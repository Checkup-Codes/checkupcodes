import { getCurrentConfig, setDefaultModel, getAvailableModels } from './config.js';
import chalk from 'chalk';

export function showConfig(): void {
  const config = getCurrentConfig();
  const models = getAvailableModels();

  console.log('\nCurrent Configuration:');
  console.log('--------------------');
  console.log(`Default Model: ${chalk.green(config.defaultModel)}`);
  console.log('\nAvailable Models:');
  
  models.forEach(modelName => {
    const model = config.models[modelName];
    const isDefault = modelName === config.defaultModel;
    
    console.log(`\n${isDefault ? chalk.green('→') : ' '} ${chalk.bold(modelName)}:`);
    console.log(`  API URL: ${model.apiUrl}`);
    console.log(`  Temperature: ${model.temperature}`);
    console.log(`  Top P: ${model.topP}`);
  });
}

export function setModel(modelName: string): void {
  try {
    setDefaultModel(modelName);
    console.log(`\n${chalk.green('✓')} Default model set to: ${chalk.bold(modelName)}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`\n${chalk.red('✗')} ${error.message}`);
      
      const availableModels = getAvailableModels();
      console.log('\nAvailable models:');
      availableModels.forEach(model => {
        console.log(`- ${model}`);
      });
    }
  }
} 