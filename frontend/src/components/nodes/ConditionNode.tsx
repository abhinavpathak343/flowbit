import React from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './BaseNode';
import { WorkflowNodeData } from '../../types/workflow';
import { GitBranch } from 'lucide-react';

export const ConditionNode: React.FC<NodeProps<WorkflowNodeData> & { 
  onDelete?: (nodeId: string) => void;
  onConfigure?: (nodeId: string) => void;
}> = (props) => {
  return (
    <BaseNode
      {...props}
      icon={<GitBranch className="w-4 h-4" />}
      color="bg-yellow-500"
    />
  );
};