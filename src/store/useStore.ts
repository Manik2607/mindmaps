import { create, useStore as useZustandStore } from 'zustand';
import { temporal, TemporalState } from 'zundo';
import {
  AppNode,
  AppEdge,
  AnyNodeData,
  DocNodeData,
  KanbanNodeData,
  ExcalidrawNodeData,
  Block,
  KanbanColumn,
} from '../types';
import { v4 as uuidv4 } from 'uuid';
import {
  Connection,
  EdgeChange,
  NodeChange,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import { loadWorkspace, saveWorkspace } from '@/lib/db';

// ─────────────────────────────────────────────────────────────────────────────
// State shape
// ─────────────────────────────────────────────────────────────────────────────

type OverlayState =
  | { type: null }
  | { type: 'doc'; nodeId: string }
  | { type: 'kanban'; nodeId: string }
  | { type: 'excalidraw'; nodeId: string };

type WorkspaceState = {
  workspaceName: string;
  nodes: AppNode[];
  edges: AppEdge[];

  // Overlay
  overlay: OverlayState;
  openOverlay: (type: 'doc' | 'kanban' | 'excalidraw', nodeId: string) => void;
  closeOverlay: () => void;

  // React Flow handlers
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  // Generic node ops
  addNode: (node: AppNode) => void;
  updateNodeData: (id: string, data: Partial<AnyNodeData>) => void;
  deleteNode: (id: string) => void;

  // Type-specific updaters
  updateDocBlocks: (nodeId: string, blocks: Block[]) => void;
  updateDocTitle: (nodeId: string, title: string) => void;
  updateKanbanColumns: (nodeId: string, columns: KanbanColumn[]) => void;
  updateKanbanTitle: (nodeId: string, title: string) => void;
  updateExcalidrawData: (
    nodeId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    elements: any[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    appState: any,
    thumbnail?: string
  ) => void;

  // Edge ops
  updateEdgeData: (id: string, data: Partial<AppEdge['data']>) => void;

  // Persistence
  saveWorkspace: () => Promise<void>;
  loadWorkspace: () => Promise<void>;

  // Rename
  renameWorkspace: (name: string) => void;
};

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const useStore = create<WorkspaceState>()(
  temporal(
    (set, get) => ({
      workspaceName: 'My Workspace',
      nodes: [],
      edges: [],

      overlay: { type: null },
      openOverlay: (type, nodeId) => set({ overlay: { type, nodeId } }),
      closeOverlay: () => set({ overlay: { type: null } }),

      onNodesChange: (changes: NodeChange[]) => {
        set({ nodes: applyNodeChanges(changes, get().nodes) as AppNode[] });
        get().saveWorkspace();
      },
      onEdgesChange: (changes: EdgeChange[]) => {
        set({ edges: applyEdgeChanges(changes, get().edges) as AppEdge[] });
        get().saveWorkspace();
      },
      onConnect: (connection: Connection) => {
        const newEdge: AppEdge = {
          ...connection,
          id: uuidv4(),
          type: 'connection',
        } as AppEdge;
        set({ edges: addEdge(newEdge, get().edges) as AppEdge[] });
        get().saveWorkspace();
      },

      addNode: (node: AppNode) => {
        set({ nodes: [...get().nodes, node] });
        get().saveWorkspace();
      },

      updateNodeData: (id: string, data: Partial<AnyNodeData>) => {
        set({
          nodes: get().nodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, ...data } as AnyNodeData } : n
          ),
        });
        get().saveWorkspace();
      },

      deleteNode: (id: string) => {
        set({
          nodes: get().nodes.filter((n) => n.id !== id),
          edges: get().edges.filter((e) => e.source !== id && e.target !== id),
        });
        get().saveWorkspace();
      },

      updateDocBlocks: (nodeId: string, blocks: Block[]) => {
        set({
          nodes: get().nodes.map((n) =>
            n.id === nodeId
              ? { ...n, data: { ...(n.data as DocNodeData), blocks } }
              : n
          ),
        });
        get().saveWorkspace();
      },

      updateDocTitle: (nodeId: string, title: string) => {
        set({
          nodes: get().nodes.map((n) =>
            n.id === nodeId
              ? { ...n, data: { ...(n.data as DocNodeData), title } }
              : n
          ),
        });
        get().saveWorkspace();
      },

      updateKanbanColumns: (nodeId: string, columns: KanbanColumn[]) => {
        set({
          nodes: get().nodes.map((n) =>
            n.id === nodeId
              ? { ...n, data: { ...(n.data as KanbanNodeData), columns } }
              : n
          ),
        });
        get().saveWorkspace();
      },

      updateKanbanTitle: (nodeId: string, title: string) => {
        set({
          nodes: get().nodes.map((n) =>
            n.id === nodeId
              ? { ...n, data: { ...(n.data as KanbanNodeData), title } }
              : n
          ),
        });
        get().saveWorkspace();
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateExcalidrawData: (nodeId: string, elements: any[], appState: any, thumbnail?: string) => {
        set({
          nodes: get().nodes.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  data: {
                    ...(n.data as ExcalidrawNodeData),
                    elements,
                    appState,
                    ...(thumbnail !== undefined ? { thumbnail } : {}),
                  },
                }
              : n
          ),
        });
        get().saveWorkspace();
      },

      updateEdgeData: (id: string, data: Partial<AppEdge['data']>) => {
        set({
          edges: get().edges.map((e) =>
            e.id === id ? { ...e, data: { ...e.data, ...data } } : e
          ),
        });
        get().saveWorkspace();
      },

      saveWorkspace: async () => {
        const { nodes, edges, workspaceName } = get();
        await saveWorkspace(nodes, edges, workspaceName);
      },

      loadWorkspace: async () => {
        const data = await loadWorkspace();
        if (data) {
          set({ nodes: data.nodes, edges: data.edges, workspaceName: data.name });
        }
      },

      renameWorkspace: (name: string) => {
        set({ workspaceName: name });
        get().saveWorkspace();
      },
    }),
    {
      limit: 50,
      partialize: (state) => ({ nodes: state.nodes, edges: state.edges }),
    }
  )
);

// Temporal (undo/redo) hook
export const useTemporalStore = <T>(
  selector: (state: TemporalState<{ nodes: AppNode[]; edges: AppEdge[] }>) => T
) => useZustandStore(useStore.temporal, selector);
