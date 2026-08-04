import { useMemo, useState, type FormEvent, type ReactElement } from "react";
import { getTranslations } from "../i18n";
import { AGENT_TYPE_COMMAND, AGENT_TYPE_LABEL, useAppStore } from "../store/useAppStore";
import type { Agent } from "../types";

type AgentFormProps = {
  agent?: Agent;
  onClose: () => void;
};

const createId = (): string =>
  `agent_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const emptyAgent = (): Agent => ({
  id: createId(),
  name: "",
  type: "custom",
  mode: "interactive",
  permissionPolicy: "safe-auto",
  command: "",
  args: [],
  workingDirectory: "",
  role: "",
  systemPrompt: "",
  skillsDirectory: "",
  skillNames: [],
  obsidianVaultPath: "",
  obsidianNotesSubdir: "MAO",
  status: "stopped"
});

export default function AgentForm({ agent, onClose }: AgentFormProps): ReactElement {
  const addAgent = useAppStore((state) => state.addAgent);
  const updateAgent = useAppStore((state) => state.updateAgent);
  const locale = useAppStore((state) => state.locale);
  const allAgents = useAppStore((state) => state.agents);
  const nodes = useAppStore((state) => state.nodes);
  const projectGroups = useAppStore((state) => state.projectGroups);
  const t = getTranslations(locale);
  const initial = useMemo(() => agent ?? emptyAgent(), [agent]);
  const [draft, setDraft] = useState<Agent>(initial);
  const [argsText, setArgsText] = useState((initial.args ?? []).join("\n"));
  const [skillNamesText, setSkillNamesText] = useState((initial.skillNames ?? []).join("\n"));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // 所属陣地があれば workingDirectory はその陣地のフォルダに固定される (陣地 = フォルダという設計のため)。
  // 未所属の場合のみ手入力できる。
  const memberNode = agent ? nodes.find((node) => node.agentId === agent.id) : undefined;
  const territory = memberNode?.groupId
    ? projectGroups.find((group) => group.id === memberNode.groupId)
    : undefined;

  const update = <K extends keyof Agent>(key: K, value: Agent[K]): void => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  /** 必須は種類のみ: name は種類の表示名 + 連番 (既存名と重複しないように採番) */
  const resolveAutoName = (type: Agent["type"]): string => {
    const baseName = AGENT_TYPE_LABEL[type];
    const existingNames = new Set(
      allAgents.filter((item) => item.id !== draft.id).map((item) => item.name)
    );
    let name = baseName;
    let counter = 1;
    while (existingNames.has(name)) {
      counter += 1;
      name = `${baseName} ${counter}`;
    }
    return name;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);

    const resolvedName = draft.name.trim() || resolveAutoName(draft.type);
    // 種類から command を自動導出する。custom のみ後から設定が必要なので必須のまま。
    const resolvedCommand = draft.command.trim() || AGENT_TYPE_COMMAND[draft.type];

    if (draft.type === "custom" && !resolvedCommand) {
      setError(t.agentForm.validation);
      return;
    }

    const payload: Agent = {
      ...draft,
      name: resolvedName,
      mode: draft.mode ?? "interactive",
      permissionPolicy: draft.permissionPolicy ?? "safe-auto",
      command: resolvedCommand,
      args: argsText
        .split(/\n|,/)
        .map((item) => item.trim())
        .filter(Boolean),
      workingDirectory: territory ? territory.folderPath : draft.workingDirectory.trim(),
      role: draft.role.trim(),
      systemPrompt: draft.systemPrompt.trim(),
      skillsDirectory: draft.skillsDirectory?.trim() ?? "",
      skillNames: skillNamesText
        .split(/\n|,/)
        .map((item) => item.trim())
        .filter(Boolean),
      obsidianVaultPath: draft.obsidianVaultPath?.trim() ?? "",
      obsidianNotesSubdir: draft.obsidianNotesSubdir?.trim() || "MAO"
    };

    setSaving(true);
    try {
      if (agent) {
        await updateAgent(payload);
      } else {
        await addAgent(payload);
      }
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t.agentForm.saveError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-bg/70 px-4 backdrop-blur-sm">
      <form
        onSubmit={(event) => void onSubmit(event)}
        className="w-full max-w-2xl rounded border border-brand-line bg-brand-surface text-brand-text shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-brand-line px-5 py-4">
          <h2 className="text-sm font-semibold">{agent ? t.agentForm.titleEdit : t.agentForm.titleNew}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-sm text-brand-textDim hover:bg-brand-surfaceHi hover:text-brand-text"
          >
            {t.agentForm.close}
          </button>
        </div>

        <div className="grid max-h-[72vh] gap-4 overflow-y-auto p-5">
          <label className="grid gap-1 text-sm">
            <span className="text-brand-textDim">{t.agentForm.type}</span>
            <select
              value={draft.type}
              onChange={(event) => update("type", event.target.value as Agent["type"])}
              className="rounded border border-brand-line bg-brand-bg px-3 py-2 text-brand-text outline-none focus:border-brand-sunsetA"
            >
              <option value="claude">claude</option>
              <option value="codex">codex</option>
              <option value="grok">grok</option>
              <option value="gemini">gemini</option>
              <option value="custom">custom</option>
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-brand-textDim">{t.agentForm.name}</span>
            <input
              value={draft.name}
              onChange={(event) => update("name", event.target.value)}
              className="rounded border border-brand-line bg-brand-bg px-3 py-2 text-brand-text outline-none focus:border-brand-sunsetA"
              placeholder="Codex"
            />
            <span className="text-[11px] text-brand-textDim">{t.agentForm.nameAutoHint}</span>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-brand-textDim">{t.agentForm.mode}</span>
            <select
              value={draft.mode ?? "interactive"}
              onChange={(event) => update("mode", event.target.value as Agent["mode"])}
              className="rounded border border-brand-line bg-brand-bg px-3 py-2 text-brand-text outline-none focus:border-brand-sunsetA"
            >
              <option value="interactive">interactive (推奨)</option>
              <option value="exec">exec</option>
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-brand-textDim">{t.agentForm.permissionPolicy}</span>
            <select
              value={draft.permissionPolicy ?? "safe-auto"}
              onChange={(event) =>
                update("permissionPolicy", event.target.value as Agent["permissionPolicy"])
              }
              className="rounded border border-brand-line bg-brand-bg px-3 py-2 text-brand-text outline-none focus:border-brand-sunsetA"
            >
              <option value="ask">{t.agentForm.permissionAsk}</option>
              <option value="safe-auto">{t.agentForm.permissionSafeAuto}</option>
              <option value="yolo">{t.agentForm.permissionYolo}</option>
            </select>
            <span className="text-[11px] text-brand-textDim">
              {t.agentForm.permissionHint}
            </span>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-brand-textDim">{t.agentForm.command}</span>
            <input
              value={draft.command}
              onChange={(event) => update("command", event.target.value)}
              className="rounded border border-brand-line bg-brand-bg px-3 py-2 text-brand-text outline-none focus:border-brand-sunsetA"
              placeholder="codex"
            />
            <span className="text-[11px] text-brand-textDim">{t.agentForm.commandAutoHint}</span>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-brand-textDim">{t.agentForm.workingDirectory}</span>
            {territory ? (
              <input
                value={territory.folderPath}
                disabled
                readOnly
                className="rounded border border-brand-line bg-brand-surfaceHi px-3 py-2 text-brand-textDim outline-none"
              />
            ) : (
              <input
                value={draft.workingDirectory}
                onChange={(event) => update("workingDirectory", event.target.value)}
                className="rounded border border-brand-line bg-brand-bg px-3 py-2 text-brand-text outline-none focus:border-brand-sunsetA"
                placeholder="/Users/name/Desktop/project"
              />
            )}
            {territory ? (
              <span className="text-[11px] text-brand-textDim">
                {t.agentForm.workingDirectoryFromTerritory(territory.name)}
              </span>
            ) : null}
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-brand-textDim">{t.agentForm.role}</span>
            <input
              value={draft.role}
              onChange={(event) => update("role", event.target.value)}
              className="rounded border border-brand-line bg-brand-bg px-3 py-2 text-brand-text outline-none focus:border-brand-sunsetA"
              placeholder="Frontend implementation"
            />
          </label>

          {error ? <p className="text-sm text-brand-ember">{error}</p> : null}

          <details className="group rounded border border-brand-line/70 bg-brand-bg/40 p-3">
            <summary className="cursor-pointer select-none text-xs font-semibold uppercase tracking-wide text-brand-textDim marker:content-none">
              <span className="mr-1 inline-block transition group-open:rotate-90">▸</span>
              {t.agentForm.advancedSettings}
            </summary>

            <div className="mt-3 grid gap-3">
              <label className="grid gap-1 text-sm">
                <span className="text-brand-textDim">{t.agentForm.args}</span>
                <input
                  value={argsText}
                  onChange={(event) => setArgsText(event.target.value)}
                  className="rounded border border-brand-line bg-brand-bg px-3 py-2 text-brand-text outline-none focus:border-brand-sunsetA"
                  placeholder="--model gpt-5"
                />
              </label>

              <label className="grid gap-1 text-sm">
                <span className="text-brand-textDim">{t.agentForm.systemPrompt}</span>
                <textarea
                  value={draft.systemPrompt}
                  onChange={(event) => update("systemPrompt", event.target.value)}
                  className="min-h-16 rounded border border-brand-line bg-brand-bg px-3 py-2 text-brand-text outline-none focus:border-brand-sunsetA"
                  placeholder="You are..."
                />
              </label>

              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-brand-textDim">
                  {t.agentForm.resources}
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-brand-textDim">
                  {t.agentForm.resourcesHint}
                </p>
              </div>

              <label className="grid gap-1 text-sm">
                <span className="text-brand-textDim">{t.agentForm.skillsDirectory}</span>
                <input
                  value={draft.skillsDirectory ?? ""}
                  onChange={(event) => update("skillsDirectory", event.target.value)}
                  className="rounded border border-brand-line bg-brand-bg px-3 py-2 text-brand-text outline-none focus:border-brand-sunsetA"
                  placeholder="/Users/name/.codex/skills"
                />
                <span className="text-[11px] leading-relaxed text-brand-textDim">
                  {t.agentForm.skillsDirectoryHint}
                </span>
              </label>

              <label className="grid gap-1 text-sm">
                <span className="text-brand-textDim">{t.agentForm.skillNames}</span>
                <textarea
                  value={skillNamesText}
                  onChange={(event) => setSkillNamesText(event.target.value)}
                  className="min-h-16 rounded border border-brand-line bg-brand-bg px-3 py-2 text-brand-text outline-none focus:border-brand-sunsetA"
                  placeholder={"documents\nspreadsheets"}
                />
                <span className="text-[11px] leading-relaxed text-brand-textDim">
                  {t.agentForm.skillNamesHint}
                </span>
              </label>

              <label className="grid gap-1 text-sm">
                <span className="text-brand-textDim">{t.agentForm.obsidianVaultPath}</span>
                <input
                  value={draft.obsidianVaultPath ?? ""}
                  onChange={(event) => update("obsidianVaultPath", event.target.value)}
                  className="rounded border border-brand-line bg-brand-bg px-3 py-2 text-brand-text outline-none focus:border-brand-sunsetA"
                  placeholder="/Users/name/Documents/Obsidian/Vault"
                />
                <span className="text-[11px] leading-relaxed text-brand-textDim">
                  {t.agentForm.obsidianVaultPathHint}
                </span>
              </label>

              <label className="grid gap-1 text-sm">
                <span className="text-brand-textDim">{t.agentForm.obsidianNotesSubdir}</span>
                <input
                  value={draft.obsidianNotesSubdir ?? "MAO"}
                  onChange={(event) => update("obsidianNotesSubdir", event.target.value)}
                  className="rounded border border-brand-line bg-brand-bg px-3 py-2 text-brand-text outline-none focus:border-brand-sunsetA"
                  placeholder="MAO"
                />
                <span className="text-[11px] leading-relaxed text-brand-textDim">
                  {t.agentForm.obsidianNotesSubdirHint}
                </span>
              </label>
            </div>
          </details>
        </div>

        <div className="flex justify-end gap-2 border-t border-brand-line px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-brand-line px-3 py-2 text-sm text-brand-textDim hover:bg-brand-surfaceHi hover:text-brand-text"
          >
            {t.agentForm.cancel}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-gradient-to-br from-brand-sunsetA to-brand-sunsetB px-3 py-2 text-sm font-medium text-white hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? t.agentForm.saving : t.agentForm.save}
          </button>
        </div>
      </form>
    </div>
  );
}
