'use client';

import React, { useMemo, useState } from 'react';
import { TimelineEntry } from '@/types/node';
import { useFlowStore } from '@/store/flowStore';
import { ChevronDown, ChevronRight, Filter } from 'lucide-react';

const formatTick = (tick: number) => `Tick ${tick}`;

const STATUS_COLORS: Record<string, string> = {
  processed: 'text-emerald-400',
  skipped: 'text-amber-400',
  error: 'text-rose-400',
};

const Timeline: React.FC = () => {
  const timeline = useFlowStore((state) => state.simulationTimeline);
  const nodes = useFlowStore((state) => state.nodes);
  const simulationStatus = useFlowStore((state) => state.simulationStatus);
  const setSelectedNodeId = useFlowStore((state) => state.setSelectedNodeId);
  
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedTick, setSelectedTick] = useState<number | null>(null);
  const [highlightedCorrelationId, setHighlightedCorrelationId] = useState<string | null>(null);
  
  const [statusFilter, setStatusFilter] = useState<'All' | 'processed' | 'error' | 'skipped'>('All');
  const [typeFilters, setTypeFilters] = useState<Set<string>>(new Set());

  const availableTypes = useMemo(() => {
    return Array.from(new Set(timeline.map((e) => e.event.type)));
  }, [timeline]);

  const toggleTypeFilter = (type: string) => {
    setTypeFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const filteredTimeline = useMemo(() => {
    return timeline.filter((entry) => {
      if (statusFilter !== 'All' && entry.status !== statusFilter) return false;
      if (typeFilters.size > 0 && !typeFilters.has(entry.event.type)) return false;
      return true;
    });
  }, [timeline, statusFilter, typeFilters]);

  const grouped = useMemo(() => {
    const map = new Map<number, TimelineEntry[]>();
    for (const entry of filteredTimeline) {
      const arr = map.get(entry.tick) ?? [];
      arr.push(entry);
      map.set(entry.tick, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [filteredTimeline]);

  const handleEntryClick = (entry: TimelineEntry) => {
    setSelectedTick(entry.tick);
    setSelectedNodeId(entry.nodeId);
    setHighlightedCorrelationId((prev) => 
      prev === entry.event.correlationId ? null : entry.event.correlationId
    );
  };

  const getNodeLabel = (nodeId: string) => {
    if (nodeId === 'user') return 'User';
    const node = nodes.find((candidate) => candidate.id === nodeId);
    return typeof node?.data?.label === 'string' ? node.data.label : nodeId;
  };

  const isRunning = simulationStatus === 'running';

  const getEventColor = (type: string) => {
    if (type.includes('http')) return 'bg-cyan-500 text-cyan-900';
    if (type.includes('cache')) return 'bg-yellow-500 text-yellow-900';
    if (type.includes('database')) return 'bg-blue-500 text-blue-900';
    if (type.includes('queue')) return 'bg-fuchsia-500 text-fuchsia-900';
    if (type.includes('error')) return 'bg-red-500 text-red-900';
    return 'bg-neutral-500 text-neutral-900';
  };

  const headerStats = useMemo(() => {
    let http = 0, db = 0, errors = 0;
    for (const e of timeline) {
      if (e.event.type.includes('http')) http++;
      if (e.event.type.includes('database')) db++;
      if (e.status === 'error') errors++;
    }
    const parts = [];
    if (http > 0) parts.push(`${http} HTTP`);
    if (db > 0) parts.push(`${db} DB`);
    if (errors > 0) parts.push(`${errors} errors`);
    return `${timeline.length} events${parts.length > 0 ? ` (${parts.join(', ')})` : ''}`;
  }, [timeline]);

  return (
    <div className="fixed bottom-6 left-1/2 translate-x-[-50%] z-50 w-[420px] max-h-[60vh] bg-black/90 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          {isRunning && (
            <div className="w-3.5 h-3.5 rounded-full bg-sky-400 animate-pulse" />
          )}
          <span className="text-xs font-mono text-neutral-400 font-semibold tracking-wide">Timeline</span>
          <span className="text-[10px] font-mono text-neutral-500 truncate max-w-[200px]">
            {headerStats}
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
        <div className="flex flex-col overflow-hidden max-h-[calc(60vh-48px)]">
          {/* Filters */}
          <div className="px-3 py-2 border-b border-white/5 bg-neutral-900/40 shrink-0 space-y-2">
            <div className="flex items-center gap-2">
              <Filter className="w-3 h-3 text-neutral-500" />
              <div className="flex gap-1 bg-black/40 p-0.5 rounded-md">
                {['All', 'processed', 'error', 'skipped'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s as 'All' | 'processed' | 'error' | 'skipped')}
                    className={`px-2 py-0.5 text-[9px] font-mono rounded transition-colors ${
                      statusFilter === s ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            {availableTypes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {availableTypes.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleTypeFilter(t)}
                    className={`px-1.5 py-0.5 text-[9px] font-mono rounded border transition-colors ${
                      typeFilters.has(t) 
                        ? 'bg-sky-500/20 border-sky-500/30 text-sky-300' 
                        : 'bg-black/40 border-white/5 text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    {t.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
            {grouped.length === 0 ? (
              <div className="text-center py-6 text-neutral-500 text-xs font-mono">
                {timeline.length === 0 ? 'Run a simulation to see the timeline.' : 'No events match the filters.'}
              </div>
            ) : (
              grouped.map(([tick, entries]) => (
                <div key={tick} className="space-y-1">
                  <div className="text-[10px] font-mono text-neutral-500 px-2 pt-1 pb-0.5">
                    {formatTick(tick)}
                  </div>
                  {entries.map((entry, idx) => {
                    const eventType = entry.event.type.replace(/_/g, ' ');
                    const sourceLabel = getNodeLabel(entry.event.source);
                    const targetLabel = getNodeLabel(entry.nodeId);
                    
                    const isSelected = selectedTick === tick && useFlowStore.getState().selectedNodeId === entry.nodeId;
                    const isHighlighted = highlightedCorrelationId === entry.event.correlationId;

                    let bgClass = 'bg-neutral-900/60 border-white/5 hover:border-white/20';
                    let borderClass = '';
                    
                    if (isSelected) {
                      bgClass = 'bg-white/10 border-white/20';
                    } else if (isHighlighted) {
                      bgClass = 'bg-sky-500/10';
                      borderClass = 'border-l-2 border-l-sky-400';
                    }

                    return (
                      <div
                        key={`${entry.event.id}-${idx}`}
                        onClick={() => handleEntryClick(entry)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[10px] font-mono cursor-pointer transition-all ${bgClass} ${borderClass}`}
                      >
                        <div className={`w-2 h-2 rounded-full shrink-0 ${getEventColor(entry.event.type)}`} />
                        <span className={`shrink-0 ${STATUS_COLORS[entry.status] || 'text-neutral-400'}`}>
                          {entry.status === 'processed' ? '✓' : entry.status === 'skipped' ? '⊘' : '✗'}
                        </span>
                        <span className="text-neutral-400 shrink-0">
                          {sourceLabel} → <span className="text-neutral-200">{targetLabel}</span>
                        </span>
                        <span className="text-neutral-500 truncate flex-1 text-right">
                          {eventType}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Timeline;
