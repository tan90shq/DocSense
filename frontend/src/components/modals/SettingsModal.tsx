import React, { useState } from "react";
import {
  Settings,
  X,
  Cpu,
  Database,
  CheckCircle2,
  Sparkles,
  Server,
  Layers,
  Save,
} from "lucide-react";
import { useNexusStore } from "../../store/useNexusStore";

export const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setSettingsOpen,
    activeModel,
    availableModels,
    changeActiveModel,
    pdfs,
    sessions,
  } = useNexusStore();

  const [selectedModel, setSelectedModel] = useState(activeModel);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isSettingsOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    await changeActiveModel(selectedModel);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={() => setSettingsOpen(false)}
    >
      <div
        className="w-full max-w-lg bg-nexus-panel border border-nexus-border rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-nexus-border bg-nexus-card/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded bg-nexus-violet/20 border border-nexus-violet/50 flex items-center justify-center">
              <Settings className="w-3.5 h-3.5 text-nexus-violet-bright" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">DocSense Neural Settings</h3>
              <p className="text-[10px] font-mono text-nexus-muted">
                System telemetry, model orchestrator & RAG configuration
              </p>
            </div>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-1 rounded text-nexus-muted hover:text-white hover:bg-nexus-card transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Active Model Selector */}
          <div>
            <label className="text-xs font-semibold text-white flex items-center mb-1.5">
              <Cpu className="w-3.5 h-3.5 text-nexus-cyan mr-1.5" />
              Active LLM Reasoning Model
            </label>
            <p className="text-[11px] text-nexus-muted mb-2">
              Select the active language model used for query expansion, synthesis, and grounding.
            </p>
            <div className="space-y-1.5">
              {availableModels.map((m) => (
                <label
                  key={m}
                  onClick={() => setSelectedModel(m)}
                  className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                    selectedModel === m
                      ? "bg-nexus-violet/15 border-nexus-violet text-white shadow-sm"
                      : "bg-nexus-card/40 border-nexus-border hover:bg-nexus-card text-nexus-muted hover:text-nexus-text"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        selectedModel === m ? "bg-nexus-violet-bright animate-pulse" : "bg-nexus-border"
                      }`}
                    />
                    <span className="font-mono text-xs">{m}</span>
                  </div>
                  {selectedModel === m && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-nexus-violet/30 text-nexus-violet-bright">
                      Selected
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Telemetry Status Grid */}
          <div>
            <label className="text-xs font-semibold text-white flex items-center mb-2">
              <Server className="w-3.5 h-3.5 text-nexus-emerald mr-1.5" />
              System Architecture & Health
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-lg bg-nexus-card/60 border border-nexus-border">
                <div className="text-[10px] font-mono text-nexus-muted uppercase">FastAPI Server</div>
                <div className="font-semibold text-white mt-1 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-nexus-emerald mr-1.5" />
                  Port 8001 (Online)
                </div>
              </div>
              <div className="p-3 rounded-lg bg-nexus-card/60 border border-nexus-border">
                <div className="text-[10px] font-mono text-nexus-muted uppercase">Qdrant Vector DB</div>
                <div className="font-semibold text-white mt-1 flex items-center">
                  <Database className="w-3 h-3 text-nexus-cyan mr-1.5" />
                  Cloud Cluster (Ready)
                </div>
              </div>
              <div className="p-3 rounded-lg bg-nexus-card/60 border border-nexus-border">
                <div className="text-[10px] font-mono text-nexus-muted uppercase">Embedding Model</div>
                <div className="font-mono text-[11px] text-white mt-1 truncate">
                  all-MiniLM-L6-v2 (384d)
                </div>
              </div>
              <div className="p-3 rounded-lg bg-nexus-card/60 border border-nexus-border">
                <div className="text-[10px] font-mono text-nexus-muted uppercase">Cross-Encoder</div>
                <div className="font-mono text-[11px] text-white mt-1 truncate">
                  ms-marco-MiniLM-L6-v2
                </div>
              </div>
            </div>
          </div>

          {/* Workspace Stats */}
          <div className="p-3 rounded-lg bg-nexus-card/40 border border-nexus-border flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-nexus-cyan" />
              <span>
                <strong className="text-white">{pdfs.length}</strong> Documents Ingested
              </span>
            </div>
            <div className="h-4 w-px bg-nexus-border" />
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-nexus-violet" />
              <span>
                <strong className="text-white">{sessions.length}</strong> Chat Sessions
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-nexus-border bg-nexus-card/50 flex items-center justify-between">
          <span className="text-[10px] font-mono text-nexus-muted">
            DocSense v1.0 · Neural Knowledge OS
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSettingsOpen(false)}
              className="px-3 py-1.5 rounded-md text-xs text-nexus-muted hover:text-white hover:bg-nexus-panel transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md bg-nexus-violet hover:bg-nexus-violet-bright text-white text-xs font-medium shadow-neural-violet transition-all active:scale-[0.98]"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-nexus-emerald" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? "Saving..." : "Save Model"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
