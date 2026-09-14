import { EventType, NodeCategory, NodeDefinition, PortDirection, PortSide } from "@/types/node";
import { Globe } from "lucide-react";

export const cdnNode: NodeDefinition = {
    type: "cdn",

    label: "CDN",

    category: NodeCategory.NETWORK,

    icon: Globe,

    description: "Geographically distributed caching servers optimized to serve assets quickly to end users.",

    inputs: [
        {
            id: "in",
            label: "Request",
            side: PortSide.LEFT,
            direction: PortDirection.INPUT,
            accepts: [EventType.FILE_DOWNLOAD],
        },
    ],

    outputs: [
        {
            id: "out",
            label: "Response",
            side: PortSide.RIGHT,
            direction: PortDirection.OUTPUT,
            emits: [EventType.FILE_DOWNLOAD],
        },
    ],

    config: [
        {
            key: "cachingRules",
            label: "Caching Rules",
            type: "select",
            defaultValue: "cache_static",
            options: ["cache_static", "cache_everything", "bypass"],
        },
        {
            key: "ttl",
            label: "Default TTL (s)",
            type: "number",
            defaultValue: 86400,
            min: 0,
        },
        {
            key: "latency",
            label: "Edge Latency (ms)",
            type: "number",
            defaultValue: 10,
            min: 0,
        },
    ],

    simulate(node, event, context, state) {
        state.cache = (state.cache || {}) as Record<string, {insertedAt: number}>;
        const cache = state.cache as Record<string, {insertedAt: number}>;
        
        if (event.type === EventType.FILE_DOWNLOAD) {
            const key = JSON.stringify(event.payload || "file");
            const entry = cache[key];
            const ttl = node.instance.config.ttl as number;
            const rules = node.instance.config.cachingRules as string;

            if (rules === 'bypass') {
                context.metrics.increment(node.instance.id, 'bypassCount');
                return [{ type: EventType.FILE_DOWNLOAD, outputPort: "out", payload: event.payload }];
            }
            
            if (entry && (context.currentTick - entry.insertedAt < ttl * 60)) {
                context.metrics.increment(node.instance.id, 'cacheHitCount');
                state.hits = Number(state.hits || 0) + 1;
                return [{ type: EventType.FILE_DOWNLOAD, outputPort: "out", payload: event.payload, delayTicks: 1 }];
            } else {
                cache[key] = { insertedAt: context.currentTick };
                context.metrics.increment(node.instance.id, 'cacheMissCount');
                state.misses = Number(state.misses || 0) + 1;
                const total = Number(state.hits || 0) + Number(state.misses || 0);
                context.metrics.record(node.instance.id, 'cacheHitRatio', total > 0 ? Number(state.hits || 0) / total : 0);
                return [{ type: EventType.FILE_DOWNLOAD, outputPort: "out", payload: event.payload }];
            }
        }
        return [];
    },

    validate(node) {
        return [];
    },
}
