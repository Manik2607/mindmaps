'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import {
  FileText, Columns3, PenLine, Image as ImageIcon,
  StickyNote, Network, ChevronLeft, ChevronRight, Search,
} from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { AppNode } from '@/types';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';

const KIND_ICONS: Record<string, React.ReactNode> = {
  mindmap:    <Network size={13} />,
  doc:        <FileText size={13} />,
  kanban:     <Columns3 size={13} />,
  excalidraw: <PenLine size={13} />,
  image:      <ImageIcon size={13} />,
  sticky:     <StickyNote size={13} />,
};

const KIND_COLORS: Record<string, string> = {
  mindmap:    'text-text-muted',
  doc:        'text-blue-400',
  kanban:     'text-emerald-400',
  excalidraw: 'text-purple-400',
  image:      'text-amber-400',
  sticky:     'text-yellow-400',
};

function getNodeLabel(node: AppNode): string {
  const d = node.data;
  if (d.kind === 'mindmap') return d.label || 'Mind Map Node';
  if (d.kind === 'doc') return d.title || 'Untitled Doc';
  if (d.kind === 'kanban') return d.title || 'Untitled Board';
  if (d.kind === 'excalidraw') return d.title || 'Drawing';
  if (d.kind === 'image') return d.alt || 'Image';
  if (d.kind === 'sticky') return d.content?.slice(0, 32) || 'Sticky Note';
  return 'Node';
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onSearchOpen: () => void;
}

export function Sidebar({ isOpen, onToggle, onSearchOpen }: SidebarProps) {
  const nodes = useStore((s) => s.nodes);
  const { setCenter, getZoom } = useReactFlow();
  const [filter, setFilter] = useState('');

  const groupedNodes = nodes.reduce<Record<string, AppNode[]>>((acc, n) => {
    const k = n.data.kind;
    if (!acc[k]) acc[k] = [];
    acc[k].push(n);
    return acc;
  }, {});

  const filteredNodes = filter
    ? nodes.filter((n) => getNodeLabel(n).toLowerCase().includes(filter.toLowerCase()))
    : null;

  const flyTo = (node: AppNode) => {
    setCenter(node.position.x + 120, node.position.y + 80, {
      zoom: Math.max(1, getZoom()),
      duration: 500,
    });
  };

  return (
    <>
      {/* Sidebar panel */}
      <div
        className={`fixed top-0 left-0 h-full flex flex-col bg-[#0d0d0d] border-r border-[#1e1e1e] transition-all duration-300 z-30 ${
          isOpen ? 'w-64' : 'w-0'
        } overflow-hidden`}
      >
        {/* Header with WorkspaceSwitcher */}
        <div className="p-3 border-b border-[#1e1e1e] shrink-0 space-y-1">
          <p className="text-[10px] text-text-muted/50 uppercase tracking-widest font-medium px-1">Workspace</p>
          <WorkspaceSwitcher variant="sidebar" />
        </div>

        {/* Search bar */}
        <div className="px-3 py-3 border-b border-[#1e1e1e] shrink-0">
          <div className="flex items-center space-x-2 bg-[#111] border border-[#222] rounded-lg px-3 py-1.5">
            <Search size={13} className="text-text-muted/50 shrink-0" />
            <input
              className="flex-1 bg-transparent border-none outline-none text-xs text-text-main placeholder-text-muted/40"
              placeholder="Filter nodes…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>

        {/* Node list */}
        <div className="flex-1 overflow-y-auto py-2">
          {filteredNodes ? (
            // Flat filtered list
            <div className="space-y-0.5 px-2">
              {filteredNodes.map((node) => (
                <button
                  key={node.id}
                  className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg hover:bg-[#1a1a1a] transition-colors text-left group ${KIND_COLORS[node.data.kind] || 'text-text-muted'}`}
                  onClick={() => flyTo(node)}
                >
                  <span className="shrink-0">{KIND_ICONS[node.data.kind]}</span>
                  <span className="text-xs text-text-main truncate">{getNodeLabel(node)}</span>
                </button>
              ))}
              {filteredNodes.length === 0 && (
                <p className="text-xs text-text-muted/40 text-center mt-4">No matches</p>
              )}
            </div>
          ) : (
            // Grouped view
            Object.entries(groupedNodes).map(([kind, kindNodes]) => (
              <div key={kind} className="mb-2">
                <div className="flex items-center space-x-1.5 px-4 py-1">
                  <span className={KIND_COLORS[kind] || 'text-text-muted'}>{KIND_ICONS[kind]}</span>
                  <span className="text-[10px] text-text-muted/50 uppercase tracking-widest font-semibold">
                    {kind === 'mindmap' ? 'Mind Map' : kind.charAt(0).toUpperCase() + kind.slice(1)}s
                    <span className="ml-1 text-text-muted/30">({kindNodes.length})</span>
                  </span>
                </div>
                <div className="space-y-0.5 px-2">
                  {kindNodes.map((node) => (
                    <button
                      key={node.id}
                      className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg hover:bg-[#1a1a1a] transition-colors text-left"
                      onClick={() => flyTo(node)}
                    >
                      <span className="text-xs text-text-main truncate">{getNodeLabel(node)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}

          {nodes.length === 0 && !filter && (
            <div className="px-4 mt-6 text-center">
              <p className="text-xs text-text-muted/40">Your canvas is empty.</p>
              <p className="text-xs text-text-muted/30 mt-1">Use the toolbar to add nodes.</p>
            </div>
          )}
        </div>

        {/* Bottom: Full search link */}
        <div className="p-3 border-t border-[#1e1e1e] shrink-0">
          <button
            className="w-full flex items-center justify-center space-x-2 py-2 rounded-lg bg-[#111] hover:bg-[#1a1a1a] border border-[#222] text-xs text-text-muted hover:text-text-main transition-colors"
            onClick={onSearchOpen}
          >
            <Search size={13} />
            <span>Search all (⌘/)</span>
          </button>
        </div>
      </div>

      {/* Toggle button */}
      <button
        className={`fixed top-1/2 -translate-y-1/2 z-40 w-5 h-12 flex items-center justify-center bg-[#1a1a1a] border border-[#2a2a2a] rounded-r-lg hover:bg-[#222] transition-all ${
          isOpen ? 'left-64' : 'left-0'
        } duration-300`}
        onClick={onToggle}
        title={isOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {isOpen ? <ChevronLeft size={12} className="text-text-muted" /> : <ChevronRight size={12} className="text-text-muted" />}
      </button>
    </>
  );
}
