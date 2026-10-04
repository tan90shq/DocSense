import React, { useState, useRef, useEffect } from "react";
import {
  Cpu,
  Search,
  Layout,
  Settings,
  Columns,
  Maximize2,
  BookOpen,
  PanelLeft,
  Check,
} from "lucide-react";
import { useNexusStore } from "../../store/useNexusStore";

export const TopNav: React.FC = () => {
  const {
    setCommandOpen,
    setSettingsOpen,
    layoutMode,
    setLayoutMode,
    isSidebarOpen,
    toggleSidebar,
    activeModel,
  } = useNexusStore();

  const [isLayoutMenuOpen, setIsLayoutMenuOpen] = useState(false);
  const layoutMenuRef = useRef<HTMLDivElement>(null);

  // Close layout menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (layoutMenuRef.current && !layoutMenuRef.current.contains(e.target as Node)) {
        setIsLayoutMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const shortModel = activeModel.includes("/") ? activeModel.split("/")[1] : activeModel;

  return (
    <header className="h-12 border-b border-nexus-border bg-nexus-void/90 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none">
      {/* Brand & Subtitle */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2.5">
          <img
            src="/DocSense_Logo.png"
            alt="DocSense Logo"
            className="w-7 h-7 object-contain rounded-md shadow-neural-violet border border-nexus-violet/40"
          />
          <span className="font-bold tracking-wider text-sm bg-gradient-to-r from-nexus-text via-white to-nexus-cyan-bright bg-clip-text text-transparent">
            DocSense
          </span>
        </div>
        <div className="h-3.5 w-px bg-nexus-border" />
        <span className="text-[10px] uppercase font-mono tracking-widest text-nexus-muted hidden sm:inline-block">
          Neural Knowledge OS v1.0
        </span>
      </div>

      {/* Omnisearch Trigger (⌘K / Ctrl+K) */}
      <div className="flex-1 max-w-md mx-4">
        <button
          onClick={() => setCommandOpen(true)}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-md bg-nexus-panel border border-nexus-border hover:border-nexus-active text-xs text-nexus-muted transition-all duration-150 group shadow-inner hover:text-nexus-text"
        >
          <div className="flex items-center space-x-2 truncate">
            <Search className="w-3.5 h-3.5 text-nexus-muted group-hover:text-nexus-cyan transition-colors flex-shrink-0" />
            <span className="truncate">Search documents, memories, prompts...</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded bg-nexus-card border border-nexus-border text-[10px] font-mono text-nexus-muted group-hover:text-nexus-text flex-shrink-0 ml-2">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Telemetry & Controls */}
      <div className="flex items-center space-x-3">
        {/* System Telemetry */}
        <div className="hidden md:flex items-center space-x-2 px-2.5 py-1 rounded-md bg-nexus-panel border border-nexus-border font-mono text-[11px]">
          <span className="flex items-center text-nexus-emerald">
            <span className="w-1.5 h-1.5 rounded-full bg-nexus-emerald animate-ping mr-1.5" />
            AI ONLINE
          </span>
          <span className="text-nexus-border">|</span>
          <span className="flex items-center text-nexus-cyan text-[10px] truncate max-w-[130px]">
            <Cpu className="w-3 h-3 mr-1 flex-shrink-0" />
            {shortModel}
          </span>
          <span className="text-nexus-border">|</span>
          <span className="text-nexus-muted text-[10px]">
            QDRANT 8001
          </span>
        </div>

        {/* Action icons */}
        {/* Layout Presets Switcher Menu */}
        <div className="relative" ref={layoutMenuRef}>
          <button
            onClick={() => setIsLayoutMenuOpen(!isLayoutMenuOpen)}
            className={`p-1.5 rounded transition-colors ${
              isLayoutMenuOpen || layoutMode !== "split"
                ? "bg-nexus-panel text-nexus-cyan border border-nexus-cyan/40"
                : "hover:bg-nexus-panel text-nexus-muted hover:text-nexus-text"
            }`}
            title="Panel Layout Presets"
          >
            <Layout className="w-4 h-4" />
          </button>

          {isLayoutMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-nexus-panel border border-nexus-border rounded-xl shadow-2xl p-1.5 z-50 text-xs font-mono animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2 py-1 text-[10px] text-nexus-muted uppercase tracking-wider border-b border-nexus-border/60 mb-1">
                Layout Configuration
              </div>

              <button
                onClick={() => {
                  setLayoutMode("split");
                  setIsLayoutMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors ${
                  layoutMode === "split"
                    ? "bg-nexus-violet/20 text-white font-medium"
                    : "text-nexus-muted hover:text-white hover:bg-nexus-card"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Columns className="w-3.5 h-3.5 text-nexus-violet-bright" />
                  <span>3-Panel Split View</span>
                </div>
                {layoutMode === "split" && <Check className="w-3 h-3 text-nexus-cyan" />}
              </button>

              <button
                onClick={() => {
                  setLayoutMode("focus-chat");
                  setIsLayoutMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors ${
                  layoutMode === "focus-chat"
                    ? "bg-nexus-violet/20 text-white font-medium"
                    : "text-nexus-muted hover:text-white hover:bg-nexus-card"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Maximize2 className="w-3.5 h-3.5 text-nexus-violet" />
                  <span>Focus Chat Engine</span>
                </div>
                {layoutMode === "focus-chat" && <Check className="w-3 h-3 text-nexus-cyan" />}
              </button>

              <button
                onClick={() => {
                  setLayoutMode("focus-pdf");
                  setIsLayoutMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors ${
                  layoutMode === "focus-pdf"
                    ? "bg-nexus-violet/20 text-white font-medium"
                    : "text-nexus-muted hover:text-white hover:bg-nexus-card"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-3.5 h-3.5 text-nexus-cyan" />
                  <span>Focus PDF Inspector</span>
                </div>
                {layoutMode === "focus-pdf" && <Check className="w-3 h-3 text-nexus-cyan" />}
              </button>

              <div className="my-1 border-t border-nexus-border/60" />

              <button
                onClick={() => {
                  toggleSidebar();
                  setIsLayoutMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-nexus-muted hover:text-white hover:bg-nexus-card transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <PanelLeft className="w-3.5 h-3.5 text-nexus-muted" />
                  <span>{isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Settings button */}
        <button
          onClick={() => setSettingsOpen(true)}
          className="p-1.5 rounded hover:bg-nexus-panel text-nexus-muted hover:text-nexus-text transition-colors"
          title="Open Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

