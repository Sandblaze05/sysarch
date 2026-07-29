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

    simulate(node, event, context) {
        return [event];
    },

    validate(node) {
        return [];
    },
}