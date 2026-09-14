import { ComponentType } from "react"

export enum NodeCategory {
    CLIENT = "client",
    NETWORK = "network",
    SECURITY = "security",
    SERVICE = "service",
    COMPUTE = "compute",
    CACHE = "cache",
    DATABASE = "database",
    MESSAGE_QUEUE = "message_queue",
    STORAGE = "storage",
    MONITORING = "monitoring",
    AI = "ai",
    EXTERNAL = "external",
}

export enum EventType {
  HTTP_REQUEST = "http_request",
  HTTP_RESPONSE = "http_response",

  CACHE_READ = "cache_read",
  CACHE_HIT = "cache_hit",
  CACHE_MISS = "cache_miss",
  CACHE_WRITE = "cache_write",

  DATABASE_READ = "database_read",
  DATABASE_WRITE = "database_write",
  DATABASE_RESPONSE = "database_response",

  QUEUE_PUBLISH = "queue_publish",
  QUEUE_CONSUME = "queue_consume",

  FILE_UPLOAD = "file_upload",
  FILE_DOWNLOAD = "file_download",

  EXTERNAL_REQUEST = "external_request",
  EXTERNAL_RESPONSE = "external_response",

  METRIC = "metric",

  ERROR = "error",
}

export enum PortSide {
    LEFT = "left",
    RIGHT = "right",
    TOP = "top",
    BOTTOM = "bottom",
}

export enum PortDirection {
    INPUT = "input",
    OUTPUT = "output",
}

export enum SimulationStatus {
    IDLE = "idle",
    RUNNING = "running",
    PAUSED = "paused",
    FINISHED = "finished",
    ERROR = "error",
}

export interface PortDefinition {
    id: string
    label: string

    side: PortSide
    direction: PortDirection

    accepts?: EventType[]
    emits?: EventType[]

    multipleConnections?: boolean
}

export type ConfigType =
    | "text"
    | "number"
    | "boolean"
    | "select"
    
export interface ConfigField {
    key: string
    label: string

    type: ConfigType

    defaultValue: unknown

    options?: string[]

    min?: number
    max?: number
}

export interface RuntimeState {
    [key: string]: unknown
}

// ── Metrics ──────────────────────────────────────────────

/** Lightweight handle nodes use inside simulate() to report metrics. */
export interface MetricsContext {
    /** Set a gauge value (e.g. connectionPoolUtilization = 0.67). */
    record(nodeId: string, key: string, value: number): void
    /** Increment a counter (e.g. requestCount += 1). */
    increment(nodeId: string, key: string, delta?: number): void
    recordEvent(): void
}

/** Snapshot of all metrics for a single node at a point in time. */
export interface NodeMetrics {
    [key: string]: number
}

/** A single data-point in a time-series. */
export interface MetricsSample {
    tick: number
    value: number
}

// ── Events ───────────────────────────────────────────────

export interface EventIntent {
    type: EventType
    payload: unknown
    outputPort?: string
    delayTicks?: number
    /**
     * `'broadcast'` (default) — send to ALL matching downstream edges.
     * `'single'`   — send to exactly ONE downstream edge (chosen by
     *                `targetEdgeIndex` or round-robin inside the router).
     */
    routing?: 'broadcast' | 'single'
    /** When routing === 'single', index into the filtered edge list to use. */
    targetEdgeIndex?: number
}

export interface RoutedEvent {
    id: string
    type: EventType
    source: string
    target: string
    targetPort?: string
    payload: unknown
    correlationId: string
    tick: number
    /** The edge (source→target handle key) this event travels on, for UI animation. */
    sourceEdgeId?: string
}

export interface TimelineEntry {
    tick: number
    nodeId: string
    event: RoutedEvent
    outputs: EventIntent[]
    status: 'processed' | 'skipped' | 'error'
}

export interface ValidationError {
    nodeId: string

    message: string

    severity: "warning" | "error"
}

export interface SimulationContext {
    currentTick: number

    emit(event: EventIntent): void

    log(message: string): void

    /** Metrics reporting handle – available during simulation. */
    metrics: MetricsContext
}

export interface NodeInstance {
    id: string

    type: string

    config: Record<string, unknown>
}

export interface NodeDefinition {
    type: string
    label: string
    icon: ComponentType<{ className?: string }>

    category: NodeCategory

    description?: string

    inputs:PortDefinition[]
    outputs: PortDefinition[]

    config: ConfigField[]

    simulate(
        node: RuntimeNode,
        event: RoutedEvent,
        context: SimulationContext,
        state: RuntimeState
    ): EventIntent[]

    validate(node: NodeInstance): ValidationError[]
}

export interface RuntimeEdge {
    id?: string
    source: string
    sourceHandle: string | null

    target: string
    targetHandle: string | null
}

export interface RuntimeNode {
    instance: NodeInstance

    definition: NodeDefinition

    state: RuntimeState

    process(event: RoutedEvent, context: SimulationContext): EventIntent[]
}

export interface RuntimeGraph {
    nodes: Map<string, RuntimeNode>

    outgoing: Map<string, RuntimeEdge[]>

    incoming: Map<string, RuntimeEdge[]>

    route(sourceId: string, intents: EventIntent[], currentTick: number, correlationId: string): RoutedEvent[]
}

export interface EventResult {
    type: EventType
    outputPort: string
    payload?: unknown
    delayTicks?: number
}

export interface GraphEdge {
    source: string

    target: string
}

/** Per-edge animation state pushed to the UI. */
export interface ActiveEdgeEvent {
    edgeKey: string          // "sourceId->targetId" or React Flow edge id
    eventType: EventType
    correlationId: string
    startTick: number
    durationTicks: number
}

/** Status a node can display during simulation. */
export type NodeSimStatus = 'idle' | 'processing' | 'success' | 'error'
