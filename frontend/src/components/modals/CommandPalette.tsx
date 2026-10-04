import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  FileText,
  MessageSquare,
  Plus,
  Upload,
  Settings,
  Layout,
  X,
  BookOpen,
} from "lucide-react";
import { useNexusStore } from "../../store/useNexusStore";

export const CommandPalette: React.FC = () => {
  const {
    isCommandOpen,
    setCommandOpen,
    setSettingsOpen,
    pdfs,
    scopedPdfs,
    toggleScopedPdf,
    setActivePdf,
    sessions,
    selectSession,
    createNewSession,
    setLayoutMode,
  } = useNexusStore();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadDocument = useNexusStore((state) => state.uploadDocument);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen(!isCommandOpen);
      }
      if (e.key === "Escape" && isCommandOpen) {
        e.preventDefault();
        setCommandOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCommandOpen, setCommandOpen]);

  // Focus on open
  useEffect(() => {
    if (isCommandOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandOpen]);

  if (!isCommandOpen) return null;

  // Filtered lists
  const filteredDocs = pdfs.filter((p) =>
    p.toLowerCase().includes(query.toLowerCase())
  );
  const filteredSessions = sessions.filter((s) =>
    (s.session_title || `Session #${s.session_id}`).toLowerCase().includes(query.toLowerCase())
  );

  const quickActions = [
    {
      id: "act-new-chat",
      type: "action",
      title: "Create New Chat Session",
      icon: Plus,
      run: async () => {
        await createNewSession();
        setCommandOpen(false);
      },
    },
    {
      id: "act-upload-doc",
      type: "action",
      title: "Upload PDF Document",
      icon: Upload,
      run: () => {
        fileInputRef.current?.click();
      },
    },
    {
      id: "act-focus-chat",
      type: "action",
      title: "Layout: Focus Chat",
      icon: Layout,
      run: () => {
        setLayoutMode("focus-chat");
        setCommandOpen(false);
      },
    },
    {
      id: "act-focus-pdf",
      type: "action",
      title: "Layout: Focus PDF Inspector",
      icon: BookOpen,
      run: () => {
        setLayoutMode("focus-pdf");
        setCommandOpen(false);
      },
    },
    {
      id: "act-split",
      type: "action",
      title: "Layout: 3-Panel Split View",
      icon: Layout,
      run: () => {
        setLayoutMode("split");
        setCommandOpen(false);
      },
    },
    {
      id: "act-settings",
      type: "action",
      title: "Open DocSense Settings",
      icon: Settings,
      run: () => {
        setCommandOpen(false);
        setSettingsOpen(true);
      },
    },
  ].filter((a) => a.title.toLowerCase().includes(query.toLowerCase()));

  // Flattened items for keyboard navigation
  const allItems: { id: string; action: () => void }[] = [
    ...quickActions.map((a) => ({ id: a.id, action: a.run })),
    ...filteredDocs.map((doc) => ({
      id: `doc-${doc}`,
      action: () => {
        setActivePdf(doc);
        setCommandOpen(false);
      },
    })),
    ...filteredSessions.map((s) => ({
      id: `session-${s.session_id}`,
      action: () => {
        selectSession(s.session_id);
        setCommandOpen(false);
      },
    })),
  ];

  const handleKeyDownNav = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, allItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allItems.length) % Math.max(1, allItems.length));
    } else if (e.key === "Enter" && allItems.length > 0) {
      e.preventDefault();
      const current = allItems[selectedIndex];
      if (current) current.action();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadDocument(file);
      setCommandOpen(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150"
      onClick={() => setCommandOpen(false)}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleFileUpload}
      />
      <div
        className="w-full max-w-xl bg-nexus-panel border border-nexus-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDownNav}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-nexus-border bg-nexus-card/50">
          <Search className="w-4 h-4 text-nexus-cyan mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search documents, chat sessions, or commands..."
            className="w-full bg-transparent text-sm text-nexus-text placeholder-nexus-muted focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-nexus-muted hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="ml-2 px-1.5 py-0.5 rounded bg-nexus-void border border-nexus-border text-[10px] font-mono text-nexus-muted select-none">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {/* Quick Actions */}
          {quickActions.length > 0 && (
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-nexus-muted px-2.5 mb-1 block">
                Actions
              </span>
              <div className="space-y-0.5">
                {quickActions.map((act) => {
                  const itemIndex = allItems.findIndex((i) => i.id === act.id);
                  const isSelected = itemIndex === selectedIndex;
                  const Icon = act.icon;
                  return (
                    <button
                      key={act.id}
                      onClick={act.run}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                        isSelected
                          ? "bg-nexus-violet/20 text-white border border-nexus-violet/40"
                          : "text-nexus-text hover:bg-nexus-card/60 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon className="w-3.5 h-3.5 text-nexus-cyan" />
                        <span>{act.title}</span>
                      </div>
                      <span className="text-[10px] font-mono text-nexus-muted">↵</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Documents Section */}
          {filteredDocs.length > 0 && (
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-nexus-muted px-2.5 mb-1 block">
                Documents ({filteredDocs.length})
              </span>
              <div className="space-y-0.5">
                {filteredDocs.map((doc) => {
                  const itemIndex = allItems.findIndex((i) => i.id === `doc-${doc}`);
                  const isSelected = itemIndex === selectedIndex;
                  const isScoped = scopedPdfs.includes(doc);

                  return (
                    <div
                      key={doc}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                        isSelected
                          ? "bg-nexus-cyan/15 text-white border border-nexus-cyan/40"
                          : "text-nexus-text hover:bg-nexus-card/60 border border-transparent"
                      }`}
                    >
                      <button
                        onClick={() => {
                          setActivePdf(doc);
                          setCommandOpen(false);
                        }}
                        className="flex items-center space-x-2.5 flex-1 truncate text-left"
                      >
                        <FileText className="w-3.5 h-3.5 text-nexus-muted flex-shrink-0" />
                        <span className="truncate">{doc}</span>
                      </button>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleScopedPdf(doc);
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                            isScoped
                              ? "bg-nexus-cyan/20 text-nexus-cyan border border-nexus-cyan/40"
                              : "bg-nexus-card text-nexus-muted border border-nexus-border hover:text-white"
                          }`}
                        >
                          {isScoped ? "Scoped" : "Scope"}
                        </button>
                        <span className="text-[10px] font-mono text-nexus-muted">View ↵</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sessions Section */}
          {filteredSessions.length > 0 && (
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-nexus-muted px-2.5 mb-1 block">
                Chat Sessions ({filteredSessions.length})
              </span>
              <div className="space-y-0.5">
                {filteredSessions.map((session) => {
                  const itemIndex = allItems.findIndex((i) => i.id === `session-${session.session_id}`);
                  const isSelected = itemIndex === selectedIndex;

                  return (
                    <button
                      key={session.session_id}
                      onClick={() => {
                        selectSession(session.session_id);
                        setCommandOpen(false);
                      }}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                        isSelected
                          ? "bg-nexus-violet/20 text-white border border-nexus-violet/40"
                          : "text-nexus-text hover:bg-nexus-card/60 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <MessageSquare className="w-3.5 h-3.5 text-nexus-violet-bright flex-shrink-0" />
                        <span className="truncate">
                          {session.session_title || `Session #${session.session_id}`}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-nexus-muted">Switch ↵</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {allItems.length === 0 && (
            <div className="text-center py-8 text-xs text-nexus-muted font-mono">
              No matching documents, chats, or commands found for "{query}".
            </div>
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-4 py-2 border-t border-nexus-border bg-nexus-card/40 flex items-center justify-between text-[10px] font-mono text-nexus-muted">
          <div className="flex items-center space-x-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="text-nexus-cyan font-semibold">DocSense Omnisearch</span>
        </div>
      </div>
    </div>
  );
};
