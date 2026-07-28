import React, { useMemo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { nodeRegistry } from '@/registry';
import { PortDirection, PortSide, NodeCategory } from '@/types/node';
import { AlertCircle, CheckCircle2, Loader2, Circle } from 'lucide-react';

export interface BaseNodeData {
  label?: string;
  type?: string;
  status?: 'idle' | 'running' | 'success' | 'error' | 'warning' | string;
  statusMessage?: string;
  config?: Record<string, unknown>;
  [key: string]: unknown;
}

// Category accent styling mapping
const CATEGORY_STYLES: Record<NodeCategory, { border: string; bg: string; iconBg: string; text: string }> = {
  [NodeCategory.CLIENT]: {
    border: 'border-sky-500/40 hover:border-sky-400',
    bg: 'from-sky-950/30 to-neutral-900/90',
    iconBg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    text: 'text-sky-400',
  },
  [NodeCategory.NETWORK]: {
    border: 'border-indigo-500/40 hover:border-indigo-400',
    bg: 'from-indigo-950/30 to-neutral-900/90',
    iconBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    text: 'text-indigo-400',
  },
  [NodeCategory.SECURITY]: {
    border: 'border-rose-500/40 hover:border-rose-400',
    bg: 'from-rose-950/30 to-neutral-900/90',
    iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    text: 'text-rose-400',
  },
  [NodeCategory.SERVICE]: {
    border: 'border-emerald-500/40 hover:border-emerald-400',
    bg: 'from-emerald-950/30 to-neutral-900/90',
    iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    text: 'text-emerald-400',
  },
  [NodeCategory.COMPUTE]: {
    border: 'border-amber-500/40 hover:border-amber-400',
    bg: 'from-amber-950/30 to-neutral-900/90',
    iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    text: 'text-amber-400',
  },
  [NodeCategory.CACHE]: {
    border: 'border-yellow-500/40 hover:border-yellow-400',
    bg: 'from-yellow-950/30 to-neutral-900/90',
    iconBg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    text: 'text-yellow-400',
  },
  [NodeCategory.DATABASE]: {
    border: 'border-cyan-500/40 hover:border-cyan-400',
    bg: 'from-cyan-950/30 to-neutral-900/90',
    iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    text: 'text-cyan-400',
  },
  [NodeCategory.MESSAGE_QUEUE]: {
    border: 'border-fuchsia-500/40 hover:border-fuchsia-400',
    bg: 'from-fuchsia-950/30 to-neutral-900/90',
    iconBg: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
    text: 'text-fuchsia-400',
  },
  [NodeCategory.STORAGE]: {
    border: 'border-teal-500/40 hover:border-teal-400',
    bg: 'from-teal-950/30 to-neutral-900/90',
    iconBg: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    text: 'text-teal-400',
  },
  [NodeCategory.MONITORING]: {
    border: 'border-purple-500/40 hover:border-purple-400',
    bg: 'from-purple-950/30 to-neutral-900/90',
    iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    text: 'text-purple-400',
  },
  [NodeCategory.AI]: {
    border: 'border-blue-500/40 hover:border-blue-400',
    bg: 'from-blue-950/30 to-neutral-900/90',
    iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    text: 'text-blue-400',
  },
  [NodeCategory.EXTERNAL]: {
    border: 'border-zinc-500/40 hover:border-zinc-400',
    bg: 'from-zinc-950/30 to-neutral-900/90',
    iconBg: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    text: 'text-zinc-400',
  },
};

const defaultCategoryStyle = {
  border: 'border-neutral-700 hover:border-neutral-500',
  bg: 'from-neutral-900/90 to-neutral-900/90',
  iconBg: 'bg-neutral-800 text-neutral-300 border-neutral-700',
  text: 'text-neutral-300',
};

const mapPortSideToPosition = (side: PortSide): Position => {
  switch (side) {
    case PortSide.LEFT:
      return Position.Left;
    case PortSide.RIGHT:
      return Position.Right;
    case PortSide.TOP:
      return Position.Top;
    case PortSide.BOTTOM:
      return Position.Bottom;
    default:
      return Position.Left;
  }
};

export const BaseNode: React.FC<NodeProps> = ({ id, type, data, selected }) => {
  // 1. Receive node -> Lookup definition
  const nodeType = (data?.type as string) || type;
  const definition = useMemo(() => nodeRegistry.get(nodeType), [nodeType]);

  const nodeData = (data || {}) as BaseNodeData;
  const label = nodeData.label || definition?.label || nodeType;
  const Icon = definition?.icon;
  const categoryStyle = (definition?.category && CATEGORY_STYLES[definition.category]) || defaultCategoryStyle;

  // Combine and position input and output handles
  const handles = useMemo(() => {
    const allPorts = [
      ...(definition?.inputs.map((p) => ({ ...p, type: 'target' as const })) || []),
      ...(definition?.outputs.map((p) => ({ ...p, type: 'source' as const })) || []),
    ];

    // Group ports by side for even layout distribution
    const groupedBySide: Record<PortSide, typeof allPorts> = {
      [PortSide.LEFT]: [],
      [PortSide.RIGHT]: [],
      [PortSide.TOP]: [],
      [PortSide.BOTTOM]: [],
    };

    allPorts.forEach((port) => {
      groupedBySide[port.side]?.push(port);
    });

    return Object.entries(groupedBySide).flatMap(([sideKey, ports]) => {
      const side = sideKey as PortSide;
      const count = ports.length;
      return ports.map((port, idx) => {
        const offsetPercent = count === 1 ? 50 : ((idx + 1) / (count + 1)) * 100;
        const position = mapPortSideToPosition(side);
        const isHorizontal = side === PortSide.LEFT || side === PortSide.RIGHT;

        const style: React.CSSProperties = isHorizontal
          ? { top: `${offsetPercent}%` }
          : { left: `${offsetPercent}%` };

        return {
          ...port,
          position,
          style,
        };
      });
    });
  }, [definition]);

  // Render Status indicator
  const renderStatus = () => {
    const status = nodeData.status || 'idle';
    switch (status) {
      case 'running':
        return (
          <div title="Processing" className="flex items-center gap-1 text-xs text-amber-400 font-mono">
            <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
            <span>Processing</span>
          </div>
        );
      case 'success':
        return (
          <div title="Healthy" className="flex items-center gap-1 text-xs text-emerald-400 font-mono">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Active</span>
          </div>
        );
      case 'error':
        return (
          <div title="Error" className="flex items-center gap-1 text-xs text-rose-400 font-mono">
            <AlertCircle className="w-3 h-3 text-rose-400 animate-pulse" />
            <span>Error</span>
          </div>
        );
      case 'idle':
      default:
        return (
          <div title="Idle" className="flex items-center gap-1 text-xs text-neutral-500 font-mono">
            <Circle className="w-2 h-2 fill-neutral-500/40 text-neutral-500" />
            <span>Idle</span>
          </div>
        );
    }
  };

  return (
    <div
      className={`relative min-w-[200px] rounded-xl border bg-gradient-to-b ${categoryStyle.bg} p-3.5 backdrop-blur-xl transition-all duration-150 ${
        categoryStyle.border
      } ${
        selected ? 'ring-2 ring-sky-400 border-sky-400' : ''
      }`}
    >
      {/* Handles */}
      {handles.map((handle) => (
        <React.Fragment key={`${handle.direction}-${handle.id}`}>
          <Handle
            id={handle.id}
            type={handle.type}
            position={handle.position}
            style={handle.style}
            className={`!w-3 !h-3 !border-2 !bg-neutral-900 transition-colors duration-150 ${
              handle.type === 'target'
                ? '!border-sky-400 hover:!bg-sky-400 hover:!border-sky-300'
                : '!border-emerald-400 hover:!bg-emerald-400 hover:!border-emerald-300'
            }`}
          />
        </React.Fragment>
      ))}

      {/* Header: Icon & Label */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <div className={`p-2 rounded-lg border flex items-center justify-center shrink-0 ${categoryStyle.iconBg}`}>
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-neutral-100 truncate tracking-wide leading-tight font-sans">
              {label}
            </h3>
            {definition?.category && (
              <span className={`text-[10px] font-mono uppercase tracking-wider ${categoryStyle.text}`}>
                {definition.category}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer: Status */}
      <div className="flex items-center justify-between pt-2 mt-2 border-t border-white/10 text-xs text-neutral-400">
        {renderStatus()}
        {nodeData.statusMessage && (
          <span className="text-[10px] text-neutral-400 truncate max-w-[110px]" title={nodeData.statusMessage}>
            {nodeData.statusMessage}
          </span>
        )}
      </div>
    </div>
  );
};

export default BaseNode;
