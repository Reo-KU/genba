import { useEffect, useState, type ReactElement } from "react";
import { getTranslations } from "../i18n";
import { AGENT_TYPE_COMMAND, useAppStore } from "../store/useAppStore";
import type { Agent, AgentLocale, AgentSummary } from "../types";
import AgentForm from "./AgentForm";

/** 設定ウィンドウで選べるエージェントの種類。 */
const AGENT_TYPES: Agent["type"][] = ["claude", "codex", "gemini", "grok", "custom"];

const policyBadgeClasses: Record<NonNullable<Agent["permissionPolicy"]>, string> = {
  ask: "border-brand-sunsetA/50 bg-brand-sunsetA/10 text-brand-sunsetA",
  "safe-auto": "border-brand-aurora/40 bg-brand-aurora/10 text-brand-aurora",
  yolo: "border-brand-ember/50 bg-brand-ember/10 text-brand-ember"
};

const safeAutoFlags: Record<Agent["type"], string> = {
  codex: "--sandbox workspace-write",
  claude: "--permission-mode acceptEdits",
  gemini: "--approval-mode auto_edit",
  grok: "",
  custom: ""
};

const yoloFlags: Record<Agent["type"], string> = {
  codex: "--dangerously-bypass-approvals-and-sandbox",
  claude: "--dangerously-skip-permissions",
  gemini: "--yolo",
  grok: "",
  custom: ""
};

