'use client';

import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { NodeResizeFrame } from './NodeResizeFrame';
import { useStore } from '@/store/useStore';
import { AppNode, DocNodeData } from '@/types';
import { FileText } from 'lucide-react';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

export function DocNode({ id, data, selected }: NodeProps<AppNode>) {
  const d = data as DocNodeData;
  const openOverlay = useStore((s) => s.openOverlay);

  // Preview non-empty blocks
  const previewBlocks = (d.blocks || [])
    .filter((b) => b.type === 'divider' || (b.content && b.content.trim()))
    .slice(0, 10);

  return (
    <div
      className="w-full h-full flex flex-col group relative rounded-xl border-2 overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:shadow-accent/10"
      style={{
        backgroundColor: '#1a1a2e',
        borderColor: selected ? 'var(--color-node-border-selected)' : '#2d2d5e',
        minWidth: 220,
        minHeight: 140,
      }}
      onDoubleClick={(e) => { e.stopPropagation(); openOverlay('doc', id); }}
    >
      <NodeResizeFrame minWidth={200} minHeight={120} isVisible={selected} color="var(--color-accent)" />

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
      <div className="flex items-center space-x-2 px-4 pt-3.5 pb-2 border-b border-white/10 shrink-0">
        <FileText size={14} className="text-blue-400 shrink-0" />
        <span className="text-sm font-semibold text-text-main truncate">{d.title || 'Untitled Doc'}</span>
        <span className="ml-auto text-[10px] text-text-muted/40 font-mono shrink-0">
          {(d.blocks || []).length} block{(d.blocks || []).length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Preview */}
      <div className="flex-1 min-h-0 px-4 py-2.5 space-y-1.5 overflow-hidden relative">
        {previewBlocks.length > 0 ? (
          previewBlocks.map((b) => {
            if (b.type === 'divider') {
              return <hr key={b.id} className="border-[#333] my-1" />;
            }
            if (b.type === 'quote') {
              return (
                <div key={b.id} className="border-l-2 border-accent/60 pl-2 text-xs italic text-text-muted truncate">
                  <MarkdownRenderer content={b.content} />
                </div>
              );
            }
            if (b.type === 'callout') {
              return (
                <div key={b.id} className="bg-accent/10 rounded px-2 py-1 text-xs text-text-muted flex items-center space-x-1.5 truncate">
                  <span>{b.icon || '💡'}</span>
                  <span className="truncate"><MarkdownRenderer content={b.content} /></span>
                </div>
              );
            }
            if (b.type === 'heading1') {
              return (
                <p key={b.id} className="text-xs font-bold text-text-main font-serif truncate">
                  <MarkdownRenderer content={b.content} />
                </p>
              );
            }
            if (b.type === 'heading2' || b.type === 'heading3') {
              return (
                <p key={b.id} className="text-xs font-semibold text-text-main truncate">
                  <MarkdownRenderer content={b.content} />
                </p>
              );
            }
            return (
              <p key={b.id} className="text-xs text-text-muted truncate leading-relaxed">
                {b.type === 'checklist' ? (b.checked ? '☑ ' : '☐ ') : b.type === 'bullet' ? '• ' : ''}
                <MarkdownRenderer content={b.content} />
              </p>
            );
          })
        ) : (
          <p className="text-xs text-text-muted/50 italic">Double-click to edit…</p>
        )}
      </div>

      {/* Hover glow */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ boxShadow: 'inset 0 0 30px rgba(108,99,255,0.08)' }} />
    </div>
  );
}
