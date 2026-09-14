import { EventType, NodeCategory, NodeDefinition, PortDirection, PortSide } from "@/types/node";
import { Server } from "lucide-react";

export const serviceNode: NodeDefinition = {
    type: "service",

    label: "Service",

    category: NodeCategory.SERVICE,

    icon: Server,

    description: "Runs business logic, interacts with databases, caches, queues, and other services.",

    inputs: [
        {
            id: "in",
            label: "HTTP",
            side: PortSide.LEFT,
            direction: PortDirection.INPUT,
            accepts: [EventType.HTTP_REQUEST, EventType.DATABASE_RESPONSE, EventType.CACHE_HIT, EventType.CACHE_MISS, EventType.QUEUE_CONSUME, EventType.EXTERNAL_RESPONSE, EventType.FILE_DOWNLOAD],
        },
    ],

    outputs: [
        {
            id: "out",
            label: "HTTP/Database/Cache",
            side: PortSide.RIGHT,
            direction: PortDirection.OUTPUT,
            emits: [EventType.HTTP_RESPONSE, EventType.CACHE_READ, EventType.CACHE_WRITE, EventType.DATABASE_READ, EventType.DATABASE_WRITE, EventType.QUEUE_PUBLISH, EventType.EXTERNAL_REQUEST, EventType.FILE_UPLOAD, EventType.FILE_DOWNLOAD, EventType.METRIC, EventType.ERROR],
        },
    ],

    config: [
        {
            key: "replicas",
            label: "Replicas",
            type: "number",
            defaultValue: 2,
            min: 1,
        },
        {
            key: "concurrencyLimit",
            label: "Concurrency Limit",
            type: "number",
            defaultValue: 100,
            min: 1,
        },
        {
            key: "timeout",
            label: "Timeout (ms)",
            type: "number",
            defaultValue: 30000,
            min: 0,
        },
        {
            key: "latency",
            label: "Processing Latency (ms)",
            type: "number",
            defaultValue: 50,
            min: 0,
        },
    ],

    simulate(node, event, context, state) {
        state.activeRequests = (state.activeRequests || 0) as number;
        state.pendingRequests = (state.pendingRequests || {}) as Record<string, unknown>;
        
        const concurrencyLimit = node.instance.config.concurrencyLimit as number;

        if (event.type === EventType.HTTP_REQUEST) {
            if (Number(node.instance.config.latency) > Number(node.instance.config.timeout)) {
                context.metrics.increment(node.instance.id, 'errorCount');
                context.metrics.increment(node.instance.id, 'timeoutCount');
                return [{ type: EventType.ERROR, outputPort: "out", payload: { status: 504, message: 'Service timeout' } }];
            }

            if ((state.activeRequests as number) >= concurrencyLimit) {
                context.metrics.increment(node.instance.id, 'errorCount');
                return [{ type: EventType.ERROR, outputPort: "out", payload: { status: 503, message: 'Service overloaded' } }];
            }
            
            state.activeRequests = (state.activeRequests as number) + 1;
            context.metrics.increment(node.instance.id, 'requestCount');
            context.metrics.record(node.instance.id, 'activeRequests', state.activeRequests as number);
            
            const reqId = `${event.correlationId}:${context.currentTick}`;
            (state.pendingRequests as Record<string, unknown>)[reqId] = event.payload;

            return [{ type: EventType.DATABASE_READ, outputPort: "out", payload: { ...event.payload as object, reqId } }];
        }
        
        if (event.type === EventType.DATABASE_RESPONSE) {
            if ((state.activeRequests as number) > 0) state.activeRequests = (state.activeRequests as number) - 1;
            const responsePayload = event.payload && typeof event.payload === 'object'
                ? event.payload as Record<string, unknown>
                : {};
            const reqId = typeof responsePayload.reqId === 'string' ? responsePayload.reqId : undefined;
            if (reqId) delete (state.pendingRequests as Record<string, unknown>)[reqId];
            return [{ type: EventType.HTTP_RESPONSE, outputPort: "out", payload: event.payload }];
        }

        if (event.type === EventType.ERROR) {
            if ((state.activeRequests as number) > 0) state.activeRequests = (state.activeRequests as number) - 1;
            context.metrics.increment(node.instance.id, 'errorCount');
            return [{ type: EventType.ERROR, outputPort: "out", payload: event.payload }];
        }
        
        if (event.type === EventType.CACHE_HIT) {
            return [{ type: EventType.HTTP_RESPONSE, outputPort: "out", payload: event.payload }];
        }
        
        if (event.type === EventType.CACHE_MISS) {
            return [{ type: EventType.DATABASE_READ, outputPort: "out", payload: event.payload }];
        }
        
        if (event.type === EventType.QUEUE_CONSUME) {
            return [{ type: EventType.DATABASE_WRITE, outputPort: "out", payload: event.payload }];
        }
        
        return [{ type: EventType.HTTP_RESPONSE, outputPort: "out", payload: event.payload }];
    },

    validate(node) {
        return [];
    },
}
