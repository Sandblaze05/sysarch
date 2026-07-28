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

interface FlowState {
    nodes: Node[]
    edges: Edge[]

    setNodes: (nodes: Node[]) => void
    setEdges: (edges: Edge[]) => void

    onNodesChange: (changes: NodeChange[]) => void
    onEdgesChange: (changes: EdgeChange[]) => void
    onConnect: (connection: Connection) => void
    addNode: (nodeType: string, position?: { x: number; y: number }) => void
}

export const useFlowStore = create<FlowState>((set, get) => ({
    nodes: [],
    edges: [],

    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),

    onNodesChange: (changes) => 
        set({
            nodes: applyNodeChanges(changes, get().nodes),
        }),
    
    onEdgesChange: (changes) => 
        set({
            edges: applyEdgeChanges(changes, get().edges),
        }),
    
    onConnect: (connection) =>
        set({
            edges: addEdge(connection, get().edges),
        }),

    addNode: (nodeType, position) => {
        const id = `${nodeType}-${Date.now()}`;
        const newNode: Node = {
            id,
            type: nodeType,
            position: position || { x: 250 + Math.random() * 80, y: 150 + Math.random() * 80 },
            data: {
                type: nodeType,
                status: 'idle',
            },
        };
        set({ nodes: [...get().nodes, newNode] });
    },
}))