/**
 * Agentic Synth Integration Wrapper
 *
 * This wrapper provides programmatic access to @ruvector/agentic-synth
 * using NPX to avoid native dependency compilation issues while still
 * leveraging the library's powerful AI data generation capabilities.
 */

import { spawn } from 'child_process';
import * as path from 'path';

export interface AgenticSynthConfig {
  provider?: 'gemini' | 'openai' | 'anthropic' | 'openrouter';
  apiKey?: string;
  model?: string;
  count?: number;
  temperature?: number;
  streaming?: boolean;
}

export interface TimeSeriesOptions {
  symbols: string[];
  count: number;
  interval?: string;
  trend?: 'up' | 'down' | 'flat' | 'volatile';
  includeVolume?: boolean;
}

export interface StructuredDataOptions {
  schema: Record<string, any>;
  count: number;
  context?: string;
}

/**
 * Wrapper class for @ruvector/agentic-synth integration
 * Uses NPX to avoid native dependency issues
 */
export class AgenticSynthWrapper {
  private config: AgenticSynthConfig;

  constructor(config: AgenticSynthConfig = {}) {
    this.config = {
      provider: config.provider || 'gemini',
      apiKey: config.apiKey || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY,
      model: config.model,
      count: config.count || 100,
      temperature: config.temperature,
      streaming: config.streaming !== false
    };
  }

  /**
   * Generate time-series market data using agentic-synth
   */
  async generateTimeSeries(options: TimeSeriesOptions): Promise<any[]> {
    const schema = this.createMarketDataSchema(options);

    try {
      const data = await this.executeAgenticSynth({
        type: 'timeseries',
        count: options.count,
        schema,
        context: `Generate realistic stock market data for ${options.symbols.join(', ')}`
      });

      return data;
    } catch (error) {
      console.error('AgenticSynth error:', error);
      return [];
    }
  }

  /**
   * Generate structured data using custom schema
   */
  async generateStructured(options: StructuredDataOptions): Promise<any[]> {
    try {
      const data = await this.executeAgenticSynth({
        type: 'structured',
        count: options.count,
        schema: options.schema,
        context: options.context
      });

      return data;
    } catch (error) {
      console.error('AgenticSynth error:', error);
      return [];
    }
  }

  /**
   * Generate news headlines using agentic-synth
   */
  async generateNews(symbols: string[], count: number = 10): Promise<any[]> {
    const schema = {
      headline: { type: 'string', description: 'Financial news headline' },
      sentiment: { type: 'enum', values: ['bullish', 'bearish', 'neutral'] },
      symbol: { type: 'enum', values: symbols },
      impact: { type: 'enum', values: ['low', 'medium', 'high'] }
    };

    try {
      const data = await this.executeAgenticSynth({
        type: 'structured',
        count,
        schema,
        context: `Generate realistic financial news headlines for ${symbols.join(', ')}`
      });

      return data;
    } catch (error) {
      console.error('AgenticSynth news generation error:', error);
      return [];
    }
  }

  /**
   * Execute agentic-synth via NPX
   */
  private async executeAgenticSynth(options: {
    type: string;
    count: number;
    schema: Record<string, any>;
    context?: string;
  }): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const args = [
        '@ruvector/agentic-synth',
        'generate',
        '--type', options.type,
        '--count', options.count.toString(),
        '--schema', JSON.stringify(options.schema),
        '--format', 'json'
      ];

      if (options.context) {
        args.push('--context', options.context);
      }

      if (this.config.provider) {
        args.push('--provider', this.config.provider);
      }

      if (this.config.model) {
        args.push('--model', this.config.model);
      }

      const env = { ...process.env };
      if (this.config.apiKey) {
        if (this.config.provider === 'gemini') {
          env.GEMINI_API_KEY = this.config.apiKey;
        } else if (this.config.provider === 'openai') {
          env.OPENAI_API_KEY = this.config.apiKey;
        } else if (this.config.provider === 'anthropic') {
          env.ANTHROPIC_API_KEY = this.config.apiKey;
        }
      }

      const child = spawn('npx', args, {
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`AgenticSynth failed: ${errorOutput}`));
          return;
        }

        try {
          // Parse JSON output
          const lines = output.trim().split('\n');
          const results: any[] = [];

          for (const line of lines) {
            if (line.startsWith('{') || line.startsWith('[')) {
              try {
                const parsed = JSON.parse(line);
                if (Array.isArray(parsed)) {
                  results.push(...parsed);
                } else {
                  results.push(parsed);
                }
              } catch (e) {
                // Skip invalid JSON lines
              }
            }
          }

          resolve(results);
        } catch (error) {
          reject(new Error(`Failed to parse AgenticSynth output: ${error}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to spawn AgenticSynth: ${error.message}`));
      });
    });
  }

  /**
   * Create Bloomberg market data schema
   */
  private createMarketDataSchema(options: TimeSeriesOptions): Record<string, any> {
    const schema: Record<string, any> = {
      timestamp: { type: 'datetime', format: 'iso8601' },
      symbol: { type: 'enum', values: options.symbols },
      open: { type: 'number', min: 50, max: 500, decimals: 2 },
      high: { type: 'number', min: 50, max: 500, decimals: 2 },
      low: { type: 'number', min: 50, max: 500, decimals: 2 },
      close: { type: 'number', min: 50, max: 500, decimals: 2 },
      bid: { type: 'number', min: 50, max: 500, decimals: 2 },
      ask: { type: 'number', min: 50, max: 500, decimals: 2 }
    };

    if (options.includeVolume !== false) {
      schema.volume = { type: 'number', min: 1000000, max: 10000000 };
    }

    return schema;
  }

  /**
   * Check if agentic-synth is available
   */
  static async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const child = spawn('npx', ['@ruvector/agentic-synth', '--version'], {
        stdio: 'pipe',
        shell: true
      });

      let hasOutput = false;

      child.stdout.on('data', () => {
        hasOutput = true;
      });

      child.on('close', (code) => {
        resolve(code === 0 && hasOutput);
      });

      child.on('error', () => {
        resolve(false);
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        child.kill();
        resolve(false);
      }, 10000);
    });
  }
}

/**
 * Singleton instance for easy access
 */
let synthWrapper: AgenticSynthWrapper | null = null;

export function getAgenticSynth(config?: AgenticSynthConfig): AgenticSynthWrapper {
  if (!synthWrapper) {
    synthWrapper = new AgenticSynthWrapper(config);
  }
  return synthWrapper;
}

export function setAgenticSynth(config: AgenticSynthConfig): void {
  synthWrapper = new AgenticSynthWrapper(config);
}
