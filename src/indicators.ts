/**
 * Technical Indicators for Bloomberg API Simulation
 */

import { OHLCV, TechnicalIndicator } from './types';

export class TechnicalIndicators {
  /**
   * Calculate Simple Moving Average (SMA)
   */
  static calculateSMA(data: number[], period: number): number {
    if (data.length < period) return 0;
    const slice = data.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
  }

  /**
   * Calculate Exponential Moving Average (EMA)
   */
  static calculateEMA(data: number[], period: number): number {
    if (data.length < period) return 0;

    const multiplier = 2 / (period + 1);
    let ema = this.calculateSMA(data.slice(0, period), period);

    for (let i = period; i < data.length; i++) {
      ema = (data[i] - ema) * multiplier + ema;
    }

    return ema;
  }

  /**
   * Calculate Relative Strength Index (RSI)
   */
  static calculateRSI(data: number[], period: number = 14): number {
    if (data.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const change = data[i] - data[i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  static calculateMACD(
    data: number[],
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9
  ): { macd: number; signal: number; histogram: number } {
    if (data.length < slowPeriod) {
      return { macd: 0, signal: 0, histogram: 0 };
    }

    const emaFast = this.calculateEMA(data, fastPeriod);
    const emaSlow = this.calculateEMA(data, slowPeriod);
    const macd = emaFast - emaSlow;

    // For simplicity, using current MACD as signal
    const signal = macd * 0.9;
    const histogram = macd - signal;

    return { macd, signal, histogram };
  }

  /**
   * Calculate Bollinger Bands
   */
  static calculateBollingerBands(
    data: number[],
    period: number = 20,
    stdDev: number = 2
  ): { upper: number; middle: number; lower: number } {
    if (data.length < period) {
      const current = data[data.length - 1] || 0;
      return { upper: current, middle: current, lower: current };
    }

    const sma = this.calculateSMA(data, period);
    const slice = data.slice(-period);
    const variance = slice.reduce((sum, val) => sum + Math.pow(val - sma, 2), 0) / period;
    const std = Math.sqrt(variance);

    return {
      upper: sma + stdDev * std,
      middle: sma,
      lower: sma - stdDev * std
    };
  }

  /**
   * Calculate Stochastic Oscillator
   */
  static calculateStochastic(
    highs: number[],
    lows: number[],
    closes: number[],
    period: number = 14
  ): { k: number; d: number } {
    if (highs.length < period) return { k: 50, d: 50 };

    const recentHighs = highs.slice(-period);
    const recentLows = lows.slice(-period);
    const close = closes[closes.length - 1];

    const highest = Math.max(...recentHighs);
    const lowest = Math.min(...recentLows);

    if (highest === lowest) return { k: 50, d: 50 };

    const k = ((close - lowest) / (highest - lowest)) * 100;
    const d = k * 0.8; // Simplified D calculation

    return { k, d };
  }

  /**
   * Calculate Volume-Weighted Average Price (VWAP)
   */
  static calculateVWAP(prices: number[], volumes: number[]): number {
    if (prices.length === 0 || prices.length !== volumes.length) return 0;

    const totalVolume = volumes.reduce((a, b) => a + b, 0);
    if (totalVolume === 0) return prices[prices.length - 1] || 0;

    const vwSum = prices.reduce((sum, price, i) => sum + price * volumes[i], 0);
    return vwSum / totalVolume;
  }

  /**
   * Generate all technical indicators for a dataset
   */
  static generateAllIndicators(
    ohlcvData: OHLCV[],
    symbol: string
  ): TechnicalIndicator[] {
    if (ohlcvData.length === 0) return [];

    const closes = ohlcvData.map(d => d.close);
    const highs = ohlcvData.map(d => d.high);
    const lows = ohlcvData.map(d => d.low);
    const volumes = ohlcvData.map(d => d.volume);

    const timestamp = new Date();
    const indicators: TechnicalIndicator[] = [];

    // Moving Averages
    indicators.push({
      timestamp,
      symbol,
      name: 'SMA_20',
      value: this.calculateSMA(closes, 20),
      signal: this.getSignal('SMA', closes[closes.length - 1], this.calculateSMA(closes, 20))
    });

    indicators.push({
      timestamp,
      symbol,
      name: 'EMA_12',
      value: this.calculateEMA(closes, 12),
      signal: this.getSignal('EMA', closes[closes.length - 1], this.calculateEMA(closes, 12))
    });

    // RSI
    const rsi = this.calculateRSI(closes);
    indicators.push({
      timestamp,
      symbol,
      name: 'RSI',
      value: rsi,
      signal: rsi > 70 ? 'sell' : rsi < 30 ? 'buy' : 'hold'
    });

    // MACD
    const macd = this.calculateMACD(closes);
    indicators.push({
      timestamp,
      symbol,
      name: 'MACD',
      value: macd,
      signal: macd.histogram > 0 ? 'buy' : macd.histogram < 0 ? 'sell' : 'hold'
    });

    // Bollinger Bands
    const bb = this.calculateBollingerBands(closes);
    indicators.push({
      timestamp,
      symbol,
      name: 'BollingerBands',
      value: bb,
      signal: this.getBollingerSignal(closes[closes.length - 1], bb)
    });

    // Stochastic
    const stoch = this.calculateStochastic(highs, lows, closes);
    indicators.push({
      timestamp,
      symbol,
      name: 'Stochastic',
      value: stoch,
      signal: stoch.k > 80 ? 'sell' : stoch.k < 20 ? 'buy' : 'hold'
    });

    // VWAP
    indicators.push({
      timestamp,
      symbol,
      name: 'VWAP',
      value: this.calculateVWAP(closes, volumes),
      signal: 'hold'
    });

    return indicators;
  }

  /**
   * Get trading signal based on indicator
   */
  private static getSignal(
    type: string,
    currentPrice: number,
    indicatorValue: number
  ): 'buy' | 'sell' | 'hold' {
    if (type === 'SMA' || type === 'EMA') {
      if (currentPrice > indicatorValue * 1.02) return 'sell';
      if (currentPrice < indicatorValue * 0.98) return 'buy';
    }
    return 'hold';
  }

  /**
   * Get Bollinger Bands signal
   */
  private static getBollingerSignal(
    currentPrice: number,
    bands: { upper: number; middle: number; lower: number }
  ): 'buy' | 'sell' | 'hold' {
    if (currentPrice > bands.upper) return 'sell';
    if (currentPrice < bands.lower) return 'buy';
    return 'hold';
  }

  /**
   * Calculate trend strength (0-100)
   */
  static calculateTrendStrength(data: number[], period: number = 20): number {
    if (data.length < period) return 50;

    const recentData = data.slice(-period);
    const firstHalf = recentData.slice(0, period / 2);
    const secondHalf = recentData.slice(period / 2);

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    return Math.min(100, Math.max(0, 50 + change * 10));
  }
}