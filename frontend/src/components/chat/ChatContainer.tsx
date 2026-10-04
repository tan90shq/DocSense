import React, { useState, useRef, useEffect } from "react";
import { CornerDownLeft, AlertCircle, Loader2 } from "lucide-react";
import { useNexusStore } from "../../store/useNexusStore";
import { askQuestion, type Citation } from "../../services/api";
import { ReasoningTrace } from "./ReasoningTrace";
import { MessageCard } from "./MessageCard";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  isStreaming?: boolean;
}

export const ChatContainer: React.FC = () => {
  const [inputQuery, setInputQuery] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [pendingUserQuery, setPendingUserQuery] = useState<string | null>(null);
  const [streamingCitationCount, setStreamingCitationCount] = useState(0);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [chatError, setChatError] = useState<string | null>(null);

  const {
    activeSession,
    activeSessionId,
    scopedPdfs,
    refreshSessions,
    selectSession,
    createNewSession,
    pendingPromptText,
    setPendingPromptText,
    addLocalMessage,
  } = useNexusStore();

  const prevSessionIdRef = useRef(activeSessionId);
  if (prevSessionIdRef.current !== activeSessionId) {
    prevSessionIdRef.current = activeSessionId;
    if (streamingMessageId !== null) {
      setStreamingMessageId(null);
    }
  }

  useEffect(() => {
    if (pendingPromptText) {
      setInputQuery(pendingPromptText);
      setPendingPromptText(null);
    }
  }, [pendingPromptText, setPendingPromptText]);

  const sessionTitle =
    activeSession?.session_title ||
    (activeSessionId ? `Session #${activeSessionId}` : "No Active Session");

  // Format previous_chats from backend
  const messages: ChatMessage[] = [];
  if (activeSession && activeSession.previous_chats) {
    activeSession.previous_chats.forEach((pair, idx) => {
      const userQ = pair[0];
      const aiAns = pair[1];

      messages.push({
        id: `q-${idx}`,
        role: "user",
        content: userQ,
      });

      if (typeof aiAns === "object" && aiAns !== null) {
        messages.push({
          id: `a-${idx}`,
          role: "assistant",
          content: aiAns.answer || "",
          citations: aiAns.citations || [],
        });
      } else {
        messages.push({
          id: `a-${idx}`,
          role: "assistant",
          content: String(aiAns),
        });
      }
    });
  }

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isAsking, pendingUserQuery, chatError]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputQuery.trim() || isAsking || scopedPdfs.length === 0) return;

    let targetSessionId = activeSessionId;
    if (!targetSessionId) {
      targetSessionId = await createNewSession();
      if (!targetSessionId) return;
    }

    const query = inputQuery.trim();
    setInputQuery("");
    setPendingUserQuery(query);
    setIsAsking(true);
    setChatError(null);
    setStreamingCitationCount(0);

    try {
      const response = await askQuestion(targetSessionId, query, scopedPdfs);
      setStreamingCitationCount(response.citations?.length || 0);

      // Track the newly added assistant response for typewriter streaming
      const nextAssistantIdx = activeSession?.previous_chats?.length ?? 0;
      setStreamingMessageId(`a-${nextAssistantIdx}`);

      // Instantly inject into session state to avoid UI flashes/glitches
      addLocalMessage(query, response);
      setPendingUserQuery(null);

      // Sync backend session metadata
      await selectSession(targetSessionId);
      await refreshSessions();
    } catch (err: any) {
      console.error("Ask query error:", err);
      setChatError(
        err.message ||
          "Inference failed. Check that the backend server is running and a valid Groq model is selected."
      );
    } finally {
      setIsAsking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="h-full flex flex-col bg-nexus-void relative overflow-hidden select-text min-w-0">
      {/* Top Header */}
      <div className="h-10 border-b border-nexus-border px-4 flex items-center justify-between bg-nexus-panel/40 select-none min-w-0">
        <div className="flex items-center space-x-2 truncate">
          <span className="text-[11px] font-mono text-nexus-muted uppercase">SESSION:</span>
          <span className="text-xs font-medium text-white truncate">{sessionTitle}</span>
        </div>
        <div className="flex items-center space-x-1.5 flex-shrink-0">
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              scopedPdfs.length > 0
                ? "bg-nexus-card border-nexus-cyan/30 text-nexus-cyan"
                : "bg-red-950/40 border-red-800 text-red-400"
            }`}
          >
            {scopedPdfs.length} Scoped {scopedPdfs.length === 1 ? "Doc" : "Docs"}
          </span>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && !isAsking && !pendingUserQuery ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 select-none">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-nexus-violet/20 to-nexus-cyan/20 border border-nexus-violet/40 flex items-center justify-center mb-4 shadow-neural-violet">
              <span className="text-xl">✦</span>
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">
              DocSense Neural Reasoning Ready
            </h3>
            <p className="text-xs text-nexus-muted max-w-sm">
              Ask anything across your scoped documents. Citations and grounded references will automatically synchronize with the document inspector.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageCard
              key={msg.id}
              role={msg.role}
              content={msg.content}
              citations={msg.citations}
              isStreaming={msg.id === streamingMessageId}
              onTypingComplete={() => {
                if (msg.id === streamingMessageId) {
                  setStreamingMessageId(null);
                }
              }}
            />
          ))
        )}

        {/* Optimistic Pending User Query */}
        {pendingUserQuery && (
          <MessageCard
            key="pending-query"
            role="user"
            content={pendingUserQuery}
          />
        )}

        {/* Live Reasoning Trace while generating */}
        {isAsking && (
          <ReasoningTrace
            isGenerating={true}
            citationCount={streamingCitationCount}
          />
        )}

        {/* Error Notification Banner with Retry/Restore */}
        {chatError && (
          <div className="max-w-2xl bg-red-950/40 border border-red-800/80 rounded-xl p-4 text-xs text-red-200 flex items-start justify-between space-x-3 shadow-lg animate-in fade-in duration-200">
            <div className="flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold text-red-300 mb-0.5">
                  Query Processing Error
                </strong>
                <p className="leading-relaxed">{chatError}</p>
              </div>
            </div>
            <button
              onClick={() => {
                if (pendingUserQuery) setInputQuery(pendingUserQuery);
                setChatError(null);
                setPendingUserQuery(null);
              }}
              className="px-2.5 py-1 rounded bg-red-900/60 hover:bg-red-800 text-red-100 font-mono text-[10px] flex-shrink-0 transition-colors"
            >
              Restore Input
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sticky Prompt Bar */}
      <div className="p-4 border-t border-nexus-border bg-nexus-panel/50 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="relative rounded-xl border border-nexus-border focus-within:border-nexus-violet/80 bg-nexus-card/90 transition-all duration-150 shadow-inner">
            <textarea
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isAsking}
              placeholder={
                scopedPdfs.length === 0
                  ? "⚠ Check at least one document in the sidebar to ask questions..."
                  : "Ask questions across scoped documents... (Shift+Enter for newline)"
              }
              rows={2}
              className="w-full bg-transparent px-3.5 py-2.5 text-xs text-nexus-text placeholder-nexus-muted focus:outline-none resize-none disabled:opacity-50"
            />
            <div className="px-3 pb-2 flex items-center justify-between">
              <span className="text-[10px] font-mono text-nexus-muted flex items-center">
                {scopedPdfs.length === 0 ? (
                  <span className="text-red-400 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" /> No documents scoped
                  </span>
                ) : (
                  <>
                    Target:{" "}
                    <span className="text-nexus-cyan ml-1 truncate max-w-[250px]">
                      {scopedPdfs.length} {scopedPdfs.length === 1 ? "document" : "documents"} selected
                    </span>
                  </>
                )}
              </span>

              <button
                type="submit"
                disabled={isAsking || !inputQuery.trim() || scopedPdfs.length === 0}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  isAsking || !inputQuery.trim() || scopedPdfs.length === 0
                    ? "bg-nexus-border text-nexus-muted cursor-not-allowed"
                    : "bg-nexus-violet hover:bg-nexus-violet-bright text-white shadow-neural-violet active:scale-[0.98]"
                }`}
              >
                {isAsking ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>Query</span>
                    <CornerDownLeft className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
