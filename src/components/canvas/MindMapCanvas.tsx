import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  MiniMap,
  useReactFlow,
  ConnectionMode
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useStore } from '@/store/useStore';
import { MindNode } from './nodes/MindNode';
import { ConnectionEdge } from './edges/ConnectionEdge';
import { v4 as uuidv4 } from 'uuid';

const nodeTypes = {
  mindmap: MindNode,
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
    addNode
  } = useStore();

  const { screenToFlowPosition, fitView, setNodes, getNodes } = useReactFlow();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [menu, setMenu] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const handleClick = () => setMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent | MouseEvent) => {
      event.preventDefault();
      setMenu({
        top: event.clientY,
        left: event.clientX,
      });
    },
    [setMenu],
  );

  const onDoubleClick = useCallback((event: React.MouseEvent | MouseEvent) => {
    // Only trigger if we double clicked the background, not a node
    if ((event.target as HTMLElement).closest('.react-flow__node')) return;

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    addNode({
      id: uuidv4(),
      type: 'mindmap',
      position,
      data: {
        label: '',
        color: '#1E1E1E', // default
      },
    });
  }, [screenToFlowPosition, addNode]);

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
        minZoom={0.25}
        maxZoom={2}
        defaultEdgeOptions={{ type: 'connection' }}
        fitView
        className="bg-canvas"
        proOptions={{ hideAttribution: true }}
        selectionKeyCode="Shift" // Example: Shift + drag for selection
        deleteKeyCode={['Backspace', 'Delete']}
        zoomOnDoubleClick={false}
        onPaneContextMenu={onPaneContextMenu}
      >
        <Background color="#333" gap={20} size={1} />
        <MiniMap 
          nodeColor={() => '#1E1E1E'} 
          maskColor="rgba(0, 0, 0, 0.6)"
          className="border border-node-border rounded-lg bg-[#121212]"
        />
      </ReactFlow>

      {menu && (
        <div
          className="absolute z-50 bg-[#151515] border border-[#333] rounded-md shadow-xl py-1 min-w-[150px]"
          style={{ top: menu.top, left: menu.left }}
          onClick={(e) => e.stopPropagation()} // prevent closing immediately if clicking inside
        >
          <button
            className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-[#2A2A2A] transition-colors"
            onClick={() => {
              const position = screenToFlowPosition({ x: menu.left, y: menu.top });
              addNode({
                id: uuidv4(),
                type: 'mindmap',
                position,
                data: { label: '', color: '#1E1E1E' },
              });
              setMenu(null);
            }}
          >
            Add Node
          </button>
          <div className="h-px bg-[#333] my-1" />
          <button
            className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-[#2A2A2A] transition-colors"
            onClick={() => {
              fitView({ duration: 400 });
              setMenu(null);
            }}
          >
            Fit View
          </button>
          <button
            className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-[#2A2A2A] transition-colors"
            onClick={() => {
              setNodes(getNodes().map(n => ({ ...n, selected: true })));
              setMenu(null);
            }}
          >
            Select All
          </button>
        </div>
      )}
    </div>
  );
}
