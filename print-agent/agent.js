#!/usr/bin/env node
/**
 * Shop Print Agent — macOS / CUPS
 * Runs on your MacBook, polls the backend, and sends jobs to CUPS automatically.
 *
 * Usage:
 *   node print-agent/agent.js
 *
 * Environment variables:
 *   BACKEND_URL              — defaults to http://localhost:3000
 *   PRINT_AGENT_AUTH_SECRET  — must match the server .env value
 *   PRINTER_NAME             — override the CUPS printer queue name
 */

const http = require('http');
const https = require('https');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// ── Configuration ─────────────────────────────────────────────
const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '');
const TOKEN = process.env.PRINT_AGENT_AUTH_SECRET || '99022997a3d1dd327bd67ed57eb370f25095edaccb2bd09db7678d8ea3f5ce63';
const HEARTBEAT_MS = 8000;   // send heartbeat every 8 seconds
const POLL_MS = 4000;        // poll for new jobs every 4 seconds
const AGENT_NAME = 'Shop MacBook Agent';

let selectedPrinter = process.env.PRINTER_NAME || '';
let isProcessingJob = false;  // prevent duplicate processing

// ── Helpers ───────────────────────────────────────────────────
function log(msg, ...args) {
  const ts = new Date().toLocaleTimeString('en-IN');
  console.log(`[${ts}] ${msg}`, ...args);
}

function run(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout: 30000 }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || stdout || err.message));
      else resolve(stdout.trim());
    });
  });
}

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(BACKEND_URL + path);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;
    const payload = body ? JSON.stringify(body) : null;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };

    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Request timeout')); });
    if (payload) req.write(payload);
    req.end();
  });
}

// ── Printer Discovery ─────────────────────────────────────────
async function discoverPrinters() {
  try {
    const out = await run('lpstat -p');
    const printers = [];
    for (const line of out.split('\n')) {
      const m = line.match(/^printer\s+(\S+)/);
      if (m) printers.push(m[1]);
    }
    return printers;
  } catch {
    return [];
  }
}

async function getDefaultPrinter() {
  try {
    const out = await run('lpstat -d');
    const m = out.match(/system default destination:\s+(\S+)/);
    return m ? m[1] : '';
  } catch {
    return '';
  }
}

async function ensurePrinter() {
  if (selectedPrinter) return selectedPrinter;
  const def = await getDefaultPrinter();
  if (def) { selectedPrinter = def; return def; }
  const list = await discoverPrinters();
  if (list.length) { selectedPrinter = list[0]; return list[0]; }
  return '';
}

// ── Heartbeat ─────────────────────────────────────────────────
async function heartbeat() {
  try {
    const printer = await ensurePrinter();
    await request('POST', '/api/agent', { name: AGENT_NAME, printer });
  } catch (e) {
    log('⚠️  Heartbeat failed:', e.message);
  }
}

// ── Update Job Status ─────────────────────────────────────────
async function updateJob(jobId, status, extra = {}) {
  try {
    await request('POST', `/api/agent/jobs/${jobId}/status`, { status, ...extra });
    log(`✓ Job ${jobId} → ${status}`);
  } catch (e) {
    log(`✗ Failed to update job ${jobId}:`, e.message);
  }
}

