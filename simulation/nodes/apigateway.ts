import { EventType, NodeCategory, NodeDefinition, PortDirection, PortSide } from "@/types/node";
import { Route } from "lucide-react";

export const apiGatewayNode: NodeDefinition = {
    type: "api_gateway",

    label: "API Gateway",

    category: NodeCategory.NETWORK,

    icon: Route,

    description: "Routes incoming requests to appropriate services, applying rate-limiting and authentication.",

    inputs: [
        {
            id: "in",
            label: "HTTP",
            side: PortSide.LEFT,
            direction: PortDirection.INPUT,
            accepts: [EventType.HTTP_REQUEST],
        },
    ],

    outputs: [
        {
            id: "out",
            label: "HTTP",
            side: PortSide.RIGHT,
            direction: PortDirection.OUTPUT,
            emits: [EventType.HTTP_REQUEST],
        },
    ],

    config: [
        {
            key: "rateLimiting",
            label: "Enable Rate Limiting",
            type: "boolean",
            defaultValue: false,
        },
        {
            key: "rateLimitRps",
            label: "Max Requests / Sec",
            type: "number",
            defaultValue: 100,
            min: 1,
        },
        {
            key: "authEnabled",
            label: "Enable Authentication",
            type: "boolean",
            defaultValue: false,
        },
        {
            key: "latency",
            label: "Latency (ms)",
            type: "number",
            defaultValue: 5,
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