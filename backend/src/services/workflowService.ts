// workflowService.ts
import { getNodeHandler } from '../registry/registry';

export interface WorkflowNode {
  id: string;
  type: string;
  data: {
    nodeType: string;
    config: any;
    status: 'idle' | 'running' | 'success' | 'error';
  };
  position: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface WorkflowExecutionResult {
  success: boolean;
  logs: any[];
  results: Record<string, any>;
  executionOrder: string[];
  executionTime: number;
  errors: any[];
}

export class WorkflowExecutionEngine {
  private nodeResults = new Map<string, any>();
  private executionLogs: any[] = [];
  private errors: any[] = [];
  private startTime: number = 0;

  async executeWorkflow(nodes: WorkflowNode[], edges: WorkflowEdge[]): Promise<WorkflowExecutionResult> {
    this.startTime = Date.now();
    this.nodeResults.clear();
    this.executionLogs = [];
    this.errors = [];

    try {
      // Build execution graph
      const executionGraph = this.buildExecutionGraph(nodes, edges);
      
      // Get execution order using topological sort
      const executionOrder = this.getTopologicalOrder(executionGraph);
      
      // Execute nodes in order
      await this.executeNodesInOrder(nodes, executionOrder, executionGraph);
      
      const executionTime = Date.now() - this.startTime;
      
      return {
        success: this.errors.length === 0,
        logs: this.executionLogs,
        results: Object.fromEntries(this.nodeResults),
        executionOrder: executionOrder.map(node => node.id),
        executionTime,
        errors: this.errors
      };
    } catch (error: any) {
      this.errors.push({
        type: 'execution_error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      
      return {
        success: false,
        logs: this.executionLogs,
        results: Object.fromEntries(this.nodeResults),
        executionOrder: [],
        executionTime: Date.now() - this.startTime,
        errors: this.errors
      };
    }
  }

  private buildExecutionGraph(nodes: WorkflowNode[], edges: WorkflowEdge[]) {
    const graph = new Map<string, { node: WorkflowNode; dependencies: string[]; dependents: string[] }>();
    
    // Initialize graph
    for (const node of nodes) {
      graph.set(node.id, {
        node,
        dependencies: [],
        dependents: []
      });
    }
    
    // Add edges
    for (const edge of edges) {
      const source = graph.get(edge.source);
      const target = graph.get(edge.target);
      
      if (source && target) {
        source.dependents.push(edge.target);
        target.dependencies.push(edge.source);
      }
    }
    
    return graph;
  }

  private getTopologicalOrder(graph: Map<string, { node: WorkflowNode; dependencies: string[]; dependents: string[] }>) {
    const order: WorkflowNode[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    
    const visit = (nodeId: string) => {
      if (visiting.has(nodeId)) {
        throw new Error(`Circular dependency detected: ${nodeId}`);
      }
      if (visited.has(nodeId)) return;
      
      visiting.add(nodeId);
      const nodeData = graph.get(nodeId);
      if (nodeData) {
        for (const dependency of nodeData.dependencies) {
          visit(dependency);
        }
      }
      visiting.delete(nodeId);
      visited.add(nodeId);
      
      const nodeData2 = graph.get(nodeId);
      if (nodeData2) {
        order.push(nodeData2.node);
      }
    };
    
    for (const nodeId of graph.keys()) {
      if (!visited.has(nodeId)) {
        visit(nodeId);
      }
    }
    
    return order;
  }

  private async executeNodesInOrder(
    nodes: WorkflowNode[], 
    executionOrder: WorkflowNode[], 
    graph: Map<string, { node: WorkflowNode; dependencies: string[]; dependents: string[] }>
  ) {
    for (let i = 0; i < executionOrder.length; i++) {
      const node = executionOrder[i];
      const nodeData = graph.get(node.id);
      
      if (!nodeData) continue;
      
      try {
        // Update node status to running
        this.logExecution(node.id, node.data.nodeType, 'running');
        
        // Get input data from dependencies
        const inputData = this.getInputData(nodeData.dependencies);
        
        // Execute the node
        const result = await this.executeNode(node, inputData);
        
        // Store result
        this.nodeResults.set(node.id, result);
        
        // Handle conditional branching
        if (node.data.nodeType === 'condition') {
          const shouldContinue = await this.handleConditionalBranching(node, result, graph, i, executionOrder);
          if (!shouldContinue) {
            break;
          }
        }
        
        // Log success
        this.logExecution(node.id, node.data.nodeType, 'success', result);
        
      } catch (error: any) {
        this.logExecution(node.id, node.data.nodeType, 'error', null, error.message);
        this.errors.push({
          nodeId: node.id,
          nodeType: node.data.nodeType,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        
        // Continue execution unless this is a critical error
        if (error.critical) {
          break;
        }
      }
    }
  }

  private async executeNode(node: WorkflowNode, inputData: any): Promise<any> {
    const nodeType = node.data.nodeType;
    const config = node.data.config || {};
    
    // Get handler for this node type
    let handler;
    if (nodeType === 'schedule') {
      handler = getNodeHandler(nodeType, config.scheduleType || 'default');
    } else if (nodeType === 'condition') {
      handler = getNodeHandler(nodeType, 'evaluate');
    } else {
      handler = getNodeHandler(nodeType, config.action || 'default');
    }
    
    if (!handler) {
      throw new Error(`No handler found for node type: ${nodeType}`);
    }
    
    // Execute the node with input data
    const result = await handler({ ...config, input: inputData });
    return result;
  }

  private getInputData(dependencies: string[]): any {
    if (dependencies.length === 0) {
      return {};
    }
    
    if (dependencies.length === 1) {
      return this.nodeResults.get(dependencies[0]) || {};
    }
    
    // Multiple dependencies - return map of source -> result
    const inputData: any = {};
    for (const dependency of dependencies) {
      inputData[dependency] = this.nodeResults.get(dependency) || {};
    }
    return inputData;
  }

  private async handleConditionalBranching(
    node: WorkflowNode, 
    result: any, 
    graph: Map<string, { node: WorkflowNode; dependencies: string[]; dependents: string[] }>,
    currentIndex: number,
    executionOrder: WorkflowNode[]
  ): Promise<boolean> {
    const nodeData = graph.get(node.id);
    if (!nodeData) return true;
    
    // Check if condition passed
    const conditionPassed = result?.result === true;
    
    if (conditionPassed) {
      // Condition is true, pass through the input data to downstream nodes
      const inputData = this.getInputData(nodeData.dependencies);
      // If condition filtered emails at handler level, prefer those
      if (result && Array.isArray(result.filteredEmails)) {
        this.nodeResults.set(node.id, { emails: result.filteredEmails, success: true });
      } else {
        this.nodeResults.set(node.id, inputData);
      }
      return true;
    } else {
      // Condition is false, skip downstream nodes that depend on this condition
      const nodesToSkip = new Set<string>();
      this.collectNodesToSkip(node.id, graph, nodesToSkip);
      
      // Skip nodes in execution order
      let skipCount = 0;
      for (let i = currentIndex + 1; i < executionOrder.length; i++) {
        if (nodesToSkip.has(executionOrder[i].id)) {
          skipCount++;
        } else {
          break;
        }
      }
      
      this.logExecution(node.id, node.data.nodeType, 'skipped_branch', null, `Condition false, skipped ${skipCount} connected nodes`);
      return false;
    }
  }

  private collectNodesToSkip(
    nodeId: string, 
    graph: Map<string, { node: WorkflowNode; dependencies: string[]; dependents: string[] }>,
    nodesToSkip: Set<string>
  ) {
    const nodeData = graph.get(nodeId);
    if (!nodeData) return;
    
    for (const dependent of nodeData.dependents) {
      nodesToSkip.add(dependent);
      this.collectNodesToSkip(dependent, graph, nodesToSkip);
    }
  }

  private logExecution(nodeId: string, nodeType: string, status: string, result?: any, error?: string) {
    this.executionLogs.push({
      nodeId,
      nodeType,
      status,
      result,
      error,
      timestamp: new Date().toISOString()
    });
  }
}

// Export singleton instance
export const workflowEngine = new WorkflowExecutionEngine();

// Helper functions used by registry evaluation and conditions
function getNestedValue(obj: any, path: string): any {
  if (!obj) return undefined;
  // If upstream is Gmail read result, expose first email fields directly
  if (!path.includes('.') && Array.isArray((obj as any).emails) && (obj as any).emails.length > 0) {
    const first = (obj as any).emails[0];
    if (first && Object.prototype.hasOwnProperty.call(first, path)) {
      return first[path];
    }
  }
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function evaluateCondition(config: any, input: any): boolean {
  const { field, operator, value } = config;
  if (!field) return true;
  const fieldValue = getNestedValue(input, field);
  // Support 'today' keyword when comparing dates
  if (field.toLowerCase() === 'date' && fieldValue) {
    const fieldDate = new Date(fieldValue);
    if (!isNaN(fieldDate.getTime()) && typeof value === 'string' && value.toLowerCase() === 'today') {
      const today = new Date();
      const sameDay = fieldDate.getFullYear() === today.getFullYear() &&
        fieldDate.getMonth() === today.getMonth() &&
        fieldDate.getDate() === today.getDate();
      return operator === 'equals' ? sameDay : operator === 'not_equals' ? !sameDay : false;
    }
  }
  switch (operator) {
    case 'equals': return String(fieldValue).toLowerCase() === String(value).toLowerCase();
    case 'not_equals': return String(fieldValue).toLowerCase() !== String(value).toLowerCase();
    case 'contains': return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
    case 'not_contains': return !String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
    case 'starts_with': return String(fieldValue).toLowerCase().startsWith(String(value).toLowerCase());
    case 'ends_with': return String(fieldValue).toLowerCase().endsWith(String(value).toLowerCase());
    case 'greater_than': return Number(fieldValue) > Number(value);
    case 'less_than': return Number(fieldValue) < Number(value);
    case 'is_empty': return !fieldValue || fieldValue === '';
    case 'is_not_empty': return fieldValue && fieldValue !== '';
    default: return true;
  }
}