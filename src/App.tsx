import { useEffect, useState, type ReactElement } from "react";
import AttentionInbox from "./components/AttentionInbox";
import GearMenu from "./components/GearMenu";
import InspectorPopover from "./components/InspectorPopover";
import MindMapCanvas from "./components/MindMapCanvas";
import OrganizationBar from "./components/OrganizationBar";
import PermissionDialog from "./components/PermissionDialog";
import SetupCheckModal from "./components/SetupCheckModal";
import Sidebar from "./components/Sidebar";
import TerminalDrawer from "./components/TerminalDrawer";
import { useAppStore } from "./store/useAppStore";
import type { SetupCheckResult } from "./types";

export default function App(): ReactElement {
  const loadAll = useAppStore((state) => state.loadAll);
  const selectedAgentId = useAppStore((state) => state.selectedAgentId);
  const locale = useAppStore((state) => state.locale);
  const setLocale = useAppStore((state) => state.setLocale);
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [setupResult, setSetupResult] = useState<SetupCheckResult | null>(null);
  const [setupDismissed, setSetupDismissed] = useState(false);
  const [rechecking, setRechecking] = useState(false);

  useEffect(() => {
    void loadAll().catch((error) => {
      console.error("Failed to load app state", error);
    });
  }, [loadAll]);

  useEffect(() => {
    void window.mao.setup.check().then(setSetupResult).catch((error) => {
      console.error("Failed to run setup check", error);
    });
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        document.getElementById("mao-spotlight")?.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const recheckSetup = async (): Promise<void> => {
    setRechecking(true);
    try {
      setSetupResult(await window.mao.setup.check());
    } finally {
      setRechecking(false);
    }
  };

  const openSetup = (): void => {
    setSetupModalOpen(true);
    void recheckSetup();
  };

  const missingRequired =
    setupResult?.tools.some((tool) => tool.category === "required" && !tool.available) ?? false;
  const showSetupModal = Boolean(setupResult && (setupModalOpen || (!setupDismissed && missingRequired)));

  return (
    <div className="fixed inset-0 overflow-hidden bg-brand-bg text-brand-text">
      <MindMapCanvas />
      <OrganizationBar />
      <Sidebar />

      <GearMenu
        onOpenSetup={openSetup}
        locale={locale}
        onLocaleChange={setLocale}
      />

      {/* v11: 下部のタスク入力欄と「単独/合議」トグルは廃止。エージェントへの指示は
          付箋を渡す / ターミナルに直接入力するのみ。合議機能は撤去済み (CONCEPT_v3.ja.md 参照)。 */}
      {selectedAgentId ? <InspectorPopover /> : null}
      <TerminalDrawer />
      <AttentionInbox />

      {showSetupModal && setupResult ? (
        <SetupCheckModal
          result={setupResult}
          onDismiss={() => {
            setSetupDismissed(true);
            setSetupModalOpen(false);
          }}
          onRecheck={() => void recheckSetup()}
          rechecking={rechecking}
        />
      ) : null}
      <PermissionDialog />
    </div>
  );
}
