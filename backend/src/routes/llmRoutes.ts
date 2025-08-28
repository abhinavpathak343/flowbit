import { Router } from 'express';
import { processLLMRequest, getLLMCapabilities, getAIServiceStatus } from '../controller/llmController';

const router = Router();

// Get LLM capabilities and supported actions
router.get('/capabilities', getLLMCapabilities);

// Process LLM requests (summarize, reply, extract, translate)
router.post('/process', processLLMRequest);

// Get AI service status and health
router.get('/status', getAIServiceStatus);

export default router;
