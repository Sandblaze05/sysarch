import { RuntimeEdge, EventIntent, RoutedEvent } from "@/types/node";
import { RuntimeNode } from "./RuntimeNode";

export class RuntimeGraph {
    readonly nodes = new Map<string, RuntimeNode>();

    readonly outgoing = new Map<string, RuntimeEdge[]>();
    readonly incoming = new Map<string, RuntimeEdge[]>();

    addNode(node: RuntimeNode) {
        this.nodes.set(node.instance.id, node);
        this.outgoing.set(node.instance.id, []);
        this.incoming.set(node.instance.id, []);
    }

    addEdge(edge: RuntimeEdge) {
        this.outgoing.get(edge.source)?.push(edge);
        this.incoming.get(edge.target)?.push(edge);
    }

    getNode(id: string) {
        return this.nodes.get(id);
    }

    getOutgoing(id: string) {
        return this.outgoing.get(id) ?? [];
    }

    getIncoming(id: string) {
        return this.incoming.get(id) ?? [];
    }

    route(sourceId: string, intents: EventIntent[], currentTick: number, correlationId: string): RoutedEvent[] {
        const routed: RoutedEvent[] = [];
        const outgoing = this.getOutgoing(sourceId);

        for (const intent of intents) {
            const edges = outgoing.filter(edge => {
                if (!intent.outputPort) return true;
                return edge.sourceHandle === intent.outputPort;
            });

            for (const edge of edges) {
                const targetNode = this.getNode(edge.target);
                if (!targetNode) continue;

                const targetPort = targetNode.definition.inputs.find(p => p.id === edge.targetHandle);
                if (targetPort && !targetPort.accepts?.includes(intent.type)) continue;

                const tick = currentTick + (intent.delayTicks ?? 0);

                routed.push({
                    id: crypto.randomUUID(),
                    type: intent.type,
                    source: sourceId,
                    target: edge.target,
                    targetPort: edge.targetHandle ?? undefined,
                    payload: intent.payload,
                    correlationId,
                    tick,
                });
            }
        }

        return routed;
    }
}
