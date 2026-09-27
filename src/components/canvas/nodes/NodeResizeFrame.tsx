'use client';

import React from 'react';
import { NodeResizer, NodeResizeControl } from '@xyflow/react';

interface NodeResizeFrameProps {
  isVisible?: boolean;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  keepAspectRatio?: boolean;
  color?: string;
}

export function NodeResizeFrame({
  isVisible = false,
  minWidth = 100,
  minHeight = 80,
  maxWidth,
  maxHeight,
  keepAspectRatio = false,
  color = 'var(--color-accent)',
}: NodeResizeFrameProps) {
  if (!isVisible) return null;

  return (
    <>
      {/* Base resizer: provides 4 corner handles and full edge lines */}
      <NodeResizer
        isVisible={isVisible}
        minWidth={minWidth}
        minHeight={minHeight}
        maxWidth={maxWidth}
        maxHeight={maxHeight}
        keepAspectRatio={keepAspectRatio}
        color={color}
        handleStyle={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          border: `2px solid ${color}`,
          boxShadow: '0 2px 6px rgba(0,0,0,0.6)',
          zIndex: 35,
        }}
        lineStyle={{
          borderColor: color,
          borderWidth: 1.5,
          opacity: 0.75,
        }}
      />

      {/* Visible Center Pill Grab Handles on all 4 edges */}
      {/* Top Edge Pill */}
      <NodeResizeControl
        position="top"
        minHeight={minHeight}
        maxHeight={maxHeight}
        className="!flex !items-center !justify-center !border-none !bg-transparent !p-1 cursor-ns-resize"
        style={{ zIndex: 36 }}
      >
        <div className="w-8 h-1.5 rounded-full bg-accent hover:bg-white border border-black/40 shadow-md transition-all hover:scale-125" />
      </NodeResizeControl>

      {/* Bottom Edge Pill */}
      <NodeResizeControl
        position="bottom"
        minHeight={minHeight}
        maxHeight={maxHeight}
        className="!flex !items-center !justify-center !border-none !bg-transparent !p-1 cursor-ns-resize"
        style={{ zIndex: 36 }}
      >
        <div className="w-8 h-1.5 rounded-full bg-accent hover:bg-white border border-black/40 shadow-md transition-all hover:scale-125" />
      </NodeResizeControl>

      {/* Left Edge Pill */}
      <NodeResizeControl
        position="left"
        minWidth={minWidth}
        maxWidth={maxWidth}
        className="!flex !items-center !justify-center !border-none !bg-transparent !p-1 cursor-ew-resize"
        style={{ zIndex: 36 }}
      >
        <div className="w-1.5 h-8 rounded-full bg-accent hover:bg-white border border-black/40 shadow-md transition-all hover:scale-125" />
      </NodeResizeControl>

      {/* Right Edge Pill */}
      <NodeResizeControl
        position="right"
        minWidth={minWidth}
        maxWidth={maxWidth}
        className="!flex !items-center !justify-center !border-none !bg-transparent !p-1 cursor-ew-resize"
        style={{ zIndex: 36 }}
      >
        <div className="w-1.5 h-8 rounded-full bg-accent hover:bg-white border border-black/40 shadow-md transition-all hover:scale-125" />
      </NodeResizeControl>
    </>
  );
}
