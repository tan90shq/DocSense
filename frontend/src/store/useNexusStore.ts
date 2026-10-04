import { create } from "zustand";
import {
  fetchSessions,
  createSession,
  deleteSession,
  fetchSessionDetails,
  fetchPdfs,
  uploadPdf,
  deletePdf,
  type Session,
} from "../services/api";

export type LayoutMode = "split" | "focus-chat" | "focus-pdf";

interface NexusState {
  // Sessions
  sessions: Session[];
  activeSessionId: number | null;
  activeSession: Session | null;
  isLoadingSessions: boolean;

  // Documents
  pdfs: string[];
  scopedPdfs: string[];
  activePdf: string | null;
  targetPage: number;
  highlightSnippet: string | null;
  isLoadingPdfs: boolean;

  // Upload Stargate
  isUploading: boolean;
  uploadStatus: string | null;

  // Modals & Controls
  isCommandOpen: boolean;
  isSettingsOpen: boolean;
  layoutMode: LayoutMode;
  isSidebarOpen: boolean;
  activeModel: string;
  availableModels: string[];

  // Error notifications
  error: string | null;

  // Prompt Forwarding (PDF to Chat)
  pendingPromptText: string | null;
  setPendingPromptText: (text: string | null) => void;

  // Actions
  loadInitialData: () => Promise<void>;
  refreshSessions: () => Promise<void>;
  selectSession: (sessionId: number) => Promise<void>;
  createNewSession: () => Promise<number | null>;
  removeSession: (sessionId: number) => Promise<void>;
  addLocalMessage: (userQuery: string, answerResponse: any) => void;

  refreshPdfs: () => Promise<void>;
  toggleScopedPdf: (fileName: string) => void;
  selectAllPdfs: () => void;
  setActivePdf: (fileName: string | null) => void;
  setTargetPage: (page: number, snippet?: string | null, fileName?: string | null) => void;
  uploadDocument: (file: File) => Promise<void>;
  removePdf: (fileName: string) => Promise<void>;

  setCommandOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setLayoutMode: (mode: LayoutMode) => void;
  cycleLayoutMode: () => void;
  toggleSidebar: () => void;
  loadSettings: () => Promise<void>;
  changeActiveModel: (model: string) => Promise<void>;

  clearError: () => void;
}

