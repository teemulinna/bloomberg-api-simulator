#!/usr/bin/env node

/**
 * Bloomberg API Simulator CLI
 * Integrates with @ruvector/agentic-synth for AI-powered data generation
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as dotenv from 'dotenv';
import { BloombergSimulator } from './BloombergSimulator';
import { TechnicalIndicators } from './indicators';
import { Quote, Trade, News, MarketDepth } from './types';
import { spawn } from 'child_process';

dotenv.config();

const program = new Command();

// ASCII Art Banner
const banner = `
${chalk.cyan('╔════════════════════════════════════════╗')}
${chalk.cyan('║')} ${chalk.bold.green('Bloomberg Terminal API Simulator')}      ${chalk.cyan('║')}
${chalk.cyan('║')} ${chalk.gray('Powered by @ruvector/agentic-synth')}    ${chalk.cyan('║')}
${chalk.cyan('╚════════════════════════════════════════╝')}
`;

program
  .name('bloomberg-sim')
  .description('Advanced Bloomberg Terminal API Simulator with AI-powered data generation')
  .version('1.0.0');

/**
 * Generate command - uses agentic-synth for AI-powered generation
 */
program
  .command('generate')
  .description('Generate Bloomberg market data using AI')
  .option('-c, --count <number>', 'Number of records to generate', '1000')
  .option('-s, --symbols <symbols>', 'Comma-separated list of symbols', 'AAPL,MSFT,GOOGL')
  .option('-t, --type <type>', 'Data type (quotes|trades|news|all)', 'all')
  .option('--streaming', 'Enable real-time streaming mode')
  .option('--use-ai', 'Use AI-powered generation via agentic-synth', true)
  .action(async (options) => {
    console.log(banner);
    console.log(chalk.yellow('🚀 Starting Bloomberg Data Generation...\n'));

    const symbols = options.symbols.split(',');
    const count = parseInt(options.count);

    if (options.useAi) {
      // Use agentic-synth for AI-powered generation
      console.log(chalk.blue('🤖 Using AI-powered generation with agentic-synth...\n'));
      await runAgenticSynth(symbols, count, options.type);
    } else {
      // Use built-in simulator
      await runBuiltInSimulator(symbols, count, options.type, options.streaming);
    }
  });

/**
 * Stream command - real-time streaming
 */
program
  .command('stream')
  .description('Stream real-time Bloomberg market data')
  .option('-s, --symbols <symbols>', 'Comma-separated list of symbols', 'AAPL,MSFT,GOOGL,AMZN,META')
  .option('-i, --interval <ms>', 'Update interval in milliseconds', '100')
  .option('-d, --duration <seconds>', 'Stream duration in seconds (0 for infinite)', '0')
  .action(async (options) => {
    console.log(banner);
    console.log(chalk.green('📊 Starting Real-Time Bloomberg Data Stream...\n'));

    const symbols = options.symbols.split(',');
    const interval = parseInt(options.interval);
    const duration = parseInt(options.duration);

    const simulator = new BloombergSimulator({
      symbols,
      interval,
      includeNews: true,
      includeOrderBook: true,
      includeTechnicals: true
    });

    // Setup event handlers with formatted output
    setupStreamHandlers(simulator);

    // Start streaming
    await simulator.startStreaming({ parallel: true });

    // Stop after duration if specified
    if (duration > 0) {
      setTimeout(() => {
        simulator.stopStreaming();
        console.log(chalk.yellow('\n📊 Stream ended.'));
        process.exit(0);
      }, duration * 1000);
    }

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      simulator.stopStreaming();
      console.log(chalk.yellow('\n📊 Stream stopped.'));
      process.exit(0);
    });
  });

/**
 * Benchmark command - performance testing
 */
program
  .command('benchmark')
  .description('Run performance benchmarks')
  .option('-r, --records <number>', 'Number of records', '10000')
  .option('-s, --symbols <number>', 'Number of symbols', '50')
  .action(async (options) => {
    console.log(banner);
    console.log(chalk.magenta('⚡ Running Performance Benchmarks...\n'));

    const records = parseInt(options.records);
    const symbolCount = parseInt(options.symbols);

    await runBenchmark(records, symbolCount);
  });

/**
 * Demo command - interactive demonstration
 */
program
  .command('demo')
  .description('Run interactive Bloomberg Terminal demo')
  .action(async () => {
    console.log(banner);
    console.log(chalk.bold.green('🎯 Bloomberg Terminal Interactive Demo\n'));

    await runInteractiveDemo();
  });

