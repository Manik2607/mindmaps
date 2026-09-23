'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import { useStore } from '@/store/useStore';
import { AppNode, MindmapNodeData } from '@/types';
import { Palette, Pencil } from 'lucide-react';

const COLORS = [
  '#1E1E1E',
  '#4A2B2B',
  '#4A3B22',
  '#2C3B2C',
  '#2B344A',
  '#3A2B4A',
  '#4A2B3A',
];

export function MindNode({ id, data, selected }: NodeProps<AppNode>) {
  const d = data as MindmapNodeData;
  const updateNodeData = useStore((s) => s.updateNodeData);
  const [isEditing, setIsEditing] = useState(d.label === '');
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const detailsRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus();
  }, [isEditing]);

  useEffect(() => {
    if (isEditingDetails && detailsRef.current) detailsRef.current.focus();
  }, [isEditingDetails]);

  return (
    <div
      className={`relative rounded-xl px-6 py-4 min-w-[120px] shadow-sm transition-shadow group border-2 outline-none`}
      style={{
        backgroundColor: d.color || COLORS[0],
        borderColor: selected ? 'var(--color-node-border-selected)' : 'var(--color-node-border)',
      }}
      tabIndex={0}
      onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
      onMouseLeave={() => setShowPalette(false)}
      onKeyDown={(e) => {
        if (e.key === 'Tab' && selected && !isEditing && !isEditingDetails) {
          e.preventDefault();
          setIsEditingDetails(true);
        }
      }}
    >
      <NodeResizer minWidth={120} minHeight={60} isVisible={selected} color="var(--color-accent)" />

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

      {/* Hover Actions */}
      <div className="absolute -top-3 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="p-1 rounded bg-node-border hover:bg-node-border-hover text-text-main"
          onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
        >
          <Pencil size={12} />
        </button>
        <div className="relative">
          <button
            className="p-1 rounded bg-node-border hover:bg-node-border-hover text-text-main"
            onClick={(e) => { e.stopPropagation(); setShowPalette(!showPalette); }}
          >
            <Palette size={12} />
          </button>
          {showPalette && (
            <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 flex bg-node-fill border border-node-border rounded p-1 space-x-1 z-50">
              {COLORS.map((c) => (
                <div
                  key={c}
                  className="w-4 h-4 rounded-full cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                  onClick={(e) => { e.stopPropagation(); updateNodeData(id, { color: c } as Partial<MindmapNodeData>); setShowPalette(false); }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Label */}
      <div className="flex items-center justify-center min-h-[1.5em] font-serif text-lg text-center cursor-pointer">
        {isEditing ? (
          <input
            ref={inputRef}
            className="bg-transparent border-none outline-none text-center w-full min-w-[100px]"
            value={d.label}
            onChange={(e) => updateNodeData(id, { label: e.target.value } as Partial<MindmapNodeData>)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Tab') { e.preventDefault(); setIsEditing(false); setIsEditingDetails(true); }
              else if (e.key === 'Enter' || e.key === 'Escape') setIsEditing(false);
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div className="break-words w-full">{d.label || '\u00a0'}</div>
        )}
      </div>

      {/* Details */}
      {(d.details || isEditingDetails) && (
        <div className="mt-2 border-t border-node-border pt-2 min-w-[150px] font-sans text-sm text-text-muted">
          {isEditingDetails ? (
            <textarea
              ref={detailsRef}
              className="bg-transparent border-none outline-none w-full min-h-[60px] resize-y"
              value={d.details || ''}
              onChange={(e) => updateNodeData(id, { details: e.target.value } as Partial<MindmapNodeData>)}
              onBlur={() => setIsEditingDetails(false)}
              onKeyDown={(e) => { if (e.key === 'Escape') setIsEditingDetails(false); }}
              onClick={(e) => e.stopPropagation()}
              placeholder="Enter details..."
            />
          ) : (
            <div
              className="whitespace-pre-wrap break-words cursor-text"
              onDoubleClick={(e) => { e.stopPropagation(); setIsEditingDetails(true); }}
            >
              {d.details}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
