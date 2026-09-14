import { RuntimeGraph } from "../runtime/RuntimeGraph";
import { EventQueue } from "./EventQueue";
import { MetricsCollector } from "./MetricsCollector";
import {
    EventIntent,
    EventType,
    RoutedEvent,
    SimulationContext,
    SimulationStatus,
    TimelineEntry,
} from "@/types/node";

export interface EngineOptions {
    maxSteps?: number;
    maxTicks?: number;
    ticksPerSecond?: number;
}

export class Engine {
    readonly graph: RuntimeGraph;
    readonly metrics = new MetricsCollector();

    readonly queue = new EventQueue();
    readonly history: TimelineEntry[] = [];
    readonly logs: string[] = [];

    currentTick = 0;
    status: SimulationStatus = SimulationStatus.IDLE;

    private readonly maxSteps: number;
    private readonly maxTicks: number;
    private readonly ticksPerSecond: number;
    private eventCounter = 0;
    private playbackToken = 0;
    private readonly responseTargets = new Map<string, string>();

    constructor(graph: RuntimeGraph, options: EngineOptions = {}) {
        this.graph = graph;
        this.maxSteps = options.maxSteps ?? 10_000;
        this.maxTicks = options.maxTicks ?? 600;
        this.ticksPerSecond = options.ticksPerSecond ?? 60;
    }

    start(initialEvents: RoutedEvent[] = []) {
        this.reset();

        this.metrics.reset();
        this.queue.clear();
        this.history.length = 0;
        this.logs.length = 0;
        this.currentTick = 0;
        this.status = SimulationStatus.RUNNING;

        this.responseTargets.clear();
        initialEvents.forEach((event) => {
            if (this.graph.getNode(event.target)?.instance.type === 'client') {
                this.responseTargets.set(event.correlationId, event.target);
            }
            this.enqueue(event);
        });
    }

    step() {
        const wasPaused = this.status === SimulationStatus.PAUSED;
        const processed = this.tickOnce(true);
        if (wasPaused && processed) {
            this.status = SimulationStatus.PAUSED;
        } else if (this.status === SimulationStatus.FINISHED && processed) {
            this.status = SimulationStatus.PAUSED;
        }
        return processed;
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
        this.metrics.reset();
        this.queue.clear();
        this.history.length = 0;
        this.logs.length = 0;
        this.currentTick = 0;
        this.eventCounter = 0;
        this.responseTargets.clear();
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
            metrics: this.metrics.getAllNodeMetrics(),
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

    private tickOnce(manual = false) {
        if (this.status !== SimulationStatus.RUNNING && !(manual && this.status === SimulationStatus.PAUSED)) {
            return null;
        }

        const nextEvent = this.queue.pop();
        if (!nextEvent) {
            if (!manual) this.status = SimulationStatus.FINISHED;
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
        this.metrics.recordEvent();
        let returnedIntents: EventIntent[] = [];
        let eventStatus: 'processed' | 'error' = 'processed';

        try {
            returnedIntents = targetNode.process(nextEvent, context);
        } catch (error) {
            eventStatus = 'error';
            this.log(`Node ${targetNode.instance.id} threw an error: ${error instanceof Error ? error.message : String(error)}`);
        }

        const allIntents = [...returnedIntents, ...intents];
        if (nextEvent.type === EventType.ERROR || allIntents.some((intent) => intent.type === EventType.ERROR)) {
            eventStatus = 'error';
        }

        if (eventStatus === 'error') {
            this.metrics.increment(targetNode.instance.id, 'errorCount');
        }

        let routed = this.graph.route(
            targetNode.instance.id,
            allIntents,
            this.currentTick,
            nextEvent.correlationId,
            this.ticksPerSecond
        );

        if (routed.length === 0 && nextEvent.source !== 'user') {
            const returnIntents = allIntents.filter((intent) =>
                intent.type === EventType.HTTP_RESPONSE ||
                intent.type === EventType.DATABASE_RESPONSE ||
                intent.type === EventType.CACHE_HIT ||
                intent.type === EventType.CACHE_MISS ||
                intent.type === EventType.EXTERNAL_RESPONSE ||
                intent.type === EventType.ERROR
            );
            routed = returnIntents.flatMap((intent) => this.graph.routeToSource(
                nextEvent,
                intent,
                this.currentTick,
                this.ticksPerSecond
            ));

            if (routed.length === 0) {
                const responseTarget = this.responseTargets.get(nextEvent.correlationId);
                if (responseTarget) {
                    routed = returnIntents.flatMap((intent) => this.graph.routeToNode(
                        targetNode.instance.id,
                        responseTarget,
                        intent,
                        this.currentTick,
                        nextEvent.correlationId,
                        this.ticksPerSecond
                    ));
                }
            }
        }

        this.history.push({
            tick: this.currentTick,
            nodeId: targetNode.instance.id,
            event: nextEvent,
            outputs: allIntents,
            status: eventStatus,
        });

        for (const routedEvent of routed) {
            this.enqueue(routedEvent);
        }

        this.scheduleNextClientRequest(nextEvent, targetNode.instance.id);

        if (this.queue.isEmpty() && !manual) {
            this.status = SimulationStatus.FINISHED;
        }

        return nextEvent;
    }

    private scheduleNextClientRequest(event: RoutedEvent, nodeId: string) {
        const node = this.graph.getNode(nodeId);
        if (!node || node.instance.type !== "client" || event.source !== "user") return;

        const requestsPerSecond = Number(node.instance.config.requestsPerSecond) || 1;
        const requestInterval = Math.max(
            1,
            Math.round(this.ticksPerSecond / requestsPerSecond)
        );
        const nextTick = this.currentTick + requestInterval;

        if (nextTick > this.maxTicks) return;

        this.enqueue({
            id: this.createEventId(),
            type: EventType.HTTP_REQUEST,
            source: "user",
            target: nodeId,
            payload: event.payload,
            correlationId: event.correlationId,
            tick: nextTick,
        });
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
            metrics: {
                record: (nodeId, key, value) => this.metrics.record(nodeId, key, value),
                increment: (nodeId, key, delta) => this.metrics.increment(nodeId, key, delta),
                recordEvent: () => this.metrics.recordEvent(),
            }
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

    getMetrics() {
        return this.metrics.getAllNodeMetrics();
    }
}