/**
 * Run agentic-synth for AI-powered generation
 */
async function runAgenticSynth(symbols: string[], count: number, type: string) {
  const config = {
    type: 'bloomberg-market-data',
    count,
    symbols,
    dataType: type,
    streaming: true,
    model: process.env.GEMINI_API_KEY ? 'gemini-1.5-flash' : 'gpt-3.5-turbo'
  };

  console.log(chalk.gray('Configuration:'), JSON.stringify(config, null, 2));
  console.log();

  // Prepare the command
  const args = [
    '@ruvector/agentic-synth',
    'generate',
    '--type', 'timeseries',
    '--count', count.toString(),
    '--schema', JSON.stringify({
      timestamp: 'datetime',
      symbol: `enum:${symbols.join(',')}`,
      open: 'number:50:500',
      high: 'number:50:500',
      low: 'number:50:500',
      close: 'number:50:500',
      volume: 'number:1000000:10000000',
      bid: 'number:50:500',
      ask: 'number:50:500'
    })
  ];

  console.log(chalk.blue('Executing: npx'), args.join(' '));
  console.log();

  // Run the command
  const child = spawn('npx', args, {
    stdio: 'pipe',
    shell: true
  });

  let dataCount = 0;

  child.stdout.on('data', (data) => {
    const output = data.toString();
    try {
      const lines = output.trim().split('\n');
      for (const line of lines) {
        if (line.startsWith('{')) {
          const record = JSON.parse(line);
          dataCount++;
          displayMarketData(record, dataCount);
        } else {
          process.stdout.write(chalk.gray(line + '\n'));
        }
      }
    } catch (e) {
      // Not JSON, just pass through
      process.stdout.write(output);
    }
  });

  child.stderr.on('data', (data) => {
    console.error(chalk.red('Error:'), data.toString());
  });

  child.on('close', (code) => {
    console.log(chalk.green(`\n✅ Generated ${dataCount} records successfully!`));
    if (code !== 0) {
      console.log(chalk.yellow('Note: agentic-synth process exited with code'), code);
    }
  });
}

/**
 * Run built-in simulator
 */
async function runBuiltInSimulator(
  symbols: string[],
  count: number,
  type: string,
  streaming: boolean
) {
  const simulator = new BloombergSimulator({
    symbols,
    includeNews: type === 'news' || type === 'all',
    includeOrderBook: type === 'all',
    includeTechnicals: type === 'all'
  });

  console.log(chalk.blue('🔄 Generating data with built-in simulator...\n'));

  let generated = 0;
  const startTime = Date.now();

  if (streaming) {
    // Use async generator for streaming
    for await (const data of simulator.generateStream({ count, chunkSize: 100 })) {
      generated++;
      displayMarketData(data, generated);

      if (generated % 100 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = generated / elapsed;
        console.log(chalk.gray(`\n⚡ Performance: ${rate.toFixed(0)} records/sec\n`));
      }
    }
  } else {
    // Generate all at once
    simulator.on('quote:update', (quote: Quote) => {
      generated++;
      displayMarketData(quote, generated);
    });

    simulator.on('trade:executed', (trade: Trade) => {
      generated++;
      displayMarketData(trade, generated);
    });

    await simulator.startStreaming({ parallel: true });

    setTimeout(() => {
      simulator.stopStreaming();
      const elapsed = (Date.now() - startTime) / 1000;
      console.log(chalk.green(`\n✅ Generated ${generated} records in ${elapsed.toFixed(2)}s`));
      console.log(chalk.green(`⚡ Rate: ${(generated / elapsed).toFixed(0)} records/sec`));
      process.exit(0);
    }, 5000);
  }
}

/**
 * Display market data with formatting
 */
function displayMarketData(data: any, count: number) {
  if ('bid' in data && 'ask' in data) {
    // Quote data
    const quote = data as Quote;
    console.log(
      `${chalk.cyan(`[${count}]`)} ${chalk.bold(quote.symbol)} | ` +
      `Bid: ${chalk.green(`$${quote.bid.toFixed(2)}`)} | ` +
      `Ask: ${chalk.red(`$${quote.ask.toFixed(2)}`)} | ` +
      `Last: ${chalk.yellow(`$${quote.last.toFixed(2)}`)} | ` +
      `Vol: ${chalk.gray(quote.volume.toLocaleString())}`
    );
  } else if ('side' in data) {
    // Trade data
    const trade = data as Trade;
    const sideColor = trade.side === 'buy' ? chalk.green : chalk.red;
    console.log(
      `${chalk.cyan(`[${count}]`)} ${chalk.bold('TRADE')} ${trade.symbol} | ` +
      `${sideColor(trade.side.toUpperCase())} ${trade.size} @ $${trade.price.toFixed(2)}`
    );
  } else if ('headline' in data) {
    // News data
    const news = data as News;
    const sentimentColor =
      news.sentiment === 'bullish' ? chalk.green :
      news.sentiment === 'bearish' ? chalk.red :
      chalk.yellow;
    console.log(
      `${chalk.cyan(`[${count}]`)} ${chalk.bold('NEWS')} | ` +
      `${sentimentColor(news.sentiment.toUpperCase())} | ${news.headline}`
    );
  }
}

