import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { 
  DataFlowContext as IDataFlowContext, 
  NodeData, 
  NodeOutput, 
  NodeInput,
  WorkflowNode 
} from '../types/workflow';

interface DataFlowContextProviderProps {
  children: ReactNode;
  nodes: WorkflowNode[];
  onNodesChange: (nodes: WorkflowNode[]) => void;
}

interface DataFlowContextState {
  nodeOutputs: Map<string, NodeOutput>;
  nodeInputs: Map<string, NodeInput[]>;
  workflowData: NodeData;
}

export interface ExtendedDataFlowContext extends IDataFlowContext {
  // getAvailableFields removed as it's no longer needed
}

const DataFlowContext = createContext<ExtendedDataFlowContext | null>(null);

export const useDataFlow = () => {
  const context = useContext(DataFlowContext);
  if (!context) {
    throw new Error('useDataFlow must be used within a DataFlowContextProvider');
  }
  return context;
};

export const DataFlowContextProvider: React.FC<DataFlowContextProviderProps> = ({
  children,
  nodes,
  onNodesChange,
}) => {
  const [state, setState] = useState<DataFlowContextState>({
    nodeOutputs: new Map(),
    nodeInputs: new Map(),
    workflowData: {},
  });

  // Get output data from a specific node
  const getNodeOutput = useCallback((nodeId: string): NodeOutput | undefined => {
    return state.nodeOutputs.get(nodeId);
  }, [state.nodeOutputs]);

  // Get input data for a specific node
  const getNodeInput = useCallback((nodeId: string): NodeInput[] => {
    return state.nodeInputs.get(nodeId) || [];
  }, [state.nodeInputs]);

  // Set output data for a node and propagate to connected nodes
  const setNodeOutput = useCallback((
    nodeId: string, 
    data: NodeData, 
    metadata?: Record<string, any>
  ) => {
    const output: NodeOutput = {
      nodeId,
      data,
      timestamp: new Date().toISOString(),
      metadata,
    };

    // Update node outputs
    setState(prev => ({
      ...prev,
      nodeOutputs: new Map(prev.nodeOutputs).set(nodeId, output),
    }));

    // Find connected downstream nodes and update their inputs
    // We need to check edges to find which nodes are connected
    const connectedNodeIds = new Set<string>();
    
    // For now, let's use a simple approach - update all nodes that might be downstream
    // In a real implementation, you'd check the actual edges
    nodes.forEach(node => {
      if (node.id !== nodeId) {
        connectedNodeIds.add(node.id);
      }
    });

    // Update the node inputs for connected nodes
    setState(prev => {
      const newNodeInputs = new Map(prev.nodeInputs);
      
      connectedNodeIds.forEach(targetNodeId => {
        const currentInputs = prev.nodeInputs.get(targetNodeId) || [];
        const newInput: NodeInput = {
          sourceNodeId: nodeId,
          data,
          timestamp: new Date().toISOString(),
        };
        
        // Add new input or update existing
        const existingIndex = currentInputs.findIndex(input => input.sourceNodeId === nodeId);
        if (existingIndex >= 0) {
          currentInputs[existingIndex] = newInput;
        } else {
          currentInputs.push(newInput);
        }
        
        newNodeInputs.set(targetNodeId, currentInputs);
      });
      
      return {
        ...prev,
        nodeInputs: newNodeInputs,
      };
    });
  }, [nodes]);

  // Get global workflow data
  const getWorkflowData = useCallback((): NodeData => {
    return state.workflowData;
  }, [state.workflowData]);

  // Set global workflow data
  const setWorkflowData = useCallback((data: NodeData) => {
    setState(prev => ({
      ...prev,
      workflowData: { ...prev.workflowData, ...data },
    }));
  }, []);

  const contextValue: ExtendedDataFlowContext = {
    getNodeOutput,
    getNodeInput,
    setNodeOutput,
    getWorkflowData,
    setWorkflowData,
  };

  return (
    <DataFlowContext.Provider value={contextValue}>
      {children}
    </DataFlowContext.Provider>
  );
};
