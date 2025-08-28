import React from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './BaseNode';
import { WorkflowNodeData } from '../../types/workflow';
import { Play } from 'lucide-react';

export const TriggerNode: React.FC<NodeProps<WorkflowNodeData> & { 
  onDelete?: (nodeId: string) => void;
  onConfigure?: (nodeId: string) => void;
}> = (props) => {
  return (
    <BaseNode
      {...props}
      icon={<Play className="w-4 h-4" />}
      color="bg-green-500"
    />
  );
};