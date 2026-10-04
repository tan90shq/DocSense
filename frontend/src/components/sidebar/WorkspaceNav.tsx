import React, { useRef, useState } from "react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import {
  Plus,
  CheckSquare,
  Square,
  Upload,
  Trash2,
  FolderGit2,
  FileText,
  Loader2,
  Sparkles,
  Eye,
  AlertCircle,
  MessageSquare,
  Layers,
} from "lucide-react";
import { useNexusStore } from "../../store/useNexusStore";

export const WorkspaceNav: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const {
    sessions,
    activeSessionId,
    selectSession,
    createNewSession,
    removeSession,
    isLoadingSessions,

    pdfs,
    scopedPdfs,
    activePdf,
    toggleScopedPdf,
    selectAllPdfs,
    setActivePdf,
    removePdf,
    isLoadingPdfs,

    uploadDocument,
    isUploading,
    uploadStatus,
    error,
    clearError,
  } = useNexusStore();

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        uploadDocument(file);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      uploadDocument(file);
      e.target.value = "";
    }
  };

  return (
    <div className="h-full flex flex-col bg-nexus-panel text-nexus-text select-none overflow-hidden border-r border-nexus-border">
      {/* Global Sidebar Header */}
      <div className="p-2.5 border-b border-nexus-border flex items-center justify-between bg-nexus-void/60 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-mono tracking-widest text-nexus-muted uppercase">
            WORKSPACE
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-nexus-emerald animate-pulse" />
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-nexus-card text-nexus-violet-bright font-mono border border-nexus-border">
          {sessions.length} Chats · {pdfs.length} Docs
        </span>
      </div>

      {/* Error Alert Banner */}
      {error && (
        <div className="mx-2 mt-2 p-2 rounded bg-red-950/60 border border-red-800/80 text-[11px] text-red-200 flex items-start justify-between flex-shrink-0">
          <div className="flex items-start space-x-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2">{error}</span>
          </div>
          <button onClick={clearError} className="text-red-400 hover:text-white text-xs ml-1">
            ✕
          </button>
        </div>
      )}

      {/* Vertical Splitter (Two Adjustable Horizontal Slabs) */}
      <div className="flex-1 w-full overflow-hidden">
        <PanelGroup direction="vertical" autoSaveId="nexus-sidebar-v-split">
          {/* SLAB 1 (TOP): CHAT SESSIONS */}
          <Panel defaultSize={50} minSize={25} maxSize={75} id="chats-slab" className="flex flex-col overflow-hidden">
            <div className="h-full flex flex-col overflow-hidden">
              {/* Slab 1 Header */}
              <div className="p-2.5 pb-1 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-1.5 text-[11px] font-mono uppercase tracking-wider text-nexus-muted">
                  <MessageSquare className="w-3 h-3 text-nexus-violet-bright" />
                  <span>Recent Chats</span>
                </div>
                <div className="flex items-center space-x-1">
                  {isLoadingSessions && <Loader2 className="w-3 h-3 text-nexus-violet animate-spin" />}
                  <span className="text-[10px] font-mono text-nexus-muted">({sessions.length})</span>
                </div>
              </div>

              {/* + New Chat Session Button */}
              <div className="px-2.5 py-1.5 flex-shrink-0">
                <button
                  onClick={() => createNewSession()}
                  className="w-full flex items-center justify-center space-x-2 py-1.5 px-3 rounded-md bg-gradient-to-r from-nexus-violet/90 via-nexus-violet to-nexus-violet-bright hover:shadow-neural-violet text-white text-xs font-medium transition-all duration-150 active:scale-[0.98]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Chat Session</span>
                </button>
              </div>

              {/* Scrollable Sessions List */}
              <div className="flex-1 overflow-y-auto px-2.5 py-1 space-y-1">
                {sessions.length === 0 ? (
                  <div className="p-3 rounded border border-dashed border-nexus-border text-center text-[11px] text-nexus-muted font-mono">
                    No active sessions.
                  </div>
                ) : (
                  sessions.map((s) => {
                    const isActive = s.session_id === activeSessionId;
                    const title = s.session_title || `Session #${s.session_id}`;

                    return (
                      <div
                        key={s.session_id}
                        onClick={() => selectSession(s.session_id)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition-all duration-150 group border ${
                          isActive
                            ? "bg-nexus-card border-nexus-violet text-white shadow-sm"
                            : "hover:bg-nexus-card/70 border-transparent text-nexus-muted hover:text-nexus-text"
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate pr-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              isActive ? "bg-nexus-violet animate-pulse" : "bg-nexus-border"
                            }`}
                          />
                          <span className="truncate">{title}</span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSession(s.session_id);
                          }}
                          className="text-nexus-muted opacity-0 group-hover:opacity-100 hover:text-red-400 p-0.5 rounded transition-opacity"
                          title="Delete session"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </Panel>

          {/* RESIZE DIVIDER BETWEEN CHATS & DOCS */}
          <PanelResizeHandle className="h-1.5 bg-nexus-border/80 hover:bg-nexus-violet transition-colors cursor-row-resize z-20 flex items-center justify-center group">
            <div className="w-10 h-0.5 bg-nexus-border group-hover:bg-nexus-violet-bright rounded-full transition-colors" />
          </PanelResizeHandle>

          {/* SLAB 2 (BOTTOM): DOCUMENTS & INGESTION */}
          <Panel defaultSize={50} minSize={25} maxSize={75} id="docs-slab" className="flex flex-col overflow-hidden">
            <div className="h-full flex flex-col overflow-hidden">
              {/* Slab 2 Header */}
              <div className="p-2.5 pb-1 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-1.5 text-[11px] font-mono uppercase tracking-wider text-nexus-muted">
                  <Layers className="w-3 h-3 text-nexus-cyan" />
                  <span>Scoped Documents</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => selectAllPdfs()}
                    className="text-[10px] text-nexus-cyan hover:underline font-mono"
                  >
                    All ({pdfs.length})
                  </button>
                  {isLoadingPdfs && <Loader2 className="w-3 h-3 text-nexus-cyan animate-spin" />}
                </div>
              </div>

              {/* Scrollable Documents List */}
              <div className="flex-1 overflow-y-auto px-2.5 py-1 space-y-1">
                {pdfs.length === 0 ? (
                  <div className="p-3 rounded border border-dashed border-nexus-border text-center text-[11px] text-nexus-muted font-mono">
                    No documents uploaded.
                  </div>
                ) : (
                  pdfs.map((pdfName) => {
                    const isScoped = scopedPdfs.includes(pdfName);
                    const isCurrentViewing = activePdf === pdfName;

                    return (
                      <div
                        key={pdfName}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors group border ${
                          isCurrentViewing
                            ? "bg-nexus-card/90 border-nexus-cyan/40"
                            : "hover:bg-nexus-card/50 border-transparent"
                        }`}
                      >
                        {/* Checkbox for Query Scoping */}
                        <button
                          onClick={() => toggleScopedPdf(pdfName)}
                          className="mr-2 text-nexus-muted hover:text-nexus-cyan flex-shrink-0"
                          title={isScoped ? "Remove from search scope" : "Include in search scope"}
                        >
                          {isScoped ? (
                            <CheckSquare className="w-3.5 h-3.5 text-nexus-cyan" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-nexus-muted" />
                          )}
                        </button>

                        {/* PDF Title -> Clicking switches PDF Viewer */}
                        <div
                          onClick={() => setActivePdf(pdfName)}
                          className="flex-1 truncate cursor-pointer flex items-center space-x-1.5"
                        >
                          <FileText className="w-3 h-3 text-nexus-muted flex-shrink-0" />
                          <span
                            className={`truncate text-[11px] ${
                              isScoped ? "text-nexus-text" : "text-nexus-muted line-through opacity-60"
                            }`}
                          >
                            {pdfName}
                          </span>
                        </div>

                        {/* Active Viewer Badge & Delete Button */}
                        <div className="flex items-center space-x-1 pl-1">
                          {isCurrentViewing && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-nexus-cyan/20 text-nexus-cyan font-mono flex items-center">
                              <Eye className="w-2.5 h-2.5 mr-0.5" />
                              View
                            </span>
                          )}
                          <button
                            onClick={() => removePdf(pdfName)}
                            className="text-nexus-muted opacity-0 group-hover:opacity-100 hover:text-red-400 p-0.5 rounded transition-opacity"
                            title="Delete PDF & vectors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Stargate Dropzone (Sticky at bottom of slab 2) */}
              <div className="p-2.5 pt-1.5 border-t border-nexus-border/60 flex-shrink-0">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  accept=".pdf"
                  className="hidden"
                />

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleFileDrop}
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className={`border rounded-lg p-2.5 text-center cursor-pointer transition-all duration-200 relative overflow-hidden ${
                    isDragOver
                      ? "border-nexus-cyan bg-nexus-cyan/10 shadow-neural-cyan"
                      : isUploading
                      ? "border-nexus-violet bg-nexus-card/80"
                      : "border-dashed border-nexus-border hover:border-nexus-cyan/60 bg-nexus-card/30 hover:bg-nexus-card/60"
                  }`}
                >
                  {isUploading ? (
                    <div className="space-y-1.5 py-0.5">
                      <div className="flex items-center justify-center space-x-1.5 text-nexus-violet-bright text-xs font-mono">
                        <Sparkles className="w-3.5 h-3.5 animate-spin text-nexus-violet" />
                        <span>STARGATE INGESTION</span>
                      </div>
                      <div className="w-full bg-nexus-void rounded-full h-1.5 overflow-hidden border border-nexus-border">
                        <div className="bg-gradient-to-r from-nexus-violet to-nexus-cyan h-full rounded-full animate-shimmer shimmer-bg w-full" />
                      </div>
                      <span className="text-[10px] font-mono text-nexus-cyan block truncate">
                        {uploadStatus || "Ingesting document into Qdrant..."}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <Upload
                        className={`w-3.5 h-3.5 mx-auto mb-1 transition-colors ${
                          isDragOver ? "text-nexus-cyan animate-bounce" : "text-nexus-muted group-hover:text-nexus-cyan"
                        }`}
                      />
                      <span className="text-[11px] font-medium text-nexus-text block leading-tight">
                        Drop PDF to Ingest
                      </span>
                      <span className="text-[9px] text-nexus-muted font-mono block mt-0.5">
                        Extracts, embeds & indexes
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>

      {/* Persistent Bottom Bar */}
      <div className="p-2.5 border-t border-nexus-border text-[10px] font-mono text-nexus-muted flex justify-between items-center bg-nexus-void/60 flex-shrink-0">
        <span className="flex items-center">
          <FolderGit2 className="w-3 h-3 mr-1 text-nexus-muted" />
          SCOPE: {scopedPdfs.length} / {pdfs.length} ACTIVE
        </span>
        <span className="text-nexus-cyan font-bold">PORT: 8001</span>
      </div>
    </div>
  );
};
