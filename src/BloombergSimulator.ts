import { EventEmitter } from 'events';
import {
  Quote,
  Trade,
  News,
  MarketDepth,
  OHLCV,
  GeneratorConfig,
  StreamOptions,
  MarketState,
  MarketCondition,
  CacheEntry
} from './types';
import { AzureOpenAIClient } from './azureOpenAI';

/**
 * Main Bloomberg API Simulator class
 * Extends EventEmitter for real-time event streaming
 */
export class BloombergSimulator extends EventEmitter {
  private config: GeneratorConfig;
  private marketState: MarketState;
  private cache: Map<string, CacheEntry<any>>;
  private cacheMaxSize: number;
  private cacheTTL: number;
  private isRunning: boolean = false;
  private streamInterval?: NodeJS.Timeout;
  private symbols: string[];
  private selfLearning: boolean;
  private patterns: Map<string, any>;
  private azureClient: AzureOpenAIClient | null = null;
  private useAzureAI: boolean = false;

  constructor(config: GeneratorConfig = {}) {
    super();
    this.config = {
      symbols: config.symbols || this.getDefaultSymbols(),
      startTime: config.startTime || new Date(),
      interval: config.interval || 100, // 100ms default
      marketCondition: config.marketCondition || 'normal',
      volatility: config.volatility || 0.2,
      includeNews: config.includeNews !== false,
      includeOrderBook: config.includeOrderBook !== false,
      includeTechnicals: config.includeTechnicals !== false,
      ...config
    };

    this.symbols = this.config.symbols!;
    this.marketState = this.initializeMarketState();
    this.cache = new Map();
    this.cacheMaxSize = parseInt(process.env.MAX_CACHE_SIZE || '1000');
    this.cacheTTL = parseInt(process.env.CACHE_TTL || '3600') * 1000;
    this.selfLearning = process.env.ENABLE_SELF_LEARNING === 'true';
    this.patterns = new Map();

    // Initialize Azure OpenAI if configured
    if (AzureOpenAIClient.isConfigured()) {
      try {
        this.azureClient = new AzureOpenAIClient();
        this.useAzureAI = true;
        this.emit('log', '✅ Azure OpenAI integration enabled');
      } catch (error) {
        this.emit('log', `⚠️  Azure OpenAI configuration error: ${error}`);
        this.useAzureAI = false;
      }
    }

    this.setupEventHandlers();
    this.emit('initialized', { config: this.config, marketState: this.marketState });
  }

  private getDefaultSymbols(): string[] {
    return [
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META',
      'TSLA', 'NVDA', 'JPM', 'V', 'JNJ',
      'WMT', 'PG', 'UNH', 'DIS', 'MA',
      'HD', 'BAC', 'PYPL', 'NFLX', 'ADBE'
    ];
  }

  private initializeMarketState(): MarketState {
    return {
      condition: this.config.marketCondition || 'normal',
      volatility: this.config.volatility || 0.2,
      momentum: 0,
      volume: 'normal',
      tradingHours: this.isTradingHours(),
      timestamp: new Date()
    };
  }

  private setupEventHandlers(): void {
    // Handle market state changes
    this.on('marketStateChange', (newState: MarketState) => {
      this.marketState = newState;
      this.emit('log', `Market state changed to: ${newState.condition}`);
    });

    // Handle self-learning updates
    if (this.selfLearning) {
      this.on('pattern:detected', (pattern: any) => {
        this.learnPattern(pattern);
      });
    }

    // Performance monitoring
    this.on('performance:metric', (metric: any) => {
      this.optimizePerformance(metric);
    });
  }

  /**
   * Start real-time data streaming
   */
  public async startStreaming(options: StreamOptions = {}): Promise<void> {
    if (this.isRunning) {
      throw new Error('Simulator is already running');
    }

    this.isRunning = true;
    this.emit('streaming:started', { timestamp: new Date() });

    const interval = options.delay || this.config.interval || 100;

    this.streamInterval = setInterval(async () => {
      try {
        if (options.parallel !== false) {
          // Parallel generation for all symbols
          await this.generateParallelData();
        } else {
          // Sequential generation
          for (const symbol of this.symbols) {
            await this.generateSymbolData(symbol);
          }
        }

        this.updateMarketState();
        this.emitPerformanceMetrics();
      } catch (error) {
        this.emit('error', error);
      }
    }, interval);
  }

