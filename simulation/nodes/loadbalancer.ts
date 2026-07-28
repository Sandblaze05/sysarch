import { EventType, NodeCategory, NodeDefinition, PortDirection, PortSide } from "@/types/node";
import { Network } from "lucide-react";

export const loadbalanceNode: NodeDefinition = {
    type: "load_balancer",

    label: "Load Balancer",

    category: NodeCategory.NETWORK,

    icon: Network,

    description: "Distributes incoming requests across multiple backend services.",

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
            key: "algorithm",
            label: "Algorithm",
            type: "select",
            defaultValue: "round_robin",
            options: [
                "round_robin",
                "least_connections",
                "ip_hash",
            ],
        },
        {
            key: "healthChecks",
            label: "Health Checks",
            type: "boolean",
            defaultValue: true,
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