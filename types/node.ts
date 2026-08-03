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

interface PortDefinition {
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

export interface EventIntent {
    type: EventType
    payload: unknown
    outputPort?: string
    delayTicks?: number
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
