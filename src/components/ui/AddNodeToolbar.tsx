'use client';

import React, { useState, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { useReactFlow } from '@xyflow/react';
import {
  FileText, Columns3, PenLine, Image as ImageIcon,
  StickyNote, Network, Search, Minus, Plus as PlusIcon, Maximize,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { AppNode } from '@/types';

type NodeKind = 'mindmap' | 'doc' | 'kanban' | 'excalidraw' | 'image' | 'sticky';

const TOOLS: { kind: NodeKind; icon: React.ReactNode; label: string; tooltip: string }[] = [
  { kind: 'doc',        icon: <FileText size={18} />,    label: 'Doc',      tooltip: 'Block document (Notion-style)' },
  { kind: 'kanban',     icon: <Columns3 size={18} />,    label: 'Board',    tooltip: 'Kanban board (Trello-style)' },
  { kind: 'excalidraw', icon: <PenLine size={18} />,     label: 'Drawing',  tooltip: 'Excalidraw whiteboard' },
  { kind: 'image',      icon: <ImageIcon size={18} />,   label: 'Image',    tooltip: 'Image reference (or paste)' },
  { kind: 'sticky',     icon: <StickyNote size={18} />,  label: 'Sticky',   tooltip: 'Sticky note' },
  { kind: 'mindmap',    icon: <Network size={18} />,     label: 'Node',     tooltip: 'Mind map node' },
];

function makeNode(kind: NodeKind, position: { x: number; y: number }): AppNode {
  const id = uuidv4();
  const base = { id, position };

  switch (kind) {
    case 'doc':
      return { ...base, type: 'doc', data: { kind: 'doc', title: 'Untitled Doc', blocks: [] } };
    case 'kanban':
      return { ...base, type: 'kanban', data: { kind: 'kanban', title: 'Untitled Board', columns: [] } };
    case 'excalidraw':
      return { ...base, type: 'excalidraw', data: { kind: 'excalidraw', title: 'New Drawing', elements: [], appState: { theme: 'dark' } } };
    case 'image':
      return { ...base, type: 'image', data: { kind: 'image', src: '', alt: '' } };
    case 'sticky':
      return { ...base, type: 'sticky', data: { kind: 'sticky', content: '', color: '#2a2000' } };
    default: // mindmap
      return { ...base, type: 'mindmap', data: { kind: 'mindmap', label: '', color: '#1E1E1E' } };
  }
}

interface AddNodeToolbarProps {
  onSearchOpen: () => void;
}

export function AddNodeToolbar({ onSearchOpen }: AddNodeToolbarProps) {
  const addNode = useStore((s) => s.addNode);
  const { getViewport, zoomIn, zoomOut, fitView } = useReactFlow();
  const [hoveredKind, setHoveredKind] = useState<NodeKind | null>(null);

  const handleAddNode = useCallback((kind: NodeKind) => {
    const vp = getViewport();
    // Place in the center of the current viewport
    const x = (-vp.x + window.innerWidth / 2) / vp.zoom;
    const y = (-vp.y + window.innerHeight / 2) / vp.zoom;
    const node = makeNode(kind, { x: x - 120, y: y - 80 });
    addNode(node);
  }, [addNode, getViewport]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-1 px-2 py-2 rounded-2xl border border-[#2a2a2a] bg-[#111]/90 backdrop-blur-md shadow-2xl">
      {/* Node type buttons */}
      {TOOLS.map(({ kind, icon, label, tooltip }) => (
        <div key={kind} className="relative flex flex-col items-center">
          {/* Tooltip */}
          {hoveredKind === kind && (
            <div className="absolute bottom-full mb-2 px-3 py-1.5 bg-[#222] border border-[#333] rounded-lg text-xs text-text-main whitespace-nowrap pointer-events-none shadow-lg">
              <div className="font-semibold">{label}</div>
              <div className="text-text-muted">{tooltip}</div>
            </div>
          )}
          <button
            className="flex flex-col items-center space-y-1 px-3 py-2 rounded-xl hover:bg-[#1e1e1e] text-text-muted hover:text-text-main transition-all group"
            onClick={() => handleAddNode(kind)}
            onMouseEnter={() => setHoveredKind(kind)}
            onMouseLeave={() => setHoveredKind(null)}
          >
            <span className="group-hover:text-accent transition-colors">{icon}</span>
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        </div>
      ))}

      {/* Divider */}
      <div className="w-px h-10 bg-[#2a2a2a] mx-1" />

      {/* Utility buttons */}
      <button
        className="p-2 rounded-xl hover:bg-[#1e1e1e] text-text-muted hover:text-text-main transition-all"
        onClick={onSearchOpen}
        title="Search (/)">
        <Search size={17} />
      </button>
      <button
        className="p-2 rounded-xl hover:bg-[#1e1e1e] text-text-muted hover:text-text-main transition-all"
        onClick={() => fitView({ duration: 400 })}
        title="Fit view">
        <Maximize size={17} />
      </button>
      <button
        className="p-2 rounded-xl hover:bg-[#1e1e1e] text-text-muted hover:text-text-main transition-all"
        onClick={() => zoomIn({ duration: 200 })}
        title="Zoom in">
        <PlusIcon size={17} />
      </button>
      <button
        className="p-2 rounded-xl hover:bg-[#1e1e1e] text-text-muted hover:text-text-main transition-all"
        onClick={() => zoomOut({ duration: 200 })}
        title="Zoom out">
        <Minus size={17} />
      </button>
    </div>
  );
}
