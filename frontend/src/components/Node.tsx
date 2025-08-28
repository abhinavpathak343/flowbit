import React, { useState } from 'react';
import { WorkflowNode } from '../types/workflow';
import { Mail, Clock, GitBranch, Play, Trash2, Settings } from 'lucide-react';

interface NodeProps {
  node: WorkflowNode;
  isSelected: boolean;
  onMove: (nodeId: string, position: { x: number; y: number }) => void;
  onSelect: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onConnectionStart: (nodeId: string, handleType: string, event: React.MouseEvent) => void;
  onConnectionEnd: (nodeId: string, handleType: string) => void;
}

export const Node: React.FC<NodeProps> = ({
  node,
  isSelected,
  onMove,
  onSelect,
  onDelete,
  onConnectionStart,
  onConnectionEnd,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const getNodeIcon = () => {
    switch (node.type) {
      case 'gmail':
        return <Mail className="w-4 h-4" />;
      case 'schedule':
        return <Clock className="w-4 h-4" />;
      case 'condition':
        return <GitBranch className="w-4 h-4" />;
      case 'trigger':
        return <Play className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const getNodeColor = () => {
    switch (node.type) {
      case 'gmail':
        return 'bg-red-500';
      case 'schedule':
        return 'bg-blue-500';
      case 'condition':
        return 'bg-yellow-500';
      case 'trigger':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
    onSelect(node.id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      onMove(node.id, {
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleOutputMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onConnectionStart(node.id, 'output', e);
  };

  const handleInputMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    onConnectionEnd(node.id, 'input');
  };

  return (
    <div
      className={`absolute select-none cursor-move ${isSelected ? 'z-20' : 'z-10'}`}
      style={{ left: node.position.x, top: node.position.y }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div
        className={`
          relative bg-white rounded-lg shadow-lg border-2 transition-all duration-200
          ${isSelected ? 'border-blue-400 shadow-xl' : 'border-gray-200 hover:border-gray-300'}
          ${isDragging ? 'scale-105' : ''}
        `}
        style={{ width: '200px', minHeight: '80px' }}
      >
        {/* Input handle */}
        {node.type !== 'trigger' && (
          <div
            className="absolute left-0 top-1/2 w-3 h-3 bg-gray-400 rounded-full transform -translate-y-1/2 -translate-x-1/2 cursor-crosshair hover:bg-gray-600 transition-colors"
            onMouseUp={handleInputMouseUp}
          />
        )}

        {/* Output handle */}
        <div
          className="absolute right-0 top-1/2 w-3 h-3 bg-blue-500 rounded-full transform -translate-y-1/2 translate-x-1/2 cursor-crosshair hover:bg-blue-600 transition-colors"
          onMouseDown={handleOutputMouseDown}
        />

        {/* Node header */}
        <div className={`flex items-center px-3 py-2 ${getNodeColor()} text-white rounded-t-lg`}>
          {getNodeIcon()}
          <span className="ml-2 font-medium text-sm">{node.label}</span>
        </div>

        {/* Node content */}
        <div className="p-3">
          <div className="text-xs text-gray-600 mb-2">{node.description}</div>
          {node.config && Object.keys(node.config).length > 0 && (
            <div className="text-xs text-gray-500">
              {Object.entries(node.config).map(([key, value]) => (
                <div key={key} className="truncate">
                  {key}: {String(value)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete button */}
        {isSelected && (
          <button
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.id);
            }}
            title="Delete node"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}

        {/* Execution status indicator */}
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
          <div className={`w-2 h-2 rounded-full ${node.status === 'success' ? 'bg-green-400' : node.status === 'error' ? 'bg-red-400' : node.status === 'running' ? 'bg-blue-400 animate-pulse' : 'bg-gray-300'}`} />
        </div>
      </div>
    </div>
  );
};