# FlowBitAI - Advanced Workflow Automation System

A powerful workflow automation platform similar to n8n, built with Node.js/TypeScript backend and React frontend. This system supports complex workflows with dynamic webhook nodes, advanced conditional logic, and modular node architecture.

## 🚀 Features

### Core Workflow Engine
- **Complex Flow Support**: Branching, multiple conditions, parallel execution
- **Dynamic Node System**: Pluggable nodes that can be added/removed/reordered anywhere
- **Automatic Context Passing**: Data flows seamlessly between nodes
- **Topological Execution**: Smart dependency resolution and execution ordering
- **Error Handling**: Robust error handling with detailed logging

### Webhook Node
- **HTTP Methods**: Full support for GET, POST, PUT, PATCH, DELETE
- **Dynamic Configuration**: URL, headers, body, and method configuration
- **Placeholder Support**: Use `{{field}}` syntax to insert values from previous nodes
- **Response Parsing**: Automatic JSON/text response parsing based on content type
- **Advanced Options**: Retry on failure, follow redirects, custom headers
- **Webhook Triggers**: External APIs can trigger workflows via webhook endpoints

### Conditional Node (If/Else)
- **Multiple Conditions**: Support for AND/OR logic with multiple conditions
- **Dynamic Operators**: equals, not_equals, contains, starts_with, ends_with, greater_than, less_than, is_empty, is_not_empty
- **Nested Field Access**: Use dot notation (e.g., `email.subject`, `data.status`)
- **Smart Branching**: Automatic workflow branching based on condition results
- **Condition Evaluation**: Real-time condition evaluation with detailed logging

### Modular Architecture
- **Node Registry**: Centralized node handler management
- **Easy Extension**: Simple API to add new node types
- **Type Safety**: Full TypeScript support throughout the system
- **Plugin System**: Modular design for easy node type additions

## 🏗️ Architecture

### Backend Structure
```
backend/
├── src/
│   ├── services/
│   │   ├── workflowService.ts    # Core workflow execution engine
│   │   └── aiService.ts          # AI/LLM integration
│   ├── controller/
│   │   ├── workflowController.ts # Workflow execution API
│   │   ├── webhookController.ts  # Webhook handling
│   │   └── llmController.ts      # LLM processing
│   ├── registry/
│   │   └── registry.ts           # Node handler registry
│   ├── routes/
│   │   ├── workflowRoutes.ts     # Workflow API routes
│   │   ├── webhookRoutes.ts      # Webhook endpoints
│   │   └── llmRoutes.ts          # LLM API routes
│   └── app.ts                    # Main application
```

### Frontend Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── nodes/
│   │   │   ├── WebhookNode.tsx   # Webhook node component
│   │   │   ├── ConditionNode.tsx # Conditional node component
│   │   │   └── BaseNode.tsx      # Base node component
│   │   ├── PropertiesPanel.tsx   # Node configuration UI
│   │   └── WorkflowCanvas.tsx    # Workflow editor
│   ├── hooks/
│   │   └── useWorkflow.ts        # Workflow state management
│   └── types/
│       └── workflow.ts           # TypeScript definitions
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Backend Setup
```bash
cd backend
npm install
npm run build
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables
Create a `.env` file in the backend directory:
```env
PORT=3000
OPENAI_API_KEY=your_openai_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## 📖 Usage Examples

### Webhook Node Configuration

#### Basic HTTP Request
```json
{
  "method": "POST",
  "url": "https://api.example.com/users",
  "headers": "{\"Content-Type\": \"application/json\"}",
  "body": "{\"name\": \"John Doe\", \"email\": \"john@example.com\"}"
}
```

#### Dynamic URL with Placeholders
```json
{
  "method": "GET",
  "url": "https://api.example.com/users/{{userId}}/posts",
  "headers": "{\"Authorization\": \"Bearer {{token}}\"}"
}
```

