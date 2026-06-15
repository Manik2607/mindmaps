import { create, useStore as useZustandStore } from 'zustand';
import { temporal, TemporalState } from 'zundo';
import { AppNode, AppEdge, MindMap } from '../types';
import { v4 as uuidv4 } from 'uuid';
import {
  Connection,
  EdgeChange,
  NodeChange,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';



type MindMapState = {
  // Current active map data
  activeMapId: string;
  nodes: AppNode[];
  edges: AppEdge[];
  
  // Navigation & Metadata
  mapsList: { id: string; name: string; updatedAt: number }[]; // For the sidebar

  // Actions
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  
  // Node Operations
  addNode: (node: AppNode) => void;
  updateNodeData: (id: string, data: Partial<AppNode['data']>) => void;
  deleteNode: (id: string) => void;
  
  // Edge Operations
  updateEdgeData: (id: string, data: Partial<AppEdge['data']>) => void;

  // Map Navigation & Operations
  loadMap: (mapId: string, mapName: string) => void;
  createMap: (name?: string) => string; // Returns new map ID
  deleteMap: (mapId: string) => void;
  renameMap: (mapId: string, newName: string) => void;
  
  // Persistence
  saveCurrentMap: () => void;
  loadMapsList: () => void;
};

// Helper for local storage keys
const getMapKey = (id: string) => `mindmaps_map_${id}`;

export const useStore = create<MindMapState>()(temporal((set, get) => ({
  activeMapId: '',
  nodes: [],
  edges: [],
  mapsList: [],

  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes) as AppNode[],
    });
    get().saveCurrentMap();
  },
  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges) as AppEdge[],
    });
    get().saveCurrentMap();
  },
  onConnect: (connection: Connection) => {
    const newEdge: AppEdge = {
      ...connection,
      id: uuidv4(),
      type: 'connection',
    } as AppEdge;
    set({
      edges: addEdge(newEdge, get().edges) as AppEdge[],
    });
    get().saveCurrentMap();
  },

  addNode: (node: AppNode) => {
    set({ nodes: [...get().nodes, node] });
    get().saveCurrentMap();
  },

  updateNodeData: (id: string, data: Partial<AppNode['data']>) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, ...data } };
        }
        return node;
      }),
    });
    get().saveCurrentMap();
  },

  deleteNode: (id: string) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
    });
    get().saveCurrentMap();
  },

  updateEdgeData: (id: string, data: Partial<AppEdge['data']>) => {
    set({
      edges: get().edges.map((edge) => {
        if (edge.id === id) {
          return { ...edge, data: { ...edge.data, ...data } };
        }
        return edge;
      }),
    });
    get().saveCurrentMap();
  },

  saveCurrentMap: () => {
    const { activeMapId, nodes, edges } = get();
    if (!activeMapId) return;

    // We will find the name from mapsList
    const mapInfo = get().mapsList.find(m => m.id === activeMapId);
    const mapName = mapInfo ? mapInfo.name : 'Home';
    
    const mapData: MindMap = {
      id: activeMapId,
      name: mapName,
      createdAt: mapInfo ? getMapFromStorage(activeMapId)?.createdAt || Date.now() : Date.now(),
      updatedAt: Date.now(),
      nodes,
      edges,
    };
    
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(getMapKey(activeMapId), JSON.stringify(mapData));
      get().loadMapsList(); // Refresh list to update 'updatedAt'
    }
  },

  loadMapsList: () => {
    if (typeof window === 'undefined') return;
    const mapsList: { id: string; name: string; updatedAt: number }[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith('mindmaps_map_')) {
        try {
          const mapData: MindMap = JSON.parse(window.localStorage.getItem(key) || '{}');
          if (mapData.id) {
            mapsList.push({ id: mapData.id, name: mapData.name, updatedAt: mapData.updatedAt });
          }
        } catch (e) {
          console.error('Error parsing map data', e);
        }
      }
    }
    mapsList.sort((a, b) => b.updatedAt - a.updatedAt);
    set({ mapsList });
  },

  createMap: (name = 'New Map') => {
    const id = uuidv4();
    const mapData: MindMap = {
      id,
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      nodes: [],
      edges: [],
    };
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(getMapKey(id), JSON.stringify(mapData));
    }
    get().loadMapsList();
    return id;
  },

  loadMap: (mapId: string, mapName: string) => {
    if (typeof window === 'undefined') return;
    
    // Save current map before leaving
    if (get().activeMapId) {
      get().saveCurrentMap();
    }

    const dataRaw = window.localStorage.getItem(getMapKey(mapId));
    let mapData: MindMap;
    
    if (dataRaw) {
      mapData = JSON.parse(dataRaw);
    } else {
      mapData = {
        id: mapId,
        name: mapName,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        nodes: [],
        edges: [],
      };
      window.localStorage.setItem(getMapKey(mapId), JSON.stringify(mapData));
      get().loadMapsList();
    }

    set({
      activeMapId: mapId,
      nodes: mapData.nodes,
      edges: mapData.edges,
    });
  },

  deleteMap: (mapId: string) => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(getMapKey(mapId));
    get().loadMapsList();
    
    // If we deleted the active map, load the first available or create a new one
    if (get().activeMapId === mapId) {
      const remainingMaps = get().mapsList;
      if (remainingMaps.length > 0) {
        get().loadMap(remainingMaps[0].id, remainingMaps[0].name);
      } else {
        const newId = get().createMap('Home');
        get().loadMap(newId, 'Home');
      }
    }
  },

  renameMap: (mapId: string, newName: string) => {
    if (typeof window === 'undefined') return;
    const mapRaw = window.localStorage.getItem(getMapKey(mapId));
    if (mapRaw) {
      const mapData = JSON.parse(mapRaw);
      mapData.name = newName;
      mapData.updatedAt = Date.now();
      window.localStorage.setItem(getMapKey(mapId), JSON.stringify(mapData));
      get().loadMapsList();
    }
  }
}), { 
  limit: 50,
  partialize: (state) => ({ nodes: state.nodes, edges: state.edges }),
}));

// Export the temporal store to access undo/redo
export const useTemporalStore = <T>(selector: (state: TemporalState<{ nodes: AppNode[]; edges: AppEdge[]; }>) => T) => useZustandStore(useStore.temporal, selector);

// Helper
function getMapFromStorage(id: string): MindMap | null {
  if (typeof window === 'undefined') return null;
  const data = window.localStorage.getItem(getMapKey(id));
  return data ? JSON.parse(data) : null;
}
