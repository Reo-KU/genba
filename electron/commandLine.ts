import type { Agent } from "../src/types";

export type NormalizedAgentCommand = {
  command: string;
  args: string[];
};

export const splitCommandLine = (value: string): string[] => {
  const tokens: string[] = [];
  let current = "";
  let quote: "'" | "\"" | null = null;
  let escaping = false;

  for (const char of value.trim()) {
    if (escaping) {
      current += char;
      escaping = false;
      continue;
    }

    if (char === "\\") {
      escaping = true;
      continue;
    }

    if (quote) {
      if (char === quote) {
        quote = null;
      } else {
        current += char;
      }
      continue;
    }

    if (char === "'" || char === "\"") {
      quote = char;
      continue;
    }

    if (/\s/.test(char)) {
      if (current.length > 0) {
        tokens.push(current);
        current = "";
      }
      continue;
    }

    current += char;
  }

  if (escaping) {
    current += "\\";
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
};

export const normalizeAgentCommand = (agent: Agent): NormalizedAgentCommand => {
  const commandParts = splitCommandLine(agent.command);
  const [command = agent.command.trim(), ...inlineArgs] = commandParts;
  const storedArgs = (agent.args ?? []).flatMap((arg) => splitCommandLine(arg));
  return {
    command,
    args: [...inlineArgs, ...storedArgs].filter(Boolean)
  };
};

export const getCommandName = (command: string): string => {
  const normalized = splitCommandLine(command)[0] ?? command.trim();
  const parts = normalized.split(/[\\/]/);
  return parts[parts.length - 1] ?? normalized;
};
