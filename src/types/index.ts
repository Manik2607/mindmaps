import { Node, Edge } from '@xyflow/react';

export type NodeData = {
  label: string;
  color: string;
  details?: string;
};

export type AppNode = Node<NodeData, 'mindmap'>;

export type EdgeData = {
  label?: string;
};

export type AppEdge = Edge<EdgeData, 'connection'>;

export type MindMap = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  nodes: AppNode[];
  edges: AppEdge[];
};
