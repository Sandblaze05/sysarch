import { NodeDefinition, NodeCategory } from '@/types/node'

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
}

export const nodeRegistry = new NodeRegistry();

export function registerNodes(definitions: NodeDefinition[]) {
    definitions.forEach((definition) => nodeRegistry.register(definition));
} 
