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
import { Engine } from '@/simulation/engine/Engine'
import { buildRuntimeGraph } from '@/simulation/runtime/buildRuntimeGraph'
import {
    EventType,
    SimulationStatus,
    RoutedEvent,
    TimelineEntry,
} from '@/types/node'

interface FlowState {
    nodes: Node[]
    edges: Edge[]
    selectedNodeId: string | null
    simulationStatus: SimulationStatus
    simulationLogs: string[]
    simulationTimeline: TimelineEntry[]
    activeNodeId: string | null
    activeEdge: { source: string; target: string } | null
    simulationPaused: boolean
    engineInstance: Engine | null

    setNodes: (nodes: Node[]) => void
    setEdges: (edges: Edge[]) => void
    setSelectedNodeId: (id: string | null) => void

    onNodesChange: (changes: NodeChange[]) => void
    onEdgesChange: (changes: EdgeChange[]) => void
    onConnect: (connection: Connection) => void
    addNode: (nodeType: string, position?: { x: number; y: number }) => void
    updateNodeConfig: (nodeId: string, key: string, value: unknown) => void
    updateNodeData: (nodeId: string, data: Record<string, unknown>) => void
    startSimulation: () => void
    stepSimulation: () => void
    pauseSimulation: () => void
    resumeSimulation: () => void
    resetSimulation: () => void
    setActiveNodeId: (id: string | null) => void
    setActiveEdge: (edge: { source: string; target: string } | null) => void
}

const buildInitialEvents = (nodes: Node[], edges: Edge[]): RoutedEvent[] => {
    const targetIds = new Set(edges.map((e) => e.target))
    const entryNodes = nodes.filter((n) => !targetIds.has(n.id))

    const initialEvents: RoutedEvent[] = entryNodes.map((node) => ({
        id: crypto.randomUUID(),
        type: EventType.HTTP_REQUEST,
        source: 'user',
        target: node.id,
        payload: { url: '/', method: 'GET' },
        correlationId: crypto.randomUUID(),
        tick: 0,
    }))

    if (initialEvents.length === 0 && nodes.length > 0) {
        initialEvents.push({
            id: crypto.randomUUID(),
            type: EventType.HTTP_REQUEST,
            source: 'user',
            target: nodes[0].id,
            payload: { url: '/', method: 'GET' },
            correlationId: crypto.randomUUID(),
            tick: 0,
        })
    }

    return initialEvents
}

export const useFlowStore = create<FlowState>((set, get) => ({
    nodes: [],
    edges: [],
    selectedNodeId: null,
    simulationStatus: SimulationStatus.IDLE,
    simulationLogs: [],
    simulationTimeline: [],
    activeNodeId: null,
    activeEdge: null,
    simulationPaused: false,
    engineInstance: null,

    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),
    setSelectedNodeId: (id) => set({ selectedNodeId: id }),

    onNodesChange: (changes) => {
        const nextNodes = applyNodeChanges(changes, get().nodes);
        
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
        if (connection.source === connection.target) return;

        const { nodes, edges } = get();

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

        set({ edges: addEdge({ ...connection, type: 'animated' }, edges) });
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

    startSimulation: () => {
        const { nodes, edges } = get();
        if (nodes.length === 0) return;

        const graph = buildRuntimeGraph(nodes, edges);
        const engine = new Engine(graph, { maxSteps: 1000 });

        const syncFromEngine = (processedEvent: RoutedEvent | null) => {
            const currentStatus = engine.status;
            const { activeNodeId, activeEdge } = get();

            set({
                simulationStatus: currentStatus,
                simulationTimeline: [...engine.history],
                simulationLogs: [...engine.logs],
                simulationPaused: currentStatus === SimulationStatus.PAUSED,
                activeNodeId: processedEvent ? processedEvent.target : currentStatus === SimulationStatus.FINISHED ? null : activeNodeId,
                activeEdge: processedEvent ? { source: processedEvent.source, target: processedEvent.target } : currentStatus === SimulationStatus.FINISHED ? null : activeEdge,
                engineInstance: currentStatus === SimulationStatus.IDLE || currentStatus === SimulationStatus.FINISHED ? null : engine,
            });
        };

        engine.start(buildInitialEvents(nodes, edges));

        set({
            engineInstance: engine,
            simulationStatus: SimulationStatus.RUNNING,
            simulationLogs: [],
            simulationTimeline: [],
            activeNodeId: null,
            activeEdge: null,
            simulationPaused: false,
        });

        void engine.play(60, syncFromEngine);
    },

    stepSimulation: () => {
        const engine = get().engineInstance;
        if (!engine) return;

        const result = engine.step();
        if (!result) {
            set({
                simulationStatus: SimulationStatus.FINISHED,
                activeNodeId: null,
                activeEdge: null,
                engineInstance: null,
            });
            return;
        }

        const status = engine.status;
        set({
            simulationStatus: status,
            simulationTimeline: [...engine.history],
            simulationLogs: [...engine.logs],
            activeNodeId: result.target,
            activeEdge: { source: result.source, target: result.target },
        });

        if (status === SimulationStatus.FINISHED) {
            set({
                activeNodeId: null,
                activeEdge: null,
                engineInstance: null,
            });
        }
    },

    pauseSimulation: () => {
        const engine = get().engineInstance;
        if (!engine) return;

        engine.pause();
        set({
            simulationStatus: SimulationStatus.PAUSED,
            simulationPaused: true,
        });
    },

    resumeSimulation: () => {
        const engine = get().engineInstance;
        if (!engine) return;

        const syncFromEngine = (processedEvent: RoutedEvent | null) => {
            const currentStatus = engine.status;
            const { activeNodeId, activeEdge } = get();

            set({
                simulationStatus: currentStatus,
                simulationTimeline: [...engine.history],
                simulationLogs: [...engine.logs],
                simulationPaused: currentStatus === SimulationStatus.PAUSED,
                activeNodeId: processedEvent ? processedEvent.target : currentStatus === SimulationStatus.FINISHED ? null : activeNodeId,
                activeEdge: processedEvent ? { source: processedEvent.source, target: processedEvent.target } : currentStatus === SimulationStatus.FINISHED ? null : activeEdge,
                engineInstance: currentStatus === SimulationStatus.IDLE || currentStatus === SimulationStatus.FINISHED ? null : engine,
            });
        };

        set({
            simulationStatus: SimulationStatus.RUNNING,
            simulationPaused: false,
        });

        void engine.play(60, syncFromEngine);
    },

    resetSimulation: () => {
        const engine = get().engineInstance;
        engine?.reset();

        set({
            simulationStatus: SimulationStatus.IDLE,
            simulationLogs: [],
            simulationTimeline: [],
            activeNodeId: null,
            activeEdge: null,
            simulationPaused: false,
            engineInstance: null,
        });
    },

    setActiveNodeId: (id) => set({ activeNodeId: id }),
    setActiveEdge: (edge) => set({ activeEdge: edge }),
}))
