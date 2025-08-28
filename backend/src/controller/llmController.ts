import { Request, Response } from 'express';
import { aiService } from '../services/aiService';
import { getEnabledAIServices, isAIServiceEnabled } from '../config/aiConfig';

export const processLLMRequest = async (req: Request, res: Response) => {
  try {
    const { action, input, model, targetLanguage, service, customPrompt } = req.body;

    if (!action || !input) {
      return res.status(400).json({
        success: false,
        error: 'Action and input are required'
      });
    }

    // Check if the requested service is available
    if (service && !isAIServiceEnabled(service)) {
      return res.status(400).json({
        success: false,
        error: `AI service '${service}' is not configured. Please check your API keys.`
      });
    }

    // Process the request using the real AI service
    const aiResponse = await aiService.processRequest({
      action,
      input,
      model,
      targetLanguage,
      service,
      customPrompt
    });

    if (!aiResponse.success) {
      return res.status(500).json({
        success: false,
        error: aiResponse.error || 'AI processing failed'
      });
    }

    res.json({
      success: true,
      action,
      input: typeof input === 'string' ? (input.substring(0, 200) + (input.length > 200 ? '...' : '')) : String(input).substring(0, 200),
      result: aiResponse.result,
      service: aiResponse.service,
      model: aiResponse.model,
      tokens_used: aiResponse.tokens_used,
      processing_time_ms: aiResponse.processing_time_ms,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('LLM processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error during LLM processing'
    });
  }
};

export const getLLMCapabilities = (_req: Request, res: Response) => {
  const enabledServices = getEnabledAIServices();
  
  res.json({
    success: true,
    enabled_services: enabledServices,
    capabilities: {
      summarize: {
        description: 'Generate concise summaries of text content',
        parameters: ['input', 'model', 'service'],
        example: { action: 'summarize', input: 'Long text content...', model: 'gpt-3.5-turbo', service: 'openai' }
      },
      reply: {
        description: 'Generate professional replies based on context',
        parameters: ['input', 'model', 'service'],
        example: { action: 'reply', input: 'Email context...', model: 'gpt-3.5-turbo', service: 'openai' }
      },
      extract: {
        description: 'Extract key information, entities, and insights from text',
        parameters: ['input', 'model', 'service'],
        example: { action: 'extract', input: 'Document content...', model: 'gpt-3.5-turbo', service: 'openai' }
      },
      translate: {
        description: 'Translate text to different languages',
        parameters: ['input', 'targetLanguage', 'model', 'service'],
        example: { action: 'translate', input: 'Text to translate', targetLanguage: 'Spanish', model: 'gpt-3.5-turbo', service: 'openai' }
      }
    },
    supported_models: {
      openai: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo']
    },
    supported_languages: ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Arabic', 'Russian', 'Portuguese', 'Italian', 'Dutch', 'Korean'],
    custom_prompts: 'You can provide custom prompts for specialized AI processing'
  });
};

export const getAIServiceStatus = async (_req: Request, res: Response) => {
  try {
    const healthStatus = await aiService.healthCheck();
    const enabledServices = getEnabledAIServices();
    
    res.json({
      success: true,
      services: healthStatus,
      enabled_services: enabledServices,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get AI service status'
    });
  }
};
