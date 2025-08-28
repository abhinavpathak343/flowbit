import React, { useState, useEffect } from 'react';
import { WorkflowToolbar } from './components/WorkflowToolbar';
import { WorkflowCanvasWrapper } from './components/WorkflowCanvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { NodePalette } from './components/NodePalette';
import { Snackbar } from './components/Snackbar';
import { ResultsPopup } from './components/ResultsPopup';
import { DataFlowContextProvider } from './contexts/DataFlowContext';
import { useWorkflow } from './hooks/useWorkflow';
import { ExecutionResult, NodeType } from './types/workflow';

function App() {
  const {
    nodes,
    edges,
    selectedNodeId,
    isExecuting,
    addNode,
    updateNode,
    deleteNode,
    setSelectedNodeId,
    setNodes,
    setEdges,
    executeWorkflow,
    saveWorkflow,
    loadWorkflow,
    clearWorkflow,
  } = useWorkflow();

  const [draggedNodeType, setDraggedNodeType] = useState<NodeType | null>(null);
  const [snackbar, setSnackbar] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    isVisible: boolean;
  }>({
    message: '',
    type: 'info',
    isVisible: false,
  });

  const [executionResults, setExecutionResults] = useState<ExecutionResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleNodeDragStart = (nodeType: NodeType) => {
    setDraggedNodeType(nodeType);
  };

  const handleNodeDrop = (position: { x: number; y: number }, nodeType: NodeType) => {
    const id = addNode(position, nodeType) as unknown as string;
    setDraggedNodeType(null);
    setSelectedNodeId(id); // Always select the dropped node
  };

  const handleNodeConfigure = (nodeId: string) => {
    setSelectedNodeId(nodeId);
  };

  const showSnackbar = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setSnackbar({ message, type, isVisible: true });
  };

  const hideSnackbar = () => {
    setSnackbar(prev => ({ ...prev, isVisible: false }));
  };

  const handleExecuteWorkflow = async () => {
    try {
      const result = await executeWorkflow();
      
      if (result && result.result && result.result.logs) {
        // Convert backend logs to frontend results format
        const results: ExecutionResult[] = result.result.logs.map((log: any) => ({
          nodeId: log.nodeId || 'unknown',
          nodeType: log.nodeType || 'unknown',
          status: log.status === 'success' ? 'success' : 
                  log.status === 'error' ? 'error' : 'running',
          output: log.output || log.result,
          error: log.error,
          processingTime: log.processing_time_ms,
          service: log.service,
          model: log.model,
          tokensUsed: log.tokens_used
        }));
        
        setExecutionResults(results);
        setShowResults(true);
        showSnackbar('Workflow executed successfully! Check results below.', 'success');
      } else {
        showSnackbar('Workflow executed successfully!', 'success');
      }
    } catch (error) {
      showSnackbar(`Workflow execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const selectedNode = nodes.find(node => node.id === selectedNodeId);

  return (
         <DataFlowContextProvider nodes={nodes} onNodesChange={setNodes}>
      <div className="h-screen flex flex-col bg-gray-100">
        <WorkflowToolbar
          onExecute={handleExecuteWorkflow}
          onSave={saveWorkflow}
          onLoad={loadWorkflow}
          onClear={clearWorkflow}
          isExecuting={isExecuting}
          onViewResults={() => setShowResults(true)}
          hasResults={executionResults.length > 0}
        />
        
        <div className="flex-1 flex overflow-hidden">
          <NodePalette onNodeDragStart={handleNodeDragStart} />
          
          <WorkflowCanvasWrapper
            nodes={nodes}
            edges={edges}
            onNodesChange={setNodes}
            onEdgesChange={setEdges}
            onNodeSelect={setSelectedNodeId}
            onNodeDelete={deleteNode}
            onNodeConfigure={handleNodeConfigure}
            selectedNodeId={selectedNodeId}
            onNodeDrop={handleNodeDrop}
          />
          
          {selectedNode && (
            <PropertiesPanel
              node={selectedNode}
              onNodeUpdate={updateNode}
              onDelete={deleteNode}
              onClose={() => setSelectedNodeId(null)}
            />
          )}
        </div>
        
        <Snackbar
          message={snackbar.message}
          type={snackbar.type}
          isVisible={snackbar.isVisible}
          onClose={hideSnackbar}
        />
        
        <ResultsPopup
          isVisible={showResults}
          results={executionResults}
          onClose={() => setShowResults(false)}
        />
      </div>
    </DataFlowContextProvider>
  );
}

export default App;