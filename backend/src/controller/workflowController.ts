// workflowController.ts
import { Request, Response } from 'express';
import { workflowEngine, WorkflowNode, WorkflowEdge } from '../services/workflowService';

// Simplified available nodes
const availableNodes = [
  { type: 'gmail', description: 'Send, read, or manage emails' },
  { type: 'webhook', description: 'HTTP requests and API calls' },
  { type: 'condition', description: 'Conditional logic and branching' },
  { type: 'schedule', description: 'Time-based scheduling and delays' },
  { type: 'llm', description: 'AI-powered text processing and generation' },
];

// Execute workflow using the new execution engine
export const executeWorkflow = async (req: any, res: any) => {
  try {
    const { nodes, edges } = req.body;
    
    if (!nodes || !edges) {
      return res.status(400).json({ error: 'Missing nodes or edges' });
    }
    
    // Convert nodes to the format expected by the workflow engine
    const workflowNodes: WorkflowNode[] = nodes.map((node: any) => ({
      id: node.id,
      type: node.type,
      data: {
        nodeType: node.data?.nodeType || node.type,
        config: node.data?.config || node.config || {},
        status: 'idle'
      },
      position: node.position
    }));
    
    const workflowEdges: WorkflowEdge[] = edges.map((edge: any) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle
    }));
    
    // Execute workflow using the new engine
    const result = await workflowEngine.executeWorkflow(workflowNodes, workflowEdges);
    
    // Add nodeResults array for frontend dynamic mapping
    const nodeResults = Object.entries(result.results || {}).map(([nodeId, output]) => ({ nodeId, output }));
    res.json({ ...result, nodeResults });
    
  } catch (err: any) {
    res.status(400).json({ 
      success: false,
      error: err.message,
      logs: []
    });
  }
};

export const getNodes = (_req: Request, res: Response) => {
  res.json({ nodes: availableNodes });
};
