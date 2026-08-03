import { EventType, NodeCategory, NodeDefinition, PortDirection, PortSide } from "@/types/node";
import { MonitorSmartphone } from "lucide-react";

export const clientNode: NodeDefinition = {
    type: "client",

    label: "Client",

    category: NodeCategory.CLIENT,

    icon: MonitorSmartphone,

    description: "Represents a user or application sending request",

    inputs: [
        {
            id: "http",
            label: "HTTP",
            side: PortSide.BOTTOM,
            direction: PortDirection.INPUT,
            accepts: [EventType.HTTP_RESPONSE]
        }
    ],
    outputs: [
        {
            id: "http",
            label: "HTTP",
            side: PortSide.RIGHT,
            direction: PortDirection.OUTPUT,
            emits: [EventType.HTTP_REQUEST],
        }
    ],

    config: [
        {
            key: "name",
            label: "Name",
            type: "text",
            defaultValue: "Browser",
        },
        {
            key: "requestsPerSecond",
            label: "Requests / Second",
            type: "number",
            defaultValue: 10,
            min: 1,
        },
        {
            key: "concurrentUsers",
            label: "Concurrent Users",
            type: "number",
            defaultValue: 100,
            min: 1,
        },
    ],

    simulate(node, event, context, state) {
        if (event.type === EventType.HTTP_REQUEST && event.source === 'user') {
            return [{ type: EventType.HTTP_REQUEST, outputPort: "http", payload: event.payload }];
        }
        if (event.type === EventType.HTTP_RESPONSE) {
            return [];
        }
        return [];
    },

    validate(node) {
        return [];
    },
}
