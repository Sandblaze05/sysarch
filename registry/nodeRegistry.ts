import { NodeDefinition, NodeCategory, PortDirection } from '@/types/node'

class NodeRegistry {
    private definitions = new Map<string, NodeDefinition>();

    register(definition: NodeDefinition) {
        if (this.definitions.has(definition.type)) {
            throw new Error(`Node "${definition.type}" is already registered.`);
        }

        this.definitions.set(definition.type, definition);
    }

    get(type: string) {
        return this.definitions.get(type);
    }

    getAll() {
        return Array.from(this.definitions.values());
    }

    getByCategory(category: NodeCategory) {
        return this.getAll().filter(
            (node) => node.category === category
        );
    }

    has(type: string) {
        return this.definitions.has(type);
    }

    /**
     * Returns true if the source node's output port can connect to the
     * target node's input port, based on their declared emits/accepts sets.
     *
     * A connection is valid when:
     *   - The source output port emits at least one EventType that the
     *     target input port accepts.
     *   - OR either side has no event constraints declared (permissive fallback).
     *
     */
    canConnect(
        sourceNodeType: string,
        sourceHandleId: string | null,
        targetNodeType: string,
        targetHandleId: string | null,
    ): boolean {

        const sourceDef = this.definitions.get(sourceNodeType);
        const targetDef = this.definitions.get(targetNodeType);

        // Unknown node type — allow (don't block unregistered nodes)
        if (!sourceDef || !targetDef) return true;

        // Find the specific output port on the source
        const outputPort = sourceHandleId
            ? sourceDef.outputs.find((p) => p.id === sourceHandleId)
            : sourceDef.outputs[0];

        // Find the specific input port on the target
        const inputPort = targetHandleId
            ? targetDef.inputs.find(
                (p) => p.id === targetHandleId && p.direction === PortDirection.INPUT,
              )
            : targetDef.inputs[0];

        // If either port is missing or has no event constraints, be permissive
        if (!outputPort || !inputPort) return true;
        if (!outputPort.emits?.length || !inputPort.accepts?.length) return true;

        // Core check: do the sets intersect?
        return outputPort.emits.some((event) => inputPort.accepts!.includes(event));
    }
}

export const nodeRegistry = new NodeRegistry();

export function registerNodes(definitions: NodeDefinition[]) {
    definitions.forEach((definition) => nodeRegistry.register(definition));
} 
