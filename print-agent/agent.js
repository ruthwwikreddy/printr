#!/usr/bin/env node
/**
 * Printr Universal Cross-Platform Print Agent Daemon
 * Supports macOS (CUPS/lp), Linux (CUPS), and Windows (PowerShell / Out-Printer / SumatraPDF)
 *
 * Multi-Tenant Scoped:
 *   TENANT_ID                — shop unique slug (e.g. "city-xerox", "demo-prints")
 *   BACKEND_URL              — defaults to https://printr.ruthwikreddy.live
 *   PRINT_AGENT_AUTH_SECRET  — shop secret auth token from the dashboard
 *   PRINTER_NAME             — optional printer queue override
 */

const http = require('http');
const https = require('https');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ── Multi-Tenant Configuration ────────────────────────────────
const TENANT_ID = (process.env.TENANT_ID || 'demo-prints').toLowerCase().trim();
const BACKEND_URL = (process.env.BACKEND_URL || 'https://printr.ruthwikreddy.live').replace(/\/$/, '');
const TOKEN =
  process.env.PRINT_AGENT_AUTH_SECRET ||
  '99022997a3d1dd327bd67ed57eb370f25095edaccb2bd09db7678d8ea3f5ce63';
const HEARTBEAT_MS = 8000;
const POLL_MS = 3500;
const IS_WINDOWS = os.platform() === 'win32';
const AGENT_NAME = `${TENANT_ID}-${IS_WINDOWS ? 'WIN' : 'MAC'}-${os.hostname()}`;

let selectedPrinter = process.env.PRINTER_NAME || '';
let isProcessingJob = false;

// ── Logging & Exec Helper ────────────────────────────────────
function log(msg, ...args) {
  const ts = new Date().toLocaleTimeString('en-IN');
  console.log(`[${ts}] [${TENANT_ID}] ${msg}`, ...args);
}

function run(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout: 45000 }, (err, stdout, stderr) => {
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
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };

    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    if (payload) req.write(payload);
    req.end();
  });
}

// ── OS-Aware Printer Discovery ────────────────────────────────
async function discoverPrinters() {
  try {
    if (IS_WINDOWS) {
      // Windows PowerShell printer discovery
      const psCmd = `powershell -Command "Get-Printer | Select-Object -ExpandProperty Name"`;
      const out = await run(psCmd);
      return out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    } else {
      // macOS / Linux CUPS
      const out = await run('lpstat -p');
      const printers = [];
      for (const line of out.split('\n')) {
        const m = line.match(/^printer\s+(\S+)/);
        if (m) printers.push(m[1]);
      }
      return printers;
    }
  } catch {
    return [];
  }
}

async function getDefaultPrinter() {
  try {
    if (IS_WINDOWS) {
      const psCmd = `powershell -Command "Get-CimInstance -ClassName Win32_Printer | Where-Object {$_.Default -eq $true} | Select-Object -ExpandProperty Name"`;
      const out = await run(psCmd);
      return out.split(/\r?\n/)[0]?.trim() || '';
    } else {
      const out = await run('lpstat -d');
      const m = out.match(/system default destination:\s+(\S+)/);
      return m ? m[1] : '';
    }
  } catch {
    return '';
  }
}

async function ensurePrinter() {
  if (selectedPrinter) return selectedPrinter;
  const def = await getDefaultPrinter();
  if (def) {
    selectedPrinter = def;
    return def;
  }
  const list = await discoverPrinters();
  if (list.length) {
    selectedPrinter = list[0];
    return list[0];
  }
  return '';
}

// ── Heartbeat & Status ────────────────────────────────────────
async function heartbeat() {
  try {
    const printer = await ensurePrinter();
    await request('POST', '/api/agent', {
      tenantId: TENANT_ID,
      name: AGENT_NAME,
      os: IS_WINDOWS ? 'Windows' : 'macOS',
      defaultPrinter: printer,
    });
  } catch (e) {
    log('⚠️  Heartbeat warning:', e.message);
  }
}

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
        Authorization: `Bearer ${TOKEN}`,
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

