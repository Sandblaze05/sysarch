import { RuntimeGraph } from "../runtime/RuntimeGraph";
import { EventQueue } from "./EventQueue";
import {
    EventIntent,
    RoutedEvent,
    SimulationContext,
    SimulationStatus,
    TimelineEntry,
} from "@/types/node";

export interface EngineOptions {
    maxSteps?: number;
}

export class Engine {
    readonly graph: RuntimeGraph;

    readonly queue = new EventQueue();
    readonly history: TimelineEntry[] = [];
    readonly logs: string[] = [];

    currentTick = 0;
    status: SimulationStatus = SimulationStatus.IDLE;

    private readonly maxSteps: number;
    private eventCounter = 0;
    private playbackToken = 0;

    constructor(graph: RuntimeGraph, options: EngineOptions = {}) {
        this.graph = graph;
        this.maxSteps = options.maxSteps ?? 10_000;
    }

    start(initialEvents: RoutedEvent[] = []) {
        this.reset();

        this.queue.clear();
        this.history.length = 0;
        this.logs.length = 0;
        this.currentTick = 0;
        this.status = SimulationStatus.RUNNING;

        initialEvents.forEach((event) => this.enqueue(event));
    }

    step() {
        return this.tickOnce();
    }

    tick() {
        return this.tickOnce();
    }

    async play(ticksPerSecond = 60, onTick?: (processedEvent: RoutedEvent | null) => void) {
        const interval = Math.max(1, Math.floor(1000 / Math.max(1, ticksPerSecond)));
        const token = ++this.playbackToken;

        if (this.status === SimulationStatus.IDLE || this.status === SimulationStatus.PAUSED) {
            this.status = SimulationStatus.RUNNING;
        }

        let steps = 0;

        while (token === this.playbackToken && this.status === SimulationStatus.RUNNING) {
            const startedAt = Date.now();
            const processedEvent = this.tickOnce();
            onTick?.(processedEvent);

            if (!processedEvent || this.status !== SimulationStatus.RUNNING) {
                break;
            }

            steps += 1;
            if (steps >= this.maxSteps) {
                this.status = SimulationStatus.ERROR;
                this.log(
                    `Simulation stopped after reaching the max step limit of ${this.maxSteps}.`
                );
                break;
            }

            const elapsed = Date.now() - startedAt;
            const remaining = interval - elapsed;
            if (remaining > 0) {
                await new Promise((resolve) => setTimeout(resolve, remaining));
            }
        }

        if (token === this.playbackToken && this.status === SimulationStatus.RUNNING && this.queue.isEmpty()) {
            this.status = SimulationStatus.FINISHED;
        }
    }

    pause() {
        this.playbackToken += 1;

        if (this.status === SimulationStatus.RUNNING) {
            this.status = SimulationStatus.PAUSED;
        }
    }

    reset() {
        this.pause();
        this.queue.clear();
        this.history.length = 0;
        this.logs.length = 0;
        this.currentTick = 0;
        this.eventCounter = 0;
        this.status = SimulationStatus.IDLE;
    }

    run(initialEvents: RoutedEvent[] = []) {
        this.start(initialEvents);

        let steps = 0;
        while (this.status === SimulationStatus.RUNNING && steps < this.maxSteps) {
            const processed = this.tickOnce();
            if (!processed) break;
            steps += 1;
        }

        if (steps >= this.maxSteps && this.status === SimulationStatus.RUNNING) {
            this.status = SimulationStatus.ERROR;
            this.log(
                `Simulation stopped after reaching the max step limit of ${this.maxSteps}.`
            );
        }

        return {
            status: this.status,
            tick: this.currentTick,
            processedEvents: this.history.length,
            queuedEvents: this.queue.size(),
            logs: [...this.logs],
            timeline: [...this.history],
        };
    }

    stop() {
        this.pause();
        this.status = SimulationStatus.FINISHED;
    }

    enqueue(event: RoutedEvent) {
        this.queue.push(this.normalizeEvent(event));
        if (this.status !== SimulationStatus.RUNNING) {
            this.status = SimulationStatus.RUNNING;
        }
    }

    private tickOnce() {
        if (this.status !== SimulationStatus.RUNNING) {
            return null;
        }

        const nextEvent = this.queue.pop();
        if (!nextEvent) {
            this.status = SimulationStatus.FINISHED;
            return null;
        }

        this.currentTick = nextEvent.tick;

        const targetNode = this.graph.getNode(nextEvent.target);
        if (!targetNode) {
            this.log(
                `No runtime node found for target "${nextEvent.target}" while processing event "${nextEvent.id}".`
            );
            if (this.queue.isEmpty()) {
                this.status = SimulationStatus.FINISHED;
            }
            this.history.push({
                tick: this.currentTick,
                nodeId: nextEvent.target,
                event: nextEvent,
                outputs: [],
                status: 'skipped',
            });
            return nextEvent;
        }

        const { context, intents } = this.createContext(nextEvent);
        const returnedIntents = targetNode.process(nextEvent, context);
        const allIntents = [...returnedIntents, ...intents];

        const routed = this.graph.route(
            targetNode.instance.id,
            allIntents,
            this.currentTick,
            nextEvent.correlationId
        );

        this.history.push({
            tick: this.currentTick,
            nodeId: targetNode.instance.id,
            event: nextEvent,
            outputs: allIntents,
            status: 'processed',
        });

        for (const routedEvent of routed) {
            this.enqueue(routedEvent);
        }

        if (this.queue.isEmpty()) {
            this.status = SimulationStatus.FINISHED;
        }

        return nextEvent;
    }

    private createContext(currentEvent: RoutedEvent): { context: SimulationContext; intents: EventIntent[] } {
        const intents: EventIntent[] = [];
        const context: SimulationContext = {
            currentTick: currentEvent.tick,
            emit: (intent: EventIntent) => {
                intents.push(intent);
            },
            log: (message) => {
                this.log(message);
            },
        };
        return { context, intents };
    }

    private normalizeEvent(event: RoutedEvent) {
        return {
            ...event,
            id: event.id || this.createEventId(),
            tick: Number.isFinite(event.tick) ? event.tick : this.currentTick,
            targetPort: event.targetPort ?? undefined,
        };
    }

    private createEventId() {
        if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
            return crypto.randomUUID();
        }

        this.eventCounter += 1;
        return `event-${this.currentTick}-${this.eventCounter}`;
    }

    private log(message: string) {
        this.logs.push(message);
    }
}
