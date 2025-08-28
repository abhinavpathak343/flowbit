import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

export interface AIServiceConfig {
  openai: {
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };
// ...existing code...
}

export const aiConfig: AIServiceConfig = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2048'),
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
  },
};

export const getAIServiceConfig = (service: keyof AIServiceConfig) => {
  const config = aiConfig[service];
  if (!config.apiKey) {
    throw new Error(`${service.toUpperCase()} API key not configured. Please set ${service.toUpperCase()}_API_KEY in your .env file.`);
  }
  return config;
};

export const isAIServiceEnabled = (service: keyof AIServiceConfig): boolean => {
  return !!aiConfig[service].apiKey;
};

export const getEnabledAIServices = (): string[] => {
  return Object.keys(aiConfig).filter(service => 
    isAIServiceEnabled(service as keyof AIServiceConfig)
  );
};


