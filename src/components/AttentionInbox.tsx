import { useEffect, type ReactElement } from "react";
import { getTranslations } from "../i18n";
import { useAppStore } from "../store/useAppStore";
import type { AgentLocale, InboxItem, InboxItemKind } from "../types";

const kindIcon: Record<InboxItemKind, string> = {
  permission: "🔐",
  "agent-error": "⚠️",
  "note-done": "✅",
  "note-error": "❌",
  "cwd-changed": "📁"
};

function formatRelativeTime(at: number, locale: AgentLocale): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - at) / 1000));
  if (diffSec < 5) return locale === "ja" ? "たった今" : "just now";
  if (diffSec < 60) return locale === "ja" ? `${diffSec}秒前` : `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return locale === "ja" ? `${diffMin}分前` : `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return locale === "ja" ? `${diffHour}時間前` : `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  return locale === "ja" ? `${diffDay}日前` : `${diffDay}d ago`;
}

export default function AttentionInbox(): ReactElement {
  const locale = useAppStore((state) => state.locale);
  const t = getTranslations(locale);
  const inboxItems = useAppStore((state) => state.inboxItems);
  const inboxOpen = useAppStore((state) => state.inboxOpen);
  const setInboxOpen = useAppStore((state) => state.setInboxOpen);
  const markInboxRead = useAppStore((state) => state.markInboxRead);
  const markAllInboxRead = useAppStore((state) => state.markAllInboxRead);
  const respondPermissionFromInbox = useAppStore((state) => state.respondPermissionFromInbox);
  const setSelectedAgentId = useAppStore((state) => state.setSelectedAgentId);

  const unreadCount = inboxItems.filter((item) => !item.read).length;

  useEffect(() => {
    if (!inboxOpen) {
      return undefined;
    }
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setInboxOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inboxOpen, setInboxOpen]);

  const onItemClick = (item: InboxItem): void => {
    markInboxRead(item.id);
    if (item.agentId) {
      setSelectedAgentId(item.agentId);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setInboxOpen(!inboxOpen)}
        className={`fixed bottom-20 right-6 z-40 flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold shadow-xl backdrop-blur-lg transition ${
          unreadCount > 0
            ? "border-brand-sunsetA/60 bg-brand-sunsetA/90 text-white shadow-[0_0_20px_rgba(255,122,61,0.4)]"
            : "border-brand-line bg-brand-surface/85 text-brand-textDim hover:text-brand-text"
        }`}
        aria-label={t.attentionInbox.inbox}
        title={t.attentionInbox.inbox}
      >
        <span aria-hidden="true">⚠</span>
        <span>{unreadCount}</span>
      </button>

      {inboxOpen ? (
        <div className="fixed bottom-32 right-6 z-40 flex max-h-[70vh] w-[360px] flex-col overflow-hidden rounded-2xl border border-brand-line bg-brand-surface/95 shadow-2xl backdrop-blur-xl">
          <div className="flex shrink-0 items-center gap-2 border-b border-brand-line px-4 py-3">
            <h2 className="text-sm font-semibold text-brand-text">{t.attentionInbox.inbox}</h2>
            <div className="ml-auto flex items-center gap-2">
              {inboxItems.length > 0 ? (
                <button
                  type="button"
                  onClick={() => markAllInboxRead()}
                  className="rounded-full border border-brand-line px-2.5 py-1 text-[11px] text-brand-textDim transition hover:text-brand-text"
                >
                  {t.attentionInbox.markAllRead}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setInboxOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded-full text-brand-textDim transition hover:bg-brand-surfaceHi hover:text-brand-text"
                aria-label={t.attentionInbox.close}
                title={t.attentionInbox.close}
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
            {inboxItems.length === 0 ? (
              <p className="px-1 py-4 text-center text-xs text-brand-textDim">{t.attentionInbox.inboxEmpty}</p>
            ) : (
              inboxItems.map((item) => (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onItemClick(item)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      onItemClick(item);
                    }
                  }}
                  className={`w-full cursor-pointer rounded-xl border px-3 py-2 text-left transition ${
                    item.read ? "border-brand-line/60 bg-brand-surfaceHi/30" : "border-brand-line bg-brand-surfaceHi/60"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span aria-hidden="true" className="mt-0.5 shrink-0 text-sm">
                      {kindIcon[item.kind]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-xs font-semibold text-brand-text">{item.title}</span>
                        {!item.read ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-sunsetA" /> : null}
                        <span className="ml-auto shrink-0 text-[10px] text-brand-textDim">
                          {formatRelativeTime(item.at, locale)}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-brand-textDim">{item.body}</p>
                      {item.kind === "permission" && !item.resolved ? (
                        <div className="mt-1.5 flex gap-2" onClick={(event) => event.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => void respondPermissionFromInbox(item.id, false)}
                            className="rounded-full border border-brand-line px-2.5 py-1 text-[10px] font-medium text-brand-textDim transition hover:border-brand-textDim hover:text-brand-text"
                          >
                            {t.attentionInbox.deny}
                          </button>
                          <button
                            type="button"
                            onClick={() => void respondPermissionFromInbox(item.id, true)}
                            className="rounded-full bg-gradient-to-br from-brand-sunsetA to-brand-sunsetB px-2.5 py-1 text-[10px] font-semibold text-white shadow-[0_0_16px_rgba(255,61,138,0.35)] transition hover:brightness-110"
                          >
                            {t.attentionInbox.approve}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
