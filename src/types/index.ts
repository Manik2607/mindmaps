import { Node, Edge } from '@xyflow/react';

// ─────────────────────────────────────────────────────────────────────────────
// Block types (for Doc nodes)
// ─────────────────────────────────────────────────────────────────────────────

export type BlockType =
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bullet'
  | 'numbered'
  | 'checklist'
  | 'code'
  | 'image';

export type Block = {
  id: string;
  type: BlockType;
  content: string;       // text content
  checked?: boolean;     // for checklist
  indent?: number;       // for bullet/numbered
  language?: string;     // for code
  src?: string;          // for image (base64 or url)
  alt?: string;          // for image
};

// ─────────────────────────────────────────────────────────────────────────────
// Kanban types (for Kanban nodes)
// ─────────────────────────────────────────────────────────────────────────────

export type KanbanCard = {
  id: string;
  title: string;
  description?: string;
  color?: string;
  checklist?: { id: string; text: string; done: boolean }[];
};

export type KanbanColumn = {
  id: string;
  title: string;
  cards: KanbanCard[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Node data shapes (one per node kind)
// ─────────────────────────────────────────────────────────────────────────────

export type MindmapNodeData = {
  kind: 'mindmap';
  label: string;
  color: string;
  details?: string;
};

export type DocNodeData = {
  kind: 'doc';
  title: string;
  blocks: Block[];
};

export type KanbanNodeData = {
  kind: 'kanban';
  title: string;
  columns: KanbanColumn[];
};

export type ExcalidrawNodeData = {
  kind: 'excalidraw';
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  elements: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  appState: any;
  thumbnail?: string; // base64 PNG
};

export type ImageNodeData = {
  kind: 'image';
  src: string;       // base64 or URL
  alt?: string;
  width?: number;
  height?: number;
};

export type StickyNodeData = {
  kind: 'sticky';
  content: string;
  color: string;
};

export type AnyNodeData =
  | MindmapNodeData
  | DocNodeData
  | KanbanNodeData
  | ExcalidrawNodeData
  | ImageNodeData
  | StickyNodeData;

// ─────────────────────────────────────────────────────────────────────────────
// React Flow node / edge types
// ─────────────────────────────────────────────────────────────────────────────

export type AppNode = Node<AnyNodeData>;

export type EdgeData = {
  label?: string;
};

export type AppEdge = Edge<EdgeData, 'connection'>;

// ─────────────────────────────────────────────────────────────────────────────
// Workspace (persisted to IndexedDB)
// ─────────────────────────────────────────────────────────────────────────────

export type Workspace = {
  id: 'main';
  name: string;
  nodes: AppNode[];
  edges: AppEdge[];
  updatedAt: number;
};
