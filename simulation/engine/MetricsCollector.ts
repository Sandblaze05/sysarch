import { MetricsSample, NodeMetrics } from "@/types/node";

/**
 * Collects per-node metrics during a simulation run.
 *
 * Nodes call `increment()` for counters (requestCount, errors, …) and
 * `record()` for gauges (connectionPoolUtilization, hitRate, …).
 *
 * The collector also stores a time-series so the UI can render sparklines.
 */
export class MetricsCollector {
    /** nodeId → metricKey → current value */
    private counters = new Map<string, Map<string, number>>();
    /** nodeId → metricKey → sample[] */
    private series = new Map<string, Map<string, MetricsSample[]>>();

    // Global aggregates
    private _totalEvents = 0;
    private _totalErrors = 0;

    // ── Mutation API (called from simulate()) ────────────

    increment(nodeId: string, key: string, delta = 1): void {
        const node = this.getOrCreateNode(nodeId);
        const prev = node.get(key) ?? 0;
        node.set(key, prev + delta);

        if (key === "errorCount") this._totalErrors += delta;
    }

    recordEvent(): void {
        this._totalEvents += 1;
    }

    record(nodeId: string, key: string, value: number): void {
        const node = this.getOrCreateNode(nodeId);
        node.set(key, value);
    }

    /** Append a data-point to the time-series for sparklines. */
    sample(nodeId: string, key: string, tick: number, value: number): void {
        let nodeSeries = this.series.get(nodeId);
        if (!nodeSeries) {
            nodeSeries = new Map();
            this.series.set(nodeId, nodeSeries);
        }
        let arr = nodeSeries.get(key);
        if (!arr) {
            arr = [];
            nodeSeries.set(key, arr);
        }
        // Keep last 200 samples max per key to avoid memory bloat
        if (arr.length >= 200) arr.shift();
        arr.push({ tick, value });
    }

    // ── Query API (called from store / UI) ───────────────

    getNodeMetrics(nodeId: string): NodeMetrics {
        const node = this.counters.get(nodeId);
        if (!node) return {};
        return Object.fromEntries(node.entries());
    }

    getAllNodeMetrics(): Record<string, NodeMetrics> {
        const result: Record<string, NodeMetrics> = {};
        for (const [nodeId, map] of this.counters) {
            result[nodeId] = Object.fromEntries(map.entries());
        }
        return result;
    }

    getTimeSeries(nodeId: string, key: string): MetricsSample[] {
        return this.series.get(nodeId)?.get(key) ?? [];
    }

    getGlobalMetrics() {
        return {
            totalEvents: this._totalEvents,
            totalErrors: this._totalErrors,
        };
    }

    // ── Lifecycle ────────────────────────────────────────

    reset(): void {
        this.counters.clear();
        this.series.clear();
        this._totalEvents = 0;
        this._totalErrors = 0;
    }

    /** Serialise for snapshot support. */
    snapshot(): {
        counters: Record<string, Record<string, number>>;
        series: Record<string, Record<string, MetricsSample[]>>;
        totalEvents: number;
        totalErrors: number;
    } {
        const counters: Record<string, Record<string, number>> = {};
        for (const [nid, m] of this.counters) {
            counters[nid] = Object.fromEntries(m.entries());
        }
        const series: Record<string, Record<string, MetricsSample[]>> = {};
        for (const [nid, m] of this.series) {
            const inner: Record<string, MetricsSample[]> = {};
            for (const [k, v] of m) inner[k] = [...v];
            series[nid] = inner;
        }
        return {
            counters,
            series,
            totalEvents: this._totalEvents,
            totalErrors: this._totalErrors,
        };
    }

    /** Restore from a snapshot. */
    loadSnapshot(snap: ReturnType<MetricsCollector["snapshot"]>): void {
        this.reset();
        for (const [nid, obj] of Object.entries(snap.counters)) {
            this.counters.set(nid, new Map(Object.entries(obj)));
        }
        for (const [nid, obj] of Object.entries(snap.series)) {
            const inner = new Map<string, MetricsSample[]>();
            for (const [k, v] of Object.entries(obj)) inner.set(k, [...v]);
            this.series.set(nid, inner);
        }
        this._totalEvents = snap.totalEvents;
        this._totalErrors = snap.totalErrors;
    }

    // ── Private ──────────────────────────────────────────

    private getOrCreateNode(nodeId: string): Map<string, number> {
        let m = this.counters.get(nodeId);
        if (!m) {
            m = new Map();
            this.counters.set(nodeId, m);
        }
        return m;
    }
}
