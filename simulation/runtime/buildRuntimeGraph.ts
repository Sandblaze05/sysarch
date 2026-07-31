import { Node, Edge } from "@xyflow/react";

import { nodeRegistry } from "@/registry";

import { RuntimeGraph } from "./RuntimeGraph";
import { RuntimeNode } from "./RuntimeNode";

export function buildRuntimeGraph (
    nodes: Node[],
    edges: Edge[]
) {
    const graph = new RuntimeGraph();

    for (const node of nodes) {
        const definition = nodeRegistry.get(
            node.data.type as string
        );

        if (!definition) continue;

        graph.addNode(
            new RuntimeNode(
                {
                    id: node.id,
                    type: definition.type,
                    config: (node.data.config as Record<string, unknown>) ?? {},
                },
                definition
            )
        );
    }

    for (const edge of edges) {
        graph.addEdge({
            source: edge.source,
            sourceHandle: edge.sourceHandle ?? null,
            target: edge.target,
            targetHandle: edge.targetHandle ?? null,
        });
    }

    return graph;
}