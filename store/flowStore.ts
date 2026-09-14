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
    ActiveEdgeEvent,
    NodeMetrics,
    NodeSimStatus,
} from '@/types/node'

interface FlowState {
    nodes: Node[]
    edges: Edge[]
    selectedNodeId: string | null
    simulationStatus: SimulationStatus
    simulationTick: number
    simulationLogs: string[]
    simulationTimeline: TimelineEntry[]
    activeNodeId: string | null
    activeEdge: { source: string; target: string } | null
    simulationPaused: boolean
    engineInstance: Engine | null
    activeEdges: ActiveEdgeEvent[]
    playbackSpeed: number
    nodeMetrics: Record<string, NodeMetrics>
    nodeStatuses: Record<string, NodeSimStatus>

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
    inspectPreviousTick: () => void
    inspectNextTick: () => void
    setActiveNodeId: (id: string | null) => void
    setActiveEdge: (edge: { source: string; target: string } | null) => void
    setPlaybackSpeed: (speed: number) => void
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
    simulationTick: 0,
    simulationLogs: [],
    simulationTimeline: [],
    activeNodeId: null,
    activeEdge: null,
    simulationPaused: false,
    engineInstance: null,
    activeEdges: [],
    playbackSpeed: 1,
    nodeMetrics: {},
    nodeStatuses: {},

    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),
    setSelectedNodeId: (id) => set({ selectedNodeId: id }),
    setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

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
        const { nodes, edges, playbackSpeed } = get();
        if (nodes.length === 0) return;

        const ticksPerSecond = playbackSpeed * 60;
        const engine = new Engine(buildRuntimeGraph(nodes, edges), {
            maxSteps: 10_000,
            maxTicks: 600,
            ticksPerSecond,
        });
        const processingNodes = new Map<string, number>();

        const syncFromEngine = (processedEvent: RoutedEvent | null) => {
            const current = get();
            const activeEdges = current.activeEdges.filter((edge) =>
                engine.currentTick - edge.startTick <= edge.durationTicks
            );
            if (processedEvent) {
                activeEdges.push({
                    edgeKey: processedEvent.sourceEdgeId ?? `${processedEvent.source}->${processedEvent.target}`,
                    eventType: processedEvent.type,
                    correlationId: processedEvent.correlationId,
                    startTick: engine.currentTick,
                    durationTicks: 3,
                });
                processingNodes.set(processedEvent.target, engine.currentTick);
            }

            const nodeStatuses: Record<string, NodeSimStatus> = {};
            for (const node of nodes) {
                const startedAt = processingNodes.get(node.id);
                if (startedAt !== undefined && engine.currentTick - startedAt <= 3) {
                    nodeStatuses[node.id] = processedEvent?.type === EventType.ERROR ? 'error' : 'processing';
                } else {
                    nodeStatuses[node.id] = 'idle';
                    processingNodes.delete(node.id);
                }
            }

            set({
                simulationStatus: engine.status,
                simulationTick: engine.currentTick,
                simulationTimeline: [...engine.history],
                simulationLogs: [...engine.logs],
                simulationPaused: engine.status === SimulationStatus.PAUSED,
                activeNodeId: processedEvent?.target ?? (engine.status === SimulationStatus.FINISHED ? null : current.activeNodeId),
                activeEdge: processedEvent ? { source: processedEvent.source, target: processedEvent.target } : current.activeEdge,
                engineInstance: engine.status === SimulationStatus.FINISHED ? null : engine,
                nodeMetrics: engine.metrics.getAllNodeMetrics(),
                activeEdges,
                nodeStatuses,
            });
        };

        engine.start(buildInitialEvents(nodes, edges));
        set({
            engineInstance: engine,
            simulationStatus: SimulationStatus.RUNNING,
            simulationTick: 0,
            simulationLogs: [],
            simulationTimeline: [],
            activeNodeId: null,
            activeEdge: null,
            simulationPaused: false,
            nodeMetrics: {},
            nodeStatuses: {},
            activeEdges: [],
        });
        void engine.play(ticksPerSecond, syncFromEngine);
    },

    stepSimulation: () => {
        const engine = get().engineInstance;
        if (!engine) return;
        const result = engine.step();
        if (!result) {
            if (engine.status === SimulationStatus.PAUSED) {
                set({ simulationStatus: SimulationStatus.PAUSED, simulationPaused: true });
            } else {
                set({ simulationStatus: SimulationStatus.FINISHED, activeNodeId: null, activeEdge: null, engineInstance: null });
            }
            return;
        }
        set({
            simulationStatus: engine.status,
            simulationPaused: engine.status === SimulationStatus.PAUSED,
            simulationTick: engine.currentTick,
            simulationTimeline: [...engine.history],
            simulationLogs: [...engine.logs],
            activeNodeId: result.target,
            activeEdge: { source: result.source, target: result.target },
            activeEdges: result.sourceEdgeId ? [{ edgeKey: result.sourceEdgeId, eventType: result.type, correlationId: result.correlationId, startTick: engine.currentTick, durationTicks: 3 }] : [],
            nodeMetrics: engine.metrics.getAllNodeMetrics(),
            nodeStatuses: { ...get().nodeStatuses, [result.target]: result.type === EventType.ERROR ? 'error' : 'processing' },
        });
        if (engine.status === SimulationStatus.FINISHED) set({ activeNodeId: null, activeEdge: null, engineInstance: null });
    },

    pauseSimulation: () => {
        const engine = get().engineInstance;
        if (!engine) return;

        engine.pause();
        set({
            simulationStatus: SimulationStatus.PAUSED,
            simulationTick: engine.currentTick,
            simulationPaused: true,
        });
    },

    resumeSimulation: () => {
        const engine = get().engineInstance;
        if (!engine) return;

        const ticksPerSecond = get().playbackSpeed * 60;

        const syncFromEngine = (processedEvent: RoutedEvent | null) => {
            const currentStatus = engine.status;
            const { activeNodeId, activeEdge, activeEdges } = get();

            const nextActiveEdges = activeEdges.filter((e) => engine.currentTick - e.startTick <= e.durationTicks);

            if (processedEvent && processedEvent.source && processedEvent.target) {
                nextActiveEdges.push({
                    edgeKey: processedEvent.sourceEdgeId ?? `${processedEvent.source}->${processedEvent.target}`,
                    eventType: processedEvent.type,
                    correlationId: processedEvent.correlationId,
                    startTick: engine.currentTick,
                    durationTicks: 3,
                });
            }

            set({
                simulationStatus: currentStatus,
                simulationTick: engine.currentTick,
                simulationTimeline: [...engine.history],
                simulationLogs: [...engine.logs],
                simulationPaused: currentStatus === SimulationStatus.PAUSED,
                activeNodeId: processedEvent ? processedEvent.target : currentStatus === SimulationStatus.FINISHED ? null : activeNodeId,
                activeEdge: processedEvent ? { source: processedEvent.source, target: processedEvent.target } : currentStatus === SimulationStatus.FINISHED ? null : activeEdge,
                engineInstance: currentStatus === SimulationStatus.IDLE || currentStatus === SimulationStatus.FINISHED ? null : engine,
                nodeMetrics: engine.metrics.getAllNodeMetrics(),
                activeEdges: nextActiveEdges,
            });
        };

        set({
            simulationStatus: SimulationStatus.RUNNING,
            simulationTick: engine.currentTick,
            simulationPaused: false,
        });

        void engine.play(ticksPerSecond, syncFromEngine);
    },

    resetSimulation: () => {
        const engine = get().engineInstance;
        engine?.reset();

        set({
            simulationStatus: SimulationStatus.IDLE,
            simulationTick: 0,
            simulationLogs: [],
            simulationTimeline: [],
            activeNodeId: null,
            activeEdge: null,
            simulationPaused: false,
            engineInstance: null,
            nodeMetrics: {},
            nodeStatuses: {},
            activeEdges: [],
        });
    },

    inspectPreviousTick: () => {
        const { simulationTick, simulationTimeline } = get();
        const previousTicks = Array.from(new Set(
            simulationTimeline
                .map((entry) => entry.tick)
                .filter((tick) => tick < simulationTick)
        )).sort((a, b) => b - a);
        if (previousTicks.length === 0) return;
        set({ simulationTick: previousTicks[0] });
    },

    inspectNextTick: () => {
        const { simulationTick, simulationTimeline } = get();
        const nextTick = Array.from(new Set(
            simulationTimeline
                .map((entry) => entry.tick)
                .filter((tick) => tick > simulationTick)
        )).sort((a, b) => a - b)[0];
        if (nextTick === undefined) return;
        set({ simulationTick: nextTick });
    },

    setActiveNodeId: (id) => set({ activeNodeId: id }),
    setActiveEdge: (edge) => set({ activeEdge: edge }),
}))
