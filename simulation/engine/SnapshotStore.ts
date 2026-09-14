import { MetricsCollector } from "./MetricsCollector";
import { RoutedEvent } from "@/types/node";

/** Serialisable snapshot of the entire engine state at a point in time. */
export interface EngineSnapshot {
    tick: number;
    /** Deep copy of every RuntimeNode's mutable state. */
    nodeStates: Record<string, Record<string, unknown>>;
    /** Events still in the queue at snapshot time. */
    queuedEvents: RoutedEvent[];
    /** Metrics collector snapshot. */
    metricsSnapshot: ReturnType<MetricsCollector["snapshot"]>;
    /** Number of events processed up to this snapshot. */
    processedCount: number;
}

/**
 * Stores periodic snapshots of engine state so the simulation can be
 * rewound or scrubbed to any point in the past.
 *
 * Usage:
 *   - Call `maybeTake()` every tick — it auto-captures every N ticks.
 *   - Call `nearest(tick)` to find the closest snapshot ≤ the target tick.
 *   - Call `clear()` on simulation reset.
 */
export class SnapshotStore {
    private snapshots: EngineSnapshot[] = [];
    private readonly interval: number;

    /**
     * @param interval  Take a snapshot every `interval` ticks (default 10).
     */
    constructor(interval = 10) {
        this.interval = interval;
    }

    /** Conditionally takes a snapshot if `tick` falls on the interval boundary. */
    maybeTake(
        tick: number,
        nodeStates: Record<string, Record<string, unknown>>,
        queuedEvents: RoutedEvent[],
        metrics: MetricsCollector,
        processedCount: number,
    ): void {
        if (tick % this.interval !== 0) return;

        // Don't duplicate if we already snapped this tick
        if (this.snapshots.length > 0 && this.snapshots[this.snapshots.length - 1].tick === tick) {
            return;
        }

        this.snapshots.push({
            tick,
            nodeStates: structuredClone(nodeStates),
            queuedEvents: structuredClone(queuedEvents),
            metricsSnapshot: metrics.snapshot(),
            processedCount,
        });
    }

    /** Returns the snapshot with the highest tick ≤ `targetTick`, or null. */
    nearest(targetTick: number): EngineSnapshot | null {
        let best: EngineSnapshot | null = null;
        for (const snap of this.snapshots) {
            if (snap.tick <= targetTick) {
                best = snap;
            } else {
                break; // snapshots are ordered by tick
            }
        }
        return best;
    }

    /** Returns all snapshots (for debugging / timeline display). */
    getAll(): readonly EngineSnapshot[] {
        return this.snapshots;
    }

    /** Number of stored snapshots. */
    get size(): number {
        return this.snapshots.length;
    }

    /** Clear all snapshots. */
    clear(): void {
        this.snapshots.length = 0;
    }
}