function downloadFile(urlPath, targetPath) {
  return new Promise((resolve, reject) => {
    const url = new URL(BACKEND_URL + urlPath);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
      },
    };

    const fileStream = fs.createWriteStream(targetPath);
    const req = lib.request(options, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download file from cloud: HTTP ${res.statusCode}`));
      }
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(targetPath);
      });
    });

    req.on('error', (err) => {
      fs.unlink(targetPath, () => {});
      reject(err);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      fs.unlink(targetPath, () => {});
      reject(new Error('File download timeout'));
    });

    req.end();
  });
}

// ── Print a Job ───────────────────────────────────────────────
async function printJob(job) {
  const printer = await ensurePrinter();
  if (!printer) {
    await updateJob(job.id, 'FAILED', { errorLog: 'No printer found in macOS. Please add a printer in System Settings → Printers & Scanners.' });
    return;
  }

  let finalFilePath = job.file?.filePath;

  // If local file does not exist (e.g. backend is hosted on Cloud / Vercel), download it securely
  if (!finalFilePath || !fs.existsSync(finalFilePath)) {
    if (job.downloadUrl) {
      try {
        log(`⬇️  Downloading file from cloud: ${job.downloadUrl}`);
        const tempDir = path.join(__dirname, 'temp_prints');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        const ext = path.extname(job.file?.filename || '') || '.pdf';
        const tempFile = path.join(tempDir, `print_${job.id}_${Date.now()}${ext}`);
        finalFilePath = await downloadFile(job.downloadUrl, tempFile);
      } catch (dlErr) {
        await updateJob(job.id, 'FAILED', { errorLog: `Cloud download error: ${dlErr.message}` });
        return;
      }
    } else {
      await updateJob(job.id, 'FAILED', { errorLog: `Print file not found at path: ${finalFilePath}` });
      return;
    }
  }

  // Mark as processing immediately
  await updateJob(job.id, 'PROCESSING', { printerName: printer });

  // Build CUPS lp command
  const args = [
    `-d "${printer}"`,
    `-n ${job.copies || 1}`,
    job.colourMode === 'COLOUR' ? '-o ColorModel=Color' : '-o ColorModel=Gray',
    job.paperSize === 'A3' ? '-o media=A3' : '-o media=A4',
    job.duplexMode === 'DUPLEX' ? '-o sides=two-sided-long-edge' : '-o sides=one-sided',
    job.pageRange ? `-P "${job.pageRange}"` : '',
    `"${filePath}"`,
  ].filter(Boolean).join(' ');

  const cmd = `lp ${args}`;
  log(`🖨️  Submitting: ${cmd}`);

  try {
    const result = await run(cmd);
    log(`✅ CUPS accepted: ${result}`);

    // Extract CUPS job ID from output like "request id is Canon_Printer-42 (1 file(s))"
    const m = result.match(/request id is\s+(\S+)/i);
    const cupsJobId = m ? m[1] : 'submitted';

    // Wait briefly then poll CUPS to confirm completion
    await new Promise((r) => setTimeout(r, 3000));
    await monitorCupsJob(job.id, printer, cupsJobId);
  } catch (err) {
    log(`❌ CUPS error: ${err.message}`);
    await updateJob(job.id, 'FAILED', { errorLog: err.message, printerName: printer });
  }
}

// ── Monitor CUPS Job Until Done ───────────────────────────────
async function monitorCupsJob(jobId, printer, cupsJobId) {
  const maxWait = 120000; // 2 minutes max
  const start = Date.now();

  while (Date.now() - start < maxWait) {
    try {
      const out = await run(`lpstat -o "${printer}"`);
      if (!out.includes(cupsJobId)) {
        // Job no longer in queue = completed successfully
        await updateJob(jobId, 'COMPLETED', { printerName: printer, cupsJobId });
        return;
      }
    } catch {
      // lpstat might throw if printer queue is empty = job done
      await updateJob(jobId, 'COMPLETED', { printerName: printer, cupsJobId });
      return;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  // If still in queue after 2 minutes, mark as failed
  await updateJob(jobId, 'FAILED', { errorLog: 'Print job timed out in CUPS queue.', printerName: printer });
}

// ── Poll for Jobs ─────────────────────────────────────────────
async function pollJobs() {
  if (isProcessingJob) return; // don't stack jobs

  try {
    const res = await request('GET', '/api/agent');
    if (res.status !== 200) return;

    const { jobs } = res.body;
    if (!jobs || jobs.length === 0) return;

    // Process one job at a time to avoid printer conflicts
    const job = jobs[0];
    log(`📋 New job received: ${job.orderNumber} (${job.copies}x ${job.colourMode} ${job.paperSize})`);

    isProcessingJob = true;
    try {
      await printJob(job);
    } finally {
      isProcessingJob = false;
    }
  } catch (e) {
    if (e.message !== 'Request timeout') {
      log('⚠️  Poll error:', e.message);
    }
  }
}

// ── Startup ───────────────────────────────────────────────────
async function start() {
  console.log('');
  console.log('╔══════════════════════════════════════╗');
  console.log('║      SHOP PRINT AGENT  (macOS)       ║');
  console.log('╚══════════════════════════════════════╝');
  console.log(`Backend : ${BACKEND_URL}`);

  const printers = await discoverPrinters();
  const def = await getDefaultPrinter();

  if (printers.length === 0) {
    console.log('⚠️  No printers detected. Add a printer in System Settings → Printers & Scanners.');
  } else {
    console.log(`Printers: ${printers.join(', ')}`);
    console.log(`Default : ${def || printers[0]}`);
    selectedPrinter = process.env.PRINTER_NAME || def || printers[0];
    console.log(`Selected: ${selectedPrinter}`);
  }

  console.log('');
  log('Agent started. Connecting to backend…');

  // Run immediately, then on intervals
  await heartbeat();
  await pollJobs();

  setInterval(heartbeat, HEARTBEAT_MS);
  setInterval(pollJobs, POLL_MS);
}

start().catch((e) => {
  console.error('Fatal error starting agent:', e);
  process.exit(1);
});
