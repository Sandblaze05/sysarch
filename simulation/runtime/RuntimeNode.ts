import {
    NodeDefinition,
    NodeInstance
} from '@/types/node';

export class RuntimeNode {
    readonly instance: NodeInstance;
    readonly definition: NodeDefinition;

    state: Record<string, unknown>;

    constructor(
        instance: NodeInstance,
        definition: NodeDefinition
    ) {
        this.instance = instance;
        this.definition = definition;

        this.state = {};
    }
}