import type {
  ActiveOrganization,
  ActiveOrganizationAgent,
  Agent,
  GraphEdge,
  GraphNode,
  OrganizationBrief
} from "../types";

type GraphInput = {
  agents: Agent[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  rootNodeId: string | null;
  locale?: "en" | "ja";
};

const isActiveAgent = (agent: Agent | undefined): agent is Agent =>
  Boolean(agent && (agent.mode ?? "exec") === "interactive" && agent.status === "running");

const unique = <T>(items: T[]): T[] => [...new Set(items)];

export function buildActiveOrganization(input: GraphInput): ActiveOrganization {
  const agentById = new Map(input.agents.map((agent) => [agent.id, agent]));
  const nodeById = new Map(input.nodes.map((node) => [node.id, node]));
  const nodeByAgentId = new Map(input.nodes.map((node) => [node.agentId, node]));
  const rootNode =
    (input.rootNodeId ? nodeById.get(input.rootNodeId) : undefined) ??
    input.nodes.find((node) => node.isRoot) ??
    null;
  const childrenByNodeId = new Map<string, GraphEdge[]>();

  for (const edge of input.edges) {
    childrenByNodeId.set(edge.source, [...(childrenByNodeId.get(edge.source) ?? []), edge]);
  }

  const activeNodeIds = new Set<string>();
  const activeEdges: GraphEdge[] = [];

  if (rootNode && isActiveAgent(agentById.get(rootNode.agentId))) {
    const queue = [rootNode.id];
    activeNodeIds.add(rootNode.id);

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;

      for (const edge of childrenByNodeId.get(current) ?? []) {
        const targetNode = nodeById.get(edge.target);
        const targetAgent = targetNode ? agentById.get(targetNode.agentId) : undefined;

        if (!targetNode || !isActiveAgent(targetAgent)) {
          continue;
        }

        activeEdges.push(edge);
        if (!activeNodeIds.has(targetNode.id)) {
          activeNodeIds.add(targetNode.id);
          queue.push(targetNode.id);
        }
      }
    }
  }

  const activeAgents = [...activeNodeIds]
    .map((nodeId) => nodeById.get(nodeId))
    .filter((node): node is GraphNode => Boolean(node))
    .map((node) => agentById.get(node.agentId))
    .filter((agent): agent is Agent => Boolean(agent));
  const activeAgentIds = new Set(activeAgents.map((agent) => agent.id));
  const directUpstream = new Map<string, string[]>();
  const directDownstream = new Map<string, string[]>();

  for (const edge of activeEdges) {
    const source = nodeById.get(edge.source)?.agentId;
    const target = nodeById.get(edge.target)?.agentId;
    if (!source || !target || !activeAgentIds.has(source) || !activeAgentIds.has(target)) {
      continue;
    }

    directDownstream.set(source, unique([...(directDownstream.get(source) ?? []), target]));
    directUpstream.set(target, unique([...(directUpstream.get(target) ?? []), source]));
  }

  const collectAncestors = (agentId: string, seen = new Set<string>()): string[] => {
    const parents = directUpstream.get(agentId) ?? [];
    const out: string[] = [];
    for (const parent of parents) {
      if (seen.has(parent)) continue;
      seen.add(parent);
      out.push(parent, ...collectAncestors(parent, seen));
    }
    return unique(out);
  };

  const collectDescendants = (agentId: string, seen = new Set<string>()): string[] => {
    const children = directDownstream.get(agentId) ?? [];
    const out: string[] = [];
    for (const child of children) {
      if (seen.has(child)) continue;
      seen.add(child);
      out.push(child, ...collectDescendants(child, seen));
    }
    return unique(out);
  };

  const toRef = (agentId: string): ActiveOrganizationAgent | null => {
    const agent = agentById.get(agentId);
    const node = nodeByAgentId.get(agentId);
    if (!agent || !node || !activeAgentIds.has(agentId)) return null;
    return {
      id: agent.id,
      nodeId: node.id,
      name: agent.name,
      role: agent.role,
      type: agent.type,
      mode: agent.mode ?? "exec",
      status: agent.status,
      workingDirectory: agent.workingDirectory
    };
  };

  const members = activeAgents.map((agent) => {
    const node = nodeByAgentId.get(agent.id);
    const upstream = directUpstream.get(agent.id) ?? [];
    const downstream = directDownstream.get(agent.id) ?? [];
    const peerIds = unique(
      upstream.flatMap((parent) => directDownstream.get(parent) ?? []).filter((peer) => peer !== agent.id)
    );
    return {
      id: agent.id,
      nodeId: node?.id ?? "",
      name: agent.name,
      role: agent.role,
      type: agent.type,
      mode: agent.mode ?? "exec",
      status: agent.status,
      workingDirectory: agent.workingDirectory,
      directUpstream: upstream.map(toRef).filter((item): item is ActiveOrganizationAgent => Boolean(item)),
      allUpstream: collectAncestors(agent.id).map(toRef).filter((item): item is ActiveOrganizationAgent => Boolean(item)),
      directDownstream: downstream.map(toRef).filter((item): item is ActiveOrganizationAgent => Boolean(item)),
      allDownstream: collectDescendants(agent.id).map(toRef).filter((item): item is ActiveOrganizationAgent => Boolean(item)),
      peers: peerIds.map(toRef).filter((item): item is ActiveOrganizationAgent => Boolean(item))
    };
  });

  return {
    savedAt: new Date().toISOString(),
    rootAgentId: rootNode?.agentId ?? null,
    locale: input.locale ?? "ja",
    members,
    edges: activeEdges
      .map((edge) => {
        const source = nodeById.get(edge.source)?.agentId;
        const target = nodeById.get(edge.target)?.agentId;
        return source && target ? { source, target } : null;
      })
      .filter((edge): edge is { source: string; target: string } => Boolean(edge))
  };
}

