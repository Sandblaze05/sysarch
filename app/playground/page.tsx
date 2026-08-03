'use client'

import React, { useCallback, useMemo, useEffect } from "react";
import Panel from "@/components/flow/Panel";

import { ReactFlowProvider, ReactFlow, Background, useReactFlow, MiniMap, type IsValidConnection, type Node, type Rect } from "@xyflow/react";
import { useFlowStore } from "@/store/flowStore";
import { nodeRegistry } from "@/registry";
import BaseNode, { BaseNodeData } from "@/components/flow/nodes/BaseNode";
import '@xyflow/react/dist/style.css';
import Inspector from "@/components/flow/Inspector";
import { ChevronLeft, Play, Pause, StepForward, RotateCcw, Terminal } from "lucide-react";
import Link from "next/link";
import Timeline from "@/components/flow/Timeline";
import AnimatedEdge from "@/components/flow/edges/AnimatedEdge";
import { SimulationStatus } from "@/types/node";

const DEFAULT_NODE_WIDTH = 200;
const DEFAULT_NODE_HEIGHT = 100;

function getNodeBounds(
  node: Node,
  getInternalNode: ReturnType<typeof useReactFlow>["getInternalNode"],
): Rect {
  const internalNode = getInternalNode(node.id);
  const width =
    internalNode?.measured.width ||
    internalNode?.width ||
    node.width ||
    DEFAULT_NODE_WIDTH;
  const height =
    internalNode?.measured.height ||
    internalNode?.height ||
    node.height ||
    DEFAULT_NODE_HEIGHT;

  return {
    x: node.position.x,
    y: node.position.y,
    width,
    height,
  };
}

function PlaygroundFlow() {
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const onNodesChange = useFlowStore((state) => state.onNodesChange);
  const onEdgesChange = useFlowStore((state) => state.onEdgesChange);
  const onConnect = useFlowStore((state) => state.onConnect);
  const addNode = useFlowStore((state) => state.addNode);
  const setSelectedNodeId = useFlowStore((state) => state.setSelectedNodeId);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const simulationStatus = useFlowStore((state) => state.simulationStatus);
  const simulationLogs = useFlowStore((state) => state.simulationLogs);
  const activeNodeId = useFlowStore((state) => state.activeNodeId);
  const simulationPaused = useFlowStore((state) => state.simulationPaused);

  const startSimulation = useFlowStore((state) => state.startSimulation);
  const stepSimulation = useFlowStore((state) => state.stepSimulation);
  const pauseSimulation = useFlowStore((state) => state.pauseSimulation);
  const resumeSimulation = useFlowStore((state) => state.resumeSimulation);
  const resetSimulation = useFlowStore((state) => state.resetSimulation);

  const { screenToFlowPosition } = useReactFlow();

  const edgeTypes = useMemo(() => ({
    animated: AnimatedEdge,
  }), []);

  const nodeTypes = useMemo(
    () => ({
      baseNode: BaseNode,
      api_gateway: BaseNode,
      cache: BaseNode,
      cdn: BaseNode,
      client: BaseNode,
      database: BaseNode,
      external_api: BaseNode,
      load_balancer: BaseNode,
      message_queue: BaseNode,
      monitor: BaseNode,
      object_storage: BaseNode,
      service: BaseNode,
      worker: BaseNode,
    }),
    []
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const nodeType = event.dataTransfer.getData('application/reactflow');
      if (!nodeType) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(nodeType, position);
    },
    [screenToFlowPosition, addNode]
  );

  const isValidConnection: IsValidConnection = useCallback((connection) => {
    if (connection.source === connection.target) return false;

    const sourceNode = nodes.find((n) => n.id === connection.source);
    const targetNode = nodes.find((n) => n.id === connection.target);

    const sourceType = (sourceNode?.data?.type as string) || sourceNode?.type || '';
    const targetType = (targetNode?.data?.type as string) || targetNode?.type || '';

    return nodeRegistry.canConnect(
      sourceType,
      connection.sourceHandle ?? null,
      targetType,
      connection.targetHandle ?? null,
    );
  }, [nodes]);

  const reactFlow = useReactFlow();

  const flyToNode = useCallback((node: Node) => {
    const targetNode = nodes.find((n) => n.id === node.id) ?? node;
    setSelectedNodeId(targetNode.id);
    void reactFlow.fitBounds(getNodeBounds(targetNode, reactFlow.getInternalNode), {
      padding: 0.2,
      duration: 800,
    });
  }, [nodes, reactFlow, setSelectedNodeId]);

  const handleMiniMapNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    flyToNode(node);
  }, [flyToNode]);

  // Update node active states based on activeNodeId
  useEffect(() => {
    nodes.forEach(n => {
      const isActive = n.id === activeNodeId;
      const data = n.data as BaseNodeData;
      if (data.isActive !== isActive) {
        updateNodeData(n.id, { isActive });
      }
    });
  }, [activeNodeId, nodes, updateNodeData]);

  const isRunning = simulationStatus === SimulationStatus.RUNNING;
  const isFinished = simulationStatus === SimulationStatus.FINISHED;
  const isIdle = simulationStatus === SimulationStatus.IDLE;

  return (
    <div className="h-screen w-full relative overflow-hidden bg-neutral-950">
      <Link 
        href={'/'} 
        aria-label="go back" 
        className={`
            fixed z-999 left-6 top-5 rounded-full flex items-center justify-center p-2
          hover:text-white text-[#a3a3a3] cursor-pointer shadow-2xl bg-black/80 backdrop-blur-2xl border border-white/15
        `}
        >
        <span>
          <ChevronLeft />
        </span>
      </Link>

      {/* Simulation Controls */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/80 backdrop-blur-xl border border-white/15 rounded-full px-3 py-1.5 shadow-2xl">
        {isIdle && (
          <button
            type="button"
            onClick={startSimulation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span className="text-xs font-mono font-semibold tracking-wide">Run</span>
          </button>
        )}
        
        {isRunning && (
          <>
            <button
              type="button"
              onClick={simulationPaused ? () => resumeSimulation() : () => pauseSimulation()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 transition-colors"
            >
              {simulationPaused ? (
                <><Play className="w-3.5 h-3.5 fill-current" /><span className="text-xs font-mono font-semibold tracking-wide">Resume</span></>
              ) : (
                <><Pause className="w-3.5 h-3.5" /><span className="text-xs font-mono font-semibold tracking-wide">Pause</span></>
              )}
            </button>
            <button
              type="button"
              onClick={stepSimulation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 hover:text-sky-300 transition-colors"
            >
              <StepForward className="w-3.5 h-3.5" />
              <span className="text-xs font-mono font-semibold tracking-wide">Step</span>
            </button>
            <button
              type="button"
              onClick={resetSimulation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-xs font-mono font-semibold tracking-wide">Reset</span>
            </button>
          </>
        )}

        {isFinished && (
          <button
            type="button"
            onClick={resetSimulation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-500/10 border border-neutral-500/30 text-neutral-400 hover:bg-neutral-500/20 hover:text-neutral-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="text-xs font-mono font-semibold tracking-wide">Reset</span>
          </button>
        )}

        <span className={`text-xs font-mono tracking-wide ml-1 ${
          simulationStatus === 'finished' ? 'text-emerald-400' :
          simulationStatus === 'error' ? 'text-rose-400' :
          simulationStatus === 'running' ? 'text-sky-400' :
          'text-neutral-500'
        }`}>
          {simulationStatus.toUpperCase()}
        </span>
      </div>

      {simulationLogs.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[600px] max-h-48 bg-black/90 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10 shrink-0">
            <Terminal className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-xs font-mono text-neutral-400 font-semibold tracking-wide">Console</span>
          </div>
          <div className="overflow-y-auto max-h-32 p-3 space-y-1 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
            {simulationLogs.map((log, i) => (
              <div key={i} className="text-xs font-mono text-neutral-300 leading-relaxed">
                <span className="text-neutral-500 mr-2">&gt;</span>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
      <Panel />
      <Inspector />
      <Timeline />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onNodeClick={(_event, node) => setSelectedNodeId(node.id)}
        onPaneClick={() => setSelectedNodeId(null)}
        onDragOver={onDragOver}
        onDrop={onDrop}
        colorMode="dark"
        proOptions={{
          hideAttribution: true
        }}
        fitView
      >
        <Background color="#333" gap={16} />
        <MiniMap
          position="bottom-right"
          nodeBorderRadius={8}
          nodeStrokeWidth={2}
          bgColor="#0a0a0a"
          maskColor="rgba(0, 0, 0, 0.75)"
          maskStrokeColor="rgba(255, 255, 255, 0.2)"
          maskStrokeWidth={1}
          pannable
          zoomable
          ariaLabel="Minimap"
          onNodeClick={handleMiniMapNodeClick}
        />
      </ReactFlow>
    </div>
  );
}

const Page = () => {
  return (
    <ReactFlowProvider>
      <PlaygroundFlow />
    </ReactFlowProvider>
  );
};

export default Page;
