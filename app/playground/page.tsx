'use client'

import Panel from "@/components/flow/Panel";

import { ReactFlowProvider, ReactFlow, Background } from "@xyflow/react"
import { useFlowStore } from "@/store/flowStore"
import '@xyflow/react/dist/style.css';

const page = () => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
  } = useFlowStore();

  return (
    <ReactFlowProvider>
      <div className="h-screen">
        <Panel />
        <ReactFlow 
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          colorMode="dark"
          fitView
        >
          <Background />
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  )
}

export default page