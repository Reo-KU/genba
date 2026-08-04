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

import { execFileSync } from "node:child_process";
import { delimiter } from "node:path";
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
export function ensureGuiPath(): void {
  if (process.platform === "win32") {
    return;
  }

  const current = process.env.PATH ?? "";

  try {
    const shell = process.env.SHELL || "/bin/zsh";
    // -i (interactive) は rc を読ませるために必要。stdout にバナーを出す設定と混ざらないよう
    // マーカーで挟んで抽出する。
    const output = execFileSync(shell, ["-ilc", 'printf "__MAO_PATH_START__%s__MAO_PATH_END__" "$PATH"'], {
      encoding: "utf8",
      timeout: 3000,
      stdio: ["ignore", "pipe", "ignore"]
    });
    const match = output.match(/__MAO_PATH_START__([\s\S]*?)__MAO_PATH_END__/);
    const shellPath = match?.[1]?.trim();
    if (shellPath && shellPath.length > 0) {
      process.env.PATH = shellPath;
      return;
    }
  } catch {
    // タイムアウト・シェル起動失敗時はフォールバックへ
  }

  const fallbackDirs = [
    "/opt/homebrew/bin",
    "/usr/local/bin",
    `${homedir()}/.local/bin`,
    `${homedir()}/.npm-global/bin`
  ];
  const parts = current.split(delimiter).filter((part) => part.length > 0);
  for (const dir of fallbackDirs) {
    if (!parts.includes(dir)) {
      parts.push(dir);
    }
  }
  process.env.PATH = parts.join(delimiter);
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