// ── Cross-Platform Printing Dispatch ─────────────────────────
async function printJob(job) {
  const printer = await ensurePrinter();
  if (!printer) {
    await updateJob(job.id, 'FAILED', {
      errorLog: `No active printer found on ${IS_WINDOWS ? 'Windows' : 'macOS'}. Please add a default printer.`,
    });
    return;
  }

  let finalFilePath = job.file?.filePath;

  // Cloud file fetch if not on local machine
  if (!finalFilePath || !fs.existsSync(finalFilePath)) {
    if (job.downloadUrl) {
      try {
        log(`⬇️  Downloading file: ${job.file?.filename || job.orderNumber}`);
        const tempDir = path.join(__dirname, 'temp_prints');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        const ext = path.extname(job.file?.filename || '') || '.pdf';
        const tempFile = path.join(tempDir, `print_${job.id}_${Date.now()}${ext}`);
        finalFilePath = await downloadFile(job.downloadUrl, tempFile);
      } catch (dlErr) {
        await updateJob(job.id, 'FAILED', { errorLog: `Download failed: ${dlErr.message}` });
        return;
      }
    } else {
      await updateJob(job.id, 'FAILED', { errorLog: `File not found: ${finalFilePath}` });
      return;
    }
  }

  await updateJob(job.id, 'PROCESSING', { printerName: printer });

  if (IS_WINDOWS) {
    // Windows Physical Print Execution via PowerShell Start-Process
    const escapedFile = finalFilePath.replace(/'/g, "''");
    const escapedPrinter = printer.replace(/'/g, "''");
    const psPrintCmd = `powershell -Command "Start-Process -FilePath '${escapedFile}' -Verb PrintTo -ArgumentList '${escapedPrinter}' -PassThru | Wait-Process -Timeout 20"`;
    log(`🖨️  [Windows] Submitting job to '${printer}'`);

    try {
      await run(psPrintCmd);
      log(`✅ [Windows] Print dispatched to ${printer}`);
      await updateJob(job.id, 'COMPLETED', { printerName: printer });
    } catch (winErr) {
      log(`❌ [Windows] Print error: ${winErr.message}`);
      await updateJob(job.id, 'FAILED', { errorLog: winErr.message, printerName: printer });
    }
  } else {
    // macOS / Linux CUPS lp command
    const args = [
      `-d "${printer}"`,
      `-n ${job.copies || 1}`,
      job.colourMode === 'COLOUR' ? '-o ColorModel=Color' : '-o ColorModel=Gray',
      job.paperSize === 'A3' ? '-o media=A3' : '-o media=A4',
      job.duplexMode === 'DUPLEX' ? '-o sides=two-sided-long-edge' : '-o sides=one-sided',
      job.pageRange ? `-P "${job.pageRange}"` : '',
      `"${finalFilePath}"`,
    ]
      .filter(Boolean)
      .join(' ');

    const cmd = `lp ${args}`;
    log(`🖨️  [macOS] Submitting: ${cmd}`);

    try {
      const result = await run(cmd);
      log(`✅ CUPS output: ${result}`);
      await updateJob(job.id, 'COMPLETED', { printerName: printer });
    } catch (err) {
      log(`❌ CUPS error: ${err.message}`);
      await updateJob(job.id, 'FAILED', { errorLog: err.message, printerName: printer });
    }
  }
}

// ── Multi-Tenant Job Polling ──────────────────────────────────
async function pollJobs() {
  if (isProcessingJob) return;

  try {
    const res = await request('GET', `/api/agent?tenantId=${encodeURIComponent(TENANT_ID)}`);
    if (res.status !== 200) return;

    const { jobs } = res.body;
    if (!jobs || jobs.length === 0) return;

    const job = jobs[0];
    log(`📋 Discovered Paid Job: ${job.orderNumber} (${job.copies}x ${job.colourMode} ${job.paperSize})`);

    isProcessingJob = true;
    try {
      await printJob(job);
    } finally {
      isProcessingJob = false;
    }
  } catch (e) {
    if (e.message !== 'Request timeout') {
      log('⚠️  Poll warning:', e.message);
    }
  }
}

// ── Universal Startup ─────────────────────────────────────────
async function start() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║       PRINTR UNIVERSAL HARDWARE PRINT DAEMON         ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`OS Detected : ${IS_WINDOWS ? 'Windows' : 'macOS / Linux'}`);
  console.log(`Tenant/Shop : ${TENANT_ID}`);
  console.log(`Backend Hub : ${BACKEND_URL}`);

  const printers = await discoverPrinters();
  const def = await getDefaultPrinter();

  if (printers.length === 0) {
    console.log('⚠️  No active printers found. Please attach USB/Network printer.');
  } else {
    console.log(`Printers    : ${printers.join(', ')}`);
    console.log(`Default     : ${def || printers[0]}`);
    selectedPrinter = process.env.PRINTER_NAME || def || printers[0];
    console.log(`Active Target: ${selectedPrinter}`);
  }

  console.log('');
  log(`Printr Agent daemon active. Connected to shop queue.`);

  await heartbeat();
  await pollJobs();

  setInterval(heartbeat, HEARTBEAT_MS);
  setInterval(pollJobs, POLL_MS);
}

start().catch((e) => {
  console.error('Fatal agent error:', e);
  process.exit(1);
});