  /**
   * Stop streaming
   */
  public stopStreaming(): void {
    if (this.streamInterval) {
      clearInterval(this.streamInterval);
      this.streamInterval = undefined;
    }
    this.isRunning = false;
    this.emit('streaming:stopped', { timestamp: new Date() });
  }

  /**
   * Generate data for all symbols in parallel
   */
  private async generateParallelData(): Promise<void> {
    const promises = this.symbols.map(symbol => this.generateSymbolData(symbol));
    await Promise.all(promises);
  }

  /**
   * Generate data for a specific symbol
   */
  private async generateSymbolData(symbol: string): Promise<void> {
    const quote = this.generateQuote(symbol);
    this.emit('quote:update', quote);

    if (Math.random() > 0.7) {
      const trade = this.generateTrade(symbol, quote.last);
      this.emit('trade:executed', trade);
    }

    if (this.config.includeOrderBook && Math.random() > 0.8) {
      const depth = this.generateMarketDepth(symbol, quote);
      this.emit('depth:update', depth);
    }

    if (this.config.includeNews && Math.random() > 0.95) {
      const news = await this.generateNews([symbol]);
      this.emit('news:flash', news);
    }
  }

  /**
   * Generate realistic quote data
   */
  private generateQuote(symbol: string): Quote {
    const cacheKey = `quote:${symbol}`;
    const cached = this.getFromCache(cacheKey);

    let lastPrice = cached?.last || 100 + Math.random() * 400;
    const volatility = this.marketState.volatility;
    const momentum = this.marketState.momentum;

    // Apply market dynamics
    const change = (Math.random() - 0.5 + momentum * 0.1) * volatility * 2;
    const newPrice = lastPrice * (1 + change / 100);

    const spread = 0.01 + Math.random() * 0.05;
    const bid = newPrice - spread / 2;
    const ask = newPrice + spread / 2;

    const quote: Quote = {
      symbol,
      timestamp: new Date(),
      bid: parseFloat(bid.toFixed(2)),
      ask: parseFloat(ask.toFixed(2)),
      bidSize: Math.floor(Math.random() * 1000) * 100,
      askSize: Math.floor(Math.random() * 1000) * 100,
      last: parseFloat(newPrice.toFixed(2)),
      lastSize: Math.floor(Math.random() * 500) * 100,
      volume: Math.floor(Math.random() * 10000000),
      change: parseFloat((newPrice - lastPrice).toFixed(2)),
      changePercent: parseFloat(((newPrice - lastPrice) / lastPrice * 100).toFixed(2)),
      high: parseFloat((newPrice * (1 + Math.random() * 0.02)).toFixed(2)),
      low: parseFloat((newPrice * (1 - Math.random() * 0.02)).toFixed(2)),
      open: cached?.open || parseFloat((lastPrice * (1 + (Math.random() - 0.5) * 0.01)).toFixed(2)),
      vwap: parseFloat(newPrice.toFixed(2))
    };

    this.putInCache(cacheKey, quote);
    return quote;
  }

  /**
   * Generate trade data
   */
  private generateTrade(symbol: string, price: number): Trade {
    return {
      id: this.generateId(),
      symbol,
      timestamp: new Date(),
      price: parseFloat((price + (Math.random() - 0.5) * 0.1).toFixed(2)),
      size: Math.floor(Math.random() * 1000) * 100,
      side: Math.random() > 0.5 ? 'buy' : 'sell',
      exchange: this.randomExchange(),
      isBlock: Math.random() > 0.95,
      isOddLot: Math.random() > 0.9
    };
  }

  /**
   * Generate market depth/order book
   */
  private generateMarketDepth(symbol: string, quote: Quote): MarketDepth {
    const levels = 10;
    const bids = [];
    const asks = [];

    for (let i = 0; i < levels; i++) {
      bids.push({
        price: parseFloat((quote.bid - i * 0.01).toFixed(2)),
        size: Math.floor(Math.random() * 5000) * 100,
        orders: Math.floor(Math.random() * 50) + 1
      });

      asks.push({
        price: parseFloat((quote.ask + i * 0.01).toFixed(2)),
        size: Math.floor(Math.random() * 5000) * 100,
        orders: Math.floor(Math.random() * 50) + 1
      });
    }

    return {
      symbol,
      timestamp: new Date(),
      bids,
      asks,
      spread: parseFloat((quote.ask - quote.bid).toFixed(2)),
      midpoint: parseFloat(((quote.ask + quote.bid) / 2).toFixed(2))
    };
  }

  /**
   * Generate news with sentiment
   */
  private async generateNews(symbols: string[]): Promise<News> {
    // Try Azure OpenAI first if enabled
    if (this.useAzureAI && this.azureClient) {
      try {
        const aiNews = await this.azureClient.generateNews(symbols, 1);
        if (aiNews && aiNews.length > 0) {
          const newsItem = aiNews[0];
          const sentimentScore =
            newsItem.sentiment === 'bullish' ? 0.7 :
            newsItem.sentiment === 'bearish' ? -0.7 : 0;

          return {
            id: this.generateId(),
            timestamp: new Date(),
            headline: newsItem.headline,
            summary: `AI-generated market analysis for ${symbols.join(', ')}`,
            symbols,
            sentiment: newsItem.sentiment as 'bullish' | 'bearish' | 'neutral',
            sentimentScore,
            impact: Math.abs(sentimentScore) > 0.5 ? 'high' : 'medium' as 'low' | 'medium' | 'high',
            categories: ['earnings', 'market-update'],
            source: 'Bloomberg Terminal Simulator (Azure AI)'
          };
        }
      } catch (error) {
        this.emit('log', `⚠️  Azure OpenAI news generation failed, falling back to mock data: ${error}`);
      }
    }

    // Fallback to mock data
    const sentiments: ('bullish' | 'bearish' | 'neutral')[] = ['bullish', 'bearish', 'neutral'];
    const impacts: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];

    const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
    const impact = impacts[Math.floor(Math.random() * impacts.length)];

    const headlines = this.getNewsHeadlines(sentiment);
    const headline = headlines[Math.floor(Math.random() * headlines.length)];

