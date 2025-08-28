import React, { useState, useEffect } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './BaseNode';
import { WorkflowNodeData, NodeData } from '../../types/workflow';
import { Zap, Eye, EyeOff, Database } from 'lucide-react';
import { useDataFlow } from '../../contexts/DataFlowContext';

interface WebhookNodeProps extends NodeProps<WorkflowNodeData> {
  onDelete?: (nodeId: string) => void;
  onConfigure?: (nodeId: string) => void;
}

export const WebhookNode: React.FC<WebhookNodeProps> = (props) => {
  const { getNodeInput, getNodeOutput } = useDataFlow();
  const [showData, setShowData] = useState(false);
  const [receivedData, setReceivedData] = useState<NodeData>({});

  // Get input data from connected nodes
  const inputData = getNodeInput(props.id);

  // Get output data if this node has processed data
  const outputData = getNodeOutput(props.id);

  // Process received data
  useEffect(() => {
    if (inputData.length > 0) {
      const processed = processWebhookData(inputData, props.data.config);
      setReceivedData(processed);
    }
  }, [inputData, props.data.config]);

  const processWebhookData = (inputs: any[], config: any): NodeData => {
    const result: NodeData = {};
    
    inputs.forEach((input, index) => {
      // Process each input source
      const sourceKey = `source_${index + 1}`;
      result[sourceKey] = {
        nodeId: input.sourceNodeId,
        data: input.data,
        timestamp: input.timestamp,
      };

      // Extract specific fields if configured
      if (config.fieldMapping) {
        Object.entries(config.fieldMapping).forEach(([targetField, sourceField]) => {
          if (input.data[sourceField] !== undefined) {
            result[targetField] = input.data[sourceField];
          }
        });
      }
    });

    return result;
  };

  // Custom webhook content to show data flow
  const customContent = (
    <div className="p-3 min-w-[200px]">
      <div className="text-xs text-gray-600 mb-2">{props.data.description}</div>
      
      {/* Configuration Preview */}
      {props.data.config && Object.keys(props.data.config).length > 0 && (
        <div className="text-xs text-gray-500 space-y-1 mb-3">
          {Object.entries(props.data.config).slice(0, 2).map(([key, value]) => (
            <div key={key} className="truncate">
              <span className="font-medium">{key}:</span> {String(value)}
            </div>
          ))}
          {Object.keys(props.data.config).length > 2 && (
            <div className="text-gray-400">+{Object.keys(props.data.config).length - 2} more...</div>
          )}
        </div>
      )}

      {/* Data Flow Information */}
      <div className="space-y-2">
        {/* Input Sources */}
        {inputData.length > 0 && (
          <div className="text-xs text-gray-600">
            <span className="font-medium">Input Sources:</span> {inputData.length} connected
            <div className="mt-1 space-y-1">
              {inputData.map((input, index) => (
                <div key={index} className="text-xs text-gray-500 pl-2">
                  • {input.sourceNodeId.substring(0, 8)}... ({Object.keys(input.data).length} fields)
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Toggle Button */}
        {inputData.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowData(!showData);
            }}
            className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
          >
            {showData ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            <span>{showData ? 'Hide' : 'Show'} Received Data</span>
          </button>
        )}

        {/* Received Data Display */}
        {showData && Object.keys(receivedData).length > 0 && (
          <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
            <div className="text-xs font-medium text-blue-700 mb-2 flex items-center">
              <Database className="w-3 h-3 mr-1" />
              Received Data:
            </div>
            {Object.entries(receivedData).map(([key, value]) => (
              <div key={key} className="text-xs text-blue-600 mb-1">
                <span className="font-medium">{key}:</span> {
                  typeof value === 'object' 
                    ? `${Object.keys(value).length} properties`
                    : Array.isArray(value)
                      ? `${value.length} items`
                      : typeof value === 'string' && value.length > 30
                        ? `${value.substring(0, 30)}...`
                        : String(value)
                }
              </div>
            ))}
          </div>
        )}

        {/* No Data Message */}
        {/* Removed: No data received yet. Connect from other nodes. */}
      </div>
    </div>
  );

  return (
    <BaseNode
      {...props}
      icon={<Zap className="w-4 h-4" />}
      color="bg-purple-500"
      customContent={customContent}
    />
  );
};