export const useNexusStore = create<NexusState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  activeSession: null,
  isLoadingSessions: false,

  pdfs: [],
  scopedPdfs: [],
  activePdf: null,
  targetPage: 1,
  highlightSnippet: null,
  isLoadingPdfs: false,

  isUploading: false,
  uploadStatus: null,
  error: null,
  pendingPromptText: null,

  isCommandOpen: false,
  isSettingsOpen: false,
  layoutMode: "split",
  isSidebarOpen: true,
  activeModel: "openai/gpt-oss-120b",
  availableModels: ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b", "allam-2-7b"],

  setPendingPromptText: (text: string | null) => set({ pendingPromptText: text }),
  setCommandOpen: (open: boolean) => set({ isCommandOpen: open }),
  setSettingsOpen: (open: boolean) => set({ isSettingsOpen: open }),
  setLayoutMode: (mode: LayoutMode) => set({ layoutMode: mode }),
  cycleLayoutMode: () => {
    const current = get().layoutMode;
    const next: LayoutMode =
      current === "split" ? "focus-chat" : current === "focus-chat" ? "focus-pdf" : "split";
    set({ layoutMode: next });
  },
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  loadSettings: async () => {
    try {
      const savedModel = localStorage.getItem("docsense_model");
      if (savedModel) {
        set({ activeModel: savedModel });
      }
    } catch {
      // Ignore if unavailable
    }
  },

  changeActiveModel: async (model: string) => {
    set({ activeModel: model });
    try {
      localStorage.setItem("docsense_model", model);
    } catch {
      // Ignore
    }
  },

  loadInitialData: async () => {
    try {
      set({ isLoadingSessions: true, isLoadingPdfs: true, error: null });
      const [sessions, pdfs] = await Promise.all([fetchSessions(), fetchPdfs()]);
      
      const activeSessionId = sessions.length > 0 ? sessions[0].session_id : null;
      let activeSession: Session | null = null;
      if (activeSessionId) {
        try {
          activeSession = await fetchSessionDetails(activeSessionId);
        } catch {
          activeSession = sessions[0];
        }
      }

      set({
        sessions,
        activeSessionId,
        activeSession,
        isLoadingSessions: false,
        pdfs,
        scopedPdfs: pdfs,
        activePdf: pdfs.length > 0 ? pdfs[0] : null,
        isLoadingPdfs: false,
      });

      // Load settings in background
      get().loadSettings();
    } catch (err: any) {
      set({
        error: err.message || "Failed to load workspace data",
        isLoadingSessions: false,
        isLoadingPdfs: false,
      });
    }
  },

  refreshSessions: async () => {
    try {
      const sessions = await fetchSessions();
      set({ sessions });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  selectSession: async (sessionId: number) => {
    try {
      set({ activeSessionId: sessionId });
      const details = await fetchSessionDetails(sessionId);
      set({ activeSession: details });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  createNewSession: async () => {
    try {
      set({ error: null });
      const res = await createSession();
      await get().refreshSessions();
      if (res.session_id) {
        await get().selectSession(res.session_id);
        return res.session_id;
      }
      return null;
    } catch (err: any) {
      set({ error: err.message });
      return null;
    }
  },

  removeSession: async (sessionId: number) => {
    try {
      await deleteSession(sessionId);
      const remainingSessions = get().sessions.filter((s) => s.session_id !== sessionId);
      const nextActiveId = remainingSessions.length > 0 ? remainingSessions[0].session_id : null;
      
      set({ sessions: remainingSessions });
      if (nextActiveId) {
        await get().selectSession(nextActiveId);
      } else {
        set({ activeSessionId: null, activeSession: null, highlightSnippet: null });
      }
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  addLocalMessage: (userQuery: string, answerResponse: any) => {
    set((state) => {
      if (!state.activeSession) return {};
      const newChats: [string, any][] = [
        ...state.activeSession.previous_chats,
        [userQuery, answerResponse],
      ];
      return {
        activeSession: {
          ...state.activeSession,
          previous_chats: newChats,
        },
      };
    });
  },

  refreshPdfs: async () => {
    try {
      const pdfs = await fetchPdfs();
      set((state) => {
        const remainingScoped = state.scopedPdfs.filter((p) => pdfs.includes(p));
        const activeStillExists = pdfs.includes(state.activePdf || "");
        return {
          pdfs,
          scopedPdfs: remainingScoped.length > 0 ? remainingScoped : pdfs,
          activePdf: activeStillExists ? state.activePdf : pdfs[0] || null,
          targetPage: activeStillExists ? state.targetPage : 1,
          highlightSnippet: activeStillExists ? state.highlightSnippet : null,
        };
      });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  toggleScopedPdf: (fileName: string) => {
    set((state) => {
      const exists = state.scopedPdfs.includes(fileName);
      const updated = exists
        ? state.scopedPdfs.filter((f) => f !== fileName)
        : [...state.scopedPdfs, fileName];
      return { scopedPdfs: updated };
    });
  },

  selectAllPdfs: () => {
    set((state) => ({ scopedPdfs: [...state.pdfs] }));
  },

  setActivePdf: (fileName: string | null) => {
    set({ activePdf: fileName, targetPage: 1, highlightSnippet: null });
  },

  setTargetPage: (page: number, snippet: string | null = null, fileName: string | null = null) => {
    set((state) => ({
      targetPage: page,
      highlightSnippet: snippet,
      activePdf: fileName && state.pdfs.includes(fileName) ? fileName : state.activePdf,
    }));
  },

  uploadDocument: async (file: File) => {
    try {
      set({ isUploading: true, uploadStatus: "Uploading PDF bytes..." });
      
      const progressTimer1 = setTimeout(() => {
        set({ uploadStatus: "Parsing & generating text chunks..." });
      }, 1000);

      const progressTimer2 = setTimeout(() => {
        set({ uploadStatus: "Generating embeddings & indexing into Qdrant..." });
      }, 3500);

      await uploadPdf(file);
      
      clearTimeout(progressTimer1);
      clearTimeout(progressTimer2);

      set({ uploadStatus: "Ingestion complete!" });
      setTimeout(() => {
        set({ isUploading: false, uploadStatus: null });
      }, 1200);

      await get().refreshPdfs();
      const cleanedName = file.name.replace(/[^a-zA-Z0-9_\-\.]/g, "_");
      set((state) => ({
        scopedPdfs: Array.from(new Set([...state.scopedPdfs, cleanedName])),
        activePdf: cleanedName,
      }));
    } catch (err: any) {
      set({
        isUploading: false,
        uploadStatus: null,
        error: err.message || "Upload failed",
      });
    }
  },

  removePdf: async (fileName: string) => {
    try {
      await deletePdf(fileName);
      await get().refreshPdfs();
      const remaining = get().pdfs;
      if (remaining.length === 0 || !remaining.includes(get().activePdf || "")) {
        set({
          activePdf: remaining[0] || null,
          targetPage: 1,
          highlightSnippet: null,
        });
      }
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  clearError: () => set({ error: null }),
}));

