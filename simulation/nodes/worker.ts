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
            accepts: [EventType.QUEUE_CONSUME],
        },
    ],

    outputs: [
        {
            id: "out",
            label: "Result",
            side: PortSide.RIGHT,
            direction: PortDirection.OUTPUT,
            emits: [EventType.DATABASE_WRITE, EventType.DATABASE_READ, EventType.CACHE_WRITE, EventType.FILE_UPLOAD, EventType.EXTERNAL_REQUEST, EventType.METRIC, EventType.ERROR],
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

    simulate(node, event, context, state) {
        state.activeTasks = (state.activeTasks || 0) as number;
        state.batch = (state.batch || []) as unknown[];
        
        const concurrency = node.instance.config.concurrency as number;
        const batchSize = node.instance.config.batchSize as number;

        if (event.type === EventType.QUEUE_CONSUME) {
            if ((state.activeTasks as number) >= concurrency) {
                (state.batch as unknown[]).push(event.payload);
                return [{ type: EventType.DATABASE_WRITE, outputPort: "out", payload: event.payload, delayTicks: 5 }];
            } else {
                state.activeTasks = (state.activeTasks as number) + 1;
                context.metrics.increment(node.instance.id, 'processedCount');
                
                if ((state.batch as unknown[]).length >= batchSize) {
                    const batchPayload = [...(state.batch as unknown[])];
                    state.batch = [];
                    state.activeTasks = (state.activeTasks as number) - 1;
                    return [{ type: EventType.DATABASE_WRITE, outputPort: "out", payload: batchPayload }];
                }
                
                return [{ type: EventType.DATABASE_WRITE, outputPort: "out", payload: event.payload }];
            }
        }
        
        context.metrics.record(node.instance.id, 'activeTasks', state.activeTasks as number);
        context.metrics.record(node.instance.id, 'batchSize', (state.batch as unknown[]).length);
        
        return [];
    },

    validate(node) {
        return [];
    },
}
