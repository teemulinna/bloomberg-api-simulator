/**
 * Bloomberg API Simulator
 * Main entry point with @ruvector/agentic-synth integration
 */

export { BloombergSimulator } from './BloombergSimulator';
export { TechnicalIndicators } from './indicators';
export { AzureOpenAIClient, getAzureOpenAIClient, setAzureOpenAIClient } from './azureOpenAI';
export { AgenticSynthWrapper, getAgenticSynth, setAgenticSynth } from './agenticSynthWrapper';
export * from './types';

// If running directly, launch CLI
if (require.main === module) {
  require('./cli');
}