import React, { useMemo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { nodeRegistry } from '@/registry';
import { PortDirection, PortSide } from '@/types/node';
import { CATEGORY_META, DEFAULT_CATEGORY_META } from '@/constants/categoryMeta';
import { AlertCircle, CheckCircle2, Loader2, Circle } from 'lucide-react';

export interface BaseNodeData {
  label?: string;
  type?: string;
  status?: 'idle' | 'running' | 'success' | 'error' | 'warning' | string;
  statusMessage?: string;
  config?: Record<string, unknown>;
  [key: string]: unknown;
}


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
  const categoryStyle = (definition?.category && CATEGORY_META[definition.category]) || DEFAULT_CATEGORY_META;

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
      className={`relative min-w-50 rounded-xl border bg-linear-to-b ${categoryStyle.gradientBg} p-3.5 backdrop-blur-xl transition-all duration-150 ${
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
            className={`w-3! h-3! border-2! bg-neutral-900! transition-colors duration-150 ${
              handle.type === 'target'
                ? 'border-sky-400! hover:bg-sky-400! hover:border-sky-300!'
                : 'border-emerald-400! hover:bg-emerald-400! hover:border-emerald-300!'
            }`}
          />
        </React.Fragment>
      ))}

      {/* Header: Icon & Label */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <div className={`p-2 rounded-lg border flex items-center justify-center shrink-0 ${categoryStyle.badgeBg}`}>
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-neutral-100 truncate tracking-wide leading-tight font-sans">
              {label}
            </h3>
            {definition?.category && (
              <span className={`text-[10px] font-mono uppercase tracking-wider ${categoryStyle.color}`}>
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
          <span className="text-[10px] text-neutral-400 truncate max-w-27.5" title={nodeData.statusMessage}>
            {nodeData.statusMessage}
          </span>
        )}
      </div>
    </div>
  );
};

export default BaseNode;
