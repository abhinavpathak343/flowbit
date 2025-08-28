import { Node, Edge } from 'reactflow';

export type NodeType = 'gmail' | 'schedule' | 'condition' | 'webhook' | 'trigger' | 'filter' | 'delay' | 'transform' | 'llm';
export type NodeStatus = 'idle' | 'running' | 'success' | 'error';

// Data flow types
export interface NodeData {
  [key: string]: any;
}

export interface NodeOutput {
  nodeId: string;
  data: NodeData;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface NodeInput {
  sourceNodeId: string;
  data: NodeData;
  timestamp: string;
}

export interface WorkflowNodeData {
  label: string;
  description: string;
  config: Record<string, any>;
  status: NodeStatus;
  nodeType: NodeType;
  // Data flow properties
  inputData?: NodeInput[];
  outputData?: NodeOutput;
  // Execution context
  lastExecuted?: string;
  executionCount?: number;
  // Field mapping for data extraction
  fieldMapping?: Record<string, string>;
  // Output schema for downstream nodes
  outputSchema?: {
    fields: Array<{
      name: string;
      type: 'string' | 'number' | 'boolean' | 'array' | 'object';
      description: string;
      example?: any;
    }>;
  };
}

export interface WorkflowNode extends Node<WorkflowNodeData> {
  type: NodeType;
}

// WorkflowEdge should extend Edge properly
export interface WorkflowEdge extends Edge {
  source: string;
  target: string;
  animated?: boolean;
  style?: React.CSSProperties;
  // Data flow properties
  dataMapping?: Record<string, string>; // Maps source fields to target fields
  transformFunction?: string; // Optional transformation function
}

export interface Workflow {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
  // Workflow execution context
  executionContext?: {
    variables: Record<string, any>;
    globalData: NodeData;
    executionHistory: Array<{
      nodeId: string;
      timestamp: string;
      status: NodeStatus;
      inputData?: NodeData;
      outputData?: NodeData;
    }>;
  };
}

export interface NodeTemplate {
  type: NodeType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  category: 'trigger' | 'action' | 'logic' | 'utility';
  defaultConfig: Record<string, any>;
  // Data flow configuration
  inputSchema?: {
    required: string[];
    optional: string[];
    types: Record<string, 'string' | 'number' | 'boolean' | 'array' | 'object'>;
  };
  outputSchema?: {
    fields: Array<{
      name: string;
      type: 'string' | 'number' | 'boolean' | 'array' | 'object';
      description: string;
      example?: any;
    }>;
  };
}

// Add proper typing for ReactFlow compatibility
export type ReactFlowNode = Node<WorkflowNodeData>;
export type ReactFlowEdge = Edge;

// Data flow utilities
export interface DataFlowContext {
  getNodeOutput: (nodeId: string) => NodeOutput | undefined;
  getNodeInput: (nodeId: string) => NodeInput[];
  setNodeOutput: (nodeId: string, data: NodeData, metadata?: Record<string, any>) => void;
  getWorkflowData: () => NodeData;
  setWorkflowData: (data: NodeData) => void;
}

// Field extraction utilities
export interface FieldExtractor {
  extractFields: (data: NodeData, schema: any) => Record<string, any>;
  validateFields: (data: NodeData, requiredFields: string[]) => boolean;
  transformFields: (data: NodeData, mapping: Record<string, string>) => NodeData;
}