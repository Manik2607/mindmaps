'use client';

import React, { useState } from 'react';
import { useStore, useTemporalStore } from '@/store/useStore';
import { useReactFlow } from '@xyflow/react';
import { Download, Undo2, Redo2, Pencil, PanelLeftOpen } from 'lucide-react';
import { toPng } from 'html-to-image';
import { useCallback } from 'react';

interface TopBarProps {
  onSidebarToggle: () => void;
}

export function TopBar({ onSidebarToggle }: TopBarProps) {
  const workspaceName = useStore((s) => s.workspaceName);
  const renameWorkspace = useStore((s) => s.renameWorkspace);
  const activeNodeId = useStore((s) => s.overlay.type ? null : null); // not used here
  const { undo, redo } = useTemporalStore((s) => s);
  const { fitView } = useReactFlow();

  const [isRenaming, setIsRenaming] = useState(false);
  const [nameInput, setNameInput] = useState('');

  const submitRename = () => {
    if (nameInput.trim()) renameWorkspace(nameInput.trim());
    setIsRenaming(false);
  };

  const exportPng = useCallback(() => {
    const el = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!el) return;
    fitView({ padding: 0.2, duration: 200 });
    setTimeout(() => {
      toPng(el, { backgroundColor: '#0D0D0D' }).then((dataUrl) => {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `canvas-${Date.now()}.png`;
        a.click();
      });
    }, 350);
  }, [fitView]);

  void activeNodeId; // suppress unused warning

  return (
    <div className="fixed top-0 left-0 right-0 h-12 z-20 flex items-center px-4 border-b border-[#1e1e1e] bg-[#0d0d0d]/95 backdrop-blur-sm">
      {/* Left: sidebar toggle + logo */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onSidebarToggle}
          className="p-1.5 rounded-lg hover:bg-[#1e1e1e] text-text-muted hover:text-text-main transition-colors"
          title="Toggle sidebar"
        >
          <PanelLeftOpen size={17} />
        </button>

        <div className="flex items-center space-x-2">
          {/* App logo pill */}
          <div className="flex items-center space-x-1.5 bg-accent/10 border border-accent/20 rounded-full px-3 py-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="text-[11px] font-semibold text-accent tracking-wider">FLOWY</span>
          </div>

          {/* Workspace name */}
          <div className="text-[#333] select-none">›</div>
          {isRenaming ? (
            <input
              autoFocus
              className="bg-node-fill border border-accent text-text-main text-sm rounded px-2 py-0.5 outline-none min-w-[160px]"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={submitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitRename();
                if (e.key === 'Escape') setIsRenaming(false);
              }}
            />
          ) : (
            <button
              className="text-sm text-text-main hover:text-accent transition-colors flex items-center space-x-1.5 group"
              onDoubleClick={() => { setNameInput(workspaceName); setIsRenaming(true); }}
            >
              <span>{workspaceName}</span>
              <Pencil size={11} className="opacity-0 group-hover:opacity-60 transition-opacity" />
            </button>
          )}
        </div>
      </div>

      {/* Right: actions */}
      <div className="ml-auto flex items-center space-x-1">
        <button
          onClick={() => undo()}
          className="p-1.5 rounded-lg hover:bg-[#1e1e1e] text-text-muted hover:text-text-main transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={16} />
        </button>
        <button
          onClick={() => redo()}
          className="p-1.5 rounded-lg hover:bg-[#1e1e1e] text-text-muted hover:text-text-main transition-colors"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 size={16} />
        </button>
        <div className="w-px h-5 bg-[#2a2a2a] mx-1" />
        <button
          onClick={exportPng}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] text-xs text-text-muted hover:text-text-main transition-colors"
          title="Export as PNG"
        >
          <Download size={14} />
          <span>Export</span>
        </button>
      </div>
    </div>
  );
}
