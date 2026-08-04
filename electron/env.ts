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

const isUtf8 = (value: string | undefined): boolean => Boolean(value && /utf-?8/i.test(value));

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