const renderRefs = (refs: ActiveOrganizationAgent[]): string[] =>
  refs.length > 0
    ? refs.map((agent) => `- ${agent.name}${agent.role ? ` (${agent.role})` : ""}`)
    : ["- none"];

export function buildOrganizationInstruction(
  organization: ActiveOrganization,
  agentId: string
): OrganizationBrief | null {
  const member = organization.members.find((item) => item.id === agentId);
  if (!member) return null;

  const allowedTargets = unique([
    ...member.directUpstream,
    ...member.directDownstream,
    ...member.peers
  ]);
  const lines = [
    "# Organization Brief",
    "",
    `Updated at: ${organization.savedAt}`,
    "",
    "## Identity",
    `You are ${member.name}.`,
    `Role: ${member.role || "unspecified"}`,
    "",
    "## Team Chart",
    "This note summarizes the currently active team chart selected by the user.",
    "",
    "Manager / upstream:",
    ...renderRefs(member.directUpstream),
    "",
    "Full upstream chain:",
    ...renderRefs(member.allUpstream),
    "",
    "Direct reports / downstream:",
    ...renderRefs(member.directDownstream),
    "",
    "Full downstream group:",
    ...renderRefs(member.allDownstream),
    "",
    "Peers:",
    ...renderRefs(member.peers),
    "",
    "Direct communication targets:",
    ...renderRefs(allowedTargets),
    "",
    "## Completion Flow",
    member.directDownstream.length > 0
      ? "When downstream members finish, review their completion reports against the task goal. If the result is not sufficient, revise the task and send it back downstream. If it is sufficient, summarize the result and report it upstream."
      : "When your task is complete, report the outcome upward with the essential findings, decisions, and any saved artifact paths.",
    "",
    "## Current Active Organization",
    ...organization.members.map((agent) => {
      const prefix = agent.id === organization.rootAgentId ? "- ROOT" : "-";
      return `${prefix} ${agent.name}${agent.role ? ` (${agent.role})` : ""}`;
    })
  ];

  return {
    agentId,
    agentName: member.name,
    workingDirectory: member.workingDirectory,
    relativePath: `.mao/briefs/${agentId}.md`,
    content: lines.join("\n")
  };
}
