'use client'

import React, { useCallback, useMemo } from "react";
import Panel from "@/components/flow/Panel";

import { ReactFlowProvider, ReactFlow, Background, useReactFlow } from "@xyflow/react";
import { useFlowStore } from "@/store/flowStore";
import BaseNode from "@/components/nodes/BaseNode";
import '@xyflow/react/dist/style.css';

function PlaygroundFlow() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
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

  return (
    <div className="h-screen w-full relative overflow-hidden bg-neutral-950">
      <Panel />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        colorMode="dark"
        fitView
      >
        <Background color="#333" gap={16} />
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