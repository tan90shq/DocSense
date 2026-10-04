import React, { useState, useEffect, useRef } from "react";
import {
  ZoomIn,
  ZoomOut,
  Download,
  ChevronLeft,
  ChevronRight,
  FileText,
  ExternalLink,
  Sparkles,
  BookOpen,
  MessageSquareShare,
  Maximize2,
  Upload,
  Info,
} from "lucide-react";
import { useNexusStore } from "../../store/useNexusStore";
import { getPdfUrl } from "../../services/api";

export const PdfInspector: React.FC = () => {
  const {
    activePdf,
    targetPage,
    highlightSnippet,
    pdfs,
    setActivePdf,
    setPendingPromptText,
    uploadDocument,
  } = useNexusStore();

  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"real" | "excerpt">("real");
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFitWidth, setIsFitWidth] = useState(true);
  const [selectionTooltip, setSelectionTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const totalPages = 14;

  // Sync internal page with targetPage when citation is clicked
  useEffect(() => {
    if (targetPage) {
      setCurrentPage(targetPage);
    }
  }, [targetPage]);

  const pdfUrl = activePdf ? getPdfUrl(activePdf) : null;

  // Listen for text selection to show "Ask DocSense" HUD
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 3) {
      const text = selection.toString().trim();
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionTooltip({
        text,
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
    } else {
      setSelectionTooltip(null);
    }
  };

  const handleAskAboutSelection = (text: string) => {
    const prompt = `Explain this excerpt from ${activePdf || "the document"}: "${text}"`;
    setPendingPromptText(prompt);
    setSelectionTooltip(null);
  };

  const handleZoomIn = () => {
    setIsFitWidth(false);
    setZoomLevel((z) => Math.min(200, z + 15));
  };

  const handleZoomOut = () => {
    setIsFitWidth(false);
    setZoomLevel((z) => Math.max(50, z - 15));
  };

  const handleToggleFitWidth = () => {
    setIsFitWidth(!isFitWidth);
    if (!isFitWidth) {
      setZoomLevel(100);
    }
  };

  // Determine iframe src URL with fit width or zoom parameter
  const iframeSrc = pdfUrl
    ? isFitWidth
      ? `${pdfUrl}#page=${currentPage}&view=FitH`
      : `${pdfUrl}#page=${currentPage}&zoom=${zoomLevel}`
    : null;

  return (
    <div
      onMouseUp={handleMouseUp}
      className="h-full flex flex-col bg-[#0A0C10] border-l border-nexus-border select-none overflow-hidden relative min-w-0"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadDocument(file);
        }}
      />

      {/* PDF Toolbar */}
      <div className="h-10 border-b border-nexus-border px-3 flex items-center justify-between bg-nexus-panel/90 flex-shrink-0 z-10 min-w-0">
        {/* Document Switcher Dropdown */}
        <div className="flex items-center space-x-2 truncate max-w-[200px] min-w-0">
          <FileText className="w-3.5 h-3.5 text-nexus-cyan flex-shrink-0" />
          {pdfs.length > 0 ? (
            <select
              value={activePdf || ""}
              onChange={(e) => setActivePdf(e.target.value)}
              className="bg-nexus-card border border-nexus-border rounded px-2 py-0.5 text-xs font-mono text-nexus-text focus:outline-none focus:border-nexus-cyan truncate max-w-[160px]"
            >
              {pdfs.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs font-mono text-nexus-muted">No documents</span>
          )}
        </div>

        {/* View Mode Toggle: Real PDF vs Excerpt Mode */}
        {activePdf && (
          <div className="hidden sm:flex items-center bg-nexus-card rounded p-0.5 border border-nexus-border font-mono text-[10px]">
            <button
              onClick={() => setViewMode("real")}
              className={`px-2 py-0.5 rounded transition-colors flex items-center space-x-1 ${
                viewMode === "real" ? "bg-nexus-violet text-white" : "text-nexus-muted hover:text-white"
              }`}
            >
              <BookOpen className="w-3 h-3" />
              <span>PDF Engine</span>
            </button>
            <button
              onClick={() => setViewMode("excerpt")}
              className={`px-2 py-0.5 rounded transition-colors flex items-center space-x-1 ${
                viewMode === "excerpt" ? "bg-nexus-cyan text-nexus-void font-bold" : "text-nexus-muted hover:text-white"
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Grounded Match</span>
            </button>
          </div>
        )}

        {/* Page Nav */}
        {activePdf && (
          <div className="flex items-center space-x-1.5 font-mono text-xs">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded hover:bg-nexus-card text-nexus-muted hover:text-white"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-white text-xs">{currentPage}</span>
            <span className="text-nexus-muted">/</span>
            <span className="text-nexus-muted text-xs">{totalPages}</span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 rounded hover:bg-nexus-card text-nexus-muted hover:text-white"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Zoom & View Controls */}
        {activePdf && (
          <div className="flex items-center space-x-1 text-nexus-muted">
            <button
              onClick={handleToggleFitWidth}
              className={`p-1 rounded transition-colors ${
                isFitWidth ? "bg-nexus-cyan/20 text-nexus-cyan" : "hover:bg-nexus-card hover:text-white"
              }`}
              title={isFitWidth ? "Fit Width Active (Auto-scales)" : "Enable Fit Width"}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1 rounded hover:bg-nexus-card hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-1">
              {isFitWidth ? "FIT" : `${zoomLevel}%`}
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1 rounded hover:bg-nexus-card hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1 rounded hover:bg-nexus-card hover:text-white inline-flex ml-1"
                title="Pop out in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            {pdfUrl && (
              <a
                href={pdfUrl}
                download={activePdf || "document.pdf"}
                className="p-1 rounded hover:bg-nexus-card hover:text-white inline-flex"
                title="Download original file"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Grounded Citation Highlight Banner (When citation is active) */}
      {activePdf && highlightSnippet && (
        <div className="bg-nexus-card border-b border-nexus-cyan/40 px-3 py-1.5 flex items-center justify-between text-xs text-nexus-cyan z-10 flex-shrink-0 animate-pulse">
          <div className="flex items-center space-x-2 truncate">
            <Sparkles className="w-3.5 h-3.5 flex-shrink-0 text-nexus-cyan-bright" />
            <span className="font-mono text-[10px] text-white">
              Grounded Citation: Page {currentPage}
            </span>
            <span className="text-nexus-muted truncate text-[11px] hidden sm:inline">
              "{highlightSnippet}"
            </span>
          </div>
          <button
            onClick={() => handleAskAboutSelection(highlightSnippet)}
            className="px-2 py-0.5 rounded bg-nexus-cyan/20 hover:bg-nexus-cyan/30 text-[10px] font-mono flex items-center space-x-1 flex-shrink-0 ml-2"
          >
            <MessageSquareShare className="w-2.5 h-2.5" />
            <span>Ask About This</span>
          </button>
        </div>
      )}

      {/* Main Viewport Container */}
      <div className="flex-1 w-full h-full overflow-hidden bg-[#07080B] flex justify-center relative min-w-0">
        {/* EMPTY STATE: No documents uploaded or selected */}
        {!activePdf || pdfs.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-[#07080B] select-none">
            <div className="w-14 h-14 rounded-2xl bg-nexus-card border border-nexus-border flex items-center justify-center mb-4 text-nexus-muted shadow-panel-glow">
              <BookOpen className="w-7 h-7 text-nexus-cyan/60" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1.5">No Document Selected</h4>
            <p className="text-xs text-nexus-muted max-w-sm mb-5 leading-relaxed">
              Upload a PDF document from the sidebar to inspect pages, read verified source passages, and interactively explore citations.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-nexus-violet hover:bg-nexus-violet-bright text-white text-xs font-medium shadow-neural-violet transition-all active:scale-[0.98]"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
          </div>
        ) : viewMode === "real" && iframeSrc ? (
          /* MODE A: REAL PDF EMBEDDED IFRAME ENGINE (With Fit Width) */
          <div className="w-full h-full flex flex-col relative overflow-hidden min-w-0">
            <iframe
              key={`${activePdf}-${currentPage}-${isFitWidth ? "fit" : zoomLevel}`}
              src={iframeSrc}
              title={activePdf || "PDF Document"}
              className="w-full h-full border-none bg-[#101218] min-w-0"
            />
          </div>
        ) : (
          /* MODE B: HIGH-CONTRAST GROUNDED EXCERPT CANVAS */
          <div className="w-full h-full overflow-auto p-6 flex justify-center min-w-0">
            <div
              style={{
                transform: isFitWidth ? "scale(1)" : `scale(${zoomLevel / 100})`,
                transformOrigin: "top center",
              }}
              className="w-full max-w-xl min-h-[500px] bg-white text-gray-900 rounded-sm shadow-2xl p-8 text-xs font-sans leading-relaxed relative border border-gray-200 transition-transform duration-150 select-text"
            >
              {/* Document Sheet Header */}
              <div className="border-b border-gray-300 pb-3 mb-6 flex justify-between items-center text-[10px] text-gray-500 font-mono select-none">
                <span className="truncate max-w-[280px] font-semibold">{activePdf}</span>
                <span>PAGE {currentPage} OF {totalPages}</span>
              </div>

              {highlightSnippet ? (
                <>
                  <h1 className="text-lg font-bold text-gray-900 mb-2">Verified Grounded Reference</h1>
                  <p className="text-gray-600 mb-4 text-[11px]">
                    Extracted excerpt directly supporting neural synthesis in the chat session.
                  </p>

                  {/* Radiant Cyan Citation Highlight Box */}
                  <div className="bg-cyan-50 border-l-4 border-cyan-500 p-4 rounded my-4 relative shadow-sm ring-2 ring-cyan-400/50 transition-all duration-300">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded bg-cyan-600 text-white font-mono text-[9px] uppercase tracking-wide">
                        ✦ Verified Source · Page {currentPage}
                      </span>
                      <button
                        onClick={() => handleAskAboutSelection(highlightSnippet)}
                        className="text-[10px] text-cyan-700 hover:text-cyan-900 font-mono font-medium flex items-center space-x-1"
                      >
                        <MessageSquareShare className="w-3 h-3" />
                        <span>Ask about this</span>
                      </button>
                    </div>
                    <p className="text-gray-900 font-medium text-xs leading-relaxed whitespace-pre-wrap">
                      "{highlightSnippet}"
                    </p>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-gray-500 font-sans">
                  <Info className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">
                    No Active Grounded Citation Selected
                  </h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4 leading-relaxed">
                    Click on any verified source pill in the chat to highlight its grounded passage here, or switch to <strong>PDF Engine</strong> to browse the full PDF.
                  </p>
                  <button
                    onClick={() => setViewMode("real")}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded bg-gray-900 text-white text-xs font-medium hover:bg-gray-800 transition-colors"
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>Switch to PDF Engine</span>
                  </button>
                </div>
              )}

              {/* Page Footer */}
              <div className="absolute bottom-6 left-8 right-8 border-t border-gray-200 pt-2 flex justify-between text-[10px] text-gray-400 font-mono select-none">
                <span className="truncate max-w-[250px]">{activePdf}</span>
                <span>Page {currentPage} of {totalPages}</span>
              </div>
            </div>
          </div>
        )}

        {/* Floating Tooltip: Ask DocSense About Selected Text */}
        {selectionTooltip && (
          <div
            style={{
              position: "fixed",
              left: `${selectionTooltip.x}px`,
              top: `${selectionTooltip.y}px`,
              transform: "translate(-50%, -100%)",
            }}
            className="z-50 bg-nexus-card border border-nexus-cyan rounded-lg px-2.5 py-1.5 shadow-neural-cyan flex items-center space-x-2 animate-in fade-in zoom-in-95 duration-150"
          >
            <Sparkles className="w-3.5 h-3.5 text-nexus-cyan" />
            <button
              onClick={() => handleAskAboutSelection(selectionTooltip.text)}
              className="text-xs font-mono text-white hover:text-nexus-cyan font-medium flex items-center space-x-1"
            >
              <span>Ask DocSense about selection</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

