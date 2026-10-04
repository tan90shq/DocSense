import React, { useRef, useEffect, useState } from "react";
import { PanelGroup, Panel, PanelResizeHandle, type ImperativePanelHandle } from "react-resizable-panels";
import { WorkspaceNav } from "../sidebar/WorkspaceNav";
import { ChatContainer } from "../chat/ChatContainer";
import { PdfInspector } from "../pdf/PdfInspector";
import { useNexusStore } from "../../store/useNexusStore";

export const ResizableLayout: React.FC = () => {
  const { layoutMode, isSidebarOpen } = useNexusStore();
  const [isDragging, setIsDragging] = useState(false);

  const sidebarRef = useRef<ImperativePanelHandle>(null);
  const chatRef = useRef<ImperativePanelHandle>(null);
  const pdfRef = useRef<ImperativePanelHandle>(null);

  // Apply layout presets dynamically
  useEffect(() => {
    try {
      if (layoutMode === "focus-chat") {
        if (isSidebarOpen) sidebarRef.current?.resize(16);
        chatRef.current?.resize(isSidebarOpen ? 84 : 100);
        pdfRef.current?.collapse();
      } else if (layoutMode === "focus-pdf") {
        if (isSidebarOpen) sidebarRef.current?.resize(16);
        chatRef.current?.resize(24);
        pdfRef.current?.expand();
        pdfRef.current?.resize(isSidebarOpen ? 60 : 76);
      } else {
        // Default Split View
        if (isSidebarOpen) {
          sidebarRef.current?.expand();
          sidebarRef.current?.resize(18);
        }
        chatRef.current?.expand();
        chatRef.current?.resize(42);
        pdfRef.current?.expand();
        pdfRef.current?.resize(40);
      }
    } catch {
      // Safe fallback if panels are initializing
    }
  }, [layoutMode]);

  // Sidebar toggle sync
  useEffect(() => {
    try {
      if (isSidebarOpen) {
        sidebarRef.current?.expand();
        sidebarRef.current?.resize(18);
      } else {
        sidebarRef.current?.collapse();
      }
    } catch {
      // Safe fallback
    }
  }, [isSidebarOpen]);

  return (
    <div className="flex-1 w-full h-[calc(100vh-3rem)] overflow-hidden relative min-w-0">
      {/* Dragging glass overlay to prevent iframe from swallowing mouse events */}
      {isDragging && (
        <div className="absolute inset-0 z-40 cursor-col-resize select-none bg-transparent" />
      )}

      <PanelGroup direction="horizontal" autoSaveId="docsense-layout-persist">
        {/* Panel 1: Workspace Navigator (18%) */}
        <Panel
          ref={sidebarRef}
          defaultSize={18}
          minSize={12}
          maxSize={30}
          collapsible={true}
          id="workspace-panel"
          className="min-w-0"
        >
          <WorkspaceNav />
        </Panel>

        {/* Divider 1 */}
        {isSidebarOpen && (
          <PanelResizeHandle
            onDragging={setIsDragging}
            className="resize-handle w-1 bg-nexus-border hover:bg-nexus-violet transition-colors cursor-col-resize z-20"
          />
        )}

        {/* Panel 2: Conversation & Thought Engine (42%) */}
        <Panel
          ref={chatRef}
          defaultSize={42}
          minSize={20}
          maxSize={85}
          id="chat-panel"
          className="min-w-0"
        >
          <ChatContainer />
        </Panel>

        {/* Divider 2 */}
        {layoutMode !== "focus-chat" && (
          <PanelResizeHandle
            onDragging={setIsDragging}
            className="resize-handle w-1 bg-nexus-border hover:bg-nexus-cyan transition-colors cursor-col-resize z-20"
          />
        )}

        {/* Panel 3: Neural PDF Inspector (40%) */}
        <Panel
          ref={pdfRef}
          defaultSize={40}
          minSize={20}
          maxSize={80}
          collapsible={true}
          id="pdf-panel"
          className="min-w-0"
        >
          <PdfInspector />
        </Panel>
      </PanelGroup>
    </div>
  );
};

