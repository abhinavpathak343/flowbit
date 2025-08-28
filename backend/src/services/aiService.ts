// Removed unused Gemini imports
import { getAIServiceConfig, isAIServiceEnabled } from '../config/aiConfig';

export interface AIRequest {
  action: 'summarize' | 'reply' | 'extract' | 'translate';
  input: string;
  model?: string;
  targetLanguage?: string;
  service?: 'openai';
  customPrompt?: string;
}

export interface AIResponse {
  success: boolean;
  result: any;
  service: string;
  model: string;
  tokens_used?: number;
  processing_time_ms: number;
  error?: string;
}

export class AIService {
  // Gemini model removed

  constructor() {
    // No Gemini initialization
  }

  // Gemini initialization removed

  async processRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    const service = request.service || 'openai';
    try {
      if (service === 'openai') {
        return await this.processWithOpenAI(request, startTime);
      }
      throw new Error(`Service ${service} is not available or not configured`);
    } catch (error: any) {
      return {
        success: false,
        result: null,
        service,
        model: request.model || 'unknown',
        processing_time_ms: Date.now() - startTime,
        error: error.message
      };
    }
  }

  // Gemini logic removed

  private async processWithOpenAI(request: AIRequest, startTime: number): Promise<AIResponse> {
    const config = getAIServiceConfig('openai');
    const prompt = this.buildPrompt(request);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: request.model || config.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant that processes text according to specific instructions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: config.maxTokens,
        temperature: config.temperature,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const text = data.choices[0]?.message?.content || '';

    return {
      success: true,
      result: this.parseOpenAIResult(request.action, text),
      service: 'openai',
      model: request.model || config.model,
      tokens_used: data.usage?.total_tokens,
      processing_time_ms: Date.now() - startTime
    };
  }
  private parseOpenAIResult(action: string, text: string): string {
    // Return plain text so UI can render without special handling
    return text;
  }

 

  private buildPrompt(request: AIRequest): string {
    const { action, input, targetLanguage, customPrompt } = request;
    
    if (customPrompt) {
      return customPrompt;
    }

    const basePrompt = `Please process the following text according to the specified action. Provide a clear, concise response.

Text to process:
"${input}"

Action: ${action}`;

    switch (action) {
      case 'summarize':
        return `${basePrompt}

Please provide a concise summary of the key points in 2-3 sentences.`;
      
      case 'reply':
        return `${basePrompt}

Please generate a professional, courteous reply that acknowledges the content and provides a helpful response.`;
      
      case 'extract':
        return `${basePrompt}

Please extract and organize the following information:
- Key points (3-5 bullet points)
- Main entities mentioned
- Overall sentiment (positive/negative/neutral)
- Primary topics discussed`;
      
      case 'translate':
        return `${basePrompt}

Please translate the text to ${targetLanguage || 'English'}. Maintain the original meaning and tone while ensuring natural language flow in the target language.`;
      
      default:
        return basePrompt;
    }
  }

 

  // Health check method
  async healthCheck(): Promise<{ [key: string]: boolean }> {
    const services: { [key: string]: boolean } = {};
    try {
      services.openai = isAIServiceEnabled('openai');
    } catch {
      services.openai = false;
    }
    
    return services;
  }
}

export const aiService = new AIService();


