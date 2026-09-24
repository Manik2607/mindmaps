import { openDB, IDBPDatabase } from 'idb';
import { AppNode, AppEdge, Workspace, WorkspaceMeta } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const DB_NAME = 'flowy-workspace';
const DB_VERSION = 1;
const WORKSPACE_STORE = 'workspace';
const NODE_CONTENT_STORE = 'node_content';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(WORKSPACE_STORE)) {
          db.createObjectStore(WORKSPACE_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(NODE_CONTENT_STORE)) {
          db.createObjectStore(NODE_CONTENT_STORE, { keyPath: 'nodeId' });
        }
      },
    });
  }
  return dbPromise;
}

export async function listWorkspaces(): Promise<WorkspaceMeta[]> {
  try {
    const db = await getDB();
    const workspaces: Workspace[] = await db.getAll(WORKSPACE_STORE);
    if (!workspaces || workspaces.length === 0) {
      return [];
    }
    return workspaces
      .map((w) => ({
        id: w.id,
        name: w.name || 'Untitled Workspace',
        updatedAt: w.updatedAt || Date.now(),
        nodeCount: (w.nodes || []).length,
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (e) {
    console.error('[db] listWorkspaces error', e);
    return [];
  }
}

export async function getWorkspace(id: string): Promise<Workspace | null> {
  try {
    const db = await getDB();
    const workspace: Workspace | undefined = await db.get(WORKSPACE_STORE, id);
    if (!workspace) return null;
    return workspace;
  } catch (e) {
    console.error('[db] getWorkspace error', e);
    return null;
  }
}

export async function saveWorkspace(
  id: string,
  name: string,
  nodes: AppNode[],
  edges: AppEdge[]
): Promise<void> {
  try {
    const db = await getDB();
    const workspace: Workspace = {
      id,
      name,
      nodes,
      edges,
      updatedAt: Date.now(),
    };
    await db.put(WORKSPACE_STORE, workspace);
  } catch (e) {
    console.error('[db] saveWorkspace error', e);
  }
}

export async function createWorkspaceRecord(name?: string): Promise<Workspace> {
  const newWorkspace: Workspace = {
    id: uuidv4(),
    name: name || 'New Workspace',
    nodes: [],
    edges: [],
    updatedAt: Date.now(),
  };
  try {
    const db = await getDB();
    await db.put(WORKSPACE_STORE, newWorkspace);
  } catch (e) {
    console.error('[db] createWorkspaceRecord error', e);
  }
  return newWorkspace;
}

export async function deleteWorkspaceRecord(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete(WORKSPACE_STORE, id);
  } catch (e) {
    console.error('[db] deleteWorkspaceRecord error', e);
  }
}

// Backward compatibility helper
export async function loadWorkspace(): Promise<{ id: string; nodes: AppNode[]; edges: AppEdge[]; name: string } | null> {
  try {
    const workspaces = await listWorkspaces();
    if (workspaces.length === 0) return null;
    const ws = await getWorkspace(workspaces[0].id);
    if (!ws) return null;
    return { id: ws.id, nodes: ws.nodes, edges: ws.edges, name: ws.name };
  } catch (e) {
    console.error('[db] loadWorkspace error', e);
    return null;
  }
}

// Large content stored separately (e.g. base64 images, excalidraw elements)
export async function getNodeContent(nodeId: string): Promise<unknown> {
  const db = await getDB();
  const row = await db.get(NODE_CONTENT_STORE, nodeId);
  return row?.content ?? null;
}

export async function setNodeContent(nodeId: string, content: unknown): Promise<void> {
  const db = await getDB();
  await db.put(NODE_CONTENT_STORE, { nodeId, content });
}

export async function deleteNodeContent(nodeId: string): Promise<void> {
  const db = await getDB();
  await db.delete(NODE_CONTENT_STORE, nodeId);
}
