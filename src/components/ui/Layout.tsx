'use client';

import React, { useState } from 'react';
import { useStore, useTemporalStore } from '@/store/useStore';
import { MindMapCanvas } from '@/components/canvas/MindMapCanvas';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { AddNodeToolbar } from './AddNodeToolbar';
import { SearchModal } from './SearchModal';
import { DocEditorOverlay } from '@/components/overlays/DocEditorOverlay';
import { KanbanBoardOverlay } from '@/components/overlays/KanbanBoardOverlay';
import { ExcalidrawOverlay } from '@/components/overlays/ExcalidrawOverlay';
import { useReactFlow } from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const overlay = useStore((s) => s.overlay);

  const { undo, redo } = useTemporalStore((s) => s);
  const { setNodes, getNodes } = useReactFlow();

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable;

      // Open search with / (only when not in input and no overlay)
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !inInput && overlay.type === null) {
        e.preventDefault();
        setSearchOpen(true);
      }

      // Undo/redo (always available)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) { e.preventDefault(); redo(); }
        else { e.preventDefault(); undo(); }
      }

      // Escape on canvas: deselect all
      if (e.key === 'Escape' && !inInput && overlay.type === null) {
        setNodes(getNodes().map((n) => ({ ...n, selected: false })));
      }

      // Ctrl+A: select all (only when no overlay)
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && overlay.type === null) {
        e.preventDefault();
        setNodes(getNodes().map((n) => ({ ...n, selected: true })));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, setNodes, getNodes, overlay.type]);

  const hasOverlay = overlay.type !== null;

  return (
    <div className="flex h-screen w-full relative overflow-hidden bg-canvas text-text-main font-sans">
      {/* Top bar */}
      <TopBar onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onSearchOpen={() => setSearchOpen(true)}
      />

      {/* Main canvas area — offset by top bar height (48px) */}
      <main
        className="flex-1 relative transition-all duration-300"
        style={{ marginTop: 48, marginLeft: sidebarOpen ? 256 : 0 }}
      >
        <MindMapCanvas />
        {/* Add node toolbar — only visible when no overlay */}
        {!hasOverlay && <AddNodeToolbar onSearchOpen={() => setSearchOpen(true)} />}
      </main>

      {/* Full-screen overlays */}
      <AnimatePresence>
        {overlay.type === 'doc' && (
          <motion.div
            key="doc-overlay"
            data-overlay="true"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[100]"
          >
            <DocEditorOverlay nodeId={overlay.nodeId} />
          </motion.div>
        )}
        {overlay.type === 'kanban' && (
          <motion.div
            key="kanban-overlay"
            data-overlay="true"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[100]"
          >
            <KanbanBoardOverlay nodeId={overlay.nodeId} />
          </motion.div>
        )}
        {overlay.type === 'excalidraw' && (
          <motion.div
            key="excalidraw-overlay"
            data-overlay="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100]"
          >
            <ExcalidrawOverlay nodeId={overlay.nodeId} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
