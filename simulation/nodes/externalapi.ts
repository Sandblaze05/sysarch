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
        if (event.type === EventType.EXTERNAL_REQUEST) {
            return [{ type: EventType.EXTERNAL_RESPONSE, outputPort: "out", payload: event.payload }];
        }
        return [];
    },

    validate(node) {
        return [];
    },
}
