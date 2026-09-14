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

    simulate(node, event, context, state) {
        state.nextIndex = (state.nextIndex || 0) as number;
        state.activePerTarget = (state.activePerTarget || {}) as Record<number, number>;
        state.healthStatus = (state.healthStatus || {}) as Record<number, boolean>;
        
        const activePerTarget = state.activePerTarget as Record<number, number>;
        const healthStatus = state.healthStatus as Record<number, boolean>;
        const healthChecks = node.instance.config.healthChecks as boolean;

        if (healthChecks && context.currentTick % 30 === 0) {
            const keys = Object.keys(healthStatus).length > 0 ? Object.keys(healthStatus) : ['0', '1', '2'];
            const randomKey = parseInt(keys[Math.floor(Math.random() * keys.length)]);
            healthStatus[randomKey] = !healthStatus[randomKey];
        }

        context.metrics.increment(node.instance.id, 'requestCount');
        
        // Count active backends
        const activeBackends = Object.keys(healthStatus).filter(k => healthStatus[parseInt(k)] !== false).length;
        context.metrics.record(node.instance.id, 'activeBackends', activeBackends || 1);

        if (event.type === EventType.HTTP_REQUEST) {
            const algo = node.instance.config.algorithm as string;
            let targetEdgeIndex = 0;

            if (algo === "round_robin") {
                targetEdgeIndex = (state.nextIndex as number);
                state.nextIndex = targetEdgeIndex + 1;
            } else if (algo === "least_connections") {
                const keys = Object.keys(activePerTarget).map(Number);
                if (keys.length > 0) {
                    targetEdgeIndex = keys.reduce((a, b) => activePerTarget[a] < activePerTarget[b] ? a : b);
                }
            } else if (algo === "ip_hash") {
                const id = event.payload ? JSON.stringify(event.payload).length : 0;
                targetEdgeIndex = id % 3; // simple hash
            }

            if (healthChecks && healthStatus[targetEdgeIndex] === false) {
                targetEdgeIndex = (targetEdgeIndex + 1) % 3;
            }

            activePerTarget[targetEdgeIndex] = (activePerTarget[targetEdgeIndex] || 0) + 1;

            return [{ type: EventType.HTTP_REQUEST, outputPort: "out", payload: event.payload, routing: 'single', targetEdgeIndex }];
        }
        return [];
    },

    validate(node) {
        return [];
    },
}
