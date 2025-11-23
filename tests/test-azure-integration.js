/**
 * Test Azure OpenAI Integration
 */

const { AzureOpenAIClient } = require('../dist/azureOpenAI');
const { BloombergSimulator } = require('../dist/BloombergSimulator');

async function testAzureOpenAI() {
  console.log('🧪 Testing Azure OpenAI Integration\n');

  // Test 1: Check configuration
  console.log('1️⃣ Testing Configuration...');
  const isConfigured = AzureOpenAIClient.isConfigured();
  console.log(`   Azure OpenAI Configured: ${isConfigured ? '✅' : '❌'}`);

  if (!isConfigured) {
    console.log('   ⚠️  Please set AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT in .env');
    return;
  }

  const client = new AzureOpenAIClient();
  const status = client.getConfigStatus();
  console.log(`   Endpoint: ${status.endpoint}`);
  console.log(`   Deployment: ${status.deployment}\n`);

  // Test 2: Generate news headlines
  console.log('2️⃣ Testing News Generation...');
  try {
    const symbols = ['AAPL', 'MSFT'];
    console.log(`   Generating news for: ${symbols.join(', ')}`);

    const news = await client.generateNews(symbols, 2);
    console.log(`   Generated ${news.length} news items:`);

    news.forEach((item, idx) => {
      console.log(`   ${idx + 1}. [${item.sentiment.toUpperCase()}] ${item.headline}`);
    });
    console.log('   ✅ News generation successful\n');
  } catch (error) {
    console.log(`   ❌ News generation failed: ${error.message}\n`);
  }

  // Test 3: Bloomberg Simulator integration
  console.log('3️⃣ Testing BloombergSimulator Integration...');
  const simulator = new BloombergSimulator({
    symbols: ['AAPL'],
    includeNews: true
  });

  let newsReceived = false;

  simulator.on('log', (msg) => {
    console.log(`   ${msg}`);
  });

  simulator.on('news:flash', (news) => {
    newsReceived = true;
    console.log(`   📰 News: [${news.sentiment}] ${news.headline}`);
    console.log(`   📝 Source: ${news.source}`);
    simulator.stopStreaming();
  });

  await simulator.startStreaming({ parallel: true });

  // Wait for news or timeout
  await new Promise((resolve) => {
    setTimeout(() => {
      simulator.stopStreaming();
      if (!newsReceived) {
        console.log('   ⏱️  No news generated in test period (this is normal for low probability events)');
      }
      resolve();
    }, 10000); // 10 seconds
  });

  console.log('\n✅ All tests completed!');
}

testAzureOpenAI().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