/**
 * Setup stream event handlers
 */
function setupStreamHandlers(simulator: BloombergSimulator) {
  let quoteCount = 0;
  let tradeCount = 0;
  let newsCount = 0;

  simulator.on('quote:update', (quote: Quote) => {
    quoteCount++;
    console.log(
      chalk.cyan(`[QUOTE ${quoteCount}]`),
      chalk.bold(quote.symbol),
      `Bid: ${chalk.green(`$${quote.bid.toFixed(2)}`)}`,
      `Ask: ${chalk.red(`$${quote.ask.toFixed(2)}`)}`,
      `Last: ${chalk.yellow(`$${quote.last.toFixed(2)}`)}`,
      `Change: ${quote.change > 0 ? chalk.green(`+${quote.changePercent}%`) : chalk.red(`${quote.changePercent}%`)}`
    );
  });

  simulator.on('trade:executed', (trade: Trade) => {
    tradeCount++;
    const sideColor = trade.side === 'buy' ? chalk.green : chalk.red;
    console.log(
      chalk.magenta(`[TRADE ${tradeCount}]`),
      chalk.bold(trade.symbol),
      sideColor(`${trade.side.toUpperCase()} ${trade.size} @ $${trade.price.toFixed(2)}`),
      trade.isBlock ? chalk.yellow('[BLOCK]') : ''
    );
  });

  simulator.on('news:flash', (news: News) => {
    newsCount++;
    const sentimentIcon =
      news.sentiment === 'bullish' ? '📈' :
      news.sentiment === 'bearish' ? '📉' : '📊';
    console.log(
      chalk.yellow(`[NEWS ${newsCount}]`),
      sentimentIcon,
      chalk.bold(news.headline),
      chalk.gray(`(${news.impact} impact)`)
    );
  });

  simulator.on('depth:update', (depth: MarketDepth) => {
    console.log(
      chalk.blue('[DEPTH]'),
      chalk.bold(depth.symbol),
      `Spread: $${depth.spread.toFixed(3)}`,
      `Mid: $${depth.midpoint.toFixed(2)}`,
      `Bid Levels: ${depth.bids.length}`,
      `Ask Levels: ${depth.asks.length}`
    );
  });

  simulator.on('performance:metrics', (metrics: any) => {
    console.log(
      chalk.gray('[METRICS]'),
      `Cache Hit: ${(metrics.cacheHitRate * 100).toFixed(1)}%`,
      `Memory: ${metrics.memoryUsage.toFixed(1)}MB`,
      `Patterns: ${metrics.patternsLearned}`
    );
  });
}

/**
 * Run performance benchmark
 */
