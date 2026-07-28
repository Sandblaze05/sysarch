import { EventType, NodeCategory, NodeDefinition, PortDirection, PortSide } from "@/types/node";
import { MonitorSmartphone } from "lucide-react";

export const clientNode: NodeDefinition = {
    type: "client",

    label: "Client",

    category: NodeCategory.CLIENT,

    icon: MonitorSmartphone,

    description: "Represents a user or application sending request",

    inputs: [],
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

    simulate(node, event, context) {
        // placeholder for now
        return [];
    },

    validate(node) {
        return [];
    },
}