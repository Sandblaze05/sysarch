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

    simulate(node, event, context) {
        return [event];
    },

    validate(node) {
        return [];
    },
}