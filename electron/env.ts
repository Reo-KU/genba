/**
 * 子プロセス (tmux / ttyd / node-pty) に渡す環境変数。
 *
 * GUI アプリ (Electron) は Finder や launchd から起動されるため、ログインシェルの
 * `LANG` / `LC_*` を引き継がないことが多い。ロケールが未設定 (= C/POSIX 扱い) だと
 * **tmux がクライアントを非 UTF-8 と判定し (`#{client_utf8}` が 0)、日本語などの
 * マルチバイト文字が入力・表示の両方で壊れる**。実際に本アプリで再現した (2026-07-31)。
 *
 * そのため、既存の値が UTF-8 でない場合だけ UTF-8 ロケールを補う。
 * 文字種の判定に効くのは LC_CTYPE なので、メッセージ言語を奪わないよう
 * LC_ALL は設定しない。
 */

import { execFile, execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { delimiter, dirname } from "node:path";
import { homedir } from "node:os";

const isUtf8 = (value: string | undefined): boolean => Boolean(value && /utf-?8/i.test(value));

/**
 * Finder / launchd から起動された GUI アプリはログインシェルの PATH を引き継がない
 * (PATH は /usr/bin:/bin:/usr/sbin:/sbin 程度になる)。その状態では tmux (/opt/homebrew/bin)
 * や claude / codex / gemini が「コマンドが見つからない」で全滅し、ダブルクリック起動だけが
 * 壊れる。dev 起動 (ターミナル経由) では再現しないので注意。
 *
 * 対策: 起動直後に一度だけ、ユーザーのログインシェルに PATH を吐かせて process.env.PATH を
 * 差し替える。子プロセスは process.env を継承するのでこれで全 spawn 経路に効く。
 * シェルが応答しない環境 (壊れた rc ファイル等) に備えて 3 秒でタイムアウトし、
 * その場合は既知の定番ディレクトリを後置で補う。
 */
const PATH_PROBE_ARGS = ["-ilc", 'printf "__MAO_PATH_START__%s__MAO_PATH_END__" "$PATH"'] as const;

const extractProbedPath = (output: string): string | null => {
  const match = output.match(/__MAO_PATH_START__([\s\S]*?)__MAO_PATH_END__/);
  const value = match?.[1]?.trim();
  return value && value.length > 0 ? value : null;
};

const applyFallbackDirs = (): void => {
  const fallbackDirs = [
    "/opt/homebrew/bin",
    "/usr/local/bin",
    `${homedir()}/.local/bin`,
    `${homedir()}/.npm-global/bin`
  ];
  const parts = (process.env.PATH ?? "").split(delimiter).filter((part) => part.length > 0);
  for (const dir of fallbackDirs) {
    if (!parts.includes(dir)) {
      parts.push(dir);
    }
  }
  process.env.PATH = parts.join(delimiter);
};

/** シェルに PATH を吐かせた結果をキャッシュへ書き、次回起動の同期プローブを不要にする。 */
const refreshPathCacheAsync = (cacheFile: string): void => {
  const shell = process.env.SHELL || "/bin/zsh";
  execFile(
    shell,
    PATH_PROBE_ARGS as unknown as string[],
    { encoding: "utf8", timeout: 5000 },
    (error, stdout) => {
      if (error) {
        return;
      }
      const probed = extractProbedPath(stdout);
      if (!probed) {
        return;
      }
      process.env.PATH = probed;
      try {
        mkdirSync(dirname(cacheFile), { recursive: true });
        writeFileSync(cacheFile, JSON.stringify({ path: probed }), "utf8");
      } catch {
        // キャッシュ書き込み失敗は無視 (次回また同期プローブに戻るだけ)
      }
    }
  );
};

export function ensureGuiPath(cacheFile?: string): void {
  if (process.platform === "win32") {
    return;
  }

  // 前回起動時のキャッシュがあれば即座に適用し、起動をブロックしない。
  // 正しい値は裏で取り直してキャッシュを更新する (PATH の変更は次回以降に反映)。
  if (cacheFile) {
    try {
      const cached = JSON.parse(readFileSync(cacheFile, "utf8")) as { path?: string };
      if (typeof cached.path === "string" && cached.path.length > 0) {
        process.env.PATH = cached.path;
        refreshPathCacheAsync(cacheFile);
        return;
      }
    } catch {
      // キャッシュなし・破損 → 同期プローブへ
    }
  }

  try {
    const shell = process.env.SHELL || "/bin/zsh";
    // -i (interactive) は rc を読ませるために必要。stdout にバナーを出す設定と混ざらないよう
    // マーカーで挟んで抽出する。
    const output = execFileSync(shell, PATH_PROBE_ARGS as unknown as string[], {
      encoding: "utf8",
      timeout: 3000,
      stdio: ["ignore", "pipe", "ignore"]
    });
    const probed = extractProbedPath(output);
    if (probed) {
      process.env.PATH = probed;
      if (cacheFile) {
        try {
          mkdirSync(dirname(cacheFile), { recursive: true });
          writeFileSync(cacheFile, JSON.stringify({ path: probed }), "utf8");
        } catch {
          // Best effort.
        }
      }
      return;
    }
  } catch {
    // タイムアウト・シェル起動失敗時はフォールバックへ
  }

  applyFallbackDirs();
}

/** 補うロケール。encoding が UTF-8 でありさえすればよいので、確実に存在するものを選ぶ。 */
const fallbackLocale = (): string => (process.platform === "darwin" ? "en_US.UTF-8" : "C.UTF-8");

export function utf8Env(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  if (isUtf8(env.LC_ALL) || isUtf8(env.LC_CTYPE) || isUtf8(env.LANG)) {
    return env;
  }

  const locale = fallbackLocale();
  env.LANG = locale;
  env.LC_CTYPE = locale;
  return env;
}