    return {
      id: this.generateId(),
      timestamp: new Date(),
      headline: headline.replace('{SYMBOL}', symbols[0]),
      summary: `Market analysis for ${symbols.join(', ')}`,
      symbols,
      sentiment,
      sentimentScore: sentiment === 'bullish' ? 0.7 : sentiment === 'bearish' ? -0.7 : 0,
      impact,
      categories: ['earnings', 'market-update'],
      source: 'Bloomberg Terminal Simulator'
    };
  }

  private getNewsHeadlines(sentiment: 'bullish' | 'bearish' | 'neutral'): string[] {
    const headlines = {
      bullish: [
        '{SYMBOL} Beats Earnings Expectations, Stock Surges',
        'Analysts Upgrade {SYMBOL} to Buy Rating',
        '{SYMBOL} Announces Record-Breaking Quarter',
        'Institutional Investors Increase {SYMBOL} Holdings'
      ],
      bearish: [
        '{SYMBOL} Misses Revenue Targets, Shares Fall',
        'Downgrade Alert: {SYMBOL} Cut to Sell',
        '{SYMBOL} Faces Regulatory Challenges',
        'Major Fund Reduces {SYMBOL} Position'
      ],
      neutral: [
        '{SYMBOL} Trading in Line with Market Expectations',
        'Analysts Maintain Hold Rating on {SYMBOL}',
        '{SYMBOL} Announces Executive Changes',
        'Market Watch: {SYMBOL} Shows Steady Performance'
      ]
    };
    return headlines[sentiment];
  }

  /**
   * Update market state based on patterns
   */
  private updateMarketState(): void {
    if (Math.random() > 0.95) {
      const conditions: MarketCondition[] = ['normal', 'bullish', 'bearish', 'volatile'];
      const newCondition = conditions[Math.floor(Math.random() * conditions.length)];

      this.marketState = {
        ...this.marketState,
        condition: newCondition,
        volatility: newCondition === 'volatile' ? 0.5 : this.config.volatility || 0.2,
        momentum: newCondition === 'bullish' ? 0.3 : newCondition === 'bearish' ? -0.3 : 0,
        timestamp: new Date()
      };

      this.emit('marketStateChange', this.marketState);
    }
  }

  /**
   * Self-learning pattern detection
   */
  private learnPattern(pattern: any): void {
    if (!this.selfLearning) return;

    const patternKey = `pattern:${pattern.type}`;
    const existing = this.patterns.get(patternKey) || { count: 0, samples: [] };

    existing.count++;
    existing.samples.push(pattern);

    if (existing.samples.length > 100) {
      existing.samples = existing.samples.slice(-100); // Keep last 100 samples
    }

    this.patterns.set(patternKey, existing);
    this.emit('pattern:learned', { key: patternKey, pattern: existing });
  }

  /**
   * Performance optimization based on metrics
   */
  private optimizePerformance(metric: any): void {
    if (metric.latency > 100) {
      // Reduce generation frequency if latency is high
      this.config.interval = Math.min((this.config.interval || 100) * 1.1, 1000);
      this.emit('performance:optimized', { action: 'reduced_frequency', newInterval: this.config.interval });
    }
  }

  /**
   * Emit performance metrics
   */
  private emitPerformanceMetrics(): void {
    const metrics = {
      cacheHitRate: this.calculateCacheHitRate(),
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
      activeSymbols: this.symbols.length,
      patternsLearned: this.patterns.size,
      timestamp: new Date()
    };

    this.emit('performance:metrics', metrics);
  }

  /**
   * Cache management
   */
  private getFromCache(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    entry.hits++;
    return entry.data;
  }

  private putInCache(key: string, data: any): void {
    if (this.cache.size >= this.cacheMaxSize) {
      // LRU eviction
      const oldestKey = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0
    });
  }

  private calculateCacheHitRate(): number {
    if (this.cache.size === 0) return 0;

    const totalHits = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.hits, 0);

    return totalHits / this.cache.size;
  }

  /**
   * Utility functions
   */
  private isTradingHours(): boolean {
    const now = new Date();
    const hours = now.getUTCHours() - 5; // EST
    const dayOfWeek = now.getUTCDay();

    return dayOfWeek >= 1 && dayOfWeek <= 5 && hours >= 9.5 && hours < 16;
  }

  private randomExchange(): string {
    const exchanges = ['NYSE', 'NASDAQ', 'AMEX', 'BATS', 'IEX'];
    return exchanges[Math.floor(Math.random() * exchanges.length)];
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * AsyncGenerator for memory-efficient streaming
   */
  public async *generateStream(options: StreamOptions = {}): AsyncGenerator<Quote | Trade | News | MarketDepth> {
    const count = options.count || Infinity;
    const chunkSize = options.chunkSize || 100;
    let generated = 0;

    while (generated < count) {
      const chunk = Math.min(chunkSize, count - generated);
      const promises = [];

      for (let i = 0; i < chunk; i++) {
        const symbol = this.symbols[Math.floor(Math.random() * this.symbols.length)];
        const quote = this.generateQuote(symbol);

        promises.push(quote);

        if (Math.random() > 0.7) {
          promises.push(this.generateTrade(symbol, quote.last));
        }
      }

      for (const item of promises) {
        yield item;
        generated++;
      }

      if (options.delay) {
        await new Promise(resolve => setTimeout(resolve, options.delay));
      }
    }
  }
}