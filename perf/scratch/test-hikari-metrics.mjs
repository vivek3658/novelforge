import autocannon from 'autocannon';
import { execSync } from 'child_process';

function getHikari() {
  try {
    const acq = JSON.parse(execSync('docker exec novelforge-server-novel-service-1 wget -qO- http://localhost:8083/actuator/metrics/hikaricp.connections.acquire').toString());
    const pend = JSON.parse(execSync('docker exec novelforge-server-novel-service-1 wget -qO- http://localhost:8083/actuator/metrics/hikaricp.connections.pending').toString());
    const act = JSON.parse(execSync('docker exec novelforge-server-novel-service-1 wget -qO- http://localhost:8083/actuator/metrics/hikaricp.connections.active').toString());
    return {
      acquireCount: acq.measurements.find(m => m.statistic === 'COUNT')?.value || 0,
      acquireTotalTime: acq.measurements.find(m => m.statistic === 'TOTAL_TIME')?.value || 0,
      acquireMaxMs: ((acq.measurements.find(m => m.statistic === 'MAX')?.value || 0) * 1000).toFixed(2),
      pending: pend.measurements.find(m => m.statistic === 'VALUE')?.value || 0,
      active: act.measurements.find(m => m.statistic === 'VALUE')?.value || 0
    };
  } catch (e) {
    return { acquireCount: 0, acquireTotalTime: 0, acquireMaxMs: '0', pending: 0, active: 0 };
  }
}

async function testConcurrency(c) {
  const hBefore = getHikari();
  let peakPending = 0;
  let peakActive = 0;

  // Poll hikari during the 5s run
  const poller = setInterval(() => {
    const current = getHikari();
    if (current.pending > peakPending) peakPending = current.pending;
    if (current.active > peakActive) peakActive = current.active;
  }, 200);

  const res = await new Promise((resolve) => {
    autocannon({
      url: 'http://localhost:8080/api/v1/novels',
      connections: c,
      duration: 5,
      pipelining: 1
    }, (err, result) => {
      resolve(result);
    });
  });

  clearInterval(poller);
  const hAfter = getHikari();

  const acquisitions = hAfter.acquireCount - hBefore.acquireCount;
  const totalAcquireTimeMs = ((hAfter.acquireTotalTime - hBefore.acquireTotalTime) * 1000).toFixed(1);
  const avgAcquireTimeMs = acquisitions > 0 ? (totalAcquireTimeMs / acquisitions).toFixed(2) : '0';

  console.log(`\nConcurrency ${c}:`);
  console.log(`  Throughput: ${res.requests.average.toFixed(1)} req/s`);
  console.log(`  Latency: mean=${res.latency.mean}ms, p50=${res.latency.p50}ms, p99=${res.latency.p99}ms, max=${res.latency.max}ms`);
  console.log(`  HikariCP Metrics:`);
  console.log(`    Acquisitions: ${acquisitions}`);
  console.log(`    Total Acquire Time: ${totalAcquireTimeMs} ms`);
  console.log(`    Avg Acquire Time: ${avgAcquireTimeMs} ms`);
  console.log(`    Max Acquire Time: ${hAfter.acquireMaxMs} ms`);
  console.log(`    Peak Active Connections: ${peakActive} / 10 (Pool Max)`);
  console.log(`    Peak Pending Threads: ${peakPending}`);
}

for (const c of [10, 50, 100, 200]) {
  await testConcurrency(c);
}
