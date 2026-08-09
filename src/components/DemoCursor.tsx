import { useEffect, useRef, useState, type ReactElement } from "react";

/**
 * 録画中だけ表示する疑似カーソル。
 *
 * 内蔵レコーダー (electron/demoRecorder.ts) は capturePage で DOM を撮るため
 * OS のマウスカーソルが映らない。操作デモとして成立させるために、録画中は
 * DOM 上にカーソルリングを描き、クリックをリップルで見せる。
 */
export default function DemoCursor(): ReactElement | null {
  const [recording, setRecording] = useState(false);
  const [clickAt, setClickAt] = useState(0);
  const positionRef = useRef({ x: -100, y: -100 });
  const dotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const off = window.mao?.onRecordState?.((state) => setRecording(state));
    return () => off?.();
  }, []);

  useEffect(() => {
    if (!recording) {
      return;
    }

    // 描画は transform 直書き (React の再レンダリングを 60fps で回さない)
    const onMove = (event: MouseEvent): void => {
      positionRef.current = { x: event.clientX, y: event.clientY };
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${event.clientX - 12}px, ${event.clientY - 12}px)`;
      }
    };
    const onDown = (): void => setClickAt(Date.now());

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
    };
  }, [recording]);

  if (!recording) {
    return null;
  }

  const clicking = Date.now() - clickAt < 300;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100]">
      <div
        ref={dotRef}
        className={`h-6 w-6 rounded-full border-2 border-brand-sunsetA bg-brand-sunsetA/25 shadow-[0_0_12px_rgba(255,122,61,0.6)] transition-transform duration-75 ${
          clicking ? "scale-75" : ""
        }`}
        style={{ transform: `translate(${positionRef.current.x - 12}px, ${positionRef.current.y - 12}px)` }}
      />
      <span className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-semibold tracking-widest text-red-400">
        <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
        REC
      </span>
    </div>
  );
}
