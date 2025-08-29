import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Node } from 'reactflow';
import { Settings, X } from 'lucide-react';
import { useWorkflow } from '../hooks/useWorkflow';

interface PropertiesPanelProps {
  node: Node | null;
  onNodeUpdate: (nodeId: string, updates: Partial<Node>) => void;
  onDelete: (nodeId: string) => void;
  onClose: () => void;
}

// Move node type configurations outside component to prevent recreation
const NODE_CONFIGS = {
  gmail: {
    actions: [
      { value: 'send', label: 'Send Email' },
      { value: 'read', label: 'Read Email' },
      { value: 'schedule', label: 'Schedule Email' },
      { value: 'filter', label: 'Filter Emails' },
      { value: 'reply', label: 'Reply to Email' }
    ],
    fields: [
      { key: 'to', type: 'email', label: 'To Address', placeholder: 'recipient@example.com' },
      { key: 'subject', type: 'text', label: 'Subject', placeholder: 'Email subject' },
      { key: 'message', type: 'textarea', label: 'Message', placeholder: 'Email message content' }
    ]
  },
  schedule: {
    types: [
      { value: 'delay', label: 'Delay' },
      { value: 'specific', label: 'Specific Time' },
      { value: 'recurring', label: 'Recurring' },
      { value: 'cron', label: 'Cron Expression' }
    ]
  },
  condition: {
    operators: [
      { value: 'equals', label: 'Equals' },
      { value: 'not_equals', label: 'Not Equals' },
      { value: 'contains', label: 'Contains' },
      { value: 'not_contains', label: 'Does Not Contain' },
      { value: 'starts_with', label: 'Starts With' },
      { value: 'ends_with', label: 'Ends With' },
      { value: 'greater_than', label: 'Greater Than' },
      { value: 'less_than', label: 'Less Than' },
      { value: 'is_empty', label: 'Is Empty' },
      { value: 'is_not_empty', label: 'Is Not Empty' }
    ]
  },
  webhook: {
    methods: [
      { value: 'GET', label: 'GET' },
      { value: 'POST', label: 'POST' },
      { value: 'PUT', label: 'PUT' },
      { value: 'PATCH', label: 'PATCH' },
      { value: 'DELETE', label: 'DELETE' }
    ]
  },
  llm: {
    actions: [
      { value: 'summarize', label: 'Summarize Text' },
      { value: 'reply', label: 'Generate Reply' },
      { value: 'extract', label: 'Extract Information' },
      { value: 'translate', label: 'Translate Text' }
    ],
    services: [
      { value: 'openai', label: 'OpenAI' },
    ],
    models: {
      openai: [
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
       
      ]
    }
  }
};

const CONDITION_FIELDS = [
  { key: 'from', label: 'From', type: 'string' },    // Changed from 'name'
  { key: 'to', label: 'To', type: 'string' },
  { key: 'subject', label: 'Subject', type: 'string' },
  { key: 'hasAttachment', label: 'Has Attachment', type: 'boolean' },
  { key: 'label', label: 'Label', type: 'string' },
];

