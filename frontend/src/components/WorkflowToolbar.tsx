import React from 'react';
import { Play, Save, Upload, Download, Trash2, Zap } from 'lucide-react';

interface WorkflowToolbarProps {
  onExecute: () => void;
  onSave: () => void;
  onLoad: () => void;
  onClear: () => void;
  isExecuting: boolean;
  onViewResults?: () => void;
  hasResults?: boolean;
}

export const WorkflowToolbar: React.FC<WorkflowToolbarProps> = ({
  onExecute,
  onSave,
  onLoad,
  onClear,
  isExecuting,
  onViewResults,
  hasResults,
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-1">
        <h1 className="text-xl font-bold text-gray-800 mr-6">FlowBitAi</h1>
        
        <button
          onClick={onExecute}
          disabled={isExecuting}
          className={`px-4 py-2 rounded-lg flex items-center transition-all ${
            isExecuting 
              ? 'bg-orange-100 text-orange-700 cursor-not-allowed' 
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {isExecuting ? <Zap className="w-4 h-4 mr-2 animate-pulse" /> : <Play className="w-4 h-4 mr-2" />}
          {isExecuting ? 'Executing...' : 'Execute'}
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-2" />
        
        <button
          onClick={onSave}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg flex items-center transition-colors"
        >
          <Save className="w-4 h-4 mr-2" />
          Save
        </button>
        
        
        
        <button
          onClick={onClear}
          className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center transition-colors"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear
        </button>
        
        {hasResults && onViewResults && (
          <>
            <div className="w-px h-6 bg-gray-300 mx-2" />
            <button
              onClick={onViewResults}
              className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg flex items-center transition-colors"
            >
              <Zap className="w-4 h-4 mr-2" />
              View Results
            </button>
          </>
        )}
      </div>
      
          
    </div>
  );
};