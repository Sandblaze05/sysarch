'use client'

import React, { useEffect, useRef, useMemo, useState } from 'react';
import gsap from 'gsap';
import { useFlowStore } from '@/store/flowStore';
import { nodeRegistry } from '@/registry';
import { ConfigField, SimulationStatus } from '@/types/node';
import { CATEGORY_META, DEFAULT_CATEGORY_META } from '@/constants/categoryMeta';
import {
  Sliders,
  X,
  ChevronDown,
  Trash2,
  Code2,
  Check,
  Activity,
} from 'lucide-react';


const formatLabel = (str: string) => {
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

type TabId = 'config' | 'runtime';

const Inspector: React.FC = () => {
  const nodes = useFlowStore((state) => state.nodes);
  const selectedNodeId = useFlowStore((state) => state.selectedNodeId);
  const setSelectedNodeId = useFlowStore((state) => state.setSelectedNodeId);
  const updateNodeConfig = useFlowStore((state) => state.updateNodeConfig);
  const setNodes = useFlowStore((state) => state.setNodes);
  const simulationStatus = useFlowStore((state) => state.simulationStatus);
  const simulationTimeline = useFlowStore((state) => state.simulationTimeline);
  const activeNodeId = useFlowStore((state) => state.activeNodeId);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('config');

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return nodes.find((n) => n.selected) || null;
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  const nodeType = (selectedNode?.data?.type as string) || selectedNode?.type;
  const definition = useMemo(() => (nodeType ? nodeRegistry.get(nodeType) : null), [nodeType]);

  const nodeConfig = useMemo(() => {
    if (!selectedNode) return {};
    const config = (selectedNode.data?.config as Record<string, unknown>) || {};
    if (definition?.config) {
      const merged = { ...config };
      definition.config.forEach((field) => {
        if (merged[field.key] === undefined) {
          merged[field.key] = field.defaultValue;
        }
      });
      return merged;
    }
    return config;
  }, [selectedNode, definition]);

  const processedEvents = useMemo(() => {
    if (!selectedNode) return 0;
    return simulationTimeline.filter(e => e.nodeId === selectedNode.id).length;
  }, [simulationTimeline, selectedNode]);

  const nodeStatus = useMemo(() => {
    if (!selectedNode) return 'idle';
    if (activeNodeId === selectedNode.id && simulationStatus === SimulationStatus.RUNNING) return 'processing';
    if (simulationStatus === SimulationStatus.FINISHED) return 'finished';
    return 'waiting';
  }, [activeNodeId, simulationStatus, selectedNode]);

  const lastEventType = useMemo(() => {
    if (!selectedNode) return null;
    const entries = simulationTimeline.filter(e => e.nodeId === selectedNode.id);
    if (entries.length === 0) return null;
    return entries[entries.length - 1].event.type.replace(/_/g, ' ');
  }, [simulationTimeline, selectedNode]);

  useEffect(() => {
    if (!panelRef.current) return;
    if (selectedNode) {
      gsap.to(panelRef.current, {
        x: 0,
        opacity: 1,
        pointerEvents: 'auto',
        duration: 0.45,
        ease: 'power3.out',
        overwrite: 'auto',
      });
    } else {
      gsap.to(panelRef.current, {
        x: 320,
        opacity: 0,
        pointerEvents: 'none',
        duration: 0.45,
        ease: 'power3.out',
        overwrite: 'auto',
      });
    }
  }, [selectedNode]);

  const handleDeleteNode = () => {
    if (!selectedNode) return;
    setNodes(nodes.filter((n) => n.id !== selectedNode.id));
    setSelectedNodeId(null);
  };

  const handleClose = () => {
    setNodes(useFlowStore.getState().nodes.map((n) => ({ ...n, selected: false })));
    setSelectedNodeId(null);
  };

  if (!selectedNode && !panelRef.current) return null;

  const categoryStyle =
    (definition?.category && CATEGORY_META[definition.category]) || DEFAULT_CATEGORY_META;

  const IconComponent = definition?.icon || DEFAULT_CATEGORY_META.icon;

  const declarativeState = {
    definition: definition?.type || nodeType || 'unknown',
    config: nodeConfig,
  };

  return (
    <div
      ref={panelRef}
    style={{ transform: 'translateX(320px)', opacity: 0, pointerEvents: 'none' }}
    className="fixed right-4 top-1/2 bottom-48 w-72 translate-y-[-50%] h-100 overflow-y-auto z-50 border-2 border-white/20 bg-black/80 backdrop-blur-xl rounded-3xl flex flex-col shadow-2xl text-white select-none transition-shadow duration-300"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-0 px-4 pt-4 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`p-2 rounded-xl border shrink-0 ${categoryStyle.badgeBg} ${categoryStyle.subtleBorder}`}>
            <IconComponent className={`w-4 h-4 ${categoryStyle.color}`} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-neutral-100 truncate font-sans tracking-wide">
              {definition?.label || (typeof selectedNode?.data?.label === 'string' ? selectedNode.data.label : String(nodeType || 'Node Inspector'))}
            </h3>
            {definition?.category && (
              <span className={`text-[10px] font-mono uppercase tracking-wider ${categoryStyle.color}`}>
                {definition.category}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            title="Delete Node"
            onClick={handleDeleteNode}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Close Inspector"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('config')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-mono font-semibold tracking-wide transition-colors ${
            activeTab === 'config'
              ? 'text-sky-400 border-b-2 border-sky-400'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Configuration
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('runtime')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-mono font-semibold tracking-wide transition-colors ${
            activeTab === 'runtime'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Runtime
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
        {activeTab === 'config' && (
          <>
            {definition?.description && (
              <p className="text-xs text-neutral-400 mb-4 px-1 leading-relaxed shrink-0">
                {definition.description}
              </p>
            )}

            <div className="space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-neutral-300 mb-2">
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                <span>Configuration</span>
              </div>

              {definition?.config && definition.config.length > 0 ? (
                definition.config.map((field: ConfigField) => {
                  const currentValue = nodeConfig[field.key] ?? field.defaultValue;

                  return (
                    <div key={field.key} className="space-y-1.5 bg-neutral-900/60 p-2.5 rounded-xl border border-white/5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-neutral-300 font-sans">
                          {field.label}
                        </label>
                        <span className="text-[10px] font-mono text-neutral-500">{field.key}</span>
                      </div>

                      {field.type === 'select' && (
                        <div className="relative">
                          <select
                            value={String(currentValue)}
                            onChange={(e) => updateNodeConfig(selectedNode!.id, field.key, e.target.value)}
                            className="w-full appearance-none bg-neutral-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono transition-all cursor-pointer"
                          >
                            {field.options?.map((opt) => (
                              <option key={opt} value={opt} className="bg-neutral-900 text-neutral-200">
                                {formatLabel(opt)}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      )}

                      {field.type === 'number' && (
                        <input
                          type="number"
                          min={field.min}
                          max={field.max}
                          value={Number(currentValue)}
                          onChange={(e) => updateNodeConfig(selectedNode!.id, field.key, Number(e.target.value))}
                          className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono transition-all"
                        />
                      )}

                      {field.type === 'text' && (
                        <input
                          type="text"
                          value={String(currentValue || '')}
                          onChange={(e) => updateNodeConfig(selectedNode!.id, field.key, e.target.value)}
                          className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono transition-all"
                        />
                      )}

                      {field.type === 'boolean' && (
                        <button
                          type="button"
                          onClick={() => updateNodeConfig(selectedNode!.id, field.key, !currentValue)}
                          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                            currentValue
                              ? 'bg-sky-500/10 border-sky-500/40 text-sky-300'
                              : 'bg-neutral-950 border-white/10 text-neutral-400'
                          }`}
                        >
                          <span>{currentValue ? 'Enabled' : 'Disabled'}</span>
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                              Boolean(currentValue) ? 'bg-sky-500 border-sky-400 text-black' : 'border-neutral-600 bg-neutral-800'
                            }`}
                          >
                            {Boolean(currentValue) && <Check className="w-3 h-3 stroke-3" />}
                          </div>
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-neutral-500 font-mono text-center py-4">
                  No configurable fields for this node.
                </div>
              )}

              <div className="pt-2 border-t border-white/10">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-400 mb-1.5">
                  <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Declarative State</span>
                </div>
                <pre className="p-3 bg-neutral-950 border border-white/10 rounded-xl text-[11px] font-mono text-emerald-400/90 overflow-x-auto leading-tight selection:bg-emerald-500/20">
                  {JSON.stringify(declarativeState, null, 2)}
                </pre>
              </div>
            </div>
          </>
        )}

        {activeTab === 'runtime' && (
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-neutral-300 mb-2">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Runtime State</span>
            </div>

            <div className="space-y-3">
              <div className="bg-neutral-900/60 p-3 rounded-xl border border-white/5">
                <div className="text-[10px] font-mono text-neutral-500 mb-1">Status</div>
                <div className={`text-sm font-mono font-semibold ${
                  nodeStatus === 'processing' ? 'text-amber-400' :
                  nodeStatus === 'finished' ? 'text-emerald-400' :
                  nodeStatus === 'waiting' ? 'text-sky-400' :
                  'text-neutral-400'
                }`}>
                  {nodeStatus.charAt(0).toUpperCase() + nodeStatus.slice(1)}
                </div>
              </div>

              <div className="bg-neutral-900/60 p-3 rounded-xl border border-white/5">
                <div className="text-[10px] font-mono text-neutral-500 mb-1">Processed Events</div>
                <div className="text-sm font-mono font-semibold text-neutral-200">
                  {processedEvents}
                </div>
              </div>

              {lastEventType && (
                <div className="bg-neutral-900/60 p-3 rounded-xl border border-white/5">
                  <div className="text-[10px] font-mono text-neutral-500 mb-1">Last Event</div>
                  <div className="text-sm font-mono font-semibold text-neutral-200">
                    {lastEventType}
                  </div>
                </div>
              )}

              <div className="bg-neutral-900/60 p-3 rounded-xl border border-white/5">
                <div className="text-[10px] font-mono text-neutral-500 mb-1">Node ID</div>
                <div className="text-[11px] font-mono text-neutral-400 break-all">
                  {selectedNode?.id}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inspector;
