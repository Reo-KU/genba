import { useMemo, useState, type ReactElement } from "react";
import { getTranslations } from "../i18n";
import { useAppStore } from "../store/useAppStore";
import type { Agent, ProjectGroup } from "../types";
import type { TerritoryTreeNode } from "../utils/territoryTree";

const statusDotClass: Record<Agent["status"], string> = {
  stopped: "bg-brand-textDim/40",
  starting: "bg-brand-sunsetA",
  running: "bg-brand-aurora",
  error: "bg-brand-ember"
};

/** 陣地のイニシャル (先頭1文字、なければ番号) — 折りたたみ時のアイコン用 */
function projectInitial(name: string, index: number): string {
  const trimmed = name.trim();
  return trimmed ? trimmed[0]!.toUpperCase() : String(index + 1);
}

export default function Sidebar(): ReactElement {
  const locale = useAppStore((state) => state.locale);
  const t = getTranslations(locale);

  const projectGroups = useAppStore((state) => state.projectGroups);
  const territoryTree = useAppStore((state) => state.territoryTree);
  const renameProjectGroup = useAppStore((state) => state.renameProjectGroup);
  const deleteProjectGroup = useAppStore((state) => state.deleteProjectGroup);
  const requestFocusGroup = useAppStore((state) => state.requestFocusGroup);
  const addTerritory = useAppStore((state) => state.addTerritory);

  const agents = useAppStore((state) => state.agents);
  const nodes = useAppStore((state) => state.nodes);
  const selectedAgentId = useAppStore((state) => state.selectedAgentId);
  const setSelectedAgentId = useAppStore((state) => state.setSelectedAgentId);
  const pendingPermissionRequests = useAppStore((state) => state.pendingPermissionRequests);

  const [open, setOpen] = useState(false);
  // 陣地名のインライン編集 (window.prompt は Electron で常に null を返すため使わない)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [draftGroupName, setDraftGroupName] = useState("");

  // 陣地 -> 所属する agentId 集合 (groupId ベース。未所属ノードはどの陣地にも属さない)
  const agentIdsByGroup = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const node of nodes) {
      if (!node.groupId) continue;
      const set = map.get(node.groupId) ?? new Set<string>();
      set.add(node.agentId);
      map.set(node.groupId, set);
    }
    return map;
  }, [nodes]);

  // エージェント一覧の「所属陣地ごとのグルーピング」用 (groupId | "unassigned" -> Agent[])
  const agentsByGroupKey = useMemo(() => {
    const groupIdByAgentId = new Map<string, string>();
    for (const node of nodes) {
      if (node.groupId) {
        groupIdByAgentId.set(node.agentId, node.groupId);
      }
    }
    const map = new Map<string, Agent[]>();
    for (const agent of agents) {
      const key = groupIdByAgentId.get(agent.id) ?? "unassigned";
      const list = map.get(key) ?? [];
      list.push(agent);
      map.set(key, list);
    }
    return map;
  }, [agents, nodes]);

  const agentById = useMemo(() => new Map(agents.map((agent) => [agent.id, agent])), [agents]);
  const pendingAgentIds = useMemo(
    () => new Set(pendingPermissionRequests.map((request) => request.agentId)),
    [pendingPermissionRequests]
  );

  const groupBadge = (group: ProjectGroup): { running: boolean; attention: boolean } => {
    const agentIds = agentIdsByGroup.get(group.id);
    if (!agentIds) {
      return { running: false, attention: false };
    }
    let running = false;
    let attention = false;
    for (const agentId of agentIds) {
      if (agentById.get(agentId)?.status === "running") {
        running = true;
      }
      if (pendingAgentIds.has(agentId)) {
        attention = true;
      }
    }
    return { running, attention };
  };

  const handleFocusGroup = (group: ProjectGroup): void => {
    requestFocusGroup(group.id);
  };

  const startRenameGroup = (group: ProjectGroup): void => {
    setEditingGroupId(group.id);
    setDraftGroupName(group.name);
  };

  const commitRenameGroup = (group: ProjectGroup): void => {
    const trimmed = draftGroupName.trim();
    if (trimmed && trimmed !== group.name) {
      void renameProjectGroup(group.id, trimmed);
    }
    setEditingGroupId(null);
  };

  const cancelRenameGroup = (): void => {
    setEditingGroupId(null);
  };

  const handleDeleteGroup = (group: ProjectGroup): void => {
    if (!window.confirm(t.sidebar.deleteProjectConfirm(group.name))) {
      return;
    }
    void deleteProjectGroup(group.id);
  };

  const renderAgentRow = (agent: Agent): ReactElement => (
    <li key={agent.id}>
      <button
        type="button"
        onClick={() => setSelectedAgentId(agent.id)}
        className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition ${
          selectedAgentId === agent.id
            ? "bg-brand-violet/15 text-brand-text"
            : "text-brand-textDim hover:bg-brand-surfaceHi hover:text-brand-text"
        }`}
      >
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDotClass[agent.status]}`} aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">{agent.name}</span>
        {pendingAgentIds.has(agent.id) ? (
          <span className="shrink-0 text-[10px] text-brand-sunsetA" aria-hidden="true">
            ⚠
          </span>
        ) : null}
      </button>
    </li>
  );

  // 陣地ツリー1行分。root/branch は淡い表示 (クリック不可)、territory は通常表示 (クリックでフォーカス、
  // ホバーで ✎/🗑)。インデントはフォルダの深さに応じて付ける。
  const renderTreeNode = (node: TerritoryTreeNode, depth: number): ReactElement | null => {
    if (node.kind !== "territory") {
      return (
        <div key={node.id}>
          <div
            className="truncate px-2 py-1 text-[11px] text-brand-textDim/60"
            style={{ paddingLeft: depth * 14 + 8 }}
            title={node.path}
          >
            {node.label}
          </div>
          {node.children.map((child) => renderTreeNode(child, depth + 1))}
        </div>
      );
    }

    const group = projectGroups.find((item) => item.id === node.groupId);
    if (!group) {
      // 陣地ツリーの再計算前後で一時的にずれることがあるが、次のレイアウトで解消するので無視する
      return null;
    }

    const { running, attention } = groupBadge(group);
    const isEditing = editingGroupId === group.id;

    return (
      <div key={node.id}>
        <div className="group flex items-center gap-1 rounded-lg" style={{ paddingLeft: depth * 14 }}>
          {isEditing ? (
            <input
              type="text"
              autoFocus
              value={draftGroupName}
              onChange={(event) => setDraftGroupName(event.target.value)}
              onFocus={(event) => event.target.select()}
              onBlur={() => commitRenameGroup(group)}
              onKeyDown={(event) => {
                // キャンバスや他のショートカットにキー入力が吸われないようにする
                event.stopPropagation();
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitRenameGroup(group);
                } else if (event.key === "Escape") {
                  event.preventDefault();
                  cancelRenameGroup();
                }
              }}
              placeholder={t.projectGroup.namePlaceholder}
              aria-label={t.sidebar.renameProject}
              className="min-w-0 flex-1 rounded-lg border border-brand-sunsetA/50 bg-brand-bg px-2 py-1.5 text-sm text-brand-text outline-none"
            />
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleFocusGroup(group)}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-brand-textDim transition hover:bg-brand-surfaceHi hover:text-brand-text"
                title={group.folderPath || undefined}
              >
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${running ? "bg-brand-aurora" : "bg-transparent"}`}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate">{group.name}</span>
                {attention ? (
                  <span className="shrink-0 text-[10px] text-brand-sunsetA" aria-hidden="true">
                    ⚠
                  </span>
                ) : null}
              </button>
              <span className="hidden shrink-0 items-center gap-0.5 pr-1 group-hover:flex">
                <button
                  type="button"
                  onClick={() => startRenameGroup(group)}
                  className="flex h-5 w-5 items-center justify-center rounded text-brand-textDim transition hover:bg-brand-surfaceHi hover:text-brand-text"
                  aria-label={t.sidebar.renameProject}
                  title={t.sidebar.renameProject}
                >
                  ✎
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteGroup(group)}
                  className="flex h-5 w-5 items-center justify-center rounded text-brand-textDim transition hover:bg-brand-surfaceHi hover:text-brand-ember"
                  aria-label={t.sidebar.deleteProject}
                  title={t.sidebar.deleteProject}
                >
                  🗑
                </button>
              </span>
            </>
          )}
        </div>
        {node.children.map((child) => renderTreeNode(child, depth + 1))}
      </div>
    );
  };

  const unassignedAgents = agentsByGroupKey.get("unassigned") ?? [];

  // 左端に縦のフローティングレール。GearMenu (top-5, 左上) / 付箋追加ボタン (top-20, 左上) と
  // 重ならないよう、上下にマージンを取った縦領域に収める (画面左下の旧エージェント追加ボタンは廃止済み)。
  return (
    <div className="fixed left-3 top-32 z-30" style={{ maxHeight: "calc(100vh - 220px)" }}>
      {open ? (
        <div
          className="flex w-72 flex-col overflow-hidden rounded-2xl border border-brand-line bg-brand-surface/95 shadow-2xl backdrop-blur-xl"
          style={{ maxHeight: "calc(100vh - 220px)" }}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-brand-line px-3 py-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-textDim">Seiton</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-6 w-6 items-center justify-center rounded-full text-brand-textDim transition hover:bg-brand-surfaceHi hover:text-brand-text"
              aria-label={t.sidebar.collapse}
              title={t.sidebar.collapse}
            >
              <span aria-hidden="true">‹</span>
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-2 py-2.5">
            <div>
              <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-brand-textDim">
                {t.sidebar.projects}
              </div>
              {projectGroups.length === 0 ? (
                <p className="px-2 py-1.5 text-xs text-brand-textDim">{t.sidebar.noProjects}</p>
              ) : territoryTree ? (
                <div className="space-y-0.5">{renderTreeNode(territoryTree, 0)}</div>
              ) : null}
              <button
                type="button"
                onClick={() => void addTerritory()}
                className="mt-1 w-full rounded-lg px-2 py-1.5 text-left text-sm text-brand-textDim transition hover:bg-brand-surfaceHi hover:text-brand-text"
              >
                + {t.sidebar.addProject}
              </button>
            </div>

            <div className="border-t border-brand-line pt-2">
              <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-brand-textDim">
                {t.sidebar.agents}
              </div>
              {agents.length === 0 ? (
                <p className="px-2 py-1.5 text-xs text-brand-textDim">{t.sidebar.noAgents}</p>
              ) : (
                <div className="space-y-2">
                  {projectGroups.map((group) => {
                    const list = agentsByGroupKey.get(group.id) ?? [];
                    if (list.length === 0) {
                      return null;
                    }
                    return (
                      <div key={group.id}>
                        <div
                          className="truncate px-2 pb-0.5 text-[10px] text-brand-textDim/70"
                          title={group.name}
                        >
                          {group.name}
                        </div>
                        <ul className="space-y-0.5">{list.map((agent) => renderAgentRow(agent))}</ul>
                      </div>
                    );
                  })}
                  {unassignedAgents.length > 0 ? (
                    <div>
                      <div className="px-2 pb-0.5 text-[10px] text-brand-textDim/70">{t.sidebar.unassigned}</div>
                      <ul className="space-y-0.5">{unassignedAgents.map((agent) => renderAgentRow(agent))}</ul>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div
          className="flex w-11 flex-col items-center gap-1 overflow-y-auto rounded-full border border-brand-line bg-brand-surface/85 px-1.5 py-2 shadow-xl backdrop-blur"
          style={{ maxHeight: "calc(100vh - 220px)" }}
        >
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-brand-textDim transition hover:bg-brand-surfaceHi hover:text-brand-text"
            aria-label={t.sidebar.expand}
            title={t.sidebar.expand}
          >
            <span aria-hidden="true">»</span>
          </button>
          <div className="my-0.5 h-px w-6 shrink-0 bg-brand-line" aria-hidden="true" />
          {projectGroups.map((group, index) => {
            const { running, attention } = groupBadge(group);
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => handleFocusGroup(group)}
                className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-surfaceHi/70 text-[11px] font-semibold text-brand-textDim transition hover:text-brand-text"
                aria-label={group.name}
                title={group.name}
              >
                {projectInitial(group.name, index)}
                {running ? (
                  <span
                    className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-brand-aurora shadow-[0_0_6px_rgba(52,199,89,0.8)]"
                    aria-hidden="true"
                  />
                ) : null}
                {attention ? (
                  <span
                    className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-brand-sunsetA shadow-[0_0_6px_rgba(255,122,61,0.8)]"
                    aria-hidden="true"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
