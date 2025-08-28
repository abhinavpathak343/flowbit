// webhookController.ts
import { Request, Response } from 'express';
import { workflowEngine, WorkflowNode, WorkflowEdge } from '../services/workflowService';

// In-memory storage for webhook configurations (in production, use a database)
const webhookConfigs = new Map<string, {
  workflowId: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  secret?: string;
  enabled: boolean;
}>();

export const webhookController = {
  // Handle incoming webhook request
  handleWebhook: async (req: Request, res: Response) => {
    try {
      const { workflowId } = req.params;
      const webhookConfig = webhookConfigs.get(workflowId);
      
      if (!webhookConfig || !webhookConfig.enabled) {
        return res.status(404).json({ error: 'Webhook not found or disabled' });
      }
      
      // Verify webhook secret if configured. Accept either HMAC signature headers
      // (x-webhook-signature / x-hub-signature) or an Authorization header (Basic/Bearer)
      if (webhookConfig.secret) {
        const signature = (req.headers['x-webhook-signature'] || req.headers['x-hub-signature']) as string | undefined;
        const authorized = verifyWebhookSignatureOrAuth(req, webhookConfig.secret, signature);
        if (!authorized) {
          return res.status(401).json({ error: 'Invalid webhook signature or authorization' });
        }
      }
      
      // Extract webhook data
      const webhookData = {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        query: req.query,
        timestamp: new Date().toISOString(),
        ip: req.ip
      };
      
      // Create a trigger node with webhook data
      const triggerNode: WorkflowNode = {
        id: `webhook_trigger_${Date.now()}`,
        type: 'trigger',
        data: {
          nodeType: 'trigger',
          config: {
            triggerType: 'webhook',
            webhookData
          },
          status: 'idle'
        },
        position: { x: 0, y: 0 }
      };
      
      // Execute workflow with webhook data
      const result = await workflowEngine.executeWorkflow(
        [triggerNode, ...webhookConfig.nodes],
        webhookConfig.edges
      );
      
      res.json({
        success: true,
        message: 'Webhook processed successfully',
        workflowId,
        executionId: result.executionTime,
        result
      });
      
    } catch (error: any) {
      console.error('Webhook processing error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Handle custom webhook path
  handleCustomWebhook: async (req: Request, res: Response) => {
    try {
      const { path } = req.params;
      
      // Find webhook config by custom path
      let webhookConfig: any = null;
      for (const [id, config] of webhookConfigs.entries()) {
        if (config.enabled && config.workflowId === path) {
          webhookConfig = config;
          break;
        }
      }
      
      if (!webhookConfig) {
        return res.status(404).json({ error: 'Custom webhook not found' });
      }

      // Verify webhook secret if configured for custom path as well
      if (webhookConfig.secret) {
        const signature = (req.headers['x-webhook-signature'] || req.headers['x-hub-signature']) as string | undefined;
        const authorized = verifyWebhookSignatureOrAuth(req, webhookConfig.secret, signature);
        if (!authorized) {
          return res.status(401).json({ error: 'Invalid webhook signature or authorization' });
        }
      }

      // Process webhook similar to handleWebhook
      const webhookData = {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        query: req.query,
        timestamp: new Date().toISOString(),
        ip: req.ip
      };
      
      const triggerNode: WorkflowNode = {
        id: `webhook_trigger_${Date.now()}`,
        type: 'trigger',
        data: {
          nodeType: 'trigger',
          config: {
            triggerType: 'webhook',
            webhookData
          },
          status: 'idle'
        },
        position: { x: 0, y: 0 }
      };
      
      const result = await workflowEngine.executeWorkflow(
        [triggerNode, ...webhookConfig.nodes],
        webhookConfig.edges
      );
      
      res.json({
        success: true,
        message: 'Custom webhook processed successfully',
        path,
        executionId: result.executionTime,
        result
      });
      
    } catch (error: any) {
      console.error('Custom webhook processing error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get webhook URL for a workflow
  getWebhookUrl: async (req: Request, res: Response) => {
    try {
      const { workflowId } = req.params;
      const webhookConfig = webhookConfigs.get(workflowId);
      
      if (!webhookConfig) {
        return res.status(404).json({ error: 'Webhook configuration not found' });
      }
      
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const webhookUrl = `${baseUrl}/api/webhook/${workflowId}`;
      
      res.json({
        webhookUrl,
        workflowId,
        enabled: webhookConfig.enabled,
        hasSecret: !!webhookConfig.secret
      });
      
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // List all webhook endpoints
  listWebhookEndpoints: async (req: Request, res: Response) => {
    try {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const endpoints = Array.from(webhookConfigs.entries()).map(([id, config]) => ({
        id,
        workflowId: config.workflowId,
        webhookUrl: `${baseUrl}/api/webhook/${config.workflowId}`,
        enabled: config.enabled,
        hasSecret: !!config.secret,
        createdAt: new Date().toISOString()
      }));
      
      res.json({
        endpoints,
        total: endpoints.length
      });
      
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Register a webhook for a workflow (internal method)
  registerWebhook: (workflowId: string, nodes: WorkflowNode[], edges: WorkflowEdge[], secret?: string) => {
    webhookConfigs.set(workflowId, {
      workflowId,
      nodes,
      edges,
      secret,
      enabled: true
    });
  },

  // Unregister a webhook
  unregisterWebhook: (workflowId: string) => {
    webhookConfigs.delete(workflowId);
  }
};

// Verify webhook signature (HMAC) or Authorization header (Basic/Bearer)
function verifyWebhookSignatureOrAuth(req: any, secret: string, signatureHeader?: string): boolean {
  const crypto = require('crypto');

  // 1) Check explicit signature headers (x-webhook-signature or x-hub-signature)
  const sig = signatureHeader || (req.headers && (req.headers['x-webhook-signature'] || req.headers['x-hub-signature']));
  if (sig && typeof sig === 'string') {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');
    // Accept both formats: 'sha256=<hex>' or raw hex
    if (sig === `sha256=${expected}` || sig === expected) return true;
  }

  // 2) Check Authorization header: Basic or Bearer
  const authHeader = (req.headers && (req.headers['authorization'] || req.headers['Authorization'])) as string | undefined;
  if (authHeader && typeof authHeader === 'string') {
    if (authHeader.startsWith('Basic ')) {
      try {
        const b64 = authHeader.slice(6).trim();
        const decoded = Buffer.from(b64, 'base64').toString('utf8');
        // Basic auth is usually username:password — accept password part or full decoded match
        const token = decoded.includes(':') ? decoded.split(':')[1] : decoded;
        if (token === secret) return true;
      } catch (e) {
        // ignore decode errors
      }
    }
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      if (token === secret) return true;
    }
    // As a last resort, compare header value directly to secret
    if (authHeader === secret) return true;
  }

  return false;
}

