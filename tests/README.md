# Test Suite

## Running Tests

**Important:** All tests must be run from the project root directory:

```bash
cd /path/to/bloomberg-api-simulator
node tests/test-simple-agentic-synth.js
```

## Test Files

### 1. `test-simple-agentic-synth.js`
**Purpose:** Verify NPX wrapper is working correctly
**Requirements:** None (no API key needed)
**Expected Result:**
```
✅ NPX Availability: ✅
✅ Help Command: ✅
❌ Basic Generation: ❌ (needs API key)
```

This test confirms:
- NPX can download and execute @ruvector/agentic-synth
- CLI responds to commands correctly
- Generation fails with "401 Unauthorized" without API key (expected)

### 2. `test-agentic-synth-integration.js`
**Purpose:** Full integration test with AI generation
**Requirements:** Valid API key in `.env` file (GEMINI_API_KEY or OPENAI_API_KEY)
**Expected Result:**
```
✅ AgenticSynth available via NPX: ✅
✅ News generation successful
✅ BloombergSimulator integration enabled
```

### 3. `test-azure-integration.js`
**Purpose:** Test Azure OpenAI fallback provider
**Requirements:** Azure OpenAI credentials in `.env`
**Expected Result:** AI-generated news using Azure OpenAI

## Common Issues

### "Cannot find module" Error
```
Error: Cannot find module '/Users/xxx/projects/tests/test-simple-agentic-synth.js'
```

**Solution:** You're in the wrong directory. Run from project root:
```bash
cd bloomberg-api-simulator
node tests/test-simple-agentic-synth.js
```

### "401 Unauthorized" Error
```
Error: All model attempts failed: OpenRouter API error: HTTP 401: Unauthorized
```

**This is expected!** The test is working correctly. Add an API key to `.env`:
```bash
cp .env.example .env
# Edit .env and add:
GEMINI_API_KEY=your_key_here
```

### Test Hangs
If a test hangs for more than 30 seconds:
- Check internet connection (NPX needs to download package)
- Verify NPM/Node are installed and in PATH
- Try: `npx @ruvector/agentic-synth --version` manually

## Quick Verification

```bash
# From project root
npm run build
node tests/test-simple-agentic-synth.js
```

Expected: 2 out of 3 tests pass (generation needs API key).
