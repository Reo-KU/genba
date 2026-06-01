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
  const logs = useAppStore((state) => state.logs);
  const plannerStatus = useAppStore((state) => state.plannerStatus);
  const locale = useAppStore((state) => state.locale);
  const t = getTranslations(locale);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const writtenCountsRef = useRef<Record<string, number>>({});
  const [ttydUrl, setTtydUrl] = useState<string | null>(null);

  const plannerVisible = plannerStatus !== "stopped" || Boolean(logs[ORGANIZATION_PLANNER_AGENT_ID]?.length);
  const terminalAgents: Agent[] = useMemo(() => {
    const plannerAgent: Agent = {
      id: ORGANIZATION_PLANNER_AGENT_ID,
      name: "Org Planner",
      type: "claude",
      mode: "exec",
      permissionPolicy: "safe-auto",
      command: "claude",
      args: ["-p"],
      workingDirectory: "",
      role: "Organization planner",
      systemPrompt: "",
      status: plannerStatus
    };
    return plannerVisible ? [plannerAgent, ...agents] : agents;
  }, [agents, plannerStatus, plannerVisible]);
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

  useEffect(() => {
    if (!activeIsInteractive) {
      setTtydUrl(null);
      return;
    }

    let active = true;
    void window.mao.tty.getUrl().then((url) => {
      if (active) {
        setTtydUrl(url);
      }
    });

    return () => {
      active = false;
    };
  }, [activeIsInteractive, activeAgent?.id]);

  useEffect(() => {
    if (!containerRef.current || !activeAgent || activeIsInteractive) {
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
    terminal.open(containerRef.current);
    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    requestAnimationFrame(() => fitAddon.fit());
    const entries = logs[activeAgent.id] ?? [];
    entries.forEach((entry) => terminal.write(maskSecrets(entry)));
    writtenCountsRef.current[activeAgent.id] = entries.length;

    const inputDisposable = terminal.onData((data) => {
      void window.mao.pty.write(activeAgent.id, data);
    });

    const onResize = (): void => fitAddon.fit();
    window.addEventListener("resize", onResize);

    return () => {
      inputDisposable.dispose();
      window.removeEventListener("resize", onResize);
      terminal.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
    };
  }, [activeAgent?.id, activeIsInteractive]);

  useEffect(() => {
    if (!activeAgent || !terminalRef.current || activeIsInteractive) {
      return;
    }

    const entries = logs[activeAgent.id] ?? [];
    const writtenCount = writtenCountsRef.current[activeAgent.id] ?? 0;
    const nextEntries = entries.slice(writtenCount);
    nextEntries.forEach((entry) => terminalRef.current?.write(maskSecrets(entry)));
    writtenCountsRef.current[activeAgent.id] = entries.length;
    terminalRef.current.scrollToBottom();
  }, [activeAgent, activeIsInteractive, logs]);

  const handleTabClick = (agentId: string): void => {
    setActiveAgentId(agentId);
    const target = terminalAgents.find((agent) => agent.id === agentId);
    if ((target?.mode ?? "exec") === "interactive") {
      void window.mao.tmux.selectWindow(agentId);
    }
  };

  return (
    <section className="h-full bg-brand-surface/95">
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex items-center gap-1 overflow-x-auto border-b border-brand-line px-3 py-2">
          {terminalAgents.length === 0 ? (
            <span className="text-xs text-brand-textDim">{t.terminal.noSessions}</span>
          ) : null}
          {terminalAgents.map((agent) => (
            <button
              key={agent.id}
              type="button"
              onClick={() => handleTabClick(agent.id)}
              className={`rounded px-3 py-1.5 text-xs ${
                activeAgent?.id === agent.id
                  ? "bg-brand-sunsetA text-brand-bg"
                  : "border border-brand-line text-brand-textDim hover:bg-brand-surfaceHi hover:text-brand-text"
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
                onClick={() => void window.mao.pty.write(activeAgent.id, "\x03")}
                disabled={activeAgent.id === ORGANIZATION_PLANNER_AGENT_ID}
                title={t.terminal.ctrlCTooltip}
                className="rounded border border-brand-line px-2 py-1 text-[11px] text-brand-textDim hover:bg-brand-surfaceHi hover:text-brand-text"
              >
                {t.terminal.ctrlC}
              </button>
              <button
                type="button"
                onClick={() => void window.mao.pty.kill(activeAgent.id)}
                disabled={
                  activeAgent.id === ORGANIZATION_PLANNER_AGENT_ID ||
                  (activeAgent.status !== "running" && activeAgent.status !== "starting")
                }
                title={t.terminal.stopTooltip}
                className="rounded bg-brand-ember px-2.5 py-1 text-[11px] font-medium text-brand-bg hover:opacity-90 disabled:cursor-not-allowed disabled:bg-brand-surfaceHi disabled:text-brand-textDim"
              >
                {t.terminal.stop}
              </button>
            </div>
          ) : null}
        </div>
        <div className="min-h-0 flex-1 overflow-hidden p-2">
          {activeAgent ? (
            activeIsInteractive && ttydUrl ? (
              <iframe
                src={`${ttydUrl}?arg=&fontSize=12`}
                className="h-full w-full rounded border border-brand-line bg-brand-bg"
                title={`${activeAgent.name}${t.terminal.agentTitleSuffix}`}
                allow="clipboard-read; clipboard-write"
              />
            ) : (
              <div ref={containerRef} className="h-full rounded border border-brand-line bg-brand-bg p-2" />
            )
          ) : (
            <div className="flex h-full items-center justify-center rounded border border-brand-line text-sm text-brand-textDim">
              {t.terminal.placeholder}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
