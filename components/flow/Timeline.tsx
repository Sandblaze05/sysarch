'use client';

import React, { useMemo, useState } from 'react';
import { TimelineEntry } from '@/types/node';
import { useFlowStore } from '@/store/flowStore';
import { ChevronDown, ChevronRight } from 'lucide-react';

const formatTick = (tick: number) => `Tick ${tick}`;

const STATUS_COLORS: Record<string, string> = {
  processed: 'text-emerald-400',
  skipped: 'text-amber-400',
  error: 'text-rose-400',
};

const STATUS_BG: Record<string, string> = {
  processed: 'bg-emerald-500/10 border-emerald-500/20',
  skipped: 'bg-amber-500/10 border-amber-500/20',
  error: 'bg-rose-500/10 border-rose-500/20',
};

const Timeline: React.FC = () => {
  const timeline = useFlowStore((state) => state.simulationTimeline);
  const simulationStatus = useFlowStore((state) => state.simulationStatus);
  const setSelectedNodeId = useFlowStore((state) => state.setSelectedNodeId);
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedTick, setSelectedTick] = useState<number | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<number, TimelineEntry[]>();
    for (const entry of timeline) {
      const arr = map.get(entry.tick) ?? [];
      arr.push(entry);
      map.set(entry.tick, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [timeline]);

  const handleEntryClick = (entry: TimelineEntry) => {
    setSelectedTick(entry.tick);
    setSelectedNodeId(entry.nodeId);
  };

  const isRunning = simulationStatus === 'running';

  return (
    <div className="fixed bottom-6 left-1/2 translate-x-[-50%] z-50 w-[340px] max-h-[60vh] bg-black/90 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          {isRunning && (
            <div className="w-3.5 h-3.5 rounded-full bg-sky-400 animate-pulse" />
          )}
          <span className="text-xs font-mono text-neutral-400 font-semibold tracking-wide">Timeline</span>
          <span className="text-[10px] font-mono text-neutral-500">
            {timeline.length} events
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="p-1 rounded-md text-neutral-400 hover:text-white transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="overflow-y-auto max-h-[calc(60vh-48px)] p-2 space-y-1 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
          {grouped.length === 0 ? (
            <div className="text-center py-6 text-neutral-500 text-xs font-mono">
              Run a simulation to see the timeline.
            </div>
          ) : (
            grouped.map(([tick, entries]) => (
              <div key={tick} className="space-y-1">
                <div className="text-[10px] font-mono text-neutral-500 px-2 pt-1 pb-0.5">
                  {formatTick(tick)}
                </div>
                {entries.map((entry, idx) => {
                  const eventType = entry.event.type.replace(/_/g, ' ');
                  const nodeId = entry.nodeId.length > 20
                    ? `${entry.nodeId.slice(0, 10)}...${entry.nodeId.slice(-6)}`
                    : entry.nodeId;
                  const isSelected = selectedTick === tick;

                  return (
                    <div
                      key={`${entry.event.id}-${idx}`}
                      onClick={() => handleEntryClick(entry)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[11px] font-mono cursor-pointer transition-all ${
                        isSelected
                          ? 'border-sky-500/40 bg-sky-500/10'
                          : STATUS_BG[entry.status] || 'bg-neutral-900/60 border-white/5 hover:border-white/20'
                      }`}
                    >
                      <span className={`shrink-0 ${STATUS_COLORS[entry.status] || 'text-neutral-400'}`}>
                        {entry.status === 'processed' ? '→' : entry.status === 'skipped' ? '⊘' : '!'}
                      </span>
                      <span className="text-neutral-300 truncate min-w-0 flex-1">
                        {nodeId}
                      </span>
                      <span className="text-neutral-500 truncate max-w-[100px]">
                        {eventType}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Timeline;
