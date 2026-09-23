'use client';

import React from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import { useStore } from '@/store/useStore';
import { AppNode, ExcalidrawNodeData } from '@/types';
import { PenLine } from 'lucide-react';

export function ExcalidrawNode({ id, data, selected }: NodeProps<AppNode>) {
  const d = data as ExcalidrawNodeData;
  const openOverlay = useStore((s) => s.openOverlay);

  return (
    <div
      className="group relative rounded-xl border-2 overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:shadow-purple-500/10"
      style={{
        backgroundColor: '#15101f',
        borderColor: selected ? 'var(--color-node-border-selected)' : '#3d2d5e',
        minWidth: 240,
        minHeight: 160,
      }}
      onDoubleClick={(e) => { e.stopPropagation(); openOverlay('excalidraw', id); }}
    >
      <NodeResizer minWidth={200} minHeight={140} isVisible={selected} color="var(--color-accent)" />

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

      {d.thumbnail ? (
        // Thumbnail view
        <>
          <div className="flex items-center space-x-2 px-3 pt-3 pb-2 border-b border-white/10 bg-black/20">
            <PenLine size={13} className="text-purple-400 shrink-0" />
            <span className="text-xs font-semibold text-text-main truncate">{d.title || 'Drawing'}</span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={d.thumbnail}
            alt={d.title || 'Excalidraw drawing'}
            className="w-full h-full object-contain bg-white/5"
            style={{ maxHeight: 260 }}
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-xl">
            <span className="text-xs text-white font-semibold flex items-center space-x-1">
              <PenLine size={14} />
              <span>Edit drawing</span>
            </span>
          </div>
        </>
      ) : (
        // Empty state
        <div className="flex flex-col items-center justify-center h-full py-8 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <PenLine size={20} className="text-purple-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-text-main">{d.title || 'Drawing'}</p>
            <p className="text-xs text-text-muted mt-1">Double-click to draw</p>
          </div>
        </div>
      )}
    </div>
  );
}
