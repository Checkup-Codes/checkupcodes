export interface ModelConfig {
  name: string;
  apiUrl: string;
  temperature: number;
  topP: number;
}

export interface AIConfig {
  defaultModel: string;
  models: {
    [key: string]: ModelConfig;
  };
}

export const DEFAULT_CONFIG: AIConfig = {
  defaultModel: 'mistral',
  models: {
    mistral: {
      name: 'mistral',
      apiUrl: 'http://127.0.0.1:11434/api/generate',
      temperature: 0.7,
      topP: 0.9
    },
    deepseek: {
      name: 'deepseek',
      apiUrl: 'http://127.0.0.1:11434/api/generate',
      temperature: 0.7,
      topP: 0.9
    },
    openai: {
      name: 'openai',
      apiUrl: 'https://api.openai.com/v1/chat/completions',
      temperature: 0.7,
      topP: 0.9
    }
  }
};

export function getModelConfig(modelName?: string): ModelConfig {
  const config = DEFAULT_CONFIG;
  const selectedModel = modelName || config.defaultModel;
  
  if (!config.models[selectedModel]) {
    throw new Error(`Model ${selectedModel} not found in config`);
  }
  
  return config.models[selectedModel];
} 