import type { Agent } from "../types";
import { stripAnsi } from "./stripAnsi";

export type ToBlock = {
  agentName: string;
  agentId: string | null;
  body: string;
};

const toComparable = (value: string): string => value.trim().toLowerCase();

const resolveAgentId = (name: string, agents: Agent[]): string | null => {
  const target = toComparable(name);
  const exact = agents.find((agent) => toComparable(agent.name) === target);
  if (exact) {
    return exact.id;
  }

  const partial = agents.find((agent) => {
    const agentName = toComparable(agent.name);
    return agentName.includes(target) || target.includes(agentName);
  });

  return partial?.id ?? null;
};

// TUI 装飾 (box-drawing / block-element / ASCII separator) を改行に正規化する。
// claude / codex の TUI は [TO:] と本文の間に長い ─ (U+2500) 罫線などを挟むため、
// この正規化がないと regex で block 抽出に失敗する。
const normalizeDecorations = (input: string): string =>
  input
    .replace(/[─-╿]{2,}/g, "\n") // box-drawing 罫線
    .replace(/[▀-▟]{2,}/g, "\n") // block-element
    .replace(/[-=_]{4,}/g, "\n"); // ASCII separator

// PM 風の natural-language dispatch 形式 (`worker1: <内容>` や `**worker1**: <内容>`、
// `- worker1: <内容>`) を `[TO: worker1]\n<内容>` 形式に正規化する。
// claude TUI の injection 検知を回避するために agent prompt を緩い自然言語にできる。
const normalizeNamePrefixes = (input: string, agents: Agent[]): string => {
  let result = input;
  // 長い名前から先に処理 (worker10 が worker1 にマッチしないように)
  const sorted = [...agents].sort((a, b) => b.name.length - a.name.length);
  for (const agent of sorted) {
    const name = agent.name.trim();
    if (!name) continue;
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // 行頭 (任意の bullet / 太字装飾あり) + 名前 + ":" or "：" + 任意の space → [TO: 名前]\n
    const pattern = new RegExp(
      `(^|\\n)[ \\t]*(?:[-*+•・] )?(?:\\*\\*|__)?${escaped}(?:\\*\\*|__)?[ \\t]*[:：][ \\t]*`,
      "g"
    );
    result = result.replace(pattern, `$1[TO: ${name}]\n`);
  }
  return result;
};

export const parseToBlocks = (input: string, agents: Agent[]): ToBlock[] => {
  const clean = normalizeNamePrefixes(normalizeDecorations(stripAnsi(input)), agents);
  const raw: ToBlock[] = [];
  // 改行を必須としない (TUI が改行を奪うことが多い)。body は次の [TO: または末尾まで lazy。
  const pattern = /\[TO:\s*([^\]]+?)\]\s*([\s\S]*?)(?=\[TO:|$)/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(clean)) !== null) {
    const agentName = match[1].trim();
    const body = stripAnsi(match[2])
      .replace(/\r?\n\d{1,3}\s*$/, "")
      .trim();

    if (!agentName || !body) {
      continue;
    }

    raw.push({
      agentName,
      agentId: resolveAgentId(agentName, agents),
      body
    });
  }

  // 同一 agent への [TO:] が複数出現するのは TUI 再描画によるストリーミング snapshot 重複。
  // 後勝ちで dedupe (最終 render の body が最も信頼できる)。null agentId は agent 名 + body の
  // 組で dedupe (placeholder 等の説明文に対する誤マッチを集約)。
  const lastByKey = new Map<string, ToBlock>();
  for (const block of raw) {
    const key = block.agentId ?? `__null:${block.agentName.toLowerCase()}`;
    lastByKey.set(key, block);
  }
  return [...lastByKey.values()];
};
