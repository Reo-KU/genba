import { randomBytes } from "node:crypto";
import { execFileSync, spawn as cpSpawn, type ChildProcess } from "node:child_process";
import { EventEmitter } from "node:events";
import { tmpdir } from "node:os";
import { join } from "node:path";
import fs from "fs-extra";
import type { Agent, PtyDataEvent, PtyStatusEvent } from "../src/types";

const SESSION_NAME = "mao-orch";
const shellQuote = (value: string): string => `'${value.replace(/'/g, `'\\''`)}'`;
const SHELL_COMMANDS = new Set(["sh", "bash", "zsh", "fish"]);

type TmuxManagerEvents = {
  data: [PtyDataEvent];
  status: [PtyStatusEvent];
};

export declare interface TmuxManager {
  on<K extends keyof TmuxManagerEvents>(eventName: K, listener: (...args: TmuxManagerEvents[K]) => void): this;
  off<K extends keyof TmuxManagerEvents>(eventName: K, listener: (...args: TmuxManagerEvents[K]) => void): this;
  emit<K extends keyof TmuxManagerEvents>(eventName: K, ...args: TmuxManagerEvents[K]): boolean;
}

export class TmuxManager extends EventEmitter {
  private readonly agentToPane = new Map<string, string>();
  private readonly tailProcs = new Map<string, ChildProcess>();
  private readonly logFiles = new Map<string, string>();

  private windowNameFor(agentId: string): string {
    return `agent-${agentId.replace(/[^A-Za-z0-9_-]/g, "").slice(-20)}`;
  }

  private tmux(args: string[]): string {
    try {
      return execFileSync("tmux", args, { encoding: "utf8" });
    } catch (error) {
      throw new Error(`tmux ${args.join(" ")} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private isUsablePaneCommand(command: string): boolean {
    const normalized = command.replace(/\.exe$/i, "").toLowerCase();
    return normalized.length > 0 && !SHELL_COMMANDS.has(normalized);
  }

  private ensureCapture(agentId: string, paneTarget: string): void {
    let logPath = this.logFiles.get(agentId);
    const isNewLog = !logPath;

    if (!logPath) {
      logPath = join(tmpdir(), `mao_tmux_${agentId.slice(-8)}_${randomBytes(4).toString("hex")}.log`);
      fs.ensureFileSync(logPath);
      this.logFiles.set(agentId, logPath);
    }

    if (isNewLog) {
      try {
        const snapshot = this.tmux(["capture-pane", "-p", "-t", paneTarget, "-S", "-80"]);
        if (snapshot.trim().length > 0) {
          fs.appendFileSync(logPath, `${snapshot}\n`);
          this.emit("data", { agentId, data: `${snapshot}\n` });
        }
      } catch {
        // Snapshot is best effort; live pipe below is the important part.
      }
    }

    this.tmux(["pipe-pane", "-o", "-t", paneTarget, `cat >> "${logPath}"`]);

    if (!this.tailProcs.has(agentId)) {
      const tail = cpSpawn("tail", ["-F", "-n", "0", logPath], { stdio: ["ignore", "pipe", "pipe"] });
      tail.stdout?.on("data", (chunk: Buffer) => {
        this.emit("data", { agentId, data: chunk.toString("utf8") });
      });
      tail.on("exit", () => {
        this.tailProcs.delete(agentId);
      });
      this.tailProcs.set(agentId, tail);
    }
  }

  private findPaneForAgent(agentId: string): string | null {
    const existing = this.agentToPane.get(agentId);
    if (existing) {
      return existing;
    }

    const windowName = this.windowNameFor(agentId);
    try {
      const lines = this.tmux([
        "list-panes",
        "-a",
        "-t",
        SESSION_NAME,
        "-F",
        "#{window_index}\t#{window_name}\t#{pane_id}\t#{pane_current_command}"
      ]).split("\n");
      let fallback: { index: number; paneId: string } | null = null;
      let preferred: { index: number; paneId: string } | null = null;

      for (const line of lines) {
        const [indexText, name, paneId, currentCommand] = line.split("\t");
        if (name !== windowName || !paneId) {
          continue;
        }

        const index = Number(indexText);
        const candidate = { index: Number.isFinite(index) ? index : -1, paneId };
        if (!fallback || candidate.index > fallback.index) {
          fallback = candidate;
        }
        if (this.isUsablePaneCommand(currentCommand ?? "") && (!preferred || candidate.index > preferred.index)) {
          preferred = candidate;
        }
      }

      const selected = preferred ?? fallback;
      if (selected) {
        this.agentToPane.set(agentId, selected.paneId);
        return selected.paneId;
      }
    } catch {
      return null;
    }

    return null;
  }

  private ensureSession(): void {
    try {
      execFileSync("tmux", ["has-session", "-t", SESSION_NAME], { stdio: "ignore" });
    } catch {
      this.tmux(["new-session", "-d", "-s", SESSION_NAME, "-n", "welcome", "-x", "200", "-y", "50"]);
    }
  }

  has(agentId: string): boolean {
    return Boolean(this.findPaneForAgent(agentId));
  }

  spawn(agent: Agent): { ok: true } | { ok: false; error: string } {
    try {
      this.ensureSession();
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }

    const existingPane = this.findPaneForAgent(agent.id);
    if (existingPane) {
      try {
        this.ensureCapture(agent.id, existingPane);
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : String(error) };
      }
      this.emit("status", { agentId: agent.id, status: "running" });
      return { ok: true };
    }

    const windowName = this.windowNameFor(agent.id);
    const cwd = agent.workingDirectory || process.env.HOME || "/tmp";
    const fullCommand = [agent.command, ...(agent.args ?? [])]
      .filter(Boolean)
      .map(shellQuote)
      .join(" ");

    let paneTarget: string;
    try {
      paneTarget = this.tmux([
        "new-window",
        "-P",
        "-F",
        "#{pane_id}",
        "-t",
        SESSION_NAME,
        "-n",
        windowName,
        "-c",
        cwd
      ]).trim();
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }

    this.agentToPane.set(agent.id, paneTarget);

    try {
      this.ensureCapture(agent.id, paneTarget);
      this.tmux(["send-keys", "-t", paneTarget, fullCommand, "Enter"]);
    } catch (error) {
      try {
        execFileSync("tmux", ["kill-pane", "-t", paneTarget], { stdio: "ignore" });
      } catch {
        // Best effort cleanup.
      }
      this.agentToPane.delete(agent.id);
      this.logFiles.delete(agent.id);
      return { ok: false, error: `pipe-pane setup failed: ${error instanceof Error ? error.message : String(error)}` };
    }

    this.emit("status", { agentId: agent.id, status: "running" });
    return { ok: true };
  }

  write(agentId: string, data: string): void {
    const paneTarget = this.agentToPane.get(agentId);
    if (!paneTarget) {
      return;
    }

    const endsWithCarriageReturn = data.endsWith("\r");
    const body = endsWithCarriageReturn ? data.slice(0, -1) : data;

    if (body.length > 0) {
      const bufferId = `mao_${randomBytes(4).toString("hex")}`;
      const bufferFile = join(tmpdir(), `${bufferId}.txt`);
      fs.writeFileSync(bufferFile, body);

      try {
        this.tmux(["load-buffer", "-b", bufferId, bufferFile]);
        this.tmux(["paste-buffer", "-b", bufferId, "-t", paneTarget, "-d"]);
      } finally {
        try {
          fs.unlinkSync(bufferFile);
        } catch {
          // Best effort cleanup.
        }
      }
    }

    if (endsWithCarriageReturn) {
      this.tmux(["send-keys", "-t", paneTarget, "Enter"]);
    }
  }

  kill(agentId: string): void {
    const paneTarget = this.agentToPane.get(agentId);
    if (paneTarget) {
      try {
        execFileSync("tmux", ["kill-pane", "-t", paneTarget], { stdio: "ignore" });
      } catch {
        // Pane may already be gone.
      }
      this.agentToPane.delete(agentId);
    }

    const tail = this.tailProcs.get(agentId);
    if (tail) {
      try {
        tail.kill();
      } catch {
        // Best effort cleanup.
      }
      this.tailProcs.delete(agentId);
    }

    const logFile = this.logFiles.get(agentId);
    if (logFile) {
      try {
        fs.unlinkSync(logFile);
      } catch {
        // Best effort cleanup.
      }
      this.logFiles.delete(agentId);
    }

    this.emit("status", { agentId, status: "stopped" });
  }

  killAll(): void {
    for (const tail of this.tailProcs.values()) {
      try {
        tail.kill();
      } catch {
        // Best effort cleanup.
      }
    }

    this.tailProcs.clear();
    this.logFiles.clear();
    this.agentToPane.clear();

    try {
      execFileSync("tmux", ["kill-session", "-t", SESSION_NAME], { stdio: "ignore" });
    } catch {
      // Session may not exist.
    }
  }

  getSessionName(): string {
    return SESSION_NAME;
  }

  selectWindow(agentId: string): boolean {
    const paneTarget = this.findPaneForAgent(agentId);
    if (!paneTarget) {
      return false;
    }

    try {
      this.ensureCapture(agentId, paneTarget);
      this.tmux(["select-window", "-t", paneTarget]);
      this.tmux(["select-pane", "-t", paneTarget]);
      try {
        const clients = this.tmux(["list-clients", "-t", SESSION_NAME, "-F", "#{client_name}"])
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);
        for (const client of clients) {
          try {
            this.tmux(["switch-client", "-c", client, "-t", paneTarget]);
          } catch {
            // Best effort: select-window above is enough for detached session state.
          }
        }
      } catch {
        // No attached clients yet.
      }
      return true;
    } catch {
      return false;
    }
  }

  getAttachCommand(agentId: string): string | null {
    const paneTarget = this.agentToPane.get(agentId);
    if (!paneTarget) {
      return null;
    }

    return `tmux attach -t ${paneTarget}`;
  }
}
