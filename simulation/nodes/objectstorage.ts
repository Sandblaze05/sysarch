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
        state.objectCount = (state.objectCount || 0) as number;
        state.totalSize = (state.totalSize || 0) as number;
        state.versions = (state.versions || {}) as Record<string, number>;
        
        if (event.type === EventType.FILE_UPLOAD) {
            state.objectCount = (state.objectCount as number) + 1;
            state.totalSize = (state.totalSize as number) + 1024; // Simulated size
            
            if (node.instance.config.versioning) {
                const key = JSON.stringify(event.payload || "file");
                (state.versions as Record<string, number>)[key] = ((state.versions as Record<string, number>)[key] || 0) + 1;
            }
            
            context.metrics.increment(node.instance.id, 'uploadCount');
            context.metrics.record(node.instance.id, 'objectCount', state.objectCount as number);
            
            return [{ type: EventType.FILE_DOWNLOAD, outputPort: "out", payload: event.payload }];
        }
        
        if (event.type === EventType.FILE_DOWNLOAD) {
            context.metrics.increment(node.instance.id, 'downloadCount');
            return [{ type: EventType.FILE_DOWNLOAD, outputPort: "out", payload: event.payload }];
        }
        
        return [];
    },

    validate(node) {
        return [];
    },
}
