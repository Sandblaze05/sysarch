import {
    NodeDefinition,
    NodeInstance,
    RoutedEvent,
    SimulationContext,
    EventIntent,
    RuntimeState,
} from '@/types/node';

export class RuntimeNode {
    readonly instance: NodeInstance;
    readonly definition: NodeDefinition;
    state: RuntimeState;

    constructor(
        instance: NodeInstance,
        definition: NodeDefinition
    ) {
        this.instance = instance;
        this.definition = definition;
        this.state = {};
    }

    process(event: RoutedEvent, context: SimulationContext): EventIntent[] {
        return this.definition.simulate(this, event, context, this.state);
    }
}
