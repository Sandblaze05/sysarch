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

    route(
        sourceId: string,
        intents: EventIntent[],
        currentTick: number,
        correlationId: string,
        ticksPerSecond = 60
    ): RoutedEvent[] {
        const routed: RoutedEvent[] = [];
        const outgoing = this.getOutgoing(sourceId);
        const sourceLatencyMs = Number(this.getNode(sourceId)?.instance.config.latency) || 0;
        const sourceLatencyTicks = Math.ceil((sourceLatencyMs / 1000) * ticksPerSecond);

        for (const intent of intents) {
            const edges = outgoing.filter(edge => {
                if (!intent.outputPort) return true;
                return edge.sourceHandle === intent.outputPort;
            });

            const routing = intent.routing ?? 'broadcast';
            const selectedEdges = routing === 'single'
                ? (intent.targetEdgeIndex !== undefined && edges.length > 0
                    ? [edges[intent.targetEdgeIndex % edges.length]]
                    : (edges.length > 0 ? [edges[0]] : []))
                : edges;

            for (const edge of selectedEdges) {
                const targetNode = this.getNode(edge.target);
                if (!targetNode) continue;

                const targetPort = targetNode.definition.inputs.find(p => p.id === edge.targetHandle);
                if (targetPort && !targetPort.accepts?.includes(intent.type)) continue;

                const tick = currentTick + (intent.delayTicks ?? sourceLatencyTicks);

                routed.push({
                    id: crypto.randomUUID(),
                    type: intent.type,
                    source: sourceId,
                    target: edge.target,
                    targetPort: edge.targetHandle ?? undefined,
                    payload: intent.payload,
                    correlationId,
                    tick,
                    sourceEdgeId: edge.id ?? `${edge.source}->${edge.target}`,
                });
            }
        }

        return routed;
    }

    routeReturn(
        targetId: string,
        intent: EventIntent,
        currentTick: number,
        correlationId: string,
        ticksPerSecond = 60
    ): RoutedEvent[] {
        const routed: RoutedEvent[] = [];
        const incoming = this.getIncoming(targetId);
        const targetLatencyMs = Number(this.getNode(targetId)?.instance.config.latency) || 0;
        const targetLatencyTicks = Math.ceil((targetLatencyMs / 1000) * ticksPerSecond);

        for (const edge of incoming) {
            const sourceNode = this.getNode(edge.source);
            if (!sourceNode) continue;

            const sourcePort = sourceNode.definition.inputs.find(p => p.id === edge.sourceHandle);
            if (sourcePort && !sourcePort.accepts?.includes(intent.type)) continue;

            const tick = currentTick + (intent.delayTicks ?? targetLatencyTicks);

            routed.push({
                id: crypto.randomUUID(),
                type: intent.type,
                source: targetId,
                target: edge.source,
                targetPort: edge.sourceHandle ?? undefined,
                payload: intent.payload,
                correlationId,
                tick,
                sourceEdgeId: edge.id ?? `${edge.source}->${edge.target}`,
            });
        }

        return routed;
    }

    routeToSource(
        event: RoutedEvent,
        intent: EventIntent,
        currentTick: number,
        ticksPerSecond = 60
    ): RoutedEvent[] {
        const sourceNode = this.getNode(event.source);
        if (!sourceNode) return [];

        const input = sourceNode.definition.inputs.find((port) =>
            !port.accepts || port.accepts.includes(intent.type)
        );
        if (!input) return [];

        const originalEdge = this.getIncoming(event.target).find((edge) => edge.source === event.source);
        const targetLatencyMs = Number(this.getNode(event.target)?.instance.config.latency) || 0;
        const latencyTicks = Math.max(1, Math.ceil(targetLatencyMs / 1000 * ticksPerSecond));

        return [{
            id: crypto.randomUUID(),
            type: intent.type,
            source: event.target,
            target: event.source,
            targetPort: input.id,
            payload: intent.payload,
            correlationId: event.correlationId,
            tick: currentTick + (intent.delayTicks ?? latencyTicks),
            sourceEdgeId: originalEdge?.id ?? `${event.source}->${event.target}`,
        }];
    }

    routeToNode(
        sourceId: string,
        targetId: string,
        intent: EventIntent,
        currentTick: number,
        correlationId: string,
        ticksPerSecond = 60
    ): RoutedEvent[] {
        const targetNode = this.getNode(targetId);
        if (!targetNode) return [];
        const targetPort = targetNode.definition.inputs.find((port) =>
            !port.accepts || port.accepts.includes(intent.type)
        );
        if (!targetPort) return [];

        const sourceLatencyMs = Number(this.getNode(sourceId)?.instance.config.latency) || 0;
        const latencyTicks = Math.max(1, Math.ceil(sourceLatencyMs / 1000 * ticksPerSecond));
        return [{
            id: crypto.randomUUID(),
            type: intent.type,
            source: sourceId,
            target: targetId,
            targetPort: targetPort.id,
            payload: intent.payload,
            correlationId,
            tick: currentTick + (intent.delayTicks ?? latencyTicks),
            sourceEdgeId: `${sourceId}->${targetId}`,
        }];
    }
}
