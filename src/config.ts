import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

const DEFAULT_CONFIG: AIConfig = {
  defaultModel: 'mistral',
  models: {
    mistral: {
      name: 'mistral:latest',
      apiUrl: 'http://127.0.0.1:11434/api/generate',
      temperature: 0.7,
      topP: 0.9
    },
    'deepseek-coder': {
      name: 'deepseek-coder-v2:latest',
      apiUrl: 'http://localhost:11434/api/generate',
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

// Get config file path in user's home directory
const CONFIG_DIR = join(process.env.HOME || process.env.USERPROFILE || '', '.checkupcodes');
const CONFIG_PATH = join(CONFIG_DIR, 'config.json');

function loadConfig(): AIConfig {
  try {
    if (!existsSync(CONFIG_PATH)) {
      // Create config directory if it doesn't exist
      if (!existsSync(CONFIG_DIR)) {
        mkdirSync(CONFIG_DIR, { recursive: true });
      }
      // Write default config
      writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2));
      return DEFAULT_CONFIG;
    }

    const configFile = readFileSync(CONFIG_PATH, 'utf-8');
    const savedConfig = JSON.parse(configFile) as AIConfig;
    
    // Merge with default config to ensure all required fields exist
    return {
      ...DEFAULT_CONFIG,
      ...savedConfig,
      models: {
        ...DEFAULT_CONFIG.models,
        ...savedConfig.models
      }
    };
  } catch (error) {
    console.warn('Error loading config, using defaults:', error);
    return DEFAULT_CONFIG;
  }
}

function saveConfig(config: AIConfig): void {
  try {
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Error saving config:', error);
  }
}

let currentConfig = loadConfig();

export function getModelConfig(modelName?: string): ModelConfig {
  const selectedModel = modelName || currentConfig.defaultModel;
  
  if (!currentConfig.models[selectedModel]) {
    throw new Error(`Model ${selectedModel} not found in config`);
  }
  
  return currentConfig.models[selectedModel];
}

export function getCurrentConfig(): AIConfig {
  return {
    ...currentConfig,
    models: { ...currentConfig.models }
  };
}

export function setDefaultModel(modelName: string): void {
  if (!currentConfig.models[modelName]) {
    throw new Error(`Model ${modelName} not found in config`);
  }
  currentConfig.defaultModel = modelName;
  saveConfig(currentConfig);
}

export function getAvailableModels(): string[] {
  return Object.keys(currentConfig.models);
} 