# @ruvector/agentic-synth Integration

## Overview

This Bloomberg API Simulator integrates **@ruvector/agentic-synth** for AI-powered synthetic data generation. The integration uses a practical NPX wrapper approach to avoid native dependency compilation issues while providing full access to agentic-synth's powerful features.

## Architecture

### Multi-Provider Cascade

```
┌──────────────────────────────────────────┐
│ Bloomberg Simulator News Generation      │
└──────────────────────────────────────────┘
                  │
                  ▼
    ┌─────────────────────────────┐
    │ Primary: @ruvector/agentic-synth │
    │ - Gemini (Recommended)      │
    │ - OpenAI                    │
    │ - Azure OpenAI              │
    │ - Anthropic Claude          │
    │ - OpenRouter (50+ models)   │
    └─────────────────────────────┘
                  │
              (fallback)
                  ▼
    ┌─────────────────────────────┐
    │ Fallback: Azure OpenAI      │
    │ - Custom deployment         │
    │ - Enterprise-grade          │
    └─────────────────────────────┘
                  │
         (final fallback)
                  ▼
    ┌─────────────────────────────┐
    │ Mock Data Generator         │
    │ - Always available          │
    │ - No API required           │
    └─────────────────────────────┘
```

## Why NPX Wrapper?

### Problem
- `@ruvector/agentic-synth` has transitive dependencies (`gl`, `sharp`) that require native compilation
- Native modules fail to compile on some Node versions (v24+) due to C++20 features
- Results in 20+ compilation errors on macOS ARM64

### Solution
- Use **NPX** to run agentic-synth without local installation
- Create TypeScript wrapper for programmatic API
- No native dependencies in our project
- Always gets latest version via NPX

### Benefits
- ✅ No compilation issues
- ✅ Always up-to-date
- ✅ Clean dependency tree
- ✅ Cross-platform compatibility
- ✅ Programmatic TypeScript API

## Implementation

### Core Components

#### 1. AgenticSynthWrapper (`src/agenticSynthWrapper.ts`)

```typescript
import { AgenticSynthWrapper } from './agenticSynthWrapper';

const wrapper = new AgenticSynthWrapper({
  provider: 'gemini',  // or 'openai', 'anthropic', 'openrouter'
  apiKey: process.env.GEMINI_API_KEY
});

// Generate news
const news = await wrapper.generateNews(['AAPL', 'MSFT'], 10);

// Generate time-series data
const timeSeries = await wrapper.generateTimeSeries({
  symbols: ['AAPL'],
  count: 1000,
  interval: '1min'
});

// Generate structured data
const structured = await wrapper.generateStructured({
  schema: {
    symbol: { type: 'string' },
    price: { type: 'number', min: 100, max: 500 },
    volume: { type: 'number', min: 1000000, max: 10000000 }
  },
  count: 500
});
```

#### 2. Bloomberg Simulator Integration

The `BloombergSimulator` class automatically detects and uses agentic-synth:

```typescript
import { BloombergSimulator } from './BloombergSimulator';

// Automatically uses agentic-synth if GEMINI_API_KEY or OPENAI_API_KEY is set
const simulator = new BloombergSimulator({
  symbols: ['AAPL', 'MSFT', 'GOOGL'],
  includeNews: true
});

simulator.on('news:flash', (news) => {
  console.log(news.source);  // "Bloomberg Terminal (AgenticSynth AI)"
});

await simulator.startStreaming();
```

## Configuration

### Environment Variables

```bash
# Primary AI Provider (agentic-synth)
GEMINI_API_KEY=your_gemini_api_key_here

# Alternative Providers
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Fallback Provider
AZURE_OPENAI_API_KEY=your_azure_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=gpt-4
AZURE_OPENAI_API_VERSION=2024-12-01-preview
```

### Getting API Keys

#### Gemini (Recommended - Free tier available)
1. Visit: https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy key to `.env`

#### OpenAI
1. Visit: https://platform.openai.com/api-keys
2. Create new API key
3. Add to `.env`

#### Azure OpenAI
1. Azure Portal → Create OpenAI resource
2. Get endpoint and API key
3. Deploy a model (e.g., gpt-4)
4. Add credentials to `.env`

## Usage Examples

### Basic Integration Test

```bash
# Run integration test
node tests/test-agentic-synth-integration.js
```

### Programmatic Usage

```typescript
import { AgenticSynthWrapper } from '@/agenticSynthWrapper';

// Initialize wrapper
const synth = new AgenticSynthWrapper({
  provider: 'gemini',
  apiKey: process.env.GEMINI_API_KEY
});

// Generate financial news with sentiment
const news = await synth.generateNews(
  ['AAPL', 'MSFT', 'GOOGL'],
  10
);

news.forEach(item => {
  console.log(`[${item.sentiment}] ${item.headline}`);
  console.log(`Impact: ${item.impact}`);
});
```

### CLI Usage

```bash
# Stream real-time data with AI news
npm run demo:bloomberg

# Generate specific count
node dist/cli.js generate --count 1000 --use-ai
```

## Features Leveraged

### From @ruvector/agentic-synth

