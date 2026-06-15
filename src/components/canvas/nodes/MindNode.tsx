import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { useStore } from '@/store/useStore';
import { AppNode } from '@/types';
import { Palette, Pencil } from 'lucide-react';

const COLORS = [
  '#1E1E1E', // Default dark
  '#4A2B2B', // Soft Red
  '#4A3B22', // Amber
  '#2C3B2C', // Green
  '#2B344A', // Blue
  '#3A2B4A', // Violet
  '#4A2B3A', // Rose
];

export function MindNode({ id, data, selected }: NodeProps<AppNode>) {
  const updateNodeData = useStore((state) => state.updateNodeData);
  const [isEditing, setIsEditing] = useState(data.label === '');
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const detailsRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    if (isEditingDetails && detailsRef.current) {
      detailsRef.current.focus();
    }
  }, [isEditingDetails]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleDetailsBlur = () => {
    setIsEditingDetails(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault(); // prevent default focus change
      setIsEditing(false);
      setIsEditingDetails(true);
    } else if (e.key === 'Enter' || e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const handleDetailsKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditingDetails(false);
    }
  };

  return (
    <div
      className={`relative rounded-xl px-6 py-4 min-w-[120px] shadow-sm transition-shadow group border-2 outline-none focus:ring-2 focus:ring-accent`}
      style={{
        backgroundColor: data.color || COLORS[0],
        borderColor: selected ? 'var(--color-node-border-selected)' : 'var(--color-node-border)',
      }}
      tabIndex={0}
      onDoubleClick={handleDoubleClick}
      onMouseLeave={() => setShowPalette(false)}
      onKeyDown={(e) => {
        if (e.key === 'Tab' && selected && !isEditing && !isEditingDetails) {
          e.preventDefault();
          setIsEditingDetails(true);
        }
      }}
    >
      {/* Handles */}
      <Handle type="target" position={Position.Top} style={{ border: 'none', background: 'var(--color-text-muted)', width: '12px', height: '12px' }} className="opacity-0 group-hover:opacity-100 transition-opacity !rounded-full">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-transparent cursor-crosshair" />
      </Handle>
      <Handle type="source" position={Position.Bottom} style={{ border: 'none', background: 'var(--color-text-muted)', width: '12px', height: '12px' }} className="opacity-0 group-hover:opacity-100 transition-opacity !rounded-full">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-transparent cursor-crosshair" />
      </Handle>
      <Handle type="source" position={Position.Left} style={{ border: 'none', background: 'var(--color-text-muted)', width: '12px', height: '12px' }} className="opacity-0 group-hover:opacity-100 transition-opacity !rounded-full" id="left">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-transparent cursor-crosshair" />
      </Handle>
      <Handle type="source" position={Position.Right} style={{ border: 'none', background: 'var(--color-text-muted)', width: '12px', height: '12px' }} className="opacity-0 group-hover:opacity-100 transition-opacity !rounded-full" id="right">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-transparent cursor-crosshair" />
      </Handle>

      {/* Hover Actions */}
      <div className="absolute -top-3 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="p-1 rounded bg-node-border hover:bg-node-border-hover text-text-main"
          onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
          title="Edit"
        >
          <Pencil size={12} />
        </button>
        <div className="relative">
          <button
            className="p-1 rounded bg-node-border hover:bg-node-border-hover text-text-main"
            onClick={(e) => { e.stopPropagation(); setShowPalette(!showPalette); }}
            title="Color"
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
                  onClick={(e) => {
                    e.stopPropagation();
                    updateNodeData(id, { color: c });
                    setShowPalette(false);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex items-center justify-center min-h-[1.5em] font-serif text-lg text-center cursor-pointer pointer-events-none">
        {isEditing ? (
          <input
            ref={inputRef}
            className="bg-transparent border-none outline-none text-center w-full min-w-[100px] pointer-events-auto"
            value={data.label}
            onChange={(e) => updateNodeData(id, { label: e.target.value })}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()} // prevent double click from triggering on container
          />
        ) : (
          <div className="break-words w-full">{data.label || ' '}</div>
        )}
      </div>

      {/* Details Section */}
      {(data.details || isEditingDetails) && (
        <div className="mt-2 border-t border-node-border pt-2 min-w-[150px] font-sans text-sm text-text-muted pointer-events-none">
          {isEditingDetails ? (
            <textarea
              ref={detailsRef}
              className="bg-transparent border-none outline-none w-full min-h-[60px] resize-y pointer-events-auto"
              value={data.details || ''}
              onChange={(e) => updateNodeData(id, { details: e.target.value })}
              onBlur={handleDetailsBlur}
              onKeyDown={handleDetailsKeyDown}
              onClick={(e) => e.stopPropagation()}
              placeholder="Enter details..."
            />
          ) : (
            <div 
              className="whitespace-pre-wrap break-words pointer-events-auto cursor-text"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditingDetails(true);
              }}
            >
              {data.details}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
