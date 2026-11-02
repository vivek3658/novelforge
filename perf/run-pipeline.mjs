import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('=== NovelForge Automated Master Scalability Pipeline ===');

function runCommand(cmd) {
  console.log(`\n>>> Executing: ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: __dirname });
}

async function waitForAuthRead() {
  const latestPath = path.join(__dirname, 'results', 'latest.json');
  console.log('Waiting for auth-read to complete and save to latest.json...');
  while (true) {
    if (fs.existsSync(latestPath)) {
      try {
        const d = JSON.parse(fs.readFileSync(latestPath, 'utf-8'));
        if (d.scenarios && d.scenarios['auth-read']) {
          console.log(' auth-read scenario detected in latest.json!');
          return;
        }
      } catch {}
    }
    await new Promise(r => setTimeout(r, 5000));
  }
}

async function main() {
  // 1. Wait for auth-read if already running
  await waitForAuthRead();

  // 2. Run login scenario
  console.log('\n=============================================');
  console.log('STARTING SCENARIO: login (BCrypt CPU Scaling)');
  console.log('=============================================');
  runCommand('node runner.mjs login');

  // 3. Run write-path scenario
  console.log('\n=============================================');
  console.log('STARTING SCENARIO: write-path (Postgres Likes)');
  console.log('=============================================');
  runCommand('node runner.mjs write-path');

  // 4. Run mixed scenario
  console.log('\n=============================================');
  console.log('STARTING SCENARIO: mixed (80/15/5 Mix)');
  console.log('=============================================');
  runCommand('node runner.mjs mixed');

  // 5. Generate final publication report
  console.log('\n=============================================');
  console.log('GENERATING FINAL PERFORMANCE REPORT & README');
  console.log('=============================================');
  runCommand('node report/generate.mjs');

  console.log('\n================================================================');
  console.log('🎉 ALL SERVICE SCALABILITY TESTS COMPLETED & FINAL REPORT GENERATED!');
  console.log('================================================================');
}

main().catch(err => {
  console.error('Pipeline error:', err);
  process.exit(1);
});