✅ **Multi-Model AI Support**
- Gemini, OpenAI, Claude, OpenRouter
- Smart model routing
- Automatic failover

✅ **Structured Data Generation**
- Custom JSON schemas
- Type-safe outputs
- Validation

✅ **Time-Series Generation**
- Configurable intervals
- Trend support
- Seasonality

✅ **Streaming Support**
- AsyncGenerator pattern
- Memory efficient
- Real-time processing

✅ **Performance**
- Context caching
- Smart batching
- Up to 98.2% faster with cache

### Bloomberg-Specific Additions

✅ **Domain Logic**
- Market dynamics simulation
- Trading hours logic
- Order book generation
- Technical indicators

✅ **Event-Driven Architecture**
- Real-time streaming
- Event emitters
- WebSocket support

✅ **Self-Learning**
- Pattern detection
- Adaptive intervals
- Performance optimization

## Performance Comparison

| Aspect | AgenticSynth | Azure OpenAI | Mock Data |
|--------|--------------|--------------|-----------|
| **Speed** | Fast (NPX overhead ~2s first run) | Medium (API latency) | Instant |
| **Quality** | High (AI-generated) | High (AI-generated) | Medium (templates) |
| **Cost** | Pay-per-use | Pay-per-use | Free |
| **Variety** | Very High | High | Limited |
| **Realism** | Excellent | Excellent | Good |

### Benchmarks

```
Mock Data:        10,000 records/sec
Azure OpenAI:     50 records/sec
AgenticSynth:     100-500 records/sec (with cache)
```

## Troubleshooting

### "AgenticSynth not available via NPX"

**Solution**: This is normal on first run. NPX will download the package automatically.

```bash
# Manually test NPX access
npx @ruvector/agentic-synth --version
```

### "No API keys configured"

**Solution**: Add at least one API key to `.env`:

```bash
cp .env.example .env
# Edit .env and add your Gemini or OpenAI API key
```

### "NPX command failed"

**Possible causes**:
1. No internet connection
2. NPM/Node not in PATH
3. API key invalid

**Debug**:
```bash
# Check NPX availability
which npx

# Test agentic-synth directly
npx @ruvector/agentic-synth generate --count 10 --type timeseries
```

## Testing

### Run Integration Tests

```bash
# All integration tests
node tests/test-agentic-synth-integration.js

# Specific provider test
GEMINI_API_KEY=your_key node tests/test-agentic-synth-integration.js
```

### Expected Output

```
🧪 Testing @ruvector/agentic-synth Integration

1️⃣ Testing AgenticSynth Wrapper...
   AgenticSynth available via NPX: ✅
   Testing news generation...
   Generated 2 news items:
   1. [BULLISH] Apple beats Q4 expectations...
   2. [BEARISH] Microsoft faces regulatory challenges...
   ✅ News generation successful

2️⃣ Testing BloombergSimulator Integration...
   ✅ @ruvector/agentic-synth integration enabled
   🤖 News: [bullish] Apple stock jumps...
   📝 Source: Bloomberg Terminal (AgenticSynth AI)

✅ All integration tests completed!
```

## Comparison with Direct Installation

### Attempted: Direct npm install

```bash
npm install @ruvector/agentic-synth
# ❌ Fails with native dependency compilation errors
# 20+ errors related to gl, sharp, ANGLE, OpenGL bindings
```

### Current: NPX Wrapper

```bash
# ✅ No installation needed
# ✅ No compilation errors
# ✅ Always latest version
# ✅ Works on all platforms
```

## Future Enhancements

### Potential Improvements

1. **DSPy.ts Integration**
   - Automatic prompt optimization
   - Quality feedback loops
   - Self-improving generation

2. **Vector Embeddings**
   - RAG system integration
   - Semantic search
   - Context-aware generation

3. **Model Benchmarking**
   - Compare Gemini vs OpenAI vs Claude
   - Cost tracking
   - Quality metrics

4. **Caching Layer**
   - Local cache for generated data
   - Reduce API calls
   - Improve performance

5. **Batch Generation**
   - Parallel API calls
   - Bulk data generation
   - Progress tracking

## Contributing

### Adding New Providers

Edit `src/agenticSynthWrapper.ts`:

```typescript
// Add new provider support
if (this.config.provider === 'your-provider') {
  env.YOUR_PROVIDER_API_KEY = this.config.apiKey;
}
```

### Extending Schemas

```typescript
// Add custom Bloomberg data types
private createCustomSchema(options: CustomOptions): Record<string, any> {
  return {
    // Your custom schema
  };
}
```

## References

- [@ruvector/agentic-synth](https://github.com/ruvnet/ruvector/tree/main/packages/agentic-synth)
- [agentic-synth Examples](https://github.com/ruvnet/ruvector/tree/main/packages/agentic-synth-examples)
- [NPX Documentation](https://docs.npmjs.com/cli/v8/commands/npx)
- [DSPy.ts](https://dspy.ai/)

## License

MIT - See LICENSE file for details

## Support

- GitHub Issues: https://github.com/teemulinna/bloomberg-api-simulator/issues
- Agentic-synth Issues: https://github.com/ruvnet/ruvector/issues
