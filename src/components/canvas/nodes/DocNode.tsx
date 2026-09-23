'use client';

import React from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import { useStore } from '@/store/useStore';
import { AppNode, DocNodeData } from '@/types';
import { FileText } from 'lucide-react';

export function DocNode({ id, data, selected }: NodeProps<AppNode>) {
  const d = data as DocNodeData;
  const openOverlay = useStore((s) => s.openOverlay);

  // Preview: first 3 non-empty blocks
  const previewBlocks = d.blocks
    .filter((b) => b.content.trim())
    .slice(0, 3);

  return (
    <div
      className="group relative rounded-xl border-2 overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:shadow-accent/10"
      style={{
        backgroundColor: '#1a1a2e',
        borderColor: selected ? 'var(--color-node-border-selected)' : '#2d2d5e',
        minWidth: 220,
        minHeight: 140,
      }}
      onDoubleClick={(e) => { e.stopPropagation(); openOverlay('doc', id); }}
    >
      <NodeResizer minWidth={200} minHeight={120} isVisible={selected} color="var(--color-accent)" />

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
        <FileText size={14} className="text-blue-400 shrink-0" />
        <span className="text-sm font-semibold text-text-main truncate">{d.title || 'Untitled Doc'}</span>
      </div>

      {/* Preview */}
      <div className="px-4 py-3 space-y-1">
        {previewBlocks.length > 0 ? (
          previewBlocks.map((b) => (
            <p key={b.id} className="text-xs text-text-muted truncate leading-relaxed">
              {b.type === 'checklist' ? (b.checked ? '✓ ' : '○ ') : b.type === 'bullet' ? '• ' : ''}
              {b.content}
            </p>
          ))
        ) : (
          <p className="text-xs text-text-muted/50 italic">Double-click to edit…</p>
        )}
      </div>

      {/* Footer badge */}
      <div className="absolute bottom-2 right-3 text-[10px] text-text-muted/40 font-mono">
        {d.blocks.length} block{d.blocks.length !== 1 ? 's' : ''}
      </div>

      {/* Hover glow */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ boxShadow: 'inset 0 0 30px rgba(108,99,255,0.08)' }} />
    </div>
  );
}
