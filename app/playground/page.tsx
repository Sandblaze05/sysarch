'use client'

import React, { useCallback, useMemo } from "react";
import Panel from "@/components/flow/Panel";

import { ReactFlowProvider, ReactFlow, Background, Controls, useReactFlow, MiniMap, type IsValidConnection, type Node, type Rect } from "@xyflow/react";
import { useFlowStore } from "@/store/flowStore";
import { nodeRegistry } from "@/registry";
import BaseNode from "@/components/flow/nodes/BaseNode";
import '@xyflow/react/dist/style.css';
import Inspector from "@/components/flow/Inspector";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

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
        <Controls 
          position="bottom-left" 
          showZoom 
          showFitView 
          showInteractive 
          orientation="vertical"
        />
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

/* ------------------------------------------------------------------
 * MINIMAP TROUBLESHOOTING CHECKLIST
 * ------------------------------------------------------------------
 * 1. Missing container height
 *    - React Flow requires its parent container to have an explicit height.
 *      Without it, the canvas and minimap won't render or will have zero size.
 *
 * 2. ReactFlowProvider placement
 *    - The <ReactFlowProvider> must wrap the component tree that consumes
 *      useReactFlow, useFlowStore, etc. If missing, hooks will throw.
 *
 * 3. Stale state updates
 *    - Avoid destructuring the entire store (useFlowStore()) as it subscribes
 *      to all state changes. Use selectors (state => state.nodes) to prevent
 *      unnecessary re-renders and stale closure captures.
 *
 * 4. CSS z-index conflicts
 *    - Panel (z-40), Inspector (z-50), and the back button (z-999) are all
 *      positioned above the canvas. Ensure the ReactFlow container doesn't
 *      clip or hide the minimap. The minimap renders inside the canvas pane,
 *      so z-index conflicts only happen if parent containers use overflow:hidden.
 *
 * 5. Fly-to-node on minimap click
 *    - Use the onNodeClick callback on MiniMap with reactFlow.fitBounds()
 *      and a duration (e.g. 800ms) to smoothly transition the viewport
 *      to the clicked node. fitView() skips off-screen nodes that have not
 *      been measured yet, so derive bounds from store position + dimensions.
 *
 * 6. Zoom/pan sync
 *    - Enable pannable and zoomable on MiniMap to keep it in sync with the
 *      main viewport. Without these, the minimap viewport indicator is static.
 * ------------------------------------------------------------------ */