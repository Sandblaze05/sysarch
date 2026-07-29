import { EventType, NodeCategory, NodeDefinition, PortDirection, PortSide } from "@/types/node";
import { Database } from "lucide-react";

export const databaseNode: NodeDefinition = {
    type: "database",

    label: "Database",

    category: NodeCategory.DATABASE,

    icon: Database,

    description: "Relational or non-relational persistent database to store and query application data.",

    inputs: [
        {
            id: "in",
            label: "Query",
            side: PortSide.LEFT,
            direction: PortDirection.INPUT,
            accepts: [EventType.DATABASE_READ, EventType.DATABASE_WRITE],
        },
    ],

    outputs: [
        {
            id: "out",
            label: "Response",
            side: PortSide.RIGHT,
            direction: PortDirection.OUTPUT,
            emits: [EventType.DATABASE_RESPONSE],
        },
    ],

    config: [
        {
            key: "dbType",
            label: "Database Type",
            type: "select",
            defaultValue: "relational",
            options: ["relational", "nosql", "timeseries", "graph"],
        },
        {
            key: "replicas",
            label: "Read Replicas",
            type: "number",
            defaultValue: 1,
            min: 0,
        },
        {
            key: "maxConnections",
            label: "Max Connections",
            type: "number",
            defaultValue: 100,
            min: 1,
        },
        {
            key: "latency",
            label: "Query Latency (ms)",
            type: "number",
            defaultValue: 20,
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