import { useState, useCallback } from 'react';
import { WorkflowNode, WorkflowEdge, NodeType, NodeStatus } from '../types/workflow';

export const useWorkflow = () => {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const getNodeDefaults = (type: NodeType) => {
    const defaults = {
      trigger: {
        label: 'Trigger',
        description: 'Start workflow execution',
        config: { triggerType: 'manual' },
      },
      gmail: {
        label: 'Gmail',
        description: 'Send, read, or manage emails',
        config: { action: 'read' },
      },
      schedule: {
        label: 'Schedule',
        description: 'Time-based scheduling and delays',
        config: { scheduleType: 'delay', delay: 5, delayUnit: 'minutes' },
      },
      condition: {
        label: 'If/Else',
        description: 'Conditional logic and branching',
        config: { operator: 'equals', field: '', value: '' },
      },
      webhook: {
        label: 'Webhook',
        description: 'HTTP requests and API calls',
        config: { method: 'POST', url: '', headers: '{\n  "Content-Type": "application/json"\n}', body: '{}' },
      },
      filter: {
        label: 'Filter',
        description: 'Filter data based on conditions',
        config: { filterType: 'text', field: '', value: '' },
      },
      delay: {
        label: 'Delay',
        description: 'Add time delays to workflow',
        config: { delay: 5, delayUnit: 'minutes' },
      },
      transform: {
        label: 'Transform',
        description: 'Transform data format or structure',
        config: { transformType: 'json', inputFormat: '', outputFormat: '' },
      },
      llm: {
  label: 'LLM',
  description: 'AI-powered text processing and generation',
  config: { action: 'summarize', input: '', service: 'openai', model: 'gpt-3.5-turbo' },
      },
    };

    return defaults[type] || { label: 'Unknown', description: 'Unknown node type', config: {} };
  };

  const addNode = useCallback((position: { x: number; y: number }, type: NodeType) => {
    const nodeDefaults = getNodeDefaults(type);
    
    const newNode: WorkflowNode = {
      id: `${type}_${Date.now()}`,
      type: type,
      position,
      data: {
        label: nodeDefaults.label,
        description: nodeDefaults.description,
        config: nodeDefaults.config,
        status: 'idle',
        nodeType: type,
      },
    };

    setNodes(prev => [...prev, newNode]);
    return newNode.id;
  }, []);

  const updateNode = useCallback((nodeId: string, updates: Partial<WorkflowNode>) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    ));
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    setEdges(prev => prev.filter(edge => 
      edge.source !== nodeId && edge.target !== nodeId
    ));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  }, [selectedNodeId]);

  const updateNodeStatus = useCallback((nodeId: string, status: NodeStatus) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { ...node, data: { ...node.data, status } }
        : node
    ));
  }, []);

  const executeWorkflow = useCallback(async () => {
    if (nodes.length === 0) return;

    setIsExecuting(true);
    
    // Reset all node statuses
    setNodes(prev => prev.map(node => ({ 
      ...node, 
      data: { ...node.data, status: 'idle' as NodeStatus }
    })));

    try {
      // Make actual HTTP request to backend
      const response = await fetch('http://localhost:3000/api/workflow/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodes: nodes.map(node => ({
            id: node.id,
            type: node.data.nodeType,
            config: node.data.config
          })),
          edges: edges
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Backend execution result:', result);

      // Update node statuses based on backend response
      if (result.logs) {
        result.logs.forEach((log: any) => {
          if (log.nodeId) {
            updateNodeStatus(log.nodeId, log.status === 'success' ? 'success' : 
                          log.status === 'error' ? 'error' : 'running');
          }
        });
      }

      // Return success result for the caller to handle
      return { success: true, result };
      
    } catch (error) {
      console.error('Workflow execution failed:', error);
      
      // Mark all nodes as error
      setNodes(prev => prev.map(node => ({ 
        ...node, 
        data: { ...node.data, status: 'error' as NodeStatus }
      })));
      
      // Re-throw error for the caller to handle
      throw error;
    } finally {
      setIsExecuting(false);
    }
  }, [nodes, edges]);

  const executeNodeChain = async (nodeId: string): Promise<any> => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return null;

    updateNodeStatus(nodeId, 'running');

    try {
      // Simulate node execution
      await new Promise(resolve => setTimeout(resolve, 1000));

      let result = null;
      
      switch (node.data.nodeType) {
        case 'gmail':
          result = await executeGmailNode(node);
          break;
        case 'schedule':
          result = await executeScheduleNode(node);
          break;
        case 'condition':
          result = await executeConditionNode(node);
          break;
        case 'webhook':
          result = await executeWebhookNode(node);
          break;
        case 'llm':
          result = await executeLLMNode(node);
          break;
        default:
          result = { executed: true };
      }

      updateNodeStatus(nodeId, 'success');

      // Find and execute connected nodes
      const outgoingEdges = edges.filter(edge => edge.source === nodeId);
      
      for (const edge of outgoingEdges) {
        await executeNodeChain(edge.target);
      }

      return result;
    } catch (error) {
      updateNodeStatus(nodeId, 'error');
      throw error;
    }
  };

  const executeGmailNode = async (node: WorkflowNode) => {
    const { config } = node.data;
    console.log('Executing Gmail node:', config);
    
    switch (config.action) {
      case 'send':
        return { emailSent: true, to: config.to, subject: config.subject };
      case 'schedule':
        return { emailScheduled: true, scheduledFor: config.scheduleTime };
      case 'filter':
        return { emailsFiltered: true, criteria: config.filter };
      default:
        return { executed: true };
    }
  };

  const executeScheduleNode = async (node: WorkflowNode) => {
    const { config } = node.data;
    console.log('Executing Schedule node:', config);
    
    if (config.scheduleType === 'delay' && config.delay) {
      return { delayed: config.delay, unit: config.delayUnit };
    }
    
    return { scheduled: true };
  };

  const executeConditionNode = async (node: WorkflowNode) => {
    const { config } = node.data;
    console.log('Executing Condition node:', config);
    
    const conditionResult = evaluateCondition(config);
    return { conditionMet: conditionResult };
  };

  const executeWebhookNode = async (node: WorkflowNode) => {
    const { config } = node.data;
    console.log('Executing Webhook node:', config);
    
    return { webhookCalled: true, method: config.method, url: config.url };
  };

  const executeLLMNode = async (node: WorkflowNode) => {
    const { config } = node.data;
    console.log('Executing LLM node:', config);
    try {
      const response = await fetch('http://localhost:3000/api/llm/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: config.action,
          input: config.input,
          model: config.model || 'gpt-3.5-turbo',
          service: config.service || 'openai'
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'LLM request failed');
      // Return the generated response from backend (Gemini)
      return result;
    } catch (error) {
      console.error('LLM node execution failed:', error);
      return { success: false, error: error.message };
    }
  };

  const executeNode = async (node: WorkflowNode): Promise<any> => {
    console.log('Executing node:', node.id, node.data.nodeType);
    
    switch (node.data.nodeType) {
      case 'gmail':
        return executeGmailNode(node);
      case 'schedule':
        return executeScheduleNode(node);
      case 'condition':
        return executeConditionNode(node);
      case 'webhook':
        return executeWebhookNode(node);
      case 'trigger':
        return executeTriggerNode(node);
      case 'filter':
        return executeFilterNode(node);
      case 'delay':
        return executeDelayNode(node);
              case 'transform':
          return executeTransformNode(node);
        case 'llm':
          return executeLLMNode(node);
        default:
          console.warn('Unknown node type:', node.data.nodeType);
          return { executed: true };
      }
  };

  const executeTriggerNode = async (node: WorkflowNode) => {
    const { config } = node.data;
    console.log('Executing Trigger node:', config);
    
    // Trigger nodes are typically just entry points
    return { triggered: true, triggerType: config.triggerType };
  };

  const executeFilterNode = async (node: WorkflowNode) => {
    const { config } = node.data;
    console.log('Executing Filter node:', config);
    
    // This would typically filter data based on the configuration
    // For now, return a simple filtered result
    return { filtered: true, filterType: config.filterType, field: config.field, value: config.value };
  };

  const executeDelayNode = async (node: WorkflowNode) => {
    const { config } = node.data;
    console.log('Executing Delay node:', config);
    
    if (config.delay && config.delayUnit) {
      const delayMs = config.delay * (config.delayUnit === 'seconds' ? 1000 : 
                                    config.delayUnit === 'minutes' ? 60000 : 
                                    config.delayUnit === 'hours' ? 3600000 : 86400000);
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return { delayed: config.delay, unit: config.delayUnit };
    }
    
    return { delayed: 0 };
  };

  const executeTransformNode = async (node: WorkflowNode) => {
    const { config } = node.data;
    console.log('Executing Transform node:', config);
    
    // This would typically transform data from one format to another
    // For now, return a simple transformation result
    return { transformed: true, transformType: config.transformType, inputFormat: config.inputFormat, outputFormat: config.outputFormat };
  };


  const evaluateCondition = (config: any) => {
    const { field, operator, value } = config;
    
    if (!field) return true; // Default to true if no field specified
    
    // Get field value from input (support nested paths like 'email.subject')
    const fieldValue = getNestedValue(config.input || {}, field);
    
    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'not_equals':
        return fieldValue !== value;
      case 'contains':
        return String(fieldValue).includes(String(value));
      case 'not_contains':
        return !String(fieldValue).includes(String(value));
      case 'starts_with':
        return String(fieldValue).startsWith(String(value));
      case 'ends_with':
        return String(fieldValue).endsWith(String(value));
      case 'greater_than':
        return Number(fieldValue) > Number(value);
      case 'less_than':
        return Number(fieldValue) < Number(value);
      case 'is_empty':
        return !fieldValue || fieldValue === '';
      case 'is_not_empty':
        return fieldValue && fieldValue !== '';
      default:
        return true;
    }
  };

  // Helper function to get nested value from object
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const saveWorkflow = useCallback(() => {
    const workflow = {
      id: 'workflow_' + Date.now(),
      name: 'My Workflow',
      nodes,
      edges,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem('workflow', JSON.stringify(workflow));
    console.log('Workflow saved');
  }, [nodes, edges]);

  const loadWorkflow = useCallback(() => {
    try {
      const saved = localStorage.getItem('workflow');
      if (saved) {
        const workflow = JSON.parse(saved);
        setNodes(workflow.nodes || []);
        setEdges(workflow.edges || []);
        console.log('Workflow loaded');
      }
    } catch (error) {
      console.error('Error loading workflow:', error);
    }
  }, []);

  const clearWorkflow = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
  }, []);

  return {
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
  };
};