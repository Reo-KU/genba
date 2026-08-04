import { useState, type ReactElement } from "react";
import { getTranslations } from "../i18n";
import { buildActiveOrganization } from "../utils/organization";
import { useAppStore } from "../store/useAppStore";

export default function OrganizationBar(): ReactElement | null {
  const agents = useAppStore((state) => state.agents);
  const saving = useAppStore((state) => state.organizationSaving);
  const error = useAppStore((state) => state.organizationError);
  const saveOrganization = useAppStore((state) => state.saveOrganization);
  const locale = useAppStore((state) => state.locale);
  const t = getTranslations(locale);
  const [localError, setLocalError] = useState<string | null>(null);

  const organization = buildActiveOrganization({ agents, locale });
  const activeCount = organization.members.length;

  if (activeCount === 0 && !error && !localError) {
    return null;
  }

  const onSave = async (): Promise<void> => {
    setLocalError(null);
    try {
      await saveOrganization();
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : t.organization.saveError);
    }
  };

  return (
    <div className="fixed left-1/2 top-5 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border border-brand-line bg-brand-surface/95 px-4 py-2 text-sm text-brand-text shadow-2xl backdrop-blur">
      <div className="min-w-0">
        <div className="font-medium">{t.organization.membersLabel}</div>
        <div className="text-[11px] text-brand-textDim">
          {t.organization.activeAgents(activeCount)}
        </div>
        {error || localError ? (
          <div className="max-w-[460px] truncate text-[11px] text-brand-ember">{error ?? localError}</div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => void onSave()}
        disabled={saving || activeCount === 0}
        className="rounded-full bg-brand-aurora px-4 py-2 text-xs font-semibold text-brand-bg transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-brand-surfaceHi disabled:text-brand-textDim"
      >
        {saving ? t.organization.saving : t.organization.save}
      </button>
    </div>
  );
}
