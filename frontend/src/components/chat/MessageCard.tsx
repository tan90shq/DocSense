import React, { useState } from "react";
import { Sparkles, FileText, Copy, Check, Code, Eye } from "lucide-react";
import { useTypewriter } from "../../hooks/useTypewriter";
import { useNexusStore } from "../../store/useNexusStore";
import type { Citation } from "../../services/api";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface MessageCardProps {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  isStreaming?: boolean;
  onTypingComplete?: () => void;
}

export const MessageCard: React.FC<MessageCardProps> = ({
  role,
  content,
  citations = [],
  isStreaming = false,
  onTypingComplete,
}) => {
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [typingComplete, setTypingComplete] = useState(!isStreaming);
  const setTargetPage = useNexusStore((state) => state.setTargetPage);

  const { displayedText, isTyping, skip } = useTypewriter(
    content,
    16,
    () => {
      setTypingComplete(true);
      if (onTypingComplete) onTypingComplete();
    }
  );

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render User Message
  if (role === "user") {
    return (
      <div className="flex items-start space-x-3 max-w-2xl ml-auto justify-end">
        <div className="bg-nexus-card border border-nexus-border rounded-xl p-3.5 text-xs text-nexus-text shadow-sm selection:bg-nexus-violet/40">
          {content}
        </div>
      </div>
    );
  }

  // Render Assistant Message (Document-Style Card with Rich Markdown Support)
  const textToShow = isStreaming && !typingComplete ? displayedText : content;

  return (
    <div
      onClick={() => isTyping && skip()}
      className="max-w-2xl bg-nexus-panel/85 border border-nexus-border hover:border-nexus-border/80 rounded-xl p-5 shadow-panel-glow transition-all duration-150 relative group"
    >
      {/* Card Header Bar */}
      <div className="flex items-center justify-between mb-3 border-b border-nexus-border/40 pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded bg-nexus-violet/20 border border-nexus-violet/50 flex items-center justify-center shadow-neural-violet">
            <Sparkles className="w-3 h-3 text-nexus-violet-bright" />
          </div>
          <span className="text-xs font-semibold tracking-wide text-white font-mono">
            DOCSENSE INTELLIGENCE
          </span>
          {isTyping && (
            <span className="text-[10px] font-mono text-nexus-cyan bg-nexus-cyan/10 px-1.5 py-0.5 rounded border border-nexus-cyan/20 animate-pulse">
              Synthesizing...
            </span>
          )}
        </div>

        {/* Toolbar: Raw/Rendered Toggle + Copy Markdown */}
        <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setShowRaw(!showRaw)}
            className={`flex items-center space-x-1 px-2 py-1 rounded text-[11px] font-mono transition-colors ${
              showRaw
                ? "bg-nexus-cyan/20 text-nexus-cyan border border-nexus-cyan/40"
                : "text-nexus-muted hover:text-white hover:bg-nexus-card border border-transparent"
            }`}
            title={showRaw ? "Switch to Formatted Markdown View" : "View Raw Markdown Source"}
          >
            {showRaw ? (
              <>
                <Eye className="w-3 h-3" />
                <span>Formatted</span>
              </>
            ) : (
              <>
                <Code className="w-3 h-3" />
                <span>Raw</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-nexus-card text-nexus-muted hover:text-white transition-colors text-[11px] font-mono border border-transparent hover:border-nexus-border"
            title="Copy full markdown text to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-nexus-emerald" />
                <span className="text-nexus-emerald">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Body */}
      {showRaw ? (
        <div className="bg-[#0b0d13] border border-nexus-border rounded-lg p-3 font-mono text-[11px] text-nexus-cyan/90 overflow-x-auto whitespace-pre-wrap leading-relaxed select-text">
          {content}
        </div>
      ) : (
        <div className="select-text">
          <MarkdownRenderer content={textToShow} />
          {isTyping && (
            <span className="inline-block w-1.5 h-3.5 bg-nexus-cyan animate-pulse ml-0.5 align-middle" />
          )}
        </div>
      )}

      {/* Skip Hint while Typing */}
      {isTyping && (
        <div className="mt-2 text-[10px] font-mono text-nexus-muted/60 select-none cursor-pointer">
          Click anywhere on this card to finish typing immediately
        </div>
      )}

      {/* Verified Source Citations */}
      {typingComplete && citations && citations.length > 0 && (
        <div className="mt-4 pt-3 border-t border-nexus-border">
          <span className="text-[10px] font-mono uppercase tracking-wider text-nexus-muted block mb-2">
            Verified Sources ({citations.length}) — Click to Inspect in Document
          </span>
          <div className="flex flex-wrap gap-2">
            {citations.map((cite, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setTargetPage(cite.page, cite.source_text, cite.file_name);
                }}
                className="flex items-center space-x-2 px-2.5 py-1.5 rounded-md bg-nexus-card border border-nexus-cyan/40 hover:border-nexus-cyan text-[11px] text-nexus-cyan transition-all duration-150 group shadow-sm hover:shadow-neural-cyan/30 text-left active:scale-[0.98]"
              >
                <FileText className="w-3 h-3 text-nexus-cyan flex-shrink-0" />
                <span className="truncate max-w-[200px]">{cite.file_name}</span>
                <span className="px-1 py-0.2 rounded bg-nexus-cyan/15 font-mono text-[10px] text-nexus-cyan-bright">
                  p. {cite.page}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
