'use client';

import React, { memo } from 'react';
import { EdgeProps, getBezierPath } from '@xyflow/react';
import { useFlowStore } from '@/store/flowStore';
import { SimulationStatus, EventType } from '@/types/node';

const AnimatedEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const activeEdges = useFlowStore((state) => state.activeEdges);
  const simulationStatus = useFlowStore((state) => state.simulationStatus);
  const simulationTick = useFlowStore((state) => state.simulationTick);
  const playbackSpeed = useFlowStore((state) => state.playbackSpeed);

  const edgeKey = id;
  const myActiveEvents = activeEdges.filter(e => e.edgeKey === edgeKey);
  const isActive = myActiveEvents.length > 0 && simulationStatus !== SimulationStatus.IDLE;

  const pathStyle = isActive
    ? { ...style, stroke: '#555', strokeWidth: 1.5 }
    : { ...style, stroke: '#333', strokeWidth: 1 };

  const getEventColor = (type: EventType) => {
    switch (type) {
      case EventType.HTTP_REQUEST:
      case EventType.HTTP_RESPONSE: return '#22d3ee';
      case EventType.CACHE_HIT:
      case EventType.CACHE_MISS:
      case EventType.CACHE_WRITE: return '#facc15';
      case EventType.DATABASE_READ:
      case EventType.DATABASE_WRITE: return '#38bdf8';
      case EventType.QUEUE_PUBLISH:
      case EventType.QUEUE_CONSUME: return '#d946ef';
      case EventType.ERROR: return '#f87171';
      default: return '#a3a3a3';
    }
  };

  return (
    <>
      <path
        id={id}
        style={pathStyle}
        className="react-flow__edge-path transition-all duration-300"
        d={edgePath}
        markerEnd={markerEnd}
      />
      {isActive && myActiveEvents.map((event, idx) => (
        <circle 
          key={`${event.correlationId}-${idx}`} 
          r={event.eventType === EventType.ERROR ? 4 : 3} 
          fill={getEventColor(event.eventType)}
        >
          <animateMotion
            dur={`${Math.max(0.12, event.durationTicks / (60 * playbackSpeed))}s`}
            begin={`${Math.max(0, (event.startTick - simulationTick) / (60 * playbackSpeed))}s`}
            fill="freeze"
            path={edgePath}
          />
        </circle>
      ))}
    </>
  );
};

export default memo(AnimatedEdge);
