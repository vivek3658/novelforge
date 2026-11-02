import autocannon from 'autocannon';

async function test(c, d) {
  console.log(`Running login test: ${c} connections, ${d} seconds...`);
  const res = await new Promise((resolve, reject) => {
    autocannon({
      url: 'http://localhost:8080/api/v1/identity/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'perf_user_1', password: 'Password123!' }),
      connections: c,
      duration: d,
      pipelining: 1
    }, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });

  console.log(`Throughput: ${res.requests.average} req/s | 2xx: ${res['2xx']} | non2xx: ${res.non2xx} | timeouts: ${res.timeouts} | errors: ${res.errors}`);
  console.log(`Latency p50: ${res.latency.p50}ms | mean: ${res.latency.mean}ms | p99: ${res.latency.p99}ms | max: ${res.latency.max}ms`);
}

async function main() {
  await test(10, 5);
  await new Promise(r => setTimeout(r, 2000));
  await test(10, 10);
}

main().catch(console.error);
