import { EventType, NodeCategory, NodeDefinition, PortDirection, PortSide } from "@/types/node";
import { ExternalLink } from "lucide-react";

export const externalApiNode: NodeDefinition = {
    type: "external_api",

    label: "External API",

    category: NodeCategory.EXTERNAL,

    icon: ExternalLink,

    description: "Integration point with 3rd-party services and REST APIs outside the main infrastructure.",

    inputs: [
        {
            id: "in",
            label: "HTTP",
            side: PortSide.LEFT,
            direction: PortDirection.INPUT,
            accepts: [EventType.EXTERNAL_REQUEST],
        },
    ],

    outputs: [
        {
            id: "out",
            label: "HTTP",
            side: PortSide.RIGHT,
            direction: PortDirection.OUTPUT,
            emits: [EventType.EXTERNAL_RESPONSE],
        },
    ],

    config: [
        {
            key: "endpointUrl",
            label: "Endpoint URL",
            type: "text",
            defaultValue: "https://api.thirdparty.com",
        },
        {
            key: "rateLimit",
            label: "Rate Limit (req/min)",
            type: "number",
            defaultValue: 60,
            min: 1,
        },
        {
            key: "timeout",
            label: "Timeout (ms)",
            type: "number",
            defaultValue: 5000,
            min: 1,
        },
    ],

    simulate(node, event, context, state) {
        state.requestCount = (state.requestCount || 0) as number;
        state.windowStart = (state.windowStart || context.currentTick) as number;

        if (context.currentTick - (state.windowStart as number) >= 60 * 60) {
            state.windowStart = context.currentTick;
            state.requestCount = 0;
        }

        if (event.type === EventType.EXTERNAL_REQUEST) {
            const rateLimit = node.instance.config.rateLimit as number;
            const timeout = node.instance.config.timeout as number;
            
            if ((state.requestCount as number) >= rateLimit) {
                context.metrics.increment(node.instance.id, 'rateLimitHits');
                return [{ type: EventType.ERROR, outputPort: "out", payload: { status: 429, message: 'Rate limit exceeded' } }];
            }

            state.requestCount = (state.requestCount as number) + 1;
            context.metrics.increment(node.instance.id, 'requestCount');
            
            const correlationHash = Array.from(event.correlationId).reduce((sum, char) => sum + char.charCodeAt(0), 0);
            if (correlationHash % 20 === 0) {
                context.metrics.increment(node.instance.id, 'errorCount');
                context.metrics.increment(node.instance.id, 'failureCount');
                return [{ type: EventType.ERROR, outputPort: "out", payload: { status: 500, message: 'External API error' } }];
            }

            if (timeout < 100) {
                context.metrics.increment(node.instance.id, 'timeoutCount');
                return [{ type: EventType.ERROR, outputPort: "out", payload: { status: 408, message: 'Timeout' } }];
            }

            return [{ type: EventType.EXTERNAL_RESPONSE, outputPort: "out", payload: event.payload }];
        }
        return [];
    },

    validate(node) {
        return [];
    },
}
