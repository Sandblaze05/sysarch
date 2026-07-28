import { EventType, NodeCategory, NodeDefinition, PortDirection, PortSide } from "@/types/node";
import { Settings } from "lucide-react";

export const workerNode: NodeDefinition = {
    type: "worker",

    label: "Worker",

    category: NodeCategory.COMPUTE,

    icon: Settings,

    description: "Background processing node that consumes tasks from a queue or schedules.",

    inputs: [
        {
            id: "in",
            label: "Task",
            side: PortSide.LEFT,
            direction: PortDirection.INPUT,
            accepts: [EventType.HTTP_REQUEST],
        },
    ],

    outputs: [
        {
            id: "out",
            label: "Result",
            side: PortSide.RIGHT,
            direction: PortDirection.OUTPUT,
            emits: [EventType.DATABASE_WRITE, EventType.HTTP_RESPONSE],
        },
    ],

    config: [
        {
            key: "concurrency",
            label: "Concurrency",
            type: "number",
            defaultValue: 5,
            min: 1,
        },
        {
            key: "batchSize",
            label: "Batch Size",
            type: "number",
            defaultValue: 10,
            min: 1,
        },
        {
            key: "latency",
            label: "Processing Latency (ms)",
            type: "number",
            defaultValue: 100,
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