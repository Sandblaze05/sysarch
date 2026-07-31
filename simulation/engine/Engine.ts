import { RuntimeGraph } from "../runtime/RuntimeGraph";
import { EventQueue } from "./EventQueue";

export class Engine {
    readonly graph: RuntimeGraph;

    readonly queue = new EventQueue();

    tick = 0;

    constructor(graph: RuntimeGraph) {
        this.graph = graph;
    }

    start() {}
    step() {}
    stop() {}
}