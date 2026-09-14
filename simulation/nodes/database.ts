import { EventType, NodeCategory, NodeDefinition, PortDirection, PortSide } from "@/types/node";
import { Database } from "lucide-react";

export const databaseNode: NodeDefinition = {
    type: "database",

    label: "Database",

    category: NodeCategory.DATABASE,

    icon: Database,

    description: "Relational or non-relational persistent database to store and query application data.",

    inputs: [
        {
            id: "in",
            label: "Query",
            side: PortSide.LEFT,
            direction: PortDirection.INPUT,
            accepts: [EventType.DATABASE_READ, EventType.DATABASE_WRITE],
        },
    ],

    outputs: [
        {
            id: "out",
            label: "Response",
            side: PortSide.RIGHT,
            direction: PortDirection.OUTPUT,
            emits: [EventType.DATABASE_RESPONSE],
        },
    ],

    config: [
        {
            key: "dbType",
            label: "Database Type",
            type: "select",
            defaultValue: "relational",
            options: ["relational", "nosql", "timeseries", "graph"],
        },
        {
            key: "replicas",
            label: "Read Replicas",
            type: "number",
            defaultValue: 1,
            min: 0,
        },
        {
            key: "maxConnections",
            label: "Max Connections",
            type: "number",
            defaultValue: 100,
            min: 1,
        },
        {
            key: "latency",
            label: "Query Latency (ms)",
            type: "number",
            defaultValue: 20,
            min: 0,
        },
    ],

    simulate(node, event, context, state) {
        state.connections = (state.connections || []) as number[];
        const connections = state.connections as number[];
        for (let index = connections.length - 1; index >= 0; index -= 1) {
            if (connections[index] <= context.currentTick) connections.splice(index, 1);
        }
        state.activeConnections = connections.length;
        const maxConnections = node.instance.config.maxConnections as number;

        if (event.type === EventType.DATABASE_READ || event.type === EventType.DATABASE_WRITE) {
            if (connections.length >= maxConnections) {
                context.metrics.increment(node.instance.id, 'poolExhausted');
                context.log('Connection pool exhausted');
                
                return [{ 
                    type: EventType.DATABASE_RESPONSE, 
                    outputPort: "out", 
                    payload: event.payload,
                    delayTicks: 5
                }];
            }

            const latencyMs = Number(node.instance.config.latency) || 0;
            const latencyTicks = Math.max(1, Math.ceil(latencyMs / 1000 * 60));
            const isReadReplica = event.type === EventType.DATABASE_READ && Number(node.instance.config.replicas) > 1;
            const releaseTick = context.currentTick + (isReadReplica ? Math.max(1, Math.ceil(latencyTicks / 2)) : latencyTicks);
            connections.push(releaseTick);
            state.activeConnections = connections.length;
            
            if (event.type === EventType.DATABASE_READ) {
                context.metrics.increment(node.instance.id, 'readCount');
            } else {
                context.metrics.increment(node.instance.id, 'writeCount');
            }
            
            context.metrics.record(node.instance.id, 'activeConnections', state.activeConnections as number);
            context.metrics.record(node.instance.id, 'connectionPoolUtilization', (state.activeConnections as number) / maxConnections);

            return [{ type: EventType.DATABASE_RESPONSE, outputPort: "out", payload: event.payload, delayTicks: isReadReplica ? Math.max(1, Math.ceil(latencyTicks / 2)) : latencyTicks }];
        }
        return [];
    },

    validate(node) {
        return [];
    },
}
