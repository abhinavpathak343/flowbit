// webhookRoutes.ts
import { Router } from 'express';
import { webhookController } from '../controller/webhookController';

const router = Router();

// Webhook endpoint to receive incoming webhook requests
router.post('/webhook/:workflowId', webhookController.handleWebhook);

// Webhook endpoint to receive incoming webhook requests with custom path
router.post('/webhook/custom/:path', webhookController.handleCustomWebhook);

// Get webhook URL for a workflow
router.get('/webhook/url/:workflowId', webhookController.getWebhookUrl);

// List all webhook endpoints
router.get('/webhook/endpoints', webhookController.listWebhookEndpoints);

export default router;