// GmailConfig: Updated to use 'from' instead of 'name' and add missing fields
const GmailConfig: React.FC<{
  config: any;
  onConfigChange: (key: string, value: any) => void;
  connected: boolean;
  onConnect: () => void;
}> = React.memo(({ config, onConfigChange, connected, onConnect }) => {
  const handleConnect = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/google/url');
      const data = await res.json();
      const authWindow = window.open(data.url, '_blank', 'width=500,height=700');
      const poll = setInterval(async () => {
        try {
          const s = await fetch('/api/auth/status');
          const sd = await s.json();
          if (sd.connected) {
            clearInterval(poll);
            onConnect();
            authWindow?.close();
          }
        } catch {}
      }, 1200);
    } catch (e) {}
  }, [onConnect]);

  return (
    <div className="space-y-4">
      {/* Action Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
        <select
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          value={config.action || 'read'}
          onChange={(e) => onConfigChange('action', e.target.value)}
        >
          {NODE_CONFIGS.gmail.actions.map(action => (
            <option key={action.value} value={action.value}>{action.label}</option>
          ))}
        </select>
      </div>

      {/* Filters for 'read' action */}
      {config.action === 'read' && (
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">From (Sender)</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded text-sm"
              placeholder="e.g. john@example.com or John Doe"
              value={config.from || ''}
              onChange={e => onConfigChange('from', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">To (Recipient)</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded text-sm"
              placeholder="e.g. me@example.com"
              value={config.to || ''}
              onChange={e => onConfigChange('to', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded text-sm"
              placeholder="e.g. Meeting, Invoice"
              value={config.subject || ''}
              onChange={e => onConfigChange('subject', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Has Attachment</label>
            <select
              className="w-full p-2 border border-gray-300 rounded text-sm"
              value={config.hasAttachment === true ? 'true' : config.hasAttachment === false ? 'false' : ''}
              onChange={e => onConfigChange('hasAttachment', e.target.value === 'true' ? true : e.target.value === 'false' ? false : undefined)}
            >
              <option value="">Any</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Max Results</label>
            <input
              type="number"
              className="w-full p-2 border border-gray-300 rounded text-sm"
              placeholder="10"
              min="1"
              max="100"
              value={config.maxResults || ''}
              onChange={e => onConfigChange('maxResults', e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>
        </div>
      )}

      {/* Dynamic Fields for other actions */}
      {config.action && config.action !== 'read' && NODE_CONFIGS.gmail.fields.map(field => (
        <div key={field.key}>
          <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
          {field.type === 'textarea' ? (
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
              rows={4}
              value={config[field.key] || ''}
              onChange={(e) => onConfigChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              aria-label={field.label}
            />
          ) : (
            <input
              type={field.type}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus-border-transparent transition-colors"
              value={config[field.key] || ''}
              onChange={(e) => onConfigChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              aria-label={field.label}
            />
          )}
        </div>
      ))}

      {/* Connection Status */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Gmail Connection</span>
          <span className={`text-sm ${connected ? 'text-green-600' : 'text-red-600'}`}>{connected ? 'Connected' : 'Not Connected'}</span>
        </div>
        {!connected && (
          <button
            onClick={handleConnect}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Connect Gmail
          </button>
        )}
      </div>
    </div>
  );
});

// Condition configuration component
const ConditionConfig: React.FC<{
  config: any;
  onConfigChange: (key: string, value: any) => void;
}> = React.memo(({ config, onConfigChange }) => {
  const [conditions, setConditions] = useState(config.conditions || []);
  const [operator, setOperator] = useState(config.operator || 'AND');

  const addCondition = () => {
    const newCondition = { field: '', operator: 'equals', value: '' };
    const newConditions = [...conditions, newCondition];
    setConditions(newConditions);
    onConfigChange('conditions', newConditions);
  };

  const removeCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    setConditions(newConditions);
    onConfigChange('conditions', newConditions);
  };

  const updateCondition = (index: number, key: string, value: any) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], [key]: value };
    setConditions(newConditions);
    onConfigChange('conditions', newConditions);
  };

  return (
    <div className="space-y-4">
      {/* Operator Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Logic Operator</label>
        <select
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus-border-transparent transition-colors"
          value={operator}
          onChange={(e) => {
            setOperator(e.target.value);
            onConfigChange('operator', e.target.value);
          }}
        >
          <option value="AND">AND (All conditions must be true)</option>
          <option value="OR">OR (Any condition can be true)</option>
        </select>
      </div>

      {/* Conditions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Conditions</label>
          <button
            onClick={addCondition}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Add Condition
          </button>
        </div>
        {conditions.map((condition, index) => {
          const selectedField = CONDITION_FIELDS.find(f => f.key === condition.field);
          return (
            <div key={index} className="border rounded-lg p-3 mb-3">
              <div className="grid grid-cols-3 gap-2 mb-2">
                {/* Field Dropdown */}
                <select
                  className="p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  value={condition.field || ''}
                  onChange={e => updateCondition(index, 'field', e.target.value)}
                >
                  <option value="">Select field…</option>
                  {CONDITION_FIELDS.map(f => (
                    <option key={f.key} value={f.key}>{f.label}</option>
                  ))}
                </select>
                {/* Operator Dropdown */}
                <select
                  className="p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus-border-transparent"
                  value={condition.operator || 'equals'}
                  onChange={e => updateCondition(index, 'operator', e.target.value)}
                >
                  {NODE_CONFIGS.condition.operators.map(op => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>
                {/* Value Input */}
                {selectedField?.type === 'boolean' ? (
                  <select
                    className="p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus-border-transparent"
                    value={condition.value === true ? 'true' : condition.value === false ? 'false' : ''}
                    onChange={e => updateCondition(index, 'value', e.target.value === 'true')}
                  >
                    <option value="">Select…</option>
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    className="p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus-border-transparent"
                    placeholder="Value"
                    value={condition.value || ''}
                    onChange={e => updateCondition(index, 'value', e.target.value)}
                    disabled={['is_empty', 'is_not_empty'].includes(condition.operator)}
                  />
                )}
              </div>
              <button
                onClick={() => removeCondition(index)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// LLM configuration component
const LLMConfig: React.FC<{
  config: any;
  onConfigChange: (key: string, value: any) => void;
}> = React.memo(({ config, onConfigChange }) => {
  const [selectedService, setSelectedService] = useState(config.service || 'openai');

  return (
    <div className="space-y-4">
      {/* Action Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
        <select
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          value={config.action || 'summarize'}
          onChange={(e) => onConfigChange('action', e.target.value)}
        >
          {NODE_CONFIGS.llm.actions.map(action => (
            <option key={action.value} value={action.value}>{action.label}</option>
          ))}
        </select>
      </div>

      {/* Service Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Service</label>
        <select
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          value={selectedService}
          onChange={(e) => {
            setSelectedService(e.target.value);
            onConfigChange('service', e.target.value);
            onConfigChange('model', ''); // Reset model when service changes
          }}
        >
          {NODE_CONFIGS.llm.services.map(service => (
            <option key={service.value} value={service.value}>{service.label}</option>
          ))}
        </select>
      </div>

      {/* Model Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
        <select
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          value={config.model || ''}
          onChange={(e) => onConfigChange('model', e.target.value)}
        >
          {NODE_CONFIGS.llm.models[selectedService]?.map((model: any) => (
            <option key={model.value} value={model.value}>{model.label}</option>
          ))}
        </select>
      </div>

      {/* Input / Prompt */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {config.action === 'reply' ? 'Prompt' : 'Input Text'}
        </label>
        <textarea
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
          rows={4}
          value={config.action === 'reply' ? (config.customPrompt || '') : (config.input || '')}
          onChange={(e) => onConfigChange(config.action === 'reply' ? 'customPrompt' : 'input', e.target.value)}
          placeholder={config.action === 'reply' ? 'Enter your custom prompt...' : 'Enter text to process...'}
        />
      </div>
    </div>
  );
});

// Webhook configuration component
const WebhookConfig: React.FC<{
  config: any;
  onConfigChange: (key: string, value: any) => void;
}> = React.memo(({ config, onConfigChange }) => {
  return (
    <div className="space-y-4">
      {/* URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">URL</label>
        <input
          type="url"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          value={config.url || ''}
          onChange={(e) => onConfigChange('url', e.target.value)}
          placeholder="https://api.example.com/webhook"
        />
      </div>

      {/* Method */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">HTTP Method</label>
        <select
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          value={config.method || 'POST'}
          onChange={(e) => onConfigChange('method', e.target.value)}
        >
          {NODE_CONFIGS.webhook.methods.map(method => (
            <option key={method.value} value={method.value}>{method.label}</option>
          ))}
        </select>
      </div>

      {/* Authentication */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Authentication</label>
        <select
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          value={config.auth || 'none'}
          onChange={(e) => onConfigChange('auth', e.target.value)}
        >
          <option value="none">None</option>
          <option value="basic">Basic Auth</option>
          <option value="bearer">Bearer Token</option>
          <option value="api_key">API Key</option>
        </select>
      </div>

      {/* Headers */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Headers</label>
        <textarea
          className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm"
          rows={3}
          value={config.headers || ''}
          onChange={(e) => onConfigChange('headers', e.target.value)}
          placeholder='{"Content-Type": "application/json"}'
        />
      </div>

      {/* Body */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Body (JSON)</label>
        <textarea
          className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm"
          rows={4}
          value={config.body || ''}
          onChange={(e) => onConfigChange('body', e.target.value)}
          placeholder='{"key": "value"}'
        />
      </div>
    </div>
  );
});

// Main PropertiesPanel component
export const PropertiesPanel: React.FC<PropertiesPanelProps> = React.memo(({
  node,
  onNodeUpdate,
  onDelete,
  onClose
}) => {
  const [connected, setConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Memoize the config object to prevent unnecessary re-renders
  const config = useMemo(() => node?.data?.config || {}, [node?.data?.config]);
  
  // Memoize the label to prevent unnecessary re-renders
  const label = useMemo(() => node?.data?.label || '', [node?.data?.label]);

  // Check connection status on mount and when node changes
  useEffect(() => {
    if (node?.id) {
      checkConnectionStatus();
    }
  }, [node?.id]);

  const checkConnectionStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/status');
      const data = await response.json();
      setConnected(data.connected || false);
    } catch (error) {
      setConnected(false);
    }
  }, []);

  // Memoize the config change handler
  const handleConfigChange = useCallback((key: string, value: any) => {
    if (node) {
      const newConfig = { ...config, [key]: value };
      onNodeUpdate(node.id, {
        data: { ...node.data, config: newConfig }
      });
    }
  }, [node, config, onNodeUpdate]);

  // Memoize the label change handler
  const handleLabelChange = useCallback((newLabel: string) => {
    if (node) {
      onNodeUpdate(node.id, {
        data: { ...node.data, label: newLabel }
      });
    }
  }, [node, onNodeUpdate]);

  // Memoize the save handler
  const handleSave = useCallback(() => {
    if (node) {
      onNodeUpdate(node.id, {
        data: { ...node.data, config }
      });
    }
  }, [node, config, onNodeUpdate]);

  // Memoize the connect handler
  const handleConnect = useCallback(() => {
    setConnected(true);
    checkConnectionStatus();
  }, [checkConnectionStatus]);

  // Memoize the disconnect handler
  const handleDisconnect = useCallback(async () => {
    try {
      await fetch('/api/auth/clear', { method: 'POST' });
      setConnected(false);
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  }, []);

  // Early return if no node
  if (!node) {
    return null;
  }

  // Memoize the configuration fields based on node type
  const configFields = useMemo(() => {
    switch (node.data.nodeType) {
      case 'gmail':
        return (
          <GmailConfig
            config={config}
            onConfigChange={handleConfigChange}
            connected={connected}
            onConnect={handleConnect}
          />
        );
      case 'condition':
        return (
          <ConditionConfig
            config={config}
            onConfigChange={handleConfigChange}
          />
        );
      case 'llm':
        return (
          <LLMConfig
            config={config}
            onConfigChange={handleConfigChange}
          />
        );
      case 'webhook':
        return (
          <WebhookConfig
            config={config}
            onConfigChange={handleConfigChange}
          />
        );
      default:
        return (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <div className="text-center">
              <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No configuration available for this node type.</p>
            </div>
          </div>
        );
    }
  }, [node.data.nodeType, config, handleConfigChange, connected, handleConnect]);

  return (
    <div className="w-80 bg-white border-l border-gray-200 shadow-lg overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex-1">
          <input
            type="text"
            className="w-full text-lg font-semibold text-gray-900 border-none outline-none bg-transparent"
            value={label}
            onChange={(e) => handleLabelChange(e.target.value)}
            placeholder="Node Label"
          />
          <p className="text-sm text-gray-500 capitalize">{node.data.nodeType} Node</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close properties panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Configuration Content */}
      <div className="p-4">
        {configFields}
        
        {/* Save Button */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Save Changes
          </button>
        </div>

        {/* Delete Button */}
        <div className="mt-3">
          <button
            onClick={() => onDelete(node.id)}
            className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Delete Node
          </button>
        </div>
      </div>
    </div>
  );
});