#### Advanced Configuration
```json
{
  "method": "POST",
  "url": "https://api.example.com/webhook",
  "headers": "{\"Content-Type\": \"application/json\", \"X-API-Key\": \"{{apiKey}}\"}",
  "body": "{\"event\": \"{{eventType}}\", \"data\": {{eventData}}}",
  "retryOnFailure": true,
  "followRedirects": true
}
```

### Conditional Node Configuration

#### Single Condition
```json
{
  "field": "email.subject",
  "operator": "contains",
  "value": "urgent"
}
```

#### Multiple Conditions (AND Logic)
```json
{
  "operator": "AND",
  "conditions": [
    {
      "field": "email.subject",
      "operator": "contains",
      "value": "urgent"
    },
    {
      "field": "email.from",
      "operator": "equals",
      "value": "boss@company.com"
    },
    {
      "field": "email.hasAttachment",
      "operator": "is_not_empty"
    }
  ]
}
```

#### Multiple Conditions (OR Logic)
```json
{
  "operator": "OR",
  "conditions": [
    {
      "field": "response.status",
      "operator": "equals",
      "value": "200"
    },
    {
      "field": "response.status",
      "operator": "equals",
      "value": "201"
    }
  ]
}
```

### Workflow Examples

#### Email Processing Workflow
1. **Trigger**: New email received
2. **Condition**: Check if email subject contains "urgent"
3. **Webhook**: Send notification to Slack
4. **Condition**: Check if email has attachment
5. **Webhook**: Upload attachment to cloud storage

#### API Integration Workflow
1. **Webhook**: Receive webhook from external service
2. **Condition**: Validate webhook payload
3. **Webhook**: Transform and forward to another API
4. **Condition**: Check response status
5. **Webhook**: Send success/failure notification

## 🔌 API Endpoints

### Workflow Execution
- `POST /api/workflow/execute` - Execute a workflow
- `GET /api/workflow/nodes` - Get available node types

### Webhook Endpoints
- `POST /api/webhook/:workflowId` - Receive webhook for specific workflow
- `POST /api/webhook/custom/:path` - Custom webhook path
- `GET /api/webhook/url/:workflowId` - Get webhook URL
- `GET /api/webhook/endpoints` - List all webhook endpoints

### LLM Processing
- `POST /api/llm/process` - Process text with AI models

## 🔧 Adding New Node Types

### Backend Node Handler
```typescript
// Add to registry.ts
const registry = {
  // ... existing nodes
  customNode: {
    action1: async (input) => {
      // Node logic here
      return { success: true, result: 'processed' };
    },
    action2: async (input) => {
      // Another action
      return { success: true, result: 'action2' };
    }
  }
};
```

### Frontend Node Component
```typescript
// Create CustomNode.tsx
import React from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './BaseNode';
import { WorkflowNodeData } from '../../types/workflow';
import { CustomIcon } from 'lucide-react';

export const CustomNode: React.FC<NodeProps<WorkflowNodeData>> = (props) => {
  return (
    <BaseNode
      {...props}
      icon={<CustomIcon className="w-4 h-4" />}
      color="bg-green-500"
    />
  );
};
```

### Add to Node Registry
```typescript
// Update useWorkflow.ts
const getNodeDefaults = (type: NodeType) => {
  const defaults = {
    // ... existing defaults
    customNode: {
      label: 'Custom Node',
      description: 'Custom node functionality',
      config: { action: 'action1' },
    },
  };
  return defaults[type] || { label: 'Unknown', description: 'Unknown node type', config: {} };
};
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Manual Testing
1. Start both backend and frontend
2. Open browser to `http://localhost:5173`
3. Create a new workflow
4. Add webhook and condition nodes
5. Configure and test execution

## 🚀 Deployment

### Production Build
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
```

### Docker Deployment
```bash
docker-compose up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review example workflows

## 🔮 Roadmap

- [ ] Database persistence for workflows
- [ ] Real-time collaboration
- [ ] Advanced scheduling (cron expressions)
- [ ] Node templates and sharing
- [ ] Workflow versioning
- [ ] Advanced error handling and retry logic
- [ ] Webhook signature verification
- [ ] Rate limiting and throttling
- [ ] Workflow analytics and monitoring

