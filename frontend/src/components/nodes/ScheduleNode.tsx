import React from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './BaseNode';
import { WorkflowNodeData } from '../../types/workflow';
import { Clock } from 'lucide-react';

export const ScheduleNode: React.FC<NodeProps<WorkflowNodeData> & { 
  onDelete?: (nodeId: string) => void;
  onConfigure?: (nodeId: string) => void;
}> = (props) => {
  return (
    <BaseNode
      {...props}
      icon={<Clock className="w-4 h-4" />}
      color="bg-blue-500"
    />
  );
};