async function runBenchmark(records: number, symbolCount: number) {
  const symbols = Array.from({ length: symbolCount }, (_, i) => `SYM${i + 1}`);

  console.log(chalk.gray('Benchmark Configuration:'));
  console.log(chalk.gray(`  - Records: ${records.toLocaleString()}`));
  console.log(chalk.gray(`  - Symbols: ${symbolCount}`));
  console.log(chalk.gray(`  - Parallel: true`));
  console.log();

  const simulator = new BloombergSimulator({ symbols });

  let generated = 0;
  const startTime = Date.now();
  const memStart = process.memoryUsage().heapUsed;

  console.log(chalk.blue('Running benchmark...'));

  const progressBar = '█'.repeat(50);
  for await (const _ of simulator.generateStream({ count: records, chunkSize: 1000 })) {
    generated++;
    if (generated % Math.max(1, Math.floor(records / 50)) === 0) {
      const progress = Math.min(50, Math.floor((generated / records) * 50));
      process.stdout.write(`\r[${progressBar.slice(0, progress)}${' '.repeat(Math.max(0, 50 - progress))}] ${((generated / records) * 100).toFixed(1)}%`);
    }
  }

  const elapsed = (Date.now() - startTime) / 1000;
  const memEnd = process.memoryUsage().heapUsed;
  const memUsed = (memEnd - memStart) / 1024 / 1024;

  console.log('\n');
  console.log(chalk.green('📊 Benchmark Results:'));
  console.log(chalk.white('━'.repeat(40)));
  console.log(chalk.cyan('Total Records:'), records.toLocaleString());
  console.log(chalk.cyan('Time Elapsed:'), `${elapsed.toFixed(2)}s`);
  console.log(chalk.cyan('Throughput:'), `${(records / elapsed).toFixed(0)} records/sec`);
  console.log(chalk.cyan('Avg Latency:'), `${((elapsed * 1000) / records).toFixed(2)}ms`);
  console.log(chalk.cyan('Memory Used:'), `${memUsed.toFixed(2)}MB`);
  console.log(chalk.cyan('Memory/Record:'), `${((memUsed * 1024) / records).toFixed(2)}KB`);
  console.log(chalk.white('━'.repeat(40)));

  // Performance grade
  const throughput = records / elapsed;
  let grade = 'F';
  let gradeColor = chalk.red;

  if (throughput > 10000) {
    grade = 'A+';
    gradeColor = chalk.green;
  } else if (throughput > 5000) {
    grade = 'A';
    gradeColor = chalk.green;
  } else if (throughput > 2000) {
    grade = 'B';
    gradeColor = chalk.yellow;
  } else if (throughput > 1000) {
    grade = 'C';
    gradeColor = chalk.yellow;
  } else if (throughput > 500) {
    grade = 'D';
    gradeColor = chalk.red;
  }

  console.log(chalk.bold('Performance Grade:'), gradeColor(grade));
}

/**
 * Run interactive demo
 */
async function runInteractiveDemo() {
  const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META'];

  console.log(chalk.gray('Starting interactive Bloomberg Terminal simulation...'));
  console.log(chalk.gray('Press Ctrl+C to exit\n'));

  const simulator = new BloombergSimulator({
    symbols,
    interval: 500,
    includeNews: true,
    includeOrderBook: true,
    includeTechnicals: true,
    marketCondition: 'volatile'
  });

  // Dashboard display
  const dashboard: { [key: string]: any } = {};

  simulator.on('quote:update', (quote: Quote) => {
    dashboard[quote.symbol] = quote;
    updateDashboard(dashboard);
  });

  simulator.on('news:flash', (news: News) => {
    console.log(chalk.bgYellow.black(' BREAKING NEWS '), news.headline);
  });

  simulator.on('marketStateChange', (state: any) => {
    console.log(
      chalk.bgMagenta.white(' MARKET ALERT '),
      `Condition changed to: ${state.condition.toUpperCase()}`
    );
  });

  await simulator.startStreaming({ parallel: true });

  // Keep running until interrupted
  process.on('SIGINT', () => {
    simulator.stopStreaming();
    console.log(chalk.yellow('\n\nDemo ended. Thank you for using Bloomberg API Simulator!'));
    process.exit(0);
  });
}

/**
 * Update dashboard display
 */
function updateDashboard(dashboard: { [key: string]: Quote }) {
  console.clear();
  console.log(banner);
  console.log(chalk.bold.white('📊 LIVE MARKET DASHBOARD'), chalk.gray(new Date().toLocaleTimeString()));
  console.log(chalk.white('━'.repeat(80)));
  console.log(
    chalk.gray('Symbol'),
    ' '.repeat(2),
    chalk.gray('Last'),
    ' '.repeat(7),
    chalk.gray('Change'),
    ' '.repeat(5),
    chalk.gray('Bid'),
    ' '.repeat(8),
    chalk.gray('Ask'),
    ' '.repeat(8),
    chalk.gray('Volume')
  );
  console.log(chalk.white('━'.repeat(80)));

  Object.values(dashboard).forEach((quote: Quote) => {
    const changeColor = quote.change > 0 ? chalk.green : quote.change < 0 ? chalk.red : chalk.yellow;
    console.log(
      chalk.bold.cyan(quote.symbol.padEnd(8)),
      chalk.yellow(`$${quote.last.toFixed(2)}`.padEnd(10)),
      changeColor(`${quote.change > 0 ? '+' : ''}${quote.changePercent}%`.padEnd(10)),
      chalk.green(`$${quote.bid.toFixed(2)}`.padEnd(10)),
      chalk.red(`$${quote.ask.toFixed(2)}`.padEnd(10)),
      chalk.gray(quote.volume.toLocaleString())
    );
  });

  console.log(chalk.white('━'.repeat(80)));
}

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}