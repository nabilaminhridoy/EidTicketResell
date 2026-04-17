const autocannon = require('autocannon');

const targetUrl = process.env.TEST_URL || 'http://localhost:3000';

const tests = [
  {
    title: 'Ticket Search API (Public / Redis)',
    url: `${targetUrl}/api/tickets`,
    connections: 100,
    duration: 20
  },
  {
    title: 'Auth Login API (Rate Limited / Strict)',
    url: `${targetUrl}/api/auth/login`,
    method: 'POST',
    body: JSON.stringify({ phone: '01711000000', password: 'password123' }),
    headers: { 'Content-type': 'application/json' },
    connections: 50,
    duration: 10
  },
  {
    title: 'Payment Init API (Rate Limited / Transactional)',
    url: `${targetUrl}/api/payments/init`,
    method: 'POST',
    body: JSON.stringify({ transactionId: 'dummy-tx-123', gateway: 'bkash' }),
    headers: { 'Content-type': 'application/json' },
    connections: 50,
    duration: 10
  }
];

async function runTest(testConfig) {
  console.log(`\n===========================================`);
  console.log(`🚀 Starting Test: ${testConfig.title}`);
  console.log(`===========================================`);
  console.log(`URL: ${testConfig.url}`);
  console.log(`Connections: ${testConfig.connections}`);
  console.log(`Duration: ${testConfig.duration}s\n`);

  return new Promise((resolve) => {
    const instance = autocannon(testConfig, (err, result) => {
      if (err) {
        console.error(`Error running test ${testConfig.title}:`, err);
        return resolve(false);
      }
      console.log(`[Results for ${testConfig.title}]`);
      console.log(`Req/Sec:        Avg ${result.requests.average} | Max ${result.requests.max}`);
      console.log(`Latency:        Avg ${result.latency.average}ms | p99 ${result.latency.p99}ms`);
      console.log(`Total Requests: ${result.requests.total}`);
      console.log(`1xx: ${result['1xx']}, 2xx: ${result['2xx']}, 3xx: ${result['3xx']}, 4xx: ${result['4xx']}, 5xx: ${result['5xx']}`);
      console.log(`Errors/Timeouts: ${result.errors} / ${result.timeouts}`);
      resolve(true);
    });

    autocannon.track(instance, { renderProgressBar: true });
  });
}

async function startLoadTestEngine() {
  console.log("Starting Load Test Engine...");
  
  for (const test of tests) {
    await runTest(test);
    // Pause briefly between tests
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log(`\n✅ Load test suite completed.`);
}

startLoadTestEngine();
