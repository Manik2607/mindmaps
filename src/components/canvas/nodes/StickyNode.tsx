'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import { useStore } from '@/store/useStore';
import { AppNode, StickyNodeData } from '@/types';

const STICKY_COLORS = [
  { bg: '#2a2000', border: '#6b5000', label: 'Amber' },
  { bg: '#002a1a', border: '#006b45', label: 'Mint' },
  { bg: '#1a002a', border: '#5000a0', label: 'Purple' },
  { bg: '#2a0016', border: '#8b0040', label: 'Rose' },
  { bg: '#002a2a', border: '#006b6b', label: 'Teal' },
  { bg: '#1a1a00', border: '#6b6b00', label: 'Yellow' },
];

export function StickyNode({ id, data, selected }: NodeProps<AppNode>) {
  const d = data as StickyNodeData;
  const updateNodeData = useStore((s) => s.updateNodeData);
  const [isEditing, setIsEditing] = useState(!d.content);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const colorEntry = STICKY_COLORS.find((c) => c.bg === d.color) || STICKY_COLORS[0];

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  return (
    <div
      className="group relative rounded-lg border-2 p-4 min-w-[160px] min-h-[100px] shadow-lg transition-all"
      style={{
        backgroundColor: d.color || STICKY_COLORS[0].bg,
        borderColor: selected ? 'var(--color-node-border-selected)' : colorEntry.border,
      }}
      onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
      onMouseLeave={() => setShowColorPicker(false)}
    >
      <NodeResizer minWidth={140} minHeight={90} isVisible={selected} color="var(--color-accent)" />

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

      {/* Color dot */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="w-3 h-3 rounded-full border border-white/20"
          style={{ backgroundColor: colorEntry.border }}
          onClick={(e) => { e.stopPropagation(); setShowColorPicker(!showColorPicker); }}
        />
        {showColorPicker && (
          <div className="absolute top-full right-0 mt-1 flex space-x-1 bg-[#111] border border-[#333] rounded p-1.5 z-50">
            {STICKY_COLORS.map((c) => (
              <button
                key={c.bg}
                className="w-4 h-4 rounded-full hover:scale-125 transition-transform"
                style={{ backgroundColor: c.border }}
                title={c.label}
                onClick={(e) => {
                  e.stopPropagation();
                  updateNodeData(id, { color: c.bg } as Partial<StickyNodeData>);
                  setShowColorPicker(false);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {isEditing ? (
        <textarea
          ref={textareaRef}
          className="w-full h-full bg-transparent border-none outline-none resize-none text-sm text-text-main leading-relaxed"
          value={d.content}
          onChange={(e) => updateNodeData(id, { content: e.target.value } as Partial<StickyNodeData>)}
          onBlur={() => setIsEditing(false)}
          onKeyDown={(e) => { if (e.key === 'Escape') setIsEditing(false); e.stopPropagation(); }}
          onClick={(e) => e.stopPropagation()}
          placeholder="Write a note…"
          style={{ minHeight: 80 }}
        />
      ) : (
        <div className="text-sm text-text-main leading-relaxed whitespace-pre-wrap break-words">
          {d.content || <span className="text-text-muted/40 italic">Double-click to edit…</span>}
        </div>
      )}
    </div>
  );
}
