'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { useReactFlow } from '@xyflow/react';
import { Search } from 'lucide-react';
import { AppNode } from '@/types';

function getNodeLabel(node: AppNode): string {
  const d = node.data;
  if (d.kind === 'mindmap') return d.label || 'Mind Map Node';
  if (d.kind === 'doc') return d.title || 'Untitled Doc';
  if (d.kind === 'kanban') return d.title || 'Untitled Board';
  if (d.kind === 'excalidraw') return d.title || 'Drawing';
  if (d.kind === 'image') return d.alt || 'Image';
  if (d.kind === 'sticky') return d.content?.slice(0, 50) || 'Sticky Note';
  return 'Node';
}

const KIND_BADGE: Record<string, { label: string; color: string }> = {
  mindmap:    { label: 'Node',    color: 'bg-[#333] text-text-muted' },
  doc:        { label: 'Doc',     color: 'bg-blue-900/50 text-blue-300' },
  kanban:     { label: 'Board',   color: 'bg-emerald-900/50 text-emerald-300' },
  excalidraw: { label: 'Drawing', color: 'bg-purple-900/50 text-purple-300' },
  image:      { label: 'Image',   color: 'bg-amber-900/50 text-amber-300' },
  sticky:     { label: 'Sticky',  color: 'bg-yellow-900/50 text-yellow-300' },
};

type SearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const nodes = useStore((s) => s.nodes);
  const { setCenter, getZoom } = useReactFlow();
  const inputRef = useRef<HTMLInputElement>(null);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setQuery('');
    }
  }

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const results = query.trim()
    ? nodes.filter((n) => getNodeLabel(n).toLowerCase().includes(query.toLowerCase()))
    : [];

  const handleSelect = (node: AppNode) => {
    setCenter(node.position.x + 120, node.position.y + 80, {
      zoom: Math.max(1, getZoom()),
      duration: 400,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh] bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#141414] border border-[#2a2a2a] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center px-5 py-4 border-b border-[#222]">
          <Search size={18} className="text-text-muted mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-text-main placeholder-text-muted/50 text-lg"
            placeholder="Search nodes, docs, boards…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
          />
          <kbd className="text-[10px] text-text-muted/40 bg-[#1e1e1e] border border-[#333] rounded px-1.5 py-0.5 ml-2">ESC</kbd>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="max-h-[55vh] overflow-y-auto py-2">
            {results.map((node) => {
              const badge = KIND_BADGE[node.data.kind] || KIND_BADGE.mindmap;
              return (
                <div
                  key={node.id}
                  className="flex items-center justify-between px-5 py-3 hover:bg-[#1e1e1e] cursor-pointer border-l-2 border-transparent hover:border-accent transition-all"
                  onClick={() => handleSelect(node)}
                >
                  <span className="text-text-main text-sm">{getNodeLabel(node)}</span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {query.trim() !== '' && results.length === 0 && (
          <div className="px-5 py-10 text-center text-text-muted/40 text-sm">
            No results for &ldquo;{query}&rdquo;
          </div>
        )}

        {!query && (
          <div className="px-5 py-6 text-center text-text-muted/30 text-sm">
            Type to search across all nodes…
          </div>
        )}
      </div>
    </div>
  );
}
