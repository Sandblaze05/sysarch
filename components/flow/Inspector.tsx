'use client'

import React, { useEffect, useRef, useMemo } from 'react';
import gsap from 'gsap';
import { useFlowStore } from '@/store/flowStore';
import { nodeRegistry } from '@/registry';
import { ConfigField } from '@/types/node';
import { CATEGORY_META, DEFAULT_CATEGORY_META } from '@/constants/categoryMeta';
import {
  Sliders,
  X,
  ChevronDown,
  Trash2,
  Code2,
  Check,
} from 'lucide-react';


const formatLabel = (str: string) => {
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const Inspector: React.FC = () => {
  const nodes = useFlowStore((state) => state.nodes);
  const selectedNodeId = useFlowStore((state) => state.selectedNodeId);
  const setSelectedNodeId = useFlowStore((state) => state.setSelectedNodeId);
  const updateNodeConfig = useFlowStore((state) => state.updateNodeConfig);
  const setNodes = useFlowStore((state) => state.setNodes);

  const panelRef = useRef<HTMLDivElement | null>(null);

  // Find currently selected node
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return nodes.find((n) => n.selected) || null;
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  // Lookup node definition from registry
  const nodeType = (selectedNode?.data?.type as string) || selectedNode?.type;
  const definition = useMemo(() => (nodeType ? nodeRegistry.get(nodeType) : null), [nodeType]);

  // Node config object
  const nodeConfig = useMemo(() => {
    if (!selectedNode) return {};
    const config = (selectedNode.data?.config as Record<string, unknown>) || {};
    // Ensure all definition fields have fallback defaults if missing
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

  // GSAP slide in/out animation
  useEffect(() => {
    if (!panelRef.current) return;
    if (selectedNode) {
      gsap.to(panelRef.current, {
        x: 0,
        opacity: 1,
        pointerEvents: 'auto',
        duration: 0.35,
        ease: 'power3.out',
      });
    } else {
      gsap.to(panelRef.current, {
        x: 360,
        opacity: 0,
        pointerEvents: 'none',
        duration: 0.35,
        ease: 'power3.in',
      });
    }
  }, [selectedNode]);

  const handleDeleteNode = () => {
    if (!selectedNode) return;
    setNodes(nodes.filter((n) => n.id !== selectedNode.id));
    setSelectedNodeId(null);
  };

  if (!selectedNode && !panelRef.current) return null;

  const categoryStyle =
    (definition?.category && CATEGORY_META[definition.category]) || DEFAULT_CATEGORY_META;

  const IconComponent = definition?.icon || DEFAULT_CATEGORY_META.icon;

  // Declarative preview structure as requested
  const declarativeState = {
    definition: definition?.type || nodeType || 'unknown',
    config: nodeConfig,
  };

  return (
    <div
      ref={panelRef}
      style={{ transform: 'translateX(360px)', opacity: 0, pointerEvents: 'none' }}
      className="fixed right-4 top-20 bottom-6 w-80 z-50 border-2 border-white/20 bg-black/80 backdrop-blur-xl rounded-3xl p-4 flex flex-col shadow-2xl text-white select-none transition-shadow duration-300"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3 shrink-0">
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
            onClick={() => setSelectedNodeId(null)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Node Description if available */}
      {definition?.description && (
        <p className="text-xs text-neutral-400 mb-4 px-1 leading-relaxed shrink-0">
          {definition.description}
        </p>
      )}

      {/* Main Form Fields (Declaratively rendered from definition.config) */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
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

                {/* SELECT field */}
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

                {/* NUMBER field */}
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

                {/* TEXT field */}
                {field.type === 'text' && (
                  <input
                    type="text"
                    value={String(currentValue || '')}
                    onChange={(e) => updateNodeConfig(selectedNode!.id, field.key, e.target.value)}
                    className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono transition-all"
                  />
                )}

                {/* BOOLEAN field */}
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

        {/* Declarative State Preview Box */}
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
    </div>
  );
};

export default Inspector;