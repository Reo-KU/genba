import { execFile } from "node:child_process";
import { join } from "node:path";
import { homedir } from "node:os";
import fs from "fs-extra";
import type { BrowserWindow } from "electron";
import { WORKSPACE_ROOT } from "../src/utils/storage";

/**
 * 宣伝動画用の内蔵ウィンドウレコーダー。
 *
 * この環境では screencapture -v / ffmpeg avfoundation の画面録画が使えない
 * (非対話コンテキストからの動画キャプチャが TCC/AVFoundation 側で拒否される) ため、
 * Electron の webContents.capturePage() で**自分のウィンドウだけ**を連写して
 * ffmpeg で動画に組む。OS の画面収録権限が不要で、デスクトップの他ウィンドウや
 * 通知が映り込まない = 宣伝素材として安全、という利点もある。
 *
 * 起動方法は UI ではなく**制御ファイル**。外部プロセス (Claude Code 等) が
 *   ~/.multi-agent-orchestrator/record-trigger.json
 * に {"seconds": 20, "fps": 15, "out": "/path/to/output"} を書くと録画が始まり、
 * 進行状況は record-status.json に書き戻される。マーケ作業を自動化の輪に入れるための
 * 開発ユーティリティであり、リリースビルドに残っても実害はない (トリガーを書くのは
 * ローカルユーザーのみ)。
 */

type TriggerPayload = {
  seconds?: number;
  fps?: number;
  out?: string;
};

type RecorderStatus = {
  state: "recording" | "assembling" | "done" | "error";
  out?: string;
  frames?: number;
  achievedFps?: number;
  error?: string;
  startedAt: string;
  updatedAt: string;
};

const TRIGGER_PATH = join(WORKSPACE_ROOT, "record-trigger.json");
const STATUS_PATH = join(WORKSPACE_ROOT, "record-status.json");
const DEFAULT_OUT_DIR = join(homedir(), "Desktop", "mao-demo", "raw");

const FFMPEG_CANDIDATES = ["/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg", "ffmpeg"];

let recording = false;
let lastTriggerRaw = "";

const writeStatus = (status: Omit<RecorderStatus, "updatedAt">): void => {
  try {
    fs.writeJsonSync(STATUS_PATH, { ...status, updatedAt: new Date().toISOString() } satisfies RecorderStatus, {
      spaces: 2
    });
  } catch {
    // Best effort.
  }
};

const findFfmpeg = async (): Promise<string | null> => {
  for (const candidate of FFMPEG_CANDIDATES) {
    if (candidate.includes("/")) {
      if (await fs.pathExists(candidate)) {
        return candidate;
      }
    } else {
      return candidate; // PATH は ensureGuiPath 済みなので裸のコマンド名に賭けてよい
    }
  }
  return null;
};

const assemble = (ffmpeg: string, framesDir: string, fps: number, outFile: string): Promise<void> =>
  new Promise((resolve, reject) => {
    execFile(
      ffmpeg,
      [
        "-y",
        "-framerate",
        String(fps),
        "-i",
        join(framesDir, "frame_%05d.png"),
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "18",
        "-pix_fmt",
        "yuv420p",
        // 奇数ピクセルは libx264 が拒否するので偶数に丸める
        "-vf",
        "scale=trunc(iw/2)*2:trunc(ih/2)*2",
        outFile
      ],
      { timeout: 5 * 60 * 1000 },
      (error) => (error ? reject(error) : resolve())
    );
  });

const record = async (window: BrowserWindow, payload: TriggerPayload): Promise<void> => {
  const seconds = Math.max(2, Math.min(180, payload.seconds ?? 20));
  const fps = Math.max(4, Math.min(30, payload.fps ?? 15));
  const startedAt = new Date();
  const stamp = startedAt.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outBase = payload.out?.trim() || join(DEFAULT_OUT_DIR, `mao_${stamp}`);
  const framesDir = `${outBase}.frames`;
  const outFile = `${outBase}.mp4`;

  await fs.ensureDir(framesDir);
  recording = true;
  writeStatus({ state: "recording", out: outFile, frames: 0, startedAt: startedAt.toISOString() });
  // 録画中だけ DOM 側に疑似カーソルを出させる (capturePage は OS カーソルを含まないため)
  window.webContents.send("mao:record:state", true);

  let frameIndex = 0;
  const deadline = Date.now() + seconds * 1000;

  try {
    while (Date.now() < deadline && !window.isDestroyed()) {
      const frameStart = Date.now();
      const image = await window.webContents.capturePage();
      const name = `frame_${String(frameIndex).padStart(5, "0")}.png`;
      await fs.writeFile(join(framesDir, name), image.toPNG());
      frameIndex += 1;

      if (frameIndex % 30 === 0) {
        writeStatus({ state: "recording", out: outFile, frames: frameIndex, startedAt: startedAt.toISOString() });
      }

      const elapsed = Date.now() - frameStart;
      const wait = Math.max(0, 1000 / fps - elapsed);
      if (wait > 0) {
        await new Promise((resolve) => setTimeout(resolve, wait));
      }
    }

    const actualSeconds = seconds;
    const achievedFps = Math.max(1, Math.round(frameIndex / actualSeconds));
    writeStatus({
      state: "assembling",
      out: outFile,
      frames: frameIndex,
      achievedFps,
      startedAt: startedAt.toISOString()
    });

    const ffmpeg = await findFfmpeg();
    if (!ffmpeg) {
      throw new Error(`ffmpeg not found — frames left in ${framesDir}`);
    }
    await assemble(ffmpeg, framesDir, achievedFps, outFile);
    await fs.remove(framesDir);
    writeStatus({
      state: "done",
      out: outFile,
      frames: frameIndex,
      achievedFps,
      startedAt: startedAt.toISOString()
    });
  } catch (error) {
    writeStatus({
      state: "error",
      out: outFile,
      frames: frameIndex,
      error: error instanceof Error ? error.message : String(error),
      startedAt: startedAt.toISOString()
    });
  } finally {
    recording = false;
    if (!window.isDestroyed()) {
      window.webContents.send("mao:record:state", false);
    }
  }
};

export function initDemoRecorder(getWindow: () => BrowserWindow | null): void {
  // fs.watch はエディタの atomic write (rename) でイベントが途切れることがあるので、
  // 1秒のポーリングで十分 (マーケ用ユーティリティに inotify 相当の即応性は要らない)。
  setInterval(() => {
    void (async () => {
      try {
        if (recording || !(await fs.pathExists(TRIGGER_PATH))) {
          return;
        }
        const raw = await fs.readFile(TRIGGER_PATH, "utf8");
        if (raw === lastTriggerRaw || raw.trim().length === 0) {
          return;
        }
        lastTriggerRaw = raw;
        const payload = JSON.parse(raw) as TriggerPayload;
        const window = getWindow();
        if (!window || window.isDestroyed()) {
          return;
        }
        await fs.remove(TRIGGER_PATH);
        await record(window, payload);
      } catch (error) {
        writeStatus({
          state: "error",
          error: error instanceof Error ? error.message : String(error),
          startedAt: new Date().toISOString()
        });
      }
    })();
  }, 1000);
}
