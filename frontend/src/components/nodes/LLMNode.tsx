import React, { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { Brain, Eye, EyeOff } from 'lucide-react';
import { WorkflowNode, NodeData } from '../../types/workflow';
import { useDataFlow } from '../../contexts/DataFlowContext';

interface LLMNodeProps {
  data: WorkflowNode['data'];
  selected?: boolean;
  onDelete?: (nodeId: string) => void;
  onConfigure?: (nodeId: string) => void;
  id: string;
}

export const LLMNode: React.FC<LLMNodeProps> = ({ 
  data, 
  selected = false, 
  onDelete, 
  onConfigure,
  id
}) => {
  const { getNodeInput, setNodeOutput } = useDataFlow();
  const [showData, setShowData] = useState(false);
  const [extractedData, setExtractedData] = useState<NodeData>({});

  // Get input data from connected nodes
  const inputData = getNodeInput(id);

  const getFilteredEmailContent = (inputs: any[], config: any): string => {
    // Look for a Gmail node output with filtered emails
    for (const input of inputs) {
      if (input.data && input.data.emails && Array.isArray(input.data.emails)) {
        // If a name filter is set, filter by name
        let filtered = input.data.emails;
        if (config.name) {
          filtered = filtered.filter((email: any) =>
            (email.from && email.from.toLowerCase().includes(config.name.toLowerCase())) ||
            (email.to && email.to.toLowerCase().includes(config.name.toLowerCase()))
          );
        }
        if (config.label) {
          filtered = filtered.filter((email: any) =>
            email.label && email.label.toLowerCase().includes(config.label.toLowerCase())
          );
        }
        if (config.subject) {
          filtered = filtered.filter((email: any) =>
            email.subject && email.subject.toLowerCase().includes(config.subject.toLowerCase())
          );
        }
        if (config.hasAttachment !== undefined && config.hasAttachment !== '') {
          filtered = filtered.filter((email: any) =>
            !!email.hasAttachment === config.hasAttachment
          );
        }
        // Use the first matching email's content
        if (filtered.length > 0) {
          return filtered[0].content || '';
        }
      }
    }
    // Fallback: use any available content
    for (const input of inputs) {
      if (input.data && input.data.content) {
        return input.data.content;
      }
    }
    return '';
  };

  const processLLMData = (inputs: any[], config: any): NodeData => {
    // Simulate LLM processing based on action type
    const result: NodeData = {};
    
    if (config.action === 'extract') {
      // Extract emails from input data - handle both content and emails fields
      let textContent = getFilteredEmailContent(inputs, config);
      if (textContent) {
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const emails = textContent.match(emailRegex) || [];
        result.extractedEmails = emails;
        result.emailCount = emails.length;
        result.sourceContent = textContent.substring(0, 100) + '...';
        result.sourceNode = inputs.find(input => input.data && input.data.content)?.sourceNodeId;
      }
    } else if (config.action === 'summarize') {
      const content = getFilteredEmailContent(inputs, config);
      result.summary = `Summary: ${content.substring(0, 100)}...`;
    } else if (config.action === 'reply') {
      const content = getFilteredEmailContent(inputs, config);
      result.reply = `Reply to: ${content.substring(0, 100)}...`;
    }

    return result;
  };

  // Simulate LLM processing and data extraction
  useEffect(() => {
    if (inputData.length > 0) {
      // Process input data and extract information
      const processedData = processLLMData(inputData, data.config);
      setExtractedData(processedData);
      
      // Set output data for downstream nodes
      setNodeOutput(id, processedData, {
        action: data.config.action,
        model: data.config.model,
        source: 'llm',
      });
    }
  }, [inputData, data.config, id, setNodeOutput]);

  const getStatusColor = () => {
    switch (data.status) {
      case 'running':
        return 'border-blue-500 bg-blue-50';
      case 'success':
        return 'border-green-500 bg-green-50';
      case 'error':
        return 'border-red-500 bg-red-50';
      default:
        return 'border-gray-300 bg-white';
    }
  };

  const getActionLabel = () => {
    switch (data.config.action) {
      case 'summarize':
        return 'Summarize';
      case 'reply':
        return 'Reply Formation';
      case 'extract':
        return 'Extract Info';
      case 'translate':
        return 'Translate';
      default:
        return 'LLM';
    }
  };

  return (
    <div
      className={`min-w-[200px] p-4 rounded-lg border-2 shadow-md transition-all duration-200 ${getStatusColor()} ${
        selected ? 'ring-2 ring-blue-400 ring-offset-2' : ''
      }`}
      onClick={() => onConfigure?.(id)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-pink-500 text-white rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-sm text-gray-800">
              {getActionLabel()}
            </div>
            <div className="text-xs text-gray-500">
              {data.config.model || 'gpt-3.5-turbo'}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowData(!showData);
            }}
            className="text-gray-400 hover:text-blue-500 transition-colors p-1"
            title="Toggle data view"
          >
            {showData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(id);
              }}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
              aria-label="Delete node"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs text-gray-600">
          <span className="font-medium">Action:</span> {data.config.action || 'summarize'}
        </div>
        {data.config.input && (
          <div className="text-xs text-gray-600">
            <span className="font-medium">Input:</span> {data.config.input.substring(0, 30)}...
          </div>
        )}
      
        
        
        {/* Input Data Preview */}
        {inputData.length > 0 && (
          <div className="text-xs text-gray-600">
            <span className="font-medium">Input Sources:</span> {inputData.length} connected
          </div>
        )}

        {/* Extracted Data Display */}
        {showData && Object.keys(extractedData).length > 0 && (
          <div className="mt-3 p-2 bg-gray-50 rounded border">
            <div className="text-xs font-medium text-gray-700 mb-2">Extracted Data:</div>
            {Object.entries(extractedData).map(([key, value]) => (
              <div key={key} className="text-xs text-gray-600 mb-1">
                <span className="font-medium">{key}:</span> {
                  Array.isArray(value) 
                    ? `${value.length} items` 
                    : typeof value === 'string' && value.length > 50 
                      ? `${value.substring(0, 50)}...` 
                      : String(value)
                }
              </div>
            ))}
          </div>
        )}

        
      </div>

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-pink-500 border-2 border-white"
      />

      {/* Status indicator */}
      {data.status !== 'idle' && (
        <div className="absolute -top-2 -right-2">
          <div className={`w-4 h-4 rounded-full ${
            data.status === 'running' ? 'bg-blue-500 animate-pulse' :
            data.status === 'success' ? 'bg-green-500' :
            data.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
          }`} />
        </div>
      )}
    </div>
  );
};
