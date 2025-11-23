/**
 * Bloomberg API Simulator
 * Main entry point
 */

export { BloombergSimulator } from './BloombergSimulator';
export { TechnicalIndicators } from './indicators';
export { AzureOpenAIClient, getAzureOpenAIClient, setAzureOpenAIClient } from './azureOpenAI';
export * from './types';

// If running directly, launch CLI
if (require.main === module) {
  require('./cli');
}