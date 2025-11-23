/**
 * Simple test to verify agentic-synth CLI is accessible
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🧪 Simple AgenticSynth CLI Test\n');

// Test 1: Check if NPX can find the package
async function testNpxAvailability() {
  console.log('1️⃣ Testing NPX availability...');

  return new Promise((resolve) => {
    const child = spawn('npx', ['@ruvector/agentic-synth', '--version'], {
      stdio: 'pipe'
    });

    let output = '';
    let hasOutput = false;

    child.stdout.on('data', (data) => {
      output += data.toString();
      hasOutput = true;
    });

    child.stderr.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      console.log(`   Exit code: ${code}`);
      console.log(`   Output: ${output.substring(0, 200)}`);
      console.log(`   Available: ${code === 0 && hasOutput ? '✅' : '❌'}\n`);
      resolve(code === 0 && hasOutput);
    });

    // 15 second timeout
    setTimeout(() => {
      child.kill();
      console.log('   ⏱️  Timeout (15s)\n');
      resolve(false);
    }, 15000);
  });
}

// Test 2: Try to generate with help
async function testHelpCommand() {
  console.log('2️⃣ Testing help command...');

  return new Promise((resolve) => {
    const child = spawn('npx', ['@ruvector/agentic-synth', '--help'], {
      stdio: 'pipe'
    });

    let output = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      console.log(`   Exit code: ${code}`);
      if (output) {
        console.log(`   Help output (first 300 chars):`);
        console.log(`   ${output.substring(0, 300)}`);
      }
      console.log(`   Success: ${code === 0 ? '✅' : '❌'}\n`);
      resolve(code === 0);
    });

    setTimeout(() => {
      child.kill();
      console.log('   ⏱️  Timeout (15s)\n');
      resolve(false);
    }, 15000);
  });
}

// Test 3: Try basic generation with mock data (no AI)
async function testBasicGeneration() {
  console.log('3️⃣ Testing basic generation (mock mode)...');

  // Create temp schema
  const schemaFile = path.join(os.tmpdir(), `test-schema-${Date.now()}.json`);
  const schema = {
    name: { type: 'string' },
    value: { type: 'number', min: 1, max: 100 }
  };

  try {
    fs.writeFileSync(schemaFile, JSON.stringify(schema, null, 2));
    console.log(`   Created schema file: ${schemaFile}`);
  } catch (error) {
    console.log(`   ❌ Failed to create schema: ${error.message}\n`);
    return false;
  }

  return new Promise((resolve) => {
    const child = spawn('npx', [
      '@ruvector/agentic-synth',
      'generate',
      'structured',
      '--schema', schemaFile,
      '--count', '2',
      '--output', '-'
    ], {
      stdio: 'pipe'
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
      // Cleanup
      try {
        fs.unlinkSync(schemaFile);
      } catch (e) {
        // Ignore
      }

      console.log(`   Exit code: ${code}`);
      if (output) {
        console.log(`   Output (first 200 chars): ${output.substring(0, 200)}`);
      }
      if (errorOutput) {
        console.log(`   Errors: ${errorOutput.substring(0, 200)}`);
      }
      console.log(`   Success: ${code === 0 ? '✅' : '❌'}\n`);
      resolve(code === 0);
    });

    setTimeout(() => {
      child.kill();
      try {
        fs.unlinkSync(schemaFile);
      } catch (e) {
        // Ignore
      }
      console.log('   ⏱️  Timeout (20s)\n');
      resolve(false);
    }, 20000);
  });
}

// Run all tests
async function runTests() {
  console.log('═══════════════════════════════════════\n');

  const result1 = await testNpxAvailability();
  const result2 = await testHelpCommand();
  const result3 = await testBasicGeneration();

  console.log('═══════════════════════════════════════');
  console.log('\n📊 Test Summary:');
  console.log(`   NPX Availability: ${result1 ? '✅' : '❌'}`);
  console.log(`   Help Command: ${result2 ? '✅' : '❌'}`);
  console.log(`   Basic Generation: ${result3 ? '✅' : '❌'}`);

  const allPassed = result1 && result2 && result3;
  console.log(`\n   Overall: ${allPassed ? '✅ All tests passed!' : '❌ Some tests failed'}`);

  if (!allPassed) {
    console.log('\n💡 Findings:');
    if (!result1) {
      console.log('   - Package not available via NPX (expected on first run)');
    }
    if (!result2 && result1) {
      console.log('   - Package found but help command failed');
    }
    if (!result3 && result2) {
      console.log('   - CLI syntax may be different than expected');
    }
  }
}

runTests().catch(console.error);
