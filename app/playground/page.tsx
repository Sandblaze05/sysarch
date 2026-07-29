'use client'

import React, { useCallback, useMemo } from "react";
import Panel from "@/components/flow/Panel";

import { ReactFlowProvider, ReactFlow, Background, useReactFlow, MiniMap, type IsValidConnection } from "@xyflow/react";
import { useFlowStore } from "@/store/flowStore";
import { nodeRegistry } from "@/registry";
import BaseNode from "@/components/flow/nodes/BaseNode";
import '@xyflow/react/dist/style.css';
import Inspector from "@/components/flow/Inspector";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

function PlaygroundFlow() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setSelectedNodeId,
  } = useFlowStore();

  const { screenToFlowPosition } = useReactFlow();

  // Custom node types mapping all types to BaseNode
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

  // Registry-driven connection validation — gives visual feedback during drag
  const isValidConnection: IsValidConnection = useCallback((connection) => {
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
      <Panel />
      <Inspector />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
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
        <MiniMap position="top-right" />
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