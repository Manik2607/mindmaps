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
  WorkspaceMeta,
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
import {
  listWorkspaces,
  getWorkspace,
  saveWorkspace,
  createWorkspaceRecord,
  deleteWorkspaceRecord,
} from '@/lib/db';

// ─────────────────────────────────────────────────────────────────────────────
// State shape
// ─────────────────────────────────────────────────────────────────────────────

type OverlayState =
  | { type: null }
  | { type: 'doc'; nodeId: string }
  | { type: 'kanban'; nodeId: string }
  | { type: 'excalidraw'; nodeId: string };

type WorkspaceState = {
  currentWorkspaceId: string;
  workspaceName: string;
  workspacesList: WorkspaceMeta[];
  isLoadingWorkspaces: boolean;
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

  // Multi-workspace management
  saveWorkspace: () => Promise<void>;
  loadWorkspace: (workspaceId?: string) => Promise<void>;
  loadWorkspaces: () => Promise<void>;
  switchWorkspace: (id: string) => Promise<void>;
  createNewWorkspace: (name?: string) => Promise<string>;
  renameWorkspace: (name: string, id?: string) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  duplicateWorkspace: (id: string) => Promise<string>;
};

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const useStore = create<WorkspaceState>()(
  temporal(
    (set, get) => ({
      currentWorkspaceId: '',
      workspaceName: 'My Workspace',
      workspacesList: [],
      isLoadingWorkspaces: true,
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
        const { currentWorkspaceId, nodes, edges, workspaceName, workspacesList } = get();
        if (!currentWorkspaceId) return;
        await saveWorkspace(currentWorkspaceId, workspaceName, nodes, edges);
        set({
          workspacesList: workspacesList.map((w) =>
            w.id === currentWorkspaceId
              ? { ...w, name: workspaceName, updatedAt: Date.now(), nodeCount: nodes.length }
              : w
          ),
        });
      },

      loadWorkspaces: async () => {
        set({ isLoadingWorkspaces: true });
        let list = await listWorkspaces();
        let activeId = typeof window !== 'undefined' ? localStorage.getItem('flowy_active_workspace_id') : null;

        if (list.length === 0) {
          const newWs = await createWorkspaceRecord('My Workspace');
          list = [
            {
              id: newWs.id,
              name: newWs.name,
              updatedAt: newWs.updatedAt,
              nodeCount: 0,
            },
          ];
          activeId = newWs.id;
        } else if (!activeId || !list.some((w) => w.id === activeId)) {
          activeId = list[0].id;
        }

        const activeWs = await getWorkspace(activeId);
        if (activeWs) {
          set({
            currentWorkspaceId: activeWs.id,
            workspaceName: activeWs.name,
            nodes: activeWs.nodes || [],
            edges: activeWs.edges || [],
            workspacesList: list,
            isLoadingWorkspaces: false,
          });
          if (typeof window !== 'undefined') {
            localStorage.setItem('flowy_active_workspace_id', activeWs.id);
          }
        } else {
          set({ workspacesList: list, isLoadingWorkspaces: false });
        }
      },

      loadWorkspace: async (workspaceId?: string) => {
        if (workspaceId) {
          await get().switchWorkspace(workspaceId);
        } else {
          await get().loadWorkspaces();
        }
      },

      switchWorkspace: async (id: string) => {
        const current = get();
        if (current.currentWorkspaceId === id) return;

        // Save current before switching
        await current.saveWorkspace();

        const targetWs = await getWorkspace(id);
        if (!targetWs) return;

        // Clear temporal history to prevent cross-workspace undo/redo
        useStore.temporal.getState().clear();

        set({
          overlay: { type: null },
          currentWorkspaceId: targetWs.id,
          workspaceName: targetWs.name,
          nodes: targetWs.nodes || [],
          edges: targetWs.edges || [],
        });

        if (typeof window !== 'undefined') {
          localStorage.setItem('flowy_active_workspace_id', targetWs.id);
        }
      },

      createNewWorkspace: async (name?: string) => {
        await get().saveWorkspace();

        const count = get().workspacesList.length + 1;
        const wsName = name || `Workspace ${count}`;
        const newWs = await createWorkspaceRecord(wsName);

        useStore.temporal.getState().clear();

        const newMeta: WorkspaceMeta = {
          id: newWs.id,
          name: newWs.name,
          updatedAt: newWs.updatedAt,
          nodeCount: 0,
        };

        const updatedList = [newMeta, ...get().workspacesList];

        set({
          overlay: { type: null },
          currentWorkspaceId: newWs.id,
          workspaceName: newWs.name,
          nodes: [],
          edges: [],
          workspacesList: updatedList,
        });

        if (typeof window !== 'undefined') {
          localStorage.setItem('flowy_active_workspace_id', newWs.id);
        }

        return newWs.id;
      },

      renameWorkspace: async (name: string, id?: string) => {
        const targetId = id || get().currentWorkspaceId;
        const trimmed = name.trim();
        if (!trimmed) return;

        const isCurrent = targetId === get().currentWorkspaceId;
        const currentNodes = isCurrent ? get().nodes : (await getWorkspace(targetId))?.nodes || [];
        const currentEdges = isCurrent ? get().edges : (await getWorkspace(targetId))?.edges || [];

        await saveWorkspace(targetId, trimmed, currentNodes, currentEdges);

        set({
          workspaceName: isCurrent ? trimmed : get().workspaceName,
          workspacesList: get().workspacesList.map((w) =>
            w.id === targetId ? { ...w, name: trimmed, updatedAt: Date.now() } : w
          ),
        });
      },

      deleteWorkspace: async (id: string) => {
        const { workspacesList, currentWorkspaceId } = get();
        if (workspacesList.length <= 1) return;

        await deleteWorkspaceRecord(id);
        const remainingList = workspacesList.filter((w) => w.id !== id);

        if (currentWorkspaceId === id) {
          const nextWs = remainingList[0];
          const targetWs = await getWorkspace(nextWs.id);
          useStore.temporal.getState().clear();
          set({
            overlay: { type: null },
            currentWorkspaceId: nextWs.id,
            workspaceName: targetWs?.name || nextWs.name,
            nodes: targetWs?.nodes || [],
            edges: targetWs?.edges || [],
            workspacesList: remainingList,
          });
          if (typeof window !== 'undefined') {
            localStorage.setItem('flowy_active_workspace_id', nextWs.id);
          }
        } else {
          set({ workspacesList: remainingList });
        }
      },

      duplicateWorkspace: async (id: string) => {
        await get().saveWorkspace();
        const source = await getWorkspace(id);
        if (!source) return '';

        const newId = uuidv4();
        const newName = `${source.name} (Copy)`;
        const newNodes: AppNode[] = JSON.parse(JSON.stringify(source.nodes || []));
        const newEdges: AppEdge[] = JSON.parse(JSON.stringify(source.edges || []));

        await saveWorkspace(newId, newName, newNodes, newEdges);
        const meta: WorkspaceMeta = {
          id: newId,
          name: newName,
          updatedAt: Date.now(),
          nodeCount: newNodes.length,
        };

        useStore.temporal.getState().clear();
        set({
          overlay: { type: null },
          currentWorkspaceId: newId,
          workspaceName: newName,
          nodes: newNodes,
          edges: newEdges,
          workspacesList: [meta, ...get().workspacesList],
        });

        if (typeof window !== 'undefined') {
          localStorage.setItem('flowy_active_workspace_id', newId);
        }

        return newId;
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
