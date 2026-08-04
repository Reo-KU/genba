import { useEffect, useState, type ReactElement } from "react";
import TerminalPanel from "./TerminalPanel";
import { useAppStore } from "../store/useAppStore";

/** スライドアウトのアニメーション時間 (下の duration-300 と揃える)。 */
const CLOSE_ANIMATION_MS = 300;

export default function TerminalDrawer(): ReactElement {
  const open = useAppStore((state) => state.terminalDrawerOpen);
  const setOpen = useAppStore((state) => state.setTerminalDrawerOpen);
  // 閉じている間も TerminalPanel を載せたままだと、画面外の xterm.js が
  // 届いた出力を描画し続ける。アニメーションが終わってから外す。
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }

    const timer = setTimeout(() => setMounted(false), CLOSE_ANIMATION_MS);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    setOpen(true);
    const onKey = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && (event.key === "j" || event.key === "J")) {
        event.preventDefault();
        setOpen(!useAppStore.getState().terminalDrawerOpen);
      } else if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-brand-line/80 bg-brand-surface/85 text-brand-textDim shadow-xl backdrop-blur-xl transition hover:bg-brand-surface hover:text-brand-text"
          aria-label="Show terminal"
          title="Show terminal (⌘J)"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
            <path d="M3 4h18a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm1 4v11h16V8H4Zm2.7 2.3 1.4 1.4-1.85 1.85 1.85 1.85-1.4 1.4-3.25-3.25 3.25-3.25ZM11 16h6v1.5h-6V16Z" />
          </svg>
        </button>
      ) : null}

      <aside
        className={`fixed bottom-5 right-5 top-5 z-30 flex w-[min(32vw,520px)] min-w-[380px] flex-col overflow-hidden rounded-2xl border border-brand-line/80 bg-brand-surface/88 shadow-[0_24px_70px_rgba(29,29,31,0.16)] backdrop-blur-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "pointer-events-none translate-x-[calc(100%+2rem)]"
        }`}
      >
      <div className="flex shrink-0 items-center justify-between border-b border-brand-line/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-brand-textDim">
            <path d="M3 4h18a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm1 4v11h16V8H4Z" />
          </svg>
          <span className="text-[11px] font-medium uppercase tracking-widest text-brand-textDim">Terminal</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-brand-textDim/70">Org Planner / agents</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-brand-textDim transition hover:bg-brand-surfaceHi/80 hover:text-brand-text"
            aria-label="Hide terminal"
            title="Hide terminal (Esc)"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
              <path d="M18.3 5.71 12 12.01l-6.3-6.3-1.41 1.41 6.3 6.3-6.3 6.3 1.41 1.41 6.3-6.3 6.3 6.3 1.41-1.41-6.3-6.3 6.3-6.3z" />
            </svg>
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1">{mounted ? <TerminalPanel /> : null}</div>
    </aside>
    </>
  );
}
