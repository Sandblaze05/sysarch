import { create } from 'zustand'
import {
    applyNodeChanges,
    applyEdgeChanges,
    addEdge,
    type Node,
    type Edge,
    type Connection,
    type NodeChange,
    type EdgeChange,
} from '@xyflow/react'
import { nodeRegistry } from '@/registry'

interface FlowState {
    nodes: Node[]
    edges: Edge[]
    selectedNodeId: string | null

    setNodes: (nodes: Node[]) => void
    setEdges: (edges: Edge[]) => void
    setSelectedNodeId: (id: string | null) => void

    onNodesChange: (changes: NodeChange[]) => void
    onEdgesChange: (changes: EdgeChange[]) => void
    onConnect: (connection: Connection) => void
    addNode: (nodeType: string, position?: { x: number; y: number }) => void
    updateNodeConfig: (nodeId: string, key: string, value: unknown) => void
    updateNodeData: (nodeId: string, data: Record<string, unknown>) => void
}

export const useFlowStore = create<FlowState>((set, get) => ({
    nodes: [],
    edges: [],
    selectedNodeId: null,

    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),
    setSelectedNodeId: (id) => set({ selectedNodeId: id }),

    onNodesChange: (changes) => {
        const nextNodes = applyNodeChanges(changes, get().nodes);
        
        // Synchronize selectedNodeId if selection change occurred
        const selectionChange = changes.find((c) => c.type === 'select');
        let nextSelectedId = get().selectedNodeId;
        if (selectionChange && selectionChange.type === 'select') {
            if (selectionChange.selected) {
                nextSelectedId = selectionChange.id;
            } else if (get().selectedNodeId === selectionChange.id) {
                nextSelectedId = null;
            }
        }

        set({
            nodes: nextNodes,
            selectedNodeId: nextSelectedId,
        });
    },
    
    onEdgesChange: (changes) => 
        set({
            edges: applyEdgeChanges(changes, get().edges),
        }),
    
    onConnect: (connection) => {
        const { nodes } = get();

        const sourceNode = nodes.find((n) => n.id === connection.source);
        const targetNode = nodes.find((n) => n.id === connection.target);

        const sourceType = (sourceNode?.data?.type as string) || sourceNode?.type || '';
        const targetType = (targetNode?.data?.type as string) || targetNode?.type || '';

        const valid = nodeRegistry.canConnect(
            sourceType,
            connection.sourceHandle ?? null,
            targetType,
            connection.targetHandle ?? null,
        );

        if (!valid) return;

        set({ edges: addEdge(connection, get().edges) });
    },

    addNode: (nodeType, position) => {
        const id = `${nodeType}-${Date.now()}`;
        const definition = nodeRegistry.get(nodeType);
        
        const initialConfig: Record<string, unknown> = {};
        if (definition?.config) {
            definition.config.forEach((field) => {
                initialConfig[field.key] = field.defaultValue;
            });
        }

        const newNode: Node = {
            id,
            type: nodeType,
            position: position || { x: 250 + Math.random() * 80, y: 150 + Math.random() * 80 },
            selected: true,
            data: {
                type: nodeType,
                definition: definition?.type || nodeType,
                label: definition?.label || nodeType,
                status: 'idle',
                config: initialConfig,
            },
        };

        // Deselect previous nodes when adding new node
        const updatedNodes = get().nodes.map((n) => ({ ...n, selected: false }));
        set({
            nodes: [...updatedNodes, newNode],
            selectedNodeId: id,
        });
    },

    updateNodeConfig: (nodeId, key, value) => {
        set({
            nodes: get().nodes.map((node) => {
                if (node.id !== nodeId) return node;
                const currentConfig = (node.data?.config as Record<string, unknown>) || {};
                return {
                    ...node,
                    data: {
                        ...node.data,
                        config: {
                            ...currentConfig,
                            [key]: value,
                        },
                    },
                };
            }),
        });
    },

    updateNodeData: (nodeId, data) => {
        set({
            nodes: get().nodes.map((node) => {
                if (node.id !== nodeId) return node;
                return {
                    ...node,
                    data: {
                        ...node.data,
                        ...data,
                    },
                };
            }),
        });
    },
}))