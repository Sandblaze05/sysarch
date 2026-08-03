import { EventType, NodeCategory, NodeDefinition, PortDirection, PortSide } from "@/types/node";
import { HardDrive } from "lucide-react";

export const objectStorageNode: NodeDefinition = {
    type: "object_storage",

    label: "Object Storage",

    category: NodeCategory.STORAGE,

    icon: HardDrive,

    description: "Persistent cloud-scale storage designed to store and retrieve large volumes of unstructured data.",

    inputs: [
        {
            id: "in",
            label: "HTTP",
            side: PortSide.LEFT,
            direction: PortDirection.INPUT,
            accepts: [EventType.FILE_UPLOAD, EventType.FILE_DOWNLOAD],
        },
    ],

    outputs: [
        {
            id: "out",
            label: "HTTP",
            side: PortSide.RIGHT,
            direction: PortDirection.OUTPUT,
            emits: [EventType.FILE_DOWNLOAD],
        },
    ],

    config: [
        {
            key: "versioning",
            label: "Enable Versioning",
            type: "boolean",
            defaultValue: false,
        },
        {
            key: "storageClass",
            label: "Storage Class",
            type: "select",
            defaultValue: "standard",
            options: ["standard", "infrequent_access", "archive"],
        },
        {
            key: "latency",
            label: "Latency (ms)",
            type: "number",
            defaultValue: 15,
            min: 0,
        },
    ],

    simulate(node, event, context, state) {
        if (event.type === EventType.FILE_UPLOAD || event.type === EventType.FILE_DOWNLOAD) {
            return [{ type: EventType.FILE_DOWNLOAD, outputPort: "out", payload: event.payload }];
        }
        return [];
    },

    validate(node) {
        return [];
    },
}
