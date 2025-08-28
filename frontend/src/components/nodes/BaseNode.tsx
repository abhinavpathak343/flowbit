import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { WorkflowNodeData } from '../../types/workflow';
import { Trash2 } from 'lucide-react';

interface BaseNodeProps extends NodeProps {
  data: WorkflowNodeData;
  icon: React.ReactNode;
  color: string;
  onDelete?: (nodeId: string) => void;
  onConfigure?: (nodeId: string) => void;
  customContent?: React.ReactNode;
}

export const BaseNode: React.FC<BaseNodeProps> = ({
  id,
  data,
  icon,
  color,
  selected,
  onDelete,
  onConfigure,
  customContent,
}) => {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Always select the node before opening properties
    onConfigure?.(id);
  };
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Only delete, do not open properties
    onDelete?.(id);
  };

  // Removed settings/configure action

  const getStatusColor = () => {
    switch (data.status) {
      case 'running':
        return 'border-blue-400 shadow-blue-200';
      case 'success':
        return 'border-green-400 shadow-green-200';
      case 'error':
        return 'border-red-400 shadow-red-200';
      default:
        return selected ? 'border-blue-400 shadow-blue-200' : 'border-gray-200';
    }
  };

  return (
    <div className={`relative bg-white rounded-lg shadow-lg border-2 transition-all duration-200 ${getStatusColor()}`}>
      {/* Input Handle - only show for non-trigger nodes */}
      {data.nodeType !== 'trigger' && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 !bg-gray-400 !border-2 !border-white hover:!bg-gray-600 transition-colors"
        />
      )}

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white hover:!bg-blue-600 transition-colors"
      />

      {/* Node Header */}
      <div className={`flex items-center px-3 py-2 ${color} text-white rounded-t-lg`}>
        <div className="flex items-center justify-center w-5 h-5 mr-2">
          {icon}
        </div>
        <span className="font-medium text-sm truncate flex-1">{data.label}</span>
        <div className="flex items-center space-x-1 ml-2">
          <button
            onClick={handleEdit}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title="Edit"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-4 1a1 1 0 01-1.263-1.263l1-4a4 4 0 01.828-1.414z" /></svg>
          </button>
          <button
            onClick={handleDelete}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Node Content */}
      {customContent || (
        <div className="p-3 min-w-[200px]">
          <div className="text-xs text-gray-600 mb-2">{data.description}</div>
          
          {/* Configuration Preview */}
          {data.config && Object.keys(data.config).length > 0 && (
            <div className="text-xs text-gray-500 space-y-1">
              {Object.entries(data.config).slice(0, 2).map(([key, value]) => (
                <div key={key} className="truncate">
                  <span className="font-medium">{key}:</span> {String(value)}
                </div>
              ))}
              {Object.keys(data.config).length > 2 && (
                <div className="text-gray-400">+{Object.keys(data.config).length - 2} more...</div>
              )}
            </div>
          )}

          {/* Data Flow Information */}
          {data.inputData && data.inputData.length > 0 && (
            <div className="mt-2 text-xs text-gray-600">
              <span className="font-medium">Input:</span> {data.inputData.length} sources
            </div>
          )}
          
          {data.outputData && (
            <div className="mt-2 text-xs text-gray-600">
              <span className="font-medium">Output:</span> {Object.keys(data.outputData.data).length} fields
            </div>
          )}
        </div>
      )}

      {/* Status Indicator */}
      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
        <div className={`w-2 h-2 rounded-full ${
          data.status === 'success' ? 'bg-green-400' : 
          data.status === 'error' ? 'bg-red-400' : 
          data.status === 'running' ? 'bg-blue-400 animate-pulse' : 
          'bg-gray-300'
        }`} />
      </div>
    </div>
  );
};