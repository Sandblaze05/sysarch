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
            emits: [EventType.HTTP_REQUEST, EventType.HTTP_RESPONSE, EventType.ERROR],
        },
    ],

    config: [
        {
            key: "algorithm",
            label: "Algorithm",
            type: "select",
            defaultValue: "round_robin",
            options: [
                "round_robin",
                "least_connections",
                "ip_hash",
                "random"
            ],
        },
        {
            key: "latency",
            label: "Latency (ms)",
            type: "number",
            defaultValue: 2,
            min: 0,
        },
        {
            key: "rateLimit",
            label: "Rate Limit",
            type: "number",
            defaultValue: 1000,
            min: 1,
        },
        {
            key: "rateLimiting",
            label: "Enable Rate Limiting",
            type: "boolean",
            defaultValue: true,
        },
        {
            key: "authEnabled",
            label: "Enable Authentication",
            type: "boolean",
            defaultValue: false,
        },
    ],

    simulate(node, event, context, state) {
        if (event.type === EventType.HTTP_REQUEST) {
            return [{ type: EventType.HTTP_REQUEST, outputPort: "out", payload: event.payload }];
        }
        return [];
    },

    validate(node) {
        return [];
    },
}
