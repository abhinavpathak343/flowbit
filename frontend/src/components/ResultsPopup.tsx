import React from 'react';
import { X, CheckCircle, AlertCircle, Brain, Clock, Zap } from 'lucide-react';

export interface ExecutionResult {
  nodeId: string;
  nodeType: string;
  status: 'success' | 'error' | 'running';
  output?: any;
  error?: string;
  processingTime?: number;
  service?: string;
  model?: string;
  tokensUsed?: number;
}

interface ResultsPopupProps {
  isVisible: boolean;
  results: ExecutionResult[];
  onClose: () => void;
}

export const ResultsPopup: React.FC<ResultsPopupProps> = ({
  isVisible,
  results,
  onClose
}) => {
  if (!isVisible) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'running':
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'running':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const formatLLMOutput = (output: any) => {
    if (!output) return 'No output available';

    // If it's already a string, return as-is
    if (typeof output === 'string') return output;

    // Known shapes from previous versions
    const knownText = output.summary || output.reply || output.translated_text || output.result;
    if (typeof knownText === 'string') return knownText;

    // Render extracted info nicely if present
    if (output.extracted_info) {
      const info = output.extracted_info;
      return (
        <div className="space-y-2">
          <div><strong>Key Points:</strong> {Array.isArray(info.key_points) ? info.key_points.join(', ') : (info.key_points || 'N/A')}</div>
          <div><strong>Entities:</strong> {Array.isArray(info.entities) ? info.entities.join(', ') : (info.entities || 'N/A')}</div>
          <div><strong>Sentiment:</strong> {info.sentiment || 'N/A'}</div>
          <div><strong>Topics:</strong> {Array.isArray(info.topics) ? info.topics.join(', ') : (info.topics || 'N/A')}</div>
        </div>
      );
    }

    // Fallback: JSON stringify any object safely
    try {
      return JSON.stringify(output, null, 2);
    } catch {
      return String(output);
    }
  };

  const getNodeTypeLabel = (nodeType: string) => {
    switch (nodeType) {
      case 'llm':
        return 'AI Processing';
      case 'gmail':
        return 'Email';
      case 'webhook':
        return 'Webhook';
      case 'condition':
        return 'Condition';
      case 'schedule':
        return 'Schedule';
      default:
        return nodeType.charAt(0).toUpperCase() + nodeType.slice(1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Brain className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">Workflow Execution Results</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2"
            aria-label="Close results popup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {results.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No execution results available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={result.nodeId + '-' + result.status + '-' + index}
                  className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}
                >
                  {/* Result Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {getNodeTypeLabel(result.nodeType)} Node
                        </h3>
                        <p className="text-sm text-gray-500">ID: {result.nodeId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        result.status === 'success' ? 'bg-green-100 text-green-800' :
                        result.status === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Result Content */}
                  {result.status === 'success' && result.output && (
                    <div className="space-y-3">
                      {/* LLM Specific Info */}
                      {result.nodeType === 'llm' && (
                        <div className="flex items-center space-x-4 text-sm text-gray-600 bg-white p-3 rounded border">
                          {result.service && (
                            <div className="flex items-center space-x-1">
                              <Brain className="w-4 h-4" />
                              <span>{result.service}</span>
                            </div>
                          )}
                          {result.model && (
                            <div className="flex items-center space-x-1">
                              <Zap className="w-4 h-4" />
                              <span>{result.model}</span>
                            </div>
                          )}
                          {result.processingTime && (
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{result.processingTime}ms</span>
                            </div>
                          )}
                          {result.tokensUsed && (
                            <div className="flex items-center space-x-1">
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {result.tokensUsed} tokens
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Output Display */}
                      <div className="bg-white p-4 rounded border">
                        <h4 className="font-medium text-gray-700 mb-2">Output:</h4>
                        <div className="text-gray-800 whitespace-pre-wrap">
                          {result.nodeType === 'llm' 
                            ? formatLLMOutput(result.output)
                            : typeof result.output === 'string' 
                              ? result.output 
                              : JSON.stringify(result.output, null, 2)
                          }
                        </div>
                        {/* Debug: Show raw output for LLM nodes */}
                        {result.nodeType === 'llm' && (
                          <pre className="mt-2 p-2 bg-gray-100 text-xs text-gray-500 rounded border overflow-x-auto">{JSON.stringify(result.output, null, 2)}</pre>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Error Display */}
                  {result.status === 'error' && result.error && (
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <h4 className="font-medium text-red-800 mb-1">Error:</h4>
                      <p className="text-red-700 text-sm">{result.error}</p>
                    </div>
                  )}

                  {/* Running Status */}
                  {result.status === 'running' && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <p className="text-blue-700 text-sm">Processing...</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
