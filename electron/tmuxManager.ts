import { randomBytes } from "node:crypto";
import { execFileSync, spawn as cpSpawn, type ChildProcess } from "node:child_process";
import { utf8Env } from "./env";
import { EventEmitter } from "node:events";
import { tmpdir } from "node:os";
import { join } from "node:path";
import fs from "fs-extra";
import type { Agent, PtyDataEvent, PtyStatusEvent } from "../src/types";
import { getCommandName, normalizeAgentCommand } from "./commandLine";

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
      return execFileSync("tmux", ["-u", ...args], { encoding: "utf8", env: utf8Env() });
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
        // -e: 色などのエスケープシーケンスを残す。xterm.js が唯一の表示先になったので、
        // 初回スナップショットも素のテキストではなく見た目付きで復元する。
        const snapshot = this.tmux(["capture-pane", "-p", "-e", "-t", paneTarget, "-S", "-80"]);
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

  /**
   * 現存するエージェントに対応しない `agent-*` window を tmux から掃除する。
   *
   * tmux サーバーはアプリを再起動しても生き残るため、過去に削除したエージェントや
   * 前のセッションの window が溜まり続け、下部ターミナルのタブが残骸だらけになる。
   * 起動時に一度だけ実行して、agents.json に無いものを消す。
   */
  pruneOrphanWindows(validAgentIds: string[]): number {
    try {
      execFileSync("tmux", ["-u", "has-session", "-t", SESSION_NAME], { stdio: "ignore", env: utf8Env() });
    } catch {
      // セッションがまだ無い = 掃除するものも無い
      return 0;
    }

    const keep = new Set(validAgentIds.map((id) => this.windowNameFor(id)));
    let removed = 0;

    try {
      const lines = this.tmux(["list-windows", "-t", SESSION_NAME, "-F", "#{window_name}"]).split("\n");
      for (const rawName of lines) {
        const name = rawName.trim();
        // MAO が作った agent window だけが対象 (welcome など他の window は触らない)
        if (!name.startsWith("agent-") || keep.has(name)) {
          continue;
        }
        try {
          execFileSync("tmux", ["-u", "kill-window", "-t", `${SESSION_NAME}:${name}`], {
            stdio: "ignore",
            env: utf8Env()
          });
          removed += 1;
        } catch {
          // 既に消えている場合は無視
        }
      }
    } catch {
      return removed;
    }

    return removed;
  }

  private ensureSession(): void {
    try {
      execFileSync("tmux", ["-u", "has-session", "-t", SESSION_NAME], { stdio: "ignore", env: utf8Env() });
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
    const normalizedCommand = normalizeAgentCommand(agent);
    const commandName = getCommandName(normalizedCommand.command);
    if (!["claude", "codex", "grok", "gemini", "sh", "bash", "zsh", "python", "python3", "node"].includes(commandName)) {
      return { ok: false, error: `Command not in allowlist: ${commandName}` };
    }
    const fullCommand = [normalizedCommand.command, ...normalizedCommand.args]
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
        execFileSync("tmux", ["-u", "kill-pane", "-t", paneTarget], { stdio: "ignore", env: utf8Env() });
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
    // agentToPane はメモリ上のキャッシュなので、アプリを再起動すると空になる。
    // tmux サーバーはアプリより長生きするため、キャッシュだけを見ると
    // 「再起動後に削除したエージェントの window が tmux に残り続ける」ことになる。
    // window 名は agentId から決定的に決まるので、キャッシュに無ければ名前で消す。
    const paneTarget = this.agentToPane.get(agentId);
    if (paneTarget) {
      try {
        execFileSync("tmux", ["-u", "kill-pane", "-t", paneTarget], { stdio: "ignore", env: utf8Env() });
      } catch {
        // Pane may already be gone.
      }
      this.agentToPane.delete(agentId);
    }

    // pane が残っていた場合も含め、window ごと確実に消す。
    try {
      execFileSync("tmux", ["-u", "kill-window", "-t", `${SESSION_NAME}:${this.windowNameFor(agentId)}`], {
        stdio: "ignore",
        env: utf8Env()
      });
    } catch {
      // window が既に無い場合は何もしなくてよい。
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

  /**
   * 購読 (pipe-pane + tail + ログファイル) だけを畳み、tmux セッションは残す。
   *
   * アプリ終了時に呼ぶ。以前はここで `kill-session` していたが、それだと
   * 「アプリが落ちてもエージェントは生き続ける」という tmux を挟んだ意味が消え、
   * 開発中に electron/ を編集するたび (= Electron 再起動のたび) にエージェントが全滅していた。
   * 次回起動時は spawn()/watch() が ensureCapture() を呼び直して購読が復活する。
   */
  detachAll(): void {
    for (const paneTarget of this.agentToPane.values()) {
      try {
        // 引数なしの pipe-pane はパイプを止める。放置すると MAO 終了後も
        // tmux 側の `cat >> /tmp/mao_tmux_*.log` が動き続けて tmp を食う。
        execFileSync("tmux", ["-u", "pipe-pane", "-t", paneTarget], { stdio: "ignore", env: utf8Env() });
      } catch {
        // Pane may already be gone.
      }
    }

    this.releaseLocalResources();
  }

  killAll(): void {
    // セッションごと消すと welcome window や MAO 以外の window まで巻き添えになるため、
    // agent-* window だけを落とす (pruneOrphanWindows の「残すものが無い」版)。
    this.pruneOrphanWindows([]);
    this.releaseLocalResources();
  }

  /** tail プロセス・一時ログ・pane キャッシュを解放する (tmux 側には触らない)。 */
  private releaseLocalResources(): void {
    for (const tail of this.tailProcs.values()) {
      try {
        tail.kill();
      } catch {
        // Best effort cleanup.
      }
    }

    for (const logFile of this.logFiles.values()) {
      try {
        fs.unlinkSync(logFile);
      } catch {
        // Best effort cleanup.
      }
    }

    this.tailProcs.clear();
    this.logFiles.clear();
    this.agentToPane.clear();
  }

  getSessionName(): string {
    return SESSION_NAME;
  }

  /**
   * renderer の xterm.js が持つ表示サイズを tmux の window に伝える。
   *
   * ttyd を外して「tmux の出力を IPC で xterm.js に直接流す」構成にしたため、
   * リサイズ通知は誰もやってくれない。ここを怠るとエージェント側は 200x50 のつもりで
   * 描画し、パネル幅と食い違って行が折り返し崩れする。
   *
   * `resize-window -x/-y` はその window を手動サイズに切り替える。直接 `tmux attach` した
   * 端末は MAO 側のサイズのまま見えるので、端末幅に戻したいときは `tmux resize-window -A`。
   */
  resize(agentId: string, cols: number, rows: number): void {
    const paneTarget = this.findPaneForAgent(agentId);
    if (!paneTarget || !Number.isFinite(cols) || !Number.isFinite(rows)) {
      return;
    }

    const width = Math.max(20, Math.min(500, Math.floor(cols)));
    const height = Math.max(5, Math.min(200, Math.floor(rows)));

    try {
      this.tmux(["resize-window", "-t", paneTarget, "-x", String(width), "-y", String(height)]);
    } catch {
      // サイズ変更に失敗しても表示は続行できる (折り返しがずれるだけ)。
    }
  }

  /**
   * そのエージェントの出力購読を開始する (パネルでタブを開いたとき用)。
   *
   * アプリを再起動すると tailProcs / logFiles は空になるが tmux の pane は生きている。
   * 表示のたびにここを通すことで「再起動後にタブを開いても何も流れてこない」を防ぐ。
   * 併せて session の current window も合わせておく (直接 `tmux attach` したときに
   * 最後に見ていたエージェントに着地する)。既に attach 済みのクライアントは
   * 奪わない — 別の window を見ている最中に画面を飛ばされるのは邪魔なだけなので。
   */
  watch(agentId: string): boolean {
    const paneTarget = this.findPaneForAgent(agentId);
    if (!paneTarget) {
      return false;
    }

    try {
      this.ensureCapture(agentId, paneTarget);
      this.tmux(["select-window", "-t", paneTarget]);
      this.tmux(["select-pane", "-t", paneTarget]);
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
