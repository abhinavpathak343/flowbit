import React from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './BaseNode';
import { WorkflowNodeData } from '../../types/workflow';
import { Mail } from 'lucide-react';

export const GmailNode: React.FC<NodeProps<WorkflowNodeData> & { 
  onDelete?: (nodeId: string) => void;
  onConfigure?: (nodeId: string) => void;
}> = (props) => {
  return (
    <BaseNode
      {...props}
      icon={<Mail className="w-4 h-4" />}
      color="bg-red-500"
    />
  );
};