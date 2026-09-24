'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  useReactFlow,
  ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useStore } from '@/store/useStore';
import { MindNode } from './nodes/MindNode';
import { DocNode } from './nodes/DocNode';
import { KanbanNode } from './nodes/KanbanNode';
import { ExcalidrawNode } from './nodes/ExcalidrawNode';
import { ImageNode } from './nodes/ImageNode';
import { StickyNode } from './nodes/StickyNode';
import { ConnectionEdge } from './edges/ConnectionEdge';
import { v4 as uuidv4 } from 'uuid';
import { AppNode } from '@/types';

const nodeTypes = {
  mindmap: MindNode,
  doc: DocNode,
  kanban: KanbanNode,
  excalidraw: ExcalidrawNode,
  image: ImageNode,
  sticky: StickyNode,
};

const edgeTypes = {
  connection: ConnectionEdge,
};

export function MindMapCanvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
  } = useStore();

  const { screenToFlowPosition, getViewport, setNodes, getNodes, fitView } = useReactFlow();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<{ top: number; left: number } | null>(null);

  // Global paste handler (capture clipboard images → ImageNode)
  const handleGlobalPaste = useCallback(
    async (e: ClipboardEvent) => {
      // Don't intercept paste inside text inputs / overlays
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('[data-overlay]')
      ) return;

      const items = Array.from(e.clipboardData?.items || []);
      const imageItem = items.find((it) => it.type.startsWith('image/'));
      if (!imageItem) return;

      e.preventDefault();
      const file = imageItem.getAsFile();
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result as string;
        const vp = getViewport();
        const x = (-vp.x + window.innerWidth / 2) / vp.zoom;
        const y = (-vp.y + window.innerHeight / 2) / vp.zoom;

        const node: AppNode = {
          id: uuidv4(),
          type: 'image',
          position: { x: x - 150, y: y - 100 },
          data: { kind: 'image', src, alt: 'Pasted image' },
        };
        addNode(node);
      };
      reader.readAsDataURL(file);
    },
    [getViewport, addNode]
  );

  useEffect(() => {
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [handleGlobalPaste]);

  useEffect(() => {
    const handleClick = () => setMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent | MouseEvent) => {
      event.preventDefault();
      setMenu({ top: event.clientY, left: event.clientX });
    },
    []
  );

  const onDoubleClick = useCallback(
    (event: React.MouseEvent | MouseEvent) => {
      if ((event.target as HTMLElement).closest('.react-flow__node')) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode({
        id: uuidv4(),
        type: 'mindmap',
        position,
        data: { kind: 'mindmap', label: '', color: '#1E1E1E' },
      });
    },
    [screenToFlowPosition, addNode]
  );

  return (
    <div className="w-full h-full" ref={wrapperRef} onDoubleClick={onDoubleClick}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        minZoom={0.1}
        maxZoom={2.5}
        defaultEdgeOptions={{ type: 'connection' }}
        fitView
        className="bg-canvas"
        proOptions={{ hideAttribution: true }}
        selectionKeyCode="Shift"
        deleteKeyCode={['Backspace', 'Delete']}
        zoomOnDoubleClick={false}
        onPaneContextMenu={onPaneContextMenu}
      >
        <Background variant={BackgroundVariant.Dots} color="#383838" gap={24} size={1.5} />
      </ReactFlow>

      {/* Right-click context menu */}
      {menu && (
        <div
          className="absolute z-50 bg-[#141414] border border-[#2a2a2a] rounded-xl shadow-2xl py-1.5 min-w-[160px]"
          style={{ top: menu.top, left: menu.left }}
          onClick={(e) => e.stopPropagation()}
        >
          {['mindmap', 'doc', 'kanban', 'excalidraw', 'sticky'].map((kind) => (
            <button
              key={kind}
              className="w-full text-left px-4 py-2 text-sm text-text-muted hover:bg-[#1e1e1e] hover:text-text-main transition-colors"
              onClick={() => {
                const position = screenToFlowPosition({ x: menu.left, y: menu.top });
                const id = uuidv4();
                const nodeMap: Record<string, AppNode> = {
                  mindmap:    { id, type: 'mindmap',    position, data: { kind: 'mindmap',    label: '', color: '#1E1E1E' } },
                  doc:        { id, type: 'doc',        position, data: { kind: 'doc',        title: 'New Doc', blocks: [] } },
                  kanban:     { id, type: 'kanban',     position, data: { kind: 'kanban',     title: 'New Board', columns: [] } },
                  excalidraw: { id, type: 'excalidraw', position, data: { kind: 'excalidraw', title: 'New Drawing', elements: [], appState: {} } },
                  sticky:     { id, type: 'sticky',     position, data: { kind: 'sticky',     content: '', color: '#2a2000' } },
                };
                addNode(nodeMap[kind]);
                setMenu(null);
              }}
            >
              Add {kind === 'mindmap' ? 'Mind Map Node' : kind.charAt(0).toUpperCase() + kind.slice(1)}
            </button>
          ))}
          <div className="h-px bg-[#222] my-1" />
          <button
            className="w-full text-left px-4 py-2 text-sm text-text-muted hover:bg-[#1e1e1e] hover:text-text-main transition-colors"
            onClick={() => { fitView({ duration: 400 }); setMenu(null); }}
          >
            Fit View
          </button>
          <button
            className="w-full text-left px-4 py-2 text-sm text-text-muted hover:bg-[#1e1e1e] hover:text-text-main transition-colors"
            onClick={() => { setNodes(getNodes().map((n) => ({ ...n, selected: true }))); setMenu(null); }}
          >
            Select All
          </button>
        </div>
      )}
    </div>
  );
}
