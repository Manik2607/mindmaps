'use client';

import React, { useRef } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import { useStore } from '@/store/useStore';
import { AppNode, ImageNodeData } from '@/types';
import { Image as ImageIcon } from 'lucide-react';

export function ImageNode({ id, data, selected }: NodeProps<AppNode>) {
  const d = data as ImageNodeData;
  const deleteNode = useStore((s) => s.deleteNode);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="group relative rounded-xl border-2 overflow-hidden"
      style={{
        borderColor: selected ? 'var(--color-node-border-selected)' : 'transparent',
        minWidth: 120,
        minHeight: 80,
      }}
    >
      <NodeResizer minWidth={80} minHeight={60} isVisible={selected} color="var(--color-accent)" />

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

      {d.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={d.src}
          alt={d.alt || 'Image reference'}
          className="w-full h-full object-contain"
          draggable={false}
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full bg-node-fill min-h-[100px]">
          <ImageIcon size={32} className="text-text-muted/40" />
        </div>
      )}

      {/* Hover delete */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="p-1 rounded bg-red-900/80 hover:bg-red-700 text-red-200 text-xs"
          onClick={(e) => { e.stopPropagation(); deleteNode(id); }}
        >
          ✕
        </button>
      </div>

      {/* Alt text badge */}
      {d.alt && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[10px] text-text-muted px-2 py-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
          {d.alt}
        </div>
      )}
    </div>
  );
}
