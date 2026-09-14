import { EventType, NodeCategory, NodeDefinition, PortDirection, PortSide } from "@/types/node";
import { Layers } from "lucide-react";

export const messageQueueNode: NodeDefinition = {
    type: "message_queue",

    label: "Message Queue",

    category: NodeCategory.MESSAGE_QUEUE,

    icon: Layers,

    description: "Message broker enabling asynchronous, decoupled communication between services.",

    inputs: [
        {
            id: "in",
            label: "Publish",
            side: PortSide.LEFT,
            direction: PortDirection.INPUT,
            accepts: [EventType.QUEUE_PUBLISH],
        },
    ],

    outputs: [
        {
            id: "out",
            label: "Consume",
            side: PortSide.RIGHT,
            direction: PortDirection.OUTPUT,
            emits: [EventType.QUEUE_CONSUME],
        },
    ],

    config: [
        {
            key: "deliveryGuarantee",
            label: "Delivery Guarantee",
            type: "select",
            defaultValue: "at_least_once",
            options: ["at_least_once", "at_most_once", "exactly_once"],
        },
        {
            key: "retentionPeriod",
            label: "Retention Period (min)",
            type: "number",
            defaultValue: 1440,
            min: 1,
        },
        {
            key: "maxMsgSize",
            label: "Max Message Size (KB)",
            type: "number",
            defaultValue: 256,
            min: 1,
        },
    ],

    simulate(node, event, context, state) {
        state.queue = (state.queue || []) as Array<{payload: unknown, insertedAt: number, correlationId: string}>;
        state.seenIds = (state.seenIds || new Set<string>()) as Set<string>;
        
        const retentionPeriod = node.instance.config.retentionPeriod as number;
        const queue = state.queue as Array<{payload: unknown, insertedAt: number, correlationId: string}>;
        
        // Clean up old messages
        const now = context.currentTick;
        state.queue = queue.filter(msg => now - msg.insertedAt < retentionPeriod * 60);
        const retainedQueue = state.queue as Array<{payload: unknown, insertedAt: number, correlationId: string}>;

        if (event.type === EventType.QUEUE_PUBLISH) {
            const payload = event.payload && typeof event.payload === 'object'
                ? event.payload as Record<string, unknown>
                : {};
            const correlationId = typeof payload.correlationId === 'string'
                ? payload.correlationId
                : event.correlationId;
            retainedQueue.push({ payload: event.payload, insertedAt: context.currentTick, correlationId });
            context.metrics.increment(node.instance.id, 'publishCount');
            
            const nextMsg = retainedQueue.shift();
            if (nextMsg) {
                context.metrics.increment(node.instance.id, 'consumeCount');
                
                const guarantee = node.instance.config.deliveryGuarantee as string;
                if (guarantee === 'exactly_once') {
                    if ((state.seenIds as Set<string>).has(nextMsg.correlationId)) {
                        return []; // Deduplicate
                    }
                    (state.seenIds as Set<string>).add(nextMsg.correlationId);
                }
                
                if (guarantee === 'at_least_once' && Math.random() < 0.05) {
                    return [
                        { type: EventType.QUEUE_CONSUME, outputPort: "out", payload: nextMsg.payload },
                        { type: EventType.QUEUE_CONSUME, outputPort: "out", payload: nextMsg.payload }
                    ];
                }
                
                return [{ type: EventType.QUEUE_CONSUME, outputPort: "out", payload: nextMsg.payload }];
            }
        }
        
        context.metrics.record(node.instance.id, 'queueDepth', retainedQueue.length);
        return [];
    },

    validate(node) {
        return [];
    },
}
