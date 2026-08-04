import type { ActiveOrganization, ActiveOrganizationMember, Agent, OrganizationBrief } from "../types";

type GraphInput = {
  agents: Agent[];
  locale?: "en" | "ja";
};

const isActiveAgent = (agent: Agent): boolean =>
  (agent.mode ?? "exec") === "interactive" && agent.status === "running";

/**
 * 稼働中(interactive かつ running)のエージェントをフラットに返す。
 * 旧・組織図時代の root/edges/上下関係は一切持たない。
 */
export function buildActiveOrganization(input: GraphInput): ActiveOrganization {
  const members: ActiveOrganizationMember[] = input.agents.filter(isActiveAgent).map((agent) => ({
    id: agent.id,
    nodeId: agent.id,
    name: agent.name,
    role: agent.role,
    type: agent.type,
    mode: agent.mode ?? "exec",
    status: agent.status,
    workingDirectory: agent.workingDirectory
  }));

  return {
    savedAt: new Date().toISOString(),
    locale: input.locale ?? "ja",
    members
  };
}

/**
 * brief の内容は「あなたは誰で、同じボードで稼働中のメンバーは誰か」+ 運用チェックリストのみ。
 * エージェント間で直接やり取りさせる指示は含めない — 作業結果はユーザーに報告する運用に統一する。
 */
export function buildOrganizationInstruction(
  organization: ActiveOrganization,
  agentId: string
): OrganizationBrief | null {
  const member = organization.members.find((item) => item.id === agentId);
  if (!member) return null;

  const teammates = organization.members.filter((item) => item.id !== agentId);
  const teammateLines =
    teammates.length > 0
      ? teammates.map((item) => `- ${item.name}${item.role ? ` (${item.role})` : ""}`)
      : ["- none"];

  const lines = [
    "# Organization Brief",
    "",
    `Updated at: ${organization.savedAt}`,
    "",
    "## Identity",
    `You are ${member.name}.`,
    `Role: ${member.role || "unspecified"}`,
    "",
    "## Team",
    "This note lists the other members currently active on the same board. MAO no longer wires agents together — there is no upstream/downstream/peer relationship to follow.",
    "",
    "Currently active teammates:",
    ...teammateLines,
    "",
    "## Operations Checklist",
    "- Complete the task you were given yourself and report the outcome to the user; do not try to hand off or delegate work to another agent listed above.",
    "- Save user-facing deliverables under `mao_artifacts/<task>/<agent>/` and include paths in your final report.",
    "- Use Obsidian notes for durable context when configured. If the CLI cannot write to the vault directly, write durable notes to the workspace-local `.mao/obsidian_outbox/` file described in the runtime prompt so MAO can import them.",
    "- If an external resource, skill, or tool path is missing or inaccessible, report the specific missing item in your final response.",
    "",
    "## Current Active Board Members",
    ...organization.members.map((agent) => `- ${agent.name}${agent.role ? ` (${agent.role})` : ""}`)
  ];

  return {
    agentId,
    agentName: member.name,
    workingDirectory: member.workingDirectory,
    relativePath: `.mao/briefs/${agentId}.md`,
    content: lines.join("\n")
  };
}
