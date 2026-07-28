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
    CACHE_LOOKUP = "cache_lookup",
    CACHE_HIT = "cache_hit",
    CACHE_MISS = "cache_miss",
    DATABASE_READ = "database_read",
    DATABASE_WRITE = "database_write",
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

export interface SimulationEvent {
    id: string

    type: EventType

    source: string
    target?: string

    payload: unknown

    timestamp: number
}

export interface ValidationError {
    nodeId: string

    message: string

    severity: "warning" | "error"
}

export interface SimulationContext {
    currentTick: number

    emit(event: SimulationEvent): void

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
        node: NodeInstance,
        event: SimulationEvent,
        context: SimulationContext
    ): SimulationEvent[]

    validate(node: NodeInstance): ValidationError[]
}


