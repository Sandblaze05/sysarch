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
            accepts: [EventType.CACHE_LOOKUP],
        },
    ],

    outputs: [
        {
            id: "out",
            label: "Result",
            side: PortSide.RIGHT,
            direction: PortDirection.OUTPUT,
            emits: [EventType.CACHE_HIT, EventType.CACHE_MISS, EventType.HTTP_RESPONSE],
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

    simulate(node, event, context) {
        return [event];
    },

    validate(node) {
        return [];
    },
}