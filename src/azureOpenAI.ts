/**
 * Azure OpenAI Integration for Bloomberg API Simulator
 * Provides AI-powered data generation using Azure OpenAI Service
 */

import * as dotenv from 'dotenv';

dotenv.config();

export interface AzureOpenAIConfig {
  apiKey: string;
  endpoint: string;
  deployment: string;
  apiVersion: string;
}

export interface GenerationRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  count?: number;
}

export interface MarketDataSchema {
  timestamp: string;
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  bid: number;
  ask: number;
}

export interface AzureOpenAIResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
    index: number;
  }>;
  created: number;
  id: string;
  model: string;
  object: string;
}

export class AzureOpenAIClient {
  private config: AzureOpenAIConfig;

  constructor(config?: Partial<AzureOpenAIConfig>) {
    this.config = {
      apiKey: config?.apiKey || process.env.AZURE_OPENAI_API_KEY || '',
      endpoint: config?.endpoint || process.env.AZURE_OPENAI_ENDPOINT || '',
      deployment: config?.deployment || process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4',
      apiVersion: config?.apiVersion || process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview'
    };

    this.validateConfig();
  }

  private validateConfig(): void {
    if (!this.config.apiKey) {
      throw new Error('Azure OpenAI API key is required. Set AZURE_OPENAI_API_KEY in .env');
    }
    if (!this.config.endpoint) {
      throw new Error('Azure OpenAI endpoint is required. Set AZURE_OPENAI_ENDPOINT in .env');
    }
  }

  /**
   * Generate synthetic market data using Azure OpenAI
   */
  async generateMarketData(
    symbols: string[],
    count: number = 100
  ): Promise<MarketDataSchema[]> {
    const prompt = this.createMarketDataPrompt(symbols, count);

    try {
      const response = await this.makeRequest(prompt, {
        maxTokens: 4000
        // Using default temperature (1.0) for compatibility with all models
      });

      return this.parseMarketData(response);
    } catch (error) {
      console.error('Error generating market data with Azure OpenAI:', error);
      throw error;
    }
  }

  /**
   * Generate news headlines with sentiment
   */
  async generateNews(
    symbols: string[],
    count: number = 10
  ): Promise<Array<{ headline: string; sentiment: string; symbol: string }>> {
    const prompt = `Generate ${count} realistic financial news headlines for these stocks: ${symbols.join(', ')}.
For each headline, provide:
- headline: The news headline
- sentiment: bullish, bearish, or neutral
- symbol: The stock symbol

Return as JSON array.`;

    try {
      const response = await this.makeRequest(prompt, {
        maxTokens: 2000
        // Using default temperature (1.0) for compatibility with all models
      });

      return this.parseNews(response);
    } catch (error) {
      console.error('Error generating news with Azure OpenAI:', error);
      throw error;
    }
  }

  /**
   * Make request to Azure OpenAI API
   */
  private async makeRequest(
    prompt: string,
    options: { maxTokens?: number; temperature?: number } = {}
  ): Promise<string> {
    const url = `${this.config.endpoint}openai/deployments/${this.config.deployment}/chat/completions?api-version=${this.config.apiVersion}`;

    const body: any = {
      messages: [
        {
          role: 'system',
          content: 'You are a financial data generator. Generate realistic market data in JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_completion_tokens: options.maxTokens || 1000,
      response_format: { type: 'json_object' }
    };

    // Only include temperature if explicitly set and not default (1.0)
    // Some models like gpt-4o-mini only support default temperature
    if (options.temperature !== undefined && options.temperature !== 1.0) {
      body.temperature = options.temperature;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.config.apiKey
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Azure OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as AzureOpenAIResponse;
    return data.choices[0]?.message?.content || '';
  }

  /**
   * Create prompt for market data generation
   */
  private createMarketDataPrompt(symbols: string[], count: number): string {
    return `Generate ${count} realistic stock market data records for symbols: ${symbols.join(', ')}.

For each record, include:
- timestamp: ISO 8601 datetime
- symbol: Stock symbol
- open: Opening price (50-500 range)
- high: High price (slightly above open)
- low: Low price (slightly below open)
- close: Closing price (within high/low range)
- volume: Trading volume (1M-10M range)
- bid: Bid price (slightly below close)
- ask: Ask price (slightly above close)

Ensure realistic price movements with proper volatility. Return as JSON object with "data" array.`;
  }

  /**
   * Parse market data from AI response
   */
  private parseMarketData(response: string): MarketDataSchema[] {
    try {
      const parsed = JSON.parse(response);
      return parsed.data || parsed.records || parsed.marketData || [];
    } catch (error) {
      console.error('Error parsing market data:', error);
      return [];
    }
  }

  /**
   * Parse news from AI response
   */
  private parseNews(response: string): Array<{ headline: string; sentiment: string; symbol: string }> {
    try {
      const parsed = JSON.parse(response);
      return parsed.news || parsed.headlines || parsed.data || [];
    } catch (error) {
      console.error('Error parsing news:', error);
      return [];
    }
  }

  /**
   * Generate technical analysis insights
   */
  async generateTechnicalAnalysis(
    symbol: string,
    historicalData: any[]
  ): Promise<string> {
    const prompt = `Analyze the following market data for ${symbol} and provide technical analysis insights:

Data: ${JSON.stringify(historicalData.slice(-20))}

Provide analysis including:
- Trend direction
- Support and resistance levels
- Key indicators (RSI, MACD signals)
- Trading recommendation

Return as concise JSON object.`;

    try {
      const response = await this.makeRequest(prompt, {
        maxTokens: 500
        // Using default temperature (1.0) for compatibility with all models
      });

      return response;
    } catch (error) {
      console.error('Error generating technical analysis:', error);
      return '{}';
    }
  }

  /**
   * Check if Azure OpenAI is configured
   */
  static isConfigured(): boolean {
    return !!(
      process.env.AZURE_OPENAI_API_KEY &&
      process.env.AZURE_OPENAI_ENDPOINT
    );
  }

  /**
   * Get configuration status
   */
  getConfigStatus(): { configured: boolean; deployment: string; endpoint: string } {
    return {
      configured: !!(this.config.apiKey && this.config.endpoint),
      deployment: this.config.deployment,
      endpoint: this.config.endpoint.replace(/\/$/, '')
    };
  }
}

/**
 * Singleton instance for easy access
 */
let azureClient: AzureOpenAIClient | null = null;

export function getAzureOpenAIClient(): AzureOpenAIClient {
  if (!azureClient) {
    azureClient = new AzureOpenAIClient();
  }
  return azureClient;
}

export function setAzureOpenAIClient(config: Partial<AzureOpenAIConfig>): void {
  azureClient = new AzureOpenAIClient(config);
}