export default function InspectorPopover(): ReactElement | null {
  const agents = useAppStore((state) => state.agents);
  const nodes = useAppStore((state) => state.nodes);
  const selectedNodeId = useAppStore((state) => state.selectedNodeId);
  const selectedAgentId = useAppStore((state) => state.selectedAgentId);
  const setSelectedAgentId = useAppStore((state) => state.setSelectedAgentId);
  const selectNode = useAppStore((state) => state.selectNode);
  const startAgent = useAppStore((state) => state.startAgent);
  const stopAgent = useAppStore((state) => state.stopAgent);
  const updateAgent = useAppStore((state) => state.updateAgent);
  const deleteAgent = useAppStore((state) => state.deleteAgent);
  const runningTaskId = useAppStore((state) => state.runningTaskId);
  const projectGroups = useAppStore((state) => state.projectGroups);
  const assignNodeToGroup = useAppStore((state) => state.assignNodeToGroup);
  const locale = useAppStore((state) => state.locale);
  const t = getTranslations(locale);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<AgentSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const agent = agents.find((item) => item.id === selectedAgentId);
  const selectedNode =
    nodes.find((node) => node.id === selectedNodeId && node.agentId === selectedAgentId) ??
    nodes.find((node) => node.agentId === selectedAgentId);

  const agentMode = agent?.mode ?? "exec";
  const policy = agent?.permissionPolicy ?? "safe-auto";
  const policyFlags =
    policy === "ask"
      ? t.inspector.noFlags
      : policy === "safe-auto" && agent
        ? safeAutoFlags[agent.type] || t.inspector.noFlags
        : agent
          ? yoloFlags[agent.type] || t.inspector.noFlags
          : t.inspector.noFlags;
  const isAskExecClaude = policy === "ask" && agentMode === "exec" && agent?.type === "claude";
  const isAskExecOther = policy === "ask" && agentMode === "exec" && agent?.type !== "claude";
  const isAskInteractive = policy === "ask" && agentMode === "interactive";

  const close = (): void => {
    setSelectedAgentId(null);
    selectNode(null);
  };

  const loadSummary = async (agentId: string): Promise<void> => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      setSummary(await window.mao.agent.loadSummary(agentId));
    } catch (caught) {
      setSummaryError(caught instanceof Error ? caught.message : t.inspector.historyError);
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    if (!agent) {
      setSummary(null);
      return;
    }
    void loadSummary(agent.id);
  }, [agent?.id, agent?.status, runningTaskId]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!agent || !selectedNode) {
    return null;
  }

  const currentGroupId = selectedNode.groupId ?? null;
  const currentGroup = currentGroupId ? projectGroups.find((group) => group.id === currentGroupId) ?? null : null;

  const start = async (): Promise<void> => {
    setError(null);
    try {
      await startAgent(agent.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to start agent.");
    }
  };

  const stop = async (): Promise<void> => {
    setError(null);
    try {
      await stopAgent(agent.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to stop agent.");
    }
  };

  const removeAgent = async (): Promise<void> => {
    if (!window.confirm(t.inspector.deleteConfirm(agent.name))) {
      return;
    }
    setError(null);
    try {
      // 稼働中のまま消すと PTY/tmux が孤児になるので、先に確実に止めてから削除する。
      if (agent.status === "running" || agent.status === "starting") {
        await stopAgent(agent.id).catch(() => undefined);
      }
      await deleteAgent(agent.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to delete agent.");
    }
  };

  return (
    <aside className="fixed bottom-5 left-5 top-5 z-40 flex w-[340px] flex-col overflow-hidden rounded-2xl border border-brand-line/80 bg-brand-surface/88 text-brand-text shadow-[0_24px_70px_rgba(29,29,31,0.14)] backdrop-blur-2xl">
      <header className="flex items-center justify-between border-b border-brand-line/70 px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">{agent.name}</h2>
          <p className="text-[10px] uppercase tracking-widest text-brand-textDim">{agent.type}</p>
        </div>
        <button
          type="button"
          onClick={close}
          className="flex h-7 w-7 items-center justify-center rounded-full text-brand-textDim hover:bg-brand-surfaceHi/80 hover:text-brand-text"
          aria-label="Close"
        >
          X
        </button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-4">
        <Info label={t.inspector.status} value={agent.status} />

        {/* 種類はエージェント作成時には聞かず (既定で作る)、ここで選ぶ。 */}
        <label className="grid gap-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-brand-textDim">{t.inspector.agentType}</span>
          <select
            value={agent.type}
            onChange={(event) => {
              const nextType = event.target.value as Agent["type"];
              // command が「その種類の既定値のまま」なら新しい種類の既定値へ追従させる。
              // 手で書き換えている場合は尊重して触らない。
              const isDefaultCommand = agent.command.trim() === AGENT_TYPE_COMMAND[agent.type];
              void updateAgent({
                ...agent,
                type: nextType,
                command: isDefaultCommand ? AGENT_TYPE_COMMAND[nextType] : agent.command
              });
            }}
            className="rounded border border-brand-line bg-brand-bg px-3 py-2 text-brand-text outline-none focus:border-brand-sunsetA"
          >
            {AGENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-brand-textDim">{t.inspector.mode}</span>
          <select
            value={agentMode}
            onChange={(event) => {
              void updateAgent({ ...agent, mode: event.target.value as "exec" | "interactive" });
            }}
            className="rounded border border-brand-line bg-brand-bg px-3 py-2 text-brand-text outline-none focus:border-brand-sunsetA"
          >
            <option value="exec">{t.inspector.modeExec}</option>
            <option value="interactive">{t.inspector.modeInteractive}</option>
          </select>
        </label>

        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-brand-textDim">{t.inspector.permissionPolicy}</div>
          <div className="mt-1 flex min-w-0 items-center gap-2">
            <span className={`rounded border px-2 py-0.5 text-[11px] font-medium ${policyBadgeClasses[policy]}`}>
              {policy}
            </span>
            <span className="min-w-0 truncate text-xs text-brand-textDim">{policyFlags}</span>
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-1 text-[11px] text-brand-sunsetA hover:underline"
          >
            {t.inspector.edit}
          </button>
          {isAskExecClaude ? <p className="mt-1 text-[11px] text-brand-aurora">{t.inspector.askExecClaudeHint}</p> : null}
          {isAskExecOther && agent ? (
            <p className="mt-1 text-[11px] text-brand-sunsetA">{t.inspector.askExecOtherHint(agent.type)}</p>
          ) : null}
          {isAskInteractive ? <p className="mt-1 text-[11px] text-brand-textDim">{t.inspector.askInteractiveHint}</p> : null}
        </div>

        <label className="grid gap-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-brand-textDim">{t.inspector.project}</span>
          <select
            value={currentGroupId ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              void assignNodeToGroup(selectedNode.id, value === "" ? null : value);
            }}
            className="rounded border border-brand-line bg-brand-bg px-3 py-2 text-brand-text outline-none focus:border-brand-sunsetA"
          >
            <option value="">{t.inspector.projectNone}</option>
            {projectGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </label>

        <Info label={t.inspector.command} value={[agent.command, ...(agent.args ?? [])].join(" ")} />
        <Info label={t.inspector.workingDirectory} value={agent.workingDirectory || "-"} />
        {currentGroup ? (
          <p className="-mt-3 text-[11px] text-brand-textDim">{t.inspector.workingDirectoryFromProject(currentGroup.name)}</p>
        ) : null}
        <p className="text-[10px] leading-relaxed text-brand-textDim">
          {t.inspector.workspaceMaoHint}
        </p>
        <Info label={t.inspector.role} value={agent.role || "-"} />

        {/* システムプロンプトは長くなりがちなので、選択したエージェントの下で開いて全文を読めるようにする。 */}
        <details className="group/prompt rounded border border-brand-line/70 bg-brand-surfaceHi/40" open>
          <summary className="cursor-pointer list-none px-2 py-1.5 text-[10px] uppercase tracking-wide text-brand-textDim">
            {t.inspector.systemPrompt}
          </summary>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words px-2 pb-2 font-mono text-[11px] leading-relaxed text-brand-text">
            {agent.systemPrompt?.trim() || t.inspector.systemPromptEmpty}
          </pre>
        </details>

        <Info
          label={t.inspector.skills}
          value={
            agent.skillsDirectory
              ? [
                  agent.skillsDirectory,
                  (agent.skillNames ?? []).length > 0 ? `(${(agent.skillNames ?? []).join(", ")})` : ""
                ]
                  .filter(Boolean)
                  .join(" ")
              : "-"
          }
        />
        <Info
          label={t.inspector.obsidian}
          value={
            agent.obsidianVaultPath
              ? `${agent.obsidianVaultPath}${agent.obsidianNotesSubdir ? ` / ${agent.obsidianNotesSubdir}` : ""}`
              : "-"
          }
        />

        {error ? <p className="rounded border border-brand-ember/60 bg-brand-ember/10 p-2 text-sm text-brand-ember">{error}</p> : null}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => void start()}
            disabled={agentMode === "exec"}
            title={agentMode === "exec" ? t.inspector.startTooltipExec : undefined}
            className="rounded bg-brand-aurora px-3 py-2 text-sm font-medium text-brand-bg hover:opacity-90 disabled:cursor-not-allowed disabled:bg-brand-surfaceHi disabled:text-brand-textDim"
          >
            {t.inspector.start}
          </button>
          <button
            type="button"
            onClick={() => void stop()}
            disabled={agentMode === "exec" && agent.status !== "running" && agent.status !== "starting"}
            title={
              agentMode === "exec" && agent.status !== "running" && agent.status !== "starting"
                ? t.inspector.stopTooltipExec
                : t.inspector.stopTooltipInteractive
            }
            className="rounded bg-brand-ember px-3 py-2 text-sm font-medium text-brand-bg hover:opacity-90 disabled:cursor-not-allowed disabled:bg-brand-surfaceHi disabled:text-brand-textDim"
          >
            {t.inspector.stop}
          </button>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded border border-brand-line px-3 py-2 text-sm text-brand-textDim hover:bg-brand-surfaceHi hover:text-brand-text"
          >
            {t.agentList.edit}
          </button>
          <button
            type="button"
            onClick={() => void removeAgent()}
            className="rounded border border-brand-ember/60 px-3 py-2 text-sm text-brand-ember hover:bg-brand-ember/10"
          >
            {t.inspector.delete}
          </button>
        </div>

        <div className="min-w-0 border-t border-brand-line pt-4">
          <div className="mb-1 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">{t.inspector.recentHistory}</h3>
            <button
              type="button"
              onClick={() => void loadSummary(agent.id)}
              className="rounded border border-brand-line px-2 py-1 text-xs text-brand-textDim hover:bg-brand-surfaceHi hover:text-brand-text"
            >
              {t.inspector.refresh}
            </button>
          </div>
          <p className="mb-3 text-[10px] text-brand-textDim">{t.inspector.liveOutputHint}</p>
          <AgentHistoryView summary={summary} loading={summaryLoading} error={summaryError} locale={locale} />
        </div>
      </div>

      {editing ? <AgentForm agent={agent} onClose={() => setEditing(false)} /> : null}
    </aside>
  );
}

function AgentHistoryView({
  summary,
  loading,
  error,
  locale
}: {
  summary: AgentSummary | null;
  loading: boolean;
  error: string | null;
  locale: AgentLocale;
}): ReactElement {
  const t = getTranslations(locale);
  if (loading) {
    return <p className="text-sm text-brand-textDim">{t.inspector.historyLoading}</p>;
  }

  if (error) {
    return <p className="rounded border border-brand-ember/60 bg-brand-ember/10 p-2 text-sm text-brand-ember">{error}</p>;
  }

  const entries = summary?.recentEntries.slice(0, 5) ?? [];
  if (entries.length === 0) {
    return <p className="text-sm text-brand-textDim">{t.inspector.historyEmpty}</p>;
  }

  return (
    <div className="grid min-w-0 gap-3">
      {entries.map((entry) => (
        <HistoryEntry key={`${entry.taskId}-${entry.at}`} entry={entry} t={t} />
      ))}
    </div>
  );
}

function HistoryEntry({
  entry,
  t
}: {
  entry: AgentSummary["recentEntries"][number];
  t: ReturnType<typeof getTranslations>;
}): ReactElement {
  const [expanded, setExpanded] = useState(false);
  const response = entry.responseLastMessage || t.inspector.historyEmptyResponse;
  const isLong = response.length > 320 || response.split("\n").length > 8;

  return (
    <div className="min-w-0 overflow-hidden rounded-xl bg-brand-bg/50 p-4">
      <div className="mb-3 flex min-w-0 items-center justify-between gap-2 text-[10px] uppercase tracking-widest text-brand-textDim">
        <span className="min-w-0 truncate">{formatTime(entry.at)} · {entry.taskId.slice(-6)}</span>
      </div>
      <p className="mb-3 line-clamp-2 min-w-0 break-all text-xs leading-relaxed text-brand-text" title={entry.receivedBody}>
        {entry.receivedBody || t.inspector.historyEmptyInput}
      </p>
      <pre
        className={`min-w-0 whitespace-pre-wrap break-all font-sans text-xs leading-relaxed text-brand-textDim ${
          expanded ? "" : "line-clamp-[8]"
        }`}
      >
        {response}
      </pre>
      {isLong ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-[11px] font-medium text-brand-sunsetA hover:underline"
        >
          {expanded ? t.inspector.historyCollapse : t.inspector.historyExpand}
        </button>
      ) : null}
    </div>
  );
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function Info({
  label,
  value,
  multiline = false
}: {
  label: string;
  value: string;
  multiline?: boolean;
}): ReactElement {
  return (
    <div className="min-w-0">
      <div className="text-xs uppercase tracking-wide text-brand-textDim">{label}</div>
      <div className={`mt-1 min-w-0 break-all text-sm text-brand-text ${multiline ? "whitespace-pre-wrap" : "truncate"}`}>
        {value}
      </div>
    </div>
  );
}
