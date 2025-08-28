import React from 'react';
import { NodeType, NodeTemplate } from '../types/workflow';
import { Mail, Clock, GitBranch, Zap, Play, Filter, Timer, Shuffle, Brain } from 'lucide-react';

interface NodePaletteProps {
  onNodeDragStart: (nodeType: NodeType) => void;
}

export const NodePalette: React.FC<NodePaletteProps> = ({ onNodeDragStart }) => {
  const nodeTemplates: NodeTemplate[] = [
   
    {
      type: 'gmail',
      label: 'Gmail',
      description: 'Send, read, or manage emails',
      icon: <Mail className="w-5 h-5" />,
      color: 'bg-red-500',
      category: 'action',
      defaultConfig: { action: 'read' },
    },
    {
      type: 'webhook',
      label: 'Webhook',
      description: 'HTTP requests and API calls',
      icon: <Zap className="w-5 h-5" />,
      color: 'bg-purple-500',
      category: 'action',
      defaultConfig: { method: 'POST' },
    },
    {
      type: 'condition',
      label: 'If/Else',
      description: 'Conditional logic and branching',
      icon: <GitBranch className="w-5 h-5" />,
      color: 'bg-yellow-500',
      category: 'logic',
      defaultConfig: { operator: 'equals' },
    },
    
    
    {
      type: 'llm',
      label: 'LLM',
      description: 'AI-powered text processing and generation',
      icon: <Brain className="w-5 h-5" />,
      color: 'bg-pink-500',
      category: 'action',
  defaultConfig: { action: 'summarize', input: ''},
    },
  ];

  // Group nodes by category
  const nodesByCategory = nodeTemplates.reduce((acc, node) => {
    if (!acc[node.category]) {
      acc[node.category] = [];
    }
    acc[node.category].push(node);
    return acc;
  }, {} as Record<string, NodeTemplate[]>);

  const handleDragStart = (e: React.DragEvent, nodeType: NodeType) => {
    e.dataTransfer.setData('application/reactflow', nodeType);
    e.dataTransfer.effectAllowed = 'move';
    onNodeDragStart(nodeType);
  };

  const categoryLabels = {
    trigger: 'TRIGGERS',
    action: 'ACTIONS',
    logic: 'LOGIC',
    utility: 'UTILITY',
  };

  const categoryOrder = ['trigger', 'action', 'logic', 'utility'];

  return (
    <div className="w-72 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4 space-y-6">
        {categoryOrder.map((category) => {
          const nodes = nodesByCategory[category];
          if (!nodes) return null;

          return (
            <div key={category}>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                {categoryLabels[category as keyof typeof categoryLabels]}
              </h3>
              
              <div className="space-y-2">
                {nodes.map((nodeTemplate) => (
                  <div
                    key={nodeTemplate.type}
                    className="group flex items-center p-3 bg-gray-50 rounded-lg cursor-move hover:bg-gray-100 transition-all duration-200 border border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    draggable
                    onDragStart={(e) => handleDragStart(e, nodeTemplate.type)}
                  >
                    <div className={`w-10 h-10 ${nodeTemplate.color} text-white rounded-lg flex items-center justify-center mr-3 group-hover:scale-105 transition-transform`}>
                      {nodeTemplate.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-800 truncate">{nodeTemplate.label}</div>
                      <div className="text-xs text-gray-600 truncate">{nodeTemplate.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};