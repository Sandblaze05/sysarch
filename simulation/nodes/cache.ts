import { EventType, NodeCategory, NodeDefinition, PortDirection, PortSide } from "@/types/node";
import { Zap } from "lucide-react";

export const cacheNode: NodeDefinition = {
    type: "cache",

    label: "Cache",

    category: NodeCategory.CACHE,

    icon: Zap,

    description: "High-speed in-memory data store used for fast data lookup and reducing database load.",

    inputs: [
        {
            id: "in",
            label: "Lookup",
            side: PortSide.LEFT,
            direction: PortDirection.INPUT,
            accepts: [EventType.CACHE_READ, EventType.CACHE_WRITE],
        },
    ],

    outputs: [
        {
            id: "out",
            label: "Result",
            side: PortSide.RIGHT,
            direction: PortDirection.OUTPUT,
            emits: [EventType.CACHE_HIT, EventType.CACHE_MISS],
        },
    ],

    config: [
        {
            key: "evictionPolicy",
            label: "Eviction Policy",
            type: "select",
            defaultValue: "LRU",
            options: ["LRU", "LFU", "FIFO"],
        },
        {
            key: "maxMemory",
            label: "Max Memory (MB)",
            type: "number",
            defaultValue: 1024,
            min: 64,
        },
        {
            key: "ttl",
            label: "Default TTL (s)",
            type: "number",
            defaultValue: 3600,
            min: 0,
        },
        {
            key: "latency",
            label: "Latency (ms)",
            type: "number",
            defaultValue: 2,
            min: 0,
        },
    ],

    simulate(node, event, context, state) {
        state.store = (state.store || {}) as Record<string, {value: unknown, insertedAt: number, accessCount: number}>;
        state.hitCount = (state.hitCount || 0) as number;
        state.missCount = (state.missCount || 0) as number;
        const store = state.store as Record<string, {value: unknown, insertedAt: number, accessCount: number}>;
        
        context.metrics.increment(node.instance.id, 'requestCount');

        if (event.type === EventType.CACHE_READ) {
            const key = JSON.stringify(event.payload || "default");
            const entry = store[key];
            const ttl = node.instance.config.ttl as number;

            if (entry && (context.currentTick - entry.insertedAt < ttl * 60)) {
                entry.accessCount++;
                state.hitCount = (state.hitCount as number) + 1;
                context.metrics.increment(node.instance.id, 'hitCount');
                const total = (state.hitCount as number) + (state.missCount as number);
                context.metrics.record(node.instance.id, 'hitRate', total > 0 ? (state.hitCount as number) / total : 0);
                return [{ type: EventType.CACHE_HIT, outputPort: "out", payload: entry.value }];
            } else {
                context.metrics.increment(node.instance.id, 'missCount');
                state.missCount = (state.missCount as number) + 1;
                const total = (state.hitCount as number) + (state.missCount as number);
                context.metrics.record(node.instance.id, 'hitRate', total > 0 ? (state.hitCount as number) / total : 0);
                return [{ type: EventType.CACHE_MISS, outputPort: "out", payload: event.payload }];
            }
        }
        
        if (event.type === EventType.CACHE_WRITE) {
            const key = JSON.stringify(event.payload || "default");
            const maxMemory = node.instance.config.maxMemory as number;
            const maxEntries = maxMemory / 64;
            
            if (Object.keys(store).length >= maxEntries) {
                const policy = node.instance.config.evictionPolicy as string;
                let keyToRemove = Object.keys(store)[0];
                
                if (policy === "LRU") {
                    keyToRemove = Object.keys(store).reduce((a, b) => store[a].insertedAt < store[b].insertedAt ? a : b);
                } else if (policy === "LFU") {
                    keyToRemove = Object.keys(store).reduce((a, b) => store[a].accessCount < store[b].accessCount ? a : b);
                }
                
                delete store[keyToRemove];
                context.metrics.increment(node.instance.id, 'evictions');
            }
            
            store[key] = { value: event.payload, insertedAt: context.currentTick, accessCount: 1 };
            context.metrics.increment(node.instance.id, 'writeCount');
            return [{ type: EventType.CACHE_HIT, outputPort: "out", payload: event.payload }];
        }
        return [];
    },

    validate(node) {
        return [];
    },
}
