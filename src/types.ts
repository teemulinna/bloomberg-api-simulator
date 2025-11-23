/**
 * Core data structures for Bloomberg API Simulation
 */

export interface Quote {
  symbol: string;
  timestamp: Date;
  bid: number;
  ask: number;
  bidSize: number;
  askSize: number;
  last: number;
  lastSize: number;
  volume: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  close?: number;
  vwap?: number;
  marketCap?: number;
}

export interface Trade {
  id: string;
  symbol: string;
  timestamp: Date;
  price: number;
  size: number;
  side: 'buy' | 'sell';
  exchange?: string;
  conditions?: string[];
  isBlock?: boolean;
  isOddLot?: boolean;
}

export interface OHLCV {
  timestamp: Date;
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap?: number;
  trades?: number;
}

export interface OrderBookLevel {
  price: number;
  size: number;
  orders: number;
  exchange?: string;
}

export interface MarketDepth {
  symbol: string;
  timestamp: Date;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  midpoint: number;
}

export interface News {
  id: string;
  timestamp: Date;
  headline: string;
  summary: string;
  content?: string;
  symbols: string[];
  sentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number; // -1 to 1
  impact: 'low' | 'medium' | 'high';
  categories: string[];
  source?: string;
  author?: string;
  url?: string;
}

export interface TechnicalIndicator {
  timestamp: Date;
  symbol: string;
  name: string;
  value: number | { [key: string]: number };
  signal?: 'buy' | 'sell' | 'hold';
}

export interface CorporateAction {
  id: string;
  symbol: string;
  type: 'dividend' | 'split' | 'merger' | 'spinoff' | 'buyback';
  announcementDate: Date;
  effectiveDate: Date;
  details: { [key: string]: any };
}

export interface EconomicEvent {
  id: string;
  timestamp: Date;
  name: string;
  country: string;
  actual?: number;
  forecast?: number;
  previous?: number;
  importance: 'low' | 'medium' | 'high';
  impact?: string;
}

export type MarketCondition =
  | 'normal'
  | 'bullish'
  | 'bearish'
  | 'volatile'
  | 'crash'
  | 'rally'
  | 'sideways';

export interface MarketState {
  condition: MarketCondition;
  volatility: number; // 0 to 1
  momentum: number; // -1 to 1
  volume: 'low' | 'normal' | 'high';
  tradingHours: boolean;
  timestamp: Date;
}

export interface GeneratorConfig {
  symbols?: string[];
  startTime?: Date;
  endTime?: Date;
  interval?: number; // milliseconds
  marketCondition?: MarketCondition;
  volatility?: number;
  includeNews?: boolean;
  includeOrderBook?: boolean;
  includeTechnicals?: boolean;
}

export interface StreamOptions {
  count?: number;
  chunkSize?: number;
  delay?: number; // milliseconds between chunks
  parallel?: boolean;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
}