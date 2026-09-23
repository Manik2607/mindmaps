'use client';

import React from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import { useStore } from '@/store/useStore';
import { AppNode, KanbanNodeData } from '@/types';
import { Columns3 } from 'lucide-react';

export function KanbanNode({ id, data, selected }: NodeProps<AppNode>) {
  const d = data as KanbanNodeData;
  const openOverlay = useStore((s) => s.openOverlay);
  const totalCards = d.columns.reduce((sum, col) => sum + col.cards.length, 0);

  return (
    <div
      className="group relative rounded-xl border-2 overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:shadow-emerald-500/10"
      style={{
        backgroundColor: '#0d1f17',
        borderColor: selected ? 'var(--color-node-border-selected)' : '#1a3d2b',
        minWidth: 260,
        minHeight: 160,
      }}
      onDoubleClick={(e) => { e.stopPropagation(); openOverlay('kanban', id); }}
    >
      <NodeResizer minWidth={240} minHeight={140} isVisible={selected} color="var(--color-accent)" />

      {/* Handles */}
      {(['top', 'bottom', 'left', 'right'] as const).map((pos, i) => (
        <Handle
          key={pos}
          type={i === 0 ? 'target' : 'source'}
          position={[Position.Top, Position.Bottom, Position.Left, Position.Right][i]}
          id={pos}
          style={{ border: 'none', background: 'var(--color-text-muted)', width: 10, height: 10 }}
          className="opacity-0 group-hover:opacity-100 transition-opacity !rounded-full"
        />
      ))}

      {/* Header */}
      <div className="flex items-center space-x-2 px-4 pt-4 pb-2 border-b border-white/10">
        <Columns3 size={14} className="text-emerald-400 shrink-0" />
        <span className="text-sm font-semibold text-text-main truncate">{d.title || 'Untitled Board'}</span>
        <span className="ml-auto text-[10px] text-emerald-400/60 font-mono shrink-0">{totalCards} cards</span>
      </div>

      {/* Column preview */}
      <div className="px-4 py-3 flex space-x-3 overflow-hidden">
        {d.columns.slice(0, 4).map((col) => (
          <div key={col.id} className="flex flex-col min-w-0 flex-1">
            <span className="text-[10px] font-semibold text-emerald-400/80 uppercase tracking-wider truncate mb-1">
              {col.title}
            </span>
            <div className="space-y-1">
              {col.cards.slice(0, 3).map((card) => (
                <div
                  key={card.id}
                  className="text-[10px] text-text-muted bg-white/5 rounded px-2 py-1 truncate"
                >
                  {card.title}
                </div>
              ))}
              {col.cards.length > 3 && (
                <div className="text-[10px] text-text-muted/40">+{col.cards.length - 3} more</div>
              )}
            </div>
          </div>
        ))}
        {d.columns.length === 0 && (
          <p className="text-xs text-text-muted/50 italic">Double-click to add columns…</p>
        )}
      </div>
    </div>
  );
}
