import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  Panel,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { WorkflowNode, WorkflowEdge, NodeType, ReactFlowNode } from '../types/workflow';
import {
  GmailNode,
  ScheduleNode,
  ConditionNode,
  TriggerNode,
  WebhookNode,
  
  LLMNode,
} from './nodes';

interface WorkflowCanvasProps {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  onNodesChange: (nodes: WorkflowNode[]) => void;
  onEdgesChange: (edges: WorkflowEdge[]) => void;
  onNodeSelect: (nodeId: string | null) => void;
  onNodeDelete: (nodeId: string) => void;
  onNodeConfigure: (nodeId: string) => void;
  selectedNodeId: string | null;
  onNodeDrop: (position: { x: number; y: number }, nodeType: NodeType) => void;
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  nodes: initialNodes,
  edges: initialEdges,
  onNodesChange,
  onEdgesChange,
  onNodeSelect,
  onNodeDelete,
  onNodeConfigure,
  selectedNodeId,
  onNodeDrop,
}) => {
  // Convert WorkflowNode/WorkflowEdge to ReactFlow compatible types
  const reactFlowNodes: ReactFlowNode[] = useMemo(() => 
    initialNodes.map(node => ({
      ...node,
      type: node.type || node.data.nodeType,
    })), [initialNodes]
  );

  const reactFlowEdges: Edge[] = useMemo(() => 
    initialEdges.map(edge => ({
      ...edge,
      id: (edge as any).id || `edge-${edge.source}-${edge.target}`,
      source: edge.source,
      target: edge.target,
    })), [initialEdges]
  );

  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(reactFlowNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(reactFlowEdges);

  // Custom node types mapping
  const nodeTypes = useMemo(() => ({
    gmail: (props: any) => <GmailNode {...props} onDelete={onNodeDelete} onConfigure={onNodeConfigure} />,
    schedule: (props: any) => <ScheduleNode {...props} onDelete={onNodeDelete} onConfigure={onNodeConfigure} />,
    condition: (props: any) => <ConditionNode {...props} onDelete={onNodeDelete} onConfigure={onNodeConfigure} />,
    trigger: (props: any) => <TriggerNode {...props} onDelete={onNodeDelete} onConfigure={onNodeConfigure} />,
    webhook: (props: any) => <WebhookNode {...props} onDelete={onNodeDelete} onConfigure={onNodeConfigure} />,
    llm: (props: any) => <LLMNode {...props} onDelete={onNodeDelete} onConfigure={onNodeConfigure} />,
  }), [onNodeDelete, onNodeConfigure]);

  // Sync internal state with props
  React.useEffect(() => {
    setNodes(reactFlowNodes);
  }, [reactFlowNodes, setNodes]);

  React.useEffect(() => {
    setEdges(reactFlowEdges);
  }, [reactFlowEdges, setEdges]);

  // Handle node changes and sync with parent
  const handleNodesChange = useCallback((changes: any) => {
    onNodesChangeInternal(changes);
    // Get updated nodes after the change
    setNodes((currentNodes) => {
      // Convert back to WorkflowNode format
      const workflowNodes: WorkflowNode[] = currentNodes.map(node => ({
        ...node,
        type: node.type as NodeType,
        data: {
          ...node.data,
          nodeType: node.type as NodeType,
        }
      }));
      onNodesChange(workflowNodes);
      return currentNodes;
    });
  }, [onNodesChangeInternal, onNodesChange, setNodes]);

  // Handle edge changes and sync with parent
  const handleEdgesChange = useCallback((changes: any) => {
    onEdgesChangeInternal(changes);
    // Get updated edges after the change
    setEdges((currentEdges) => {
      // Convert back to WorkflowEdge format
      const workflowEdges: WorkflowEdge[] = currentEdges.map(edge => ({
        ...edge,
        id: edge.id,
        source: edge.source,
        target: edge.target,
      }));
      onEdgesChange(workflowEdges);
      return currentEdges;
    });
  }, [onEdgesChangeInternal, onEdgesChange, setEdges]);

  // Handle new connections
  const onConnect = useCallback((params: Connection | Edge) => {
    if (!params.source || !params.target) return;
    
    const newEdge: Edge = {
      id: `edge-${params.source}-${params.target}`,
      source: params.source,
      target: params.target,
      sourceHandle: params.sourceHandle,
      targetHandle: params.targetHandle,
      animated: true,
      style: { stroke: '#6b7280', strokeWidth: 2 },
    };

    setEdges((eds) => {
      const updatedEdges = addEdge(newEdge, eds);
      onEdgesChange(updatedEdges);
      return updatedEdges;
    });
  }, [setEdges, onEdgesChange]);

  // Handle node selection
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    onNodeSelect(node.id);
  }, [onNodeSelect]);

  // Handle canvas click (deselect)
  const onPaneClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  // Handle drag and drop
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const reactFlowBounds = (event.target as Element).closest('.react-flow')?.getBoundingClientRect();
    if (!reactFlowBounds) return;

    const nodeType = event.dataTransfer.getData('application/reactflow') as NodeType;
    if (!nodeType) return;

    const position = {
      x: event.clientX - reactFlowBounds.left - 100, // Center the node
      y: event.clientY - reactFlowBounds.top - 40,
    };

    onNodeDrop(position, nodeType);
  }, [onNodeDrop]);

  return (
    <div className="flex-1 h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        className="bg-gray-50"
        connectionLineStyle={{ stroke: '#3b7280', strokeWidth: 2 }}
        defaultEdgeOptions={{
          style: { stroke: '#6b7280', strokeWidth: 2 },
          animated: false,
        }}
      >
        <Background 
          color="#e2e8f0" 
          gap={20} 
          size={1}
          variant={BackgroundVariant.Dots}
        />
        <Controls 
          className="bg-white border border-gray-200 rounded-lg shadow-lg"
          showInteractive={false}
        />
        
        {/* Workflow Stats Panel */}
        <Panel position="top-right" className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
          <div className="text-sm text-gray-600">
            <div className="flex items-center justify-between mb-1">
              <span>Nodes:</span>
              <span className="font-medium">{nodes.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Connections:</span>
              <span className="font-medium">{edges.length}</span>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

// Wrapper component with ReactFlowProvider
export const WorkflowCanvasWrapper: React.FC<WorkflowCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <WorkflowCanvas {...props} />
    </ReactFlowProvider>
  );
};