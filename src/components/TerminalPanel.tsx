import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { getTranslations } from "../i18n";
import { ORGANIZATION_PLANNER_AGENT_ID, useAppStore } from "../store/useAppStore";
import { maskSecrets } from "../utils/maskSecrets";
import type { Agent } from "../types";

export default function TerminalPanel(): ReactElement {
  const agents = useAppStore((state) => state.agents);
  // タブの並びに必要なのは「出力を持つ agent が誰か」だけ。ログ本体を購読すると
  // 1 チャンク届くたびにパネル全体が再レンダリングされるため、id の一覧だけを見る。
  const agentIdsWithOutput = useAppStore((state) => Object.keys(state.logs).join("|"));
  const plannerStatus = useAppStore((state) => state.plannerStatus);
  const selectedAgentId = useAppStore((state) => state.selectedAgentId);
  const locale = useAppStore((state) => state.locale);
  const t = getTranslations(locale);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  const terminalAgents: Agent[] = useMemo(() => {
    const plannerAgent: Agent = {
      id: ORGANIZATION_PLANNER_AGENT_ID,
      name: "Org Planner",
      type: "claude",
      mode: "interactive",
      permissionPolicy: "safe-auto",
      command: "claude",
      args: [],
      workingDirectory: "",
      role: "Organization planner",
      systemPrompt: "",
      status: plannerStatus
    };
    // 登録済みの全エージェントをタブにすると、一度も起動していない過去の残骸まで並んでしまう。
    // 「実体があるもの」= 稼働中 / 出力ログを持つ / いま選択中 のみに絞る。
    const withOutput = new Set(agentIdsWithOutput.split("|").filter(Boolean));
    const isLive = (agent: Agent): boolean =>
      agent.status === "running" ||
      agent.status === "starting" ||
      withOutput.has(agent.id) ||
      agent.id === selectedAgentId;

    return [plannerAgent, ...agents.filter(isLive)];
  }, [agents, plannerStatus, agentIdsWithOutput, selectedAgentId]);
  const activeAgent = useMemo(
    () => terminalAgents.find((agent) => agent.id === activeAgentId) ?? terminalAgents[0],
    [activeAgentId, terminalAgents]
  );
  const activeIsInteractive = (activeAgent?.mode ?? "exec") === "interactive";

  useEffect(() => {
    if (!activeAgentId && terminalAgents[0]) {
      setActiveAgentId(terminalAgents[0].id);
    }
  }, [activeAgentId, terminalAgents]);

  // キャンバスでエージェントを選ぶと、そのエージェントのプロンプトをここに出す
  // (設定 = Inspector と、プロンプト = このパネルを同時に開くための追従)。
  useEffect(() => {
    if (selectedAgentId && terminalAgents.some((agent) => agent.id === selectedAgentId)) {
      setActiveAgentId(selectedAgentId);
    }
  }, [selectedAgentId, terminalAgents]);

  // interactive も exec も同じ xterm.js に流す。以前は interactive だけ ttyd (別プロセスの
  // Web ターミナル) を iframe で埋めていたが、同じ 1 文字が PTY 2 回・エミュレータ 2 回
  // (tmux と xterm.js)・WebSocket 1 回を通る構成になっていて、実測で重さの主因だった。
  // 出力は既に tmux pipe-pane → IPC で届いているので、それをそのまま描けばよい。
  useEffect(() => {
    const agentId = activeAgent?.id;
    const container = containerRef.current;
    if (!container || !agentId) {
      return;
    }

    const terminal = new Terminal({
      convertEol: true,
      cursorBlink: true,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      fontSize: 12,
      theme: {
        background: "#08060f",
        foreground: "#f5f1ea",
        cursor: "#ff7a3d"
      }
    });
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(container);
    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // ttyd (= 本物の tmux クライアント) が居なくなったので、サイズ通知は自前で出す。
    // これを送らないとエージェント側は tmux 既定の 200x50 のつもりで描画し、行が崩れる。
    const pushSize = (): void => {
      fitAddon.fit();
      const { cols, rows } = terminal;
      if (cols > 0 && rows > 0) {
        // ブラウザモック (Electron 外の目視確認用) では window.mao が居ないので optional chaining。
        void window.mao?.pty.resize(agentId, cols, rows).catch(() => undefined);
      }
    };

    requestAnimationFrame(pushSize);

    if (activeIsInteractive) {
      // アプリ再起動後は tmux の pane が生きていても購読 (pipe-pane + tail) が切れている。
      void window.mao?.tmux.watch(agentId).catch(() => undefined);
    }

    // 既に溜まっている分をまとめて1回で書く (チャンクごとの write は描画が重い)。
    // logs と logSeq は必ず同じスナップショットから読む (別々に getState すると
    // 間にフラッシュが挟まって「書いた量」と seq がずれる)。
    const snapshot = useAppStore.getState();
    const initial = snapshot.logs[agentId] ?? [];
    if (initial.length > 0) {
      terminal.write(maskSecrets(initial.join("")));
    }
    let writtenSeq = snapshot.logSeq[agentId] ?? 0;

    // ログは store を直接購読する。React の state 経由にすると 1 チャンクごとに
    // パネル全体が再レンダリングされるため、描画コストが出力速度に比例して膨らむ。
    const unsubscribe = useAppStore.subscribe((state) => {
      const seq = state.logSeq[agentId] ?? 0;
      if (seq === writtenSeq) {
        return;
      }

      const entries = state.logs[agentId] ?? [];
      if (seq < writtenSeq) {
        // clearLogs でリセットされた
        terminal.clear();
        writtenSeq = seq;
        return;
      }

      // リングバッファで古いチャンクが落ちている場合、手元にある分だけ書く。
      const pending = entries.slice(Math.max(0, entries.length - (seq - writtenSeq)));
      if (pending.length > 0) {
        terminal.write(maskSecrets(pending.join("")));
        terminal.scrollToBottom();
      }
      writtenSeq = seq;
    });

    const inputDisposable = terminal.onData((data) => {
      void window.mao.pty.write(agentId, data);
    });

    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    const onResize = (): void => {
      if (resizeTimer) clearTimeout(resizeTimer);
      // tmux resize-window は同期 exec なので、ドラッグ中に毎フレーム叩かない。
      resizeTimer = setTimeout(pushSize, 120);
    };
    window.addEventListener("resize", onResize);
    const observer = new ResizeObserver(onResize);
    observer.observe(container);

    return () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      observer.disconnect();
      unsubscribe();
      inputDisposable.dispose();
      window.removeEventListener("resize", onResize);
      terminal.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
    };
  }, [activeAgent?.id]);

  const handleTabClick = (agentId: string): void => {
    setActiveAgentId(agentId);
    const target = terminalAgents.find((agent) => agent.id === agentId);
    if ((target?.mode ?? "exec") === "interactive") {
      // アプリ再起動後は tmux 側の pane が生きていても購読が切れている。
      // タブを開くたびに購読を張り直す (pane が無ければ false が返るだけ)。
      void window.mao.tmux.watch(agentId);
    }
  };

  return (
    <section className="h-full bg-transparent">
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex items-center gap-1 overflow-x-auto border-b border-brand-line/60 px-3 py-2">
          {terminalAgents.length === 0 ? (
            <span className="text-xs text-brand-textDim">{t.terminal.noSessions}</span>
          ) : null}
          {terminalAgents.map((agent) => (
            <button
              key={agent.id}
              type="button"
              onClick={() => handleTabClick(agent.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] transition ${
                activeAgent?.id === agent.id
                  ? "bg-brand-text text-brand-surface"
                  : "text-brand-textDim hover:bg-brand-surfaceHi/80 hover:text-brand-text"
              }`}
            >
              {agent.name}
              {agent.status === "running" ? (
                <span className="ml-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-brand-aurora align-middle" />
              ) : null}
            </button>
          ))}
          {activeAgent ? (
            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={() => void window.mao.pty.spawn(activeAgent.id)}
                disabled={activeAgent.status === "running" || activeAgent.status === "starting"}
                title={t.inspector.start}
                className="rounded-full bg-brand-aurora px-2.5 py-1 text-[11px] font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:bg-brand-surfaceHi disabled:text-brand-textDim"
              >
                {t.inspector.start}
              </button>
              <button
                type="button"
                onClick={() => void window.mao.pty.write(activeAgent.id, "\x03")}
                title={t.terminal.ctrlCTooltip}
                className="rounded-full border border-brand-line/80 px-2 py-1 text-[11px] text-brand-textDim hover:bg-brand-surfaceHi/80 hover:text-brand-text"
              >
                {t.terminal.ctrlC}
              </button>
              <button
                type="button"
                onClick={() => void window.mao.pty.kill(activeAgent.id)}
                disabled={
                  (activeAgent.status !== "running" && activeAgent.status !== "starting")
                }
                title={t.terminal.stopTooltip}
                className="rounded-full bg-brand-ember px-2.5 py-1 text-[11px] font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:bg-brand-surfaceHi disabled:text-brand-textDim"
              >
                {t.terminal.stop}
              </button>
            </div>
          ) : null}
        </div>
        <div className="min-h-0 flex-1 overflow-hidden p-3">
          {activeAgent ? (
            <div
              ref={containerRef}
              title={`${activeAgent.name}${t.terminal.agentTitleSuffix}`}
              className="h-full rounded-xl border border-brand-line/80 bg-[#08060f] p-2 shadow-inner"
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-brand-line/80 text-sm text-brand-textDim">
              {t.terminal.placeholder}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
