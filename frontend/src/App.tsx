import { useEffect } from "react";
import { TopNav } from "./components/layout/TopNav";
import { ResizableLayout } from "./components/layout/ResizableLayout";
import { CommandPalette } from "./components/modals/CommandPalette";
import { SettingsModal } from "./components/modals/SettingsModal";
import { useNexusStore } from "./store/useNexusStore";

function App() {
  const loadInitialData = useNexusStore((state) => state.loadInitialData);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  return (
    <div className="w-screen h-screen flex flex-col bg-nexus-void text-nexus-text overflow-hidden select-none">
      {/* Top HUD Navigation */}
      <TopNav />

      {/* 3-Panel Draggable Workspace */}
      <ResizableLayout />

      {/* Omnisearch Command Palette (⌘K) */}
      <CommandPalette />

      {/* Neural Settings Modal */}
      <SettingsModal />
    </div>
  );
}

export default App;

