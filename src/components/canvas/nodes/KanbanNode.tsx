'use client';

import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { NodeResizeFrame } from './NodeResizeFrame';
import { useStore } from '@/store/useStore';
import { AppNode, KanbanNodeData } from '@/types';
import { Columns3 } from 'lucide-react';
import { BOARD_THEMES } from '@/components/overlays/KanbanBoardOverlay';

export function KanbanNode({ id, data, selected }: NodeProps<AppNode>) {
  const d = data as KanbanNodeData;
  const openOverlay = useStore((s) => s.openOverlay);
  const totalCards = (d.columns || []).reduce((sum, col) => sum + (col.cards?.length || 0), 0);
  const theme = BOARD_THEMES.find((t) => t.id === d.theme) || BOARD_THEMES[0];

  return (
    <div
      className="w-full h-full flex flex-col group relative rounded-xl border-2 overflow-hidden cursor-pointer transition-all hover:shadow-xl"
      style={{
        background: theme.background,
        borderColor: selected ? 'var(--color-node-border-selected)' : theme.border,
        minWidth: 260,
        minHeight: 160,
      }}
      onDoubleClick={(e) => { e.stopPropagation(); openOverlay('kanban', id); }}
    >
      <NodeResizeFrame minWidth={240} minHeight={140} isVisible={selected} color={theme.accent} />

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
      <div className="flex items-center space-x-2 px-4 pt-3.5 pb-2 border-b border-white/10 shrink-0 bg-black/20">
        <Columns3 size={14} style={{ color: theme.accent }} className="shrink-0" />
        <span className="text-sm font-semibold text-text-main truncate">{d.title || 'Untitled Board'}</span>
        <span className="ml-auto text-[10px] text-text-muted font-mono shrink-0">{totalCards} cards</span>
      </div>

      {/* Column preview */}
      <div className="flex-1 min-h-0 px-3.5 py-2.5 flex space-x-2.5 overflow-hidden">
        {(d.columns || []).slice(0, 8).map((col) => (
          <div key={col.id} className="flex flex-col min-w-0 flex-1 h-full bg-black/25 rounded-lg p-2 border border-white/5">
            <span
              className="text-[10px] font-semibold uppercase tracking-wider truncate mb-1.5 shrink-0"
              style={{ color: theme.accent }}
            >
              {col.title}
            </span>
            <div className="space-y-1 overflow-y-auto flex-1 pr-0.5">
              {(col.cards || []).slice(0, 8).map((card) => (
                <div
                  key={card.id}
                  className="text-[10px] text-text-muted/90 bg-white/5 rounded px-2 py-1 truncate flex items-center justify-between"
                  style={{
                    borderLeft: card.color && card.color !== 'transparent' ? `3px solid ${card.color}` : undefined,
                  }}
                >
                  <span className="truncate">{card.title}</span>
                  {card.checklist && card.checklist.length > 0 && (
                    <span className="text-[8px] font-mono opacity-50 shrink-0 ml-1">
                      {card.checklist.filter(i => i.done).length}/{card.checklist.length}
                    </span>
                  )}
                </div>
              ))}
              {(col.cards || []).length > 8 && (
                <div className="text-[9px] text-text-muted/40">+{col.cards.length - 8} more</div>
              )}
            </div>
          </div>
        ))}
        {(!d.columns || d.columns.length === 0) && (
          <p className="text-xs text-text-muted/50 italic p-2">Double-click to add columns…</p>
        )}
      </div>
    </div>
  );
}
