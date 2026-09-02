#!/usr/bin/env node
/**
 * Printr Universal Cross-Platform Print Agent Daemon
 * 
 * Supports:
 *  - Windows 10 / 11 / Server (PowerShell / SumatraPDF / Native Print)
 *  - macOS Intel & Apple Silicon (CUPS / lp)
 *  - Linux / Raspberry Pi / Ubuntu / Debian (CUPS / lp)
 * 
 * Environment Variables:
 *  - BACKEND_URL             : URL of your deployed Printr web app (e.g. https://print.myshop.com or http://localhost:3000)
 *  - PRINT_AGENT_AUTH_SECRET : Secret token matching your web server .env
 *  - PRINTER_NAME            : (Optional) Force specific printer queue name
 */

const http = require('http');
const https = require('https');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ── Configuration ─────────────────────────────────────────────
const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '');
const TOKEN =
  process.env.PRINT_AGENT_AUTH_SECRET ||
  '99022997a3d1dd327bd67ed57eb370f25095edaccb2bd09db7678d8ea3f5ce63';
const HEARTBEAT_MS = 6000;
const POLL_MS = 3000;
const IS_WINDOWS = os.platform() === 'win32';
const AGENT_NAME = `${IS_WINDOWS ? 'Windows' : 'macOS'}-${os.hostname()}`;

let selectedPrinter = process.env.PRINTER_NAME || '';
let isProcessingJob = false;

// ── Logging & Exec Helper ─────────────────────────────────────
function log(msg, ...args) {
  const ts = new Date().toLocaleTimeString('en-IN', { hour12: false });
  console.log(`[${ts}] ${msg}`, ...args);
}

function run(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout: 60000 }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || stdout || err.message));
      else resolve(stdout ? stdout.trim() : '');
    });
  });
}

function request(method, pathName, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(BACKEND_URL + pathName);
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
      const psCmd = `powershell -NoProfile -Command "Get-CimInstance -ClassName Win32_Printer | Select-Object -ExpandProperty Name"`;
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
      const psCmd = `powershell -NoProfile -Command "Get-CimInstance -ClassName Win32_Printer | Where-Object {$_.Default -eq $true} | Select-Object -ExpandProperty Name"`;
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
      name: AGENT_NAME,
      os: IS_WINDOWS ? 'Windows' : 'macOS',
      defaultPrinter: printer,
    });
  } catch (e) {
    // Suppress network logs if temporary connection drops
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

// ── Cross-Platform Printing Dispatch ──────────────────────────
async function printJob(job) {
  const printer = await ensurePrinter();
  if (!printer) {
    await updateJob(job.id, 'FAILED', {
      errorLog: `No active printer found on ${IS_WINDOWS ? 'Windows' : 'macOS'}. Please attach or configure a default printer.`,
    });
    return;
  }

  let finalFilePath = job.file?.filePath;

  // Cloud file fetch if not on local machine
  if (!finalFilePath || !fs.existsSync(finalFilePath)) {
    if (job.downloadUrl) {
      try {
        log(`⬇️  Downloading document for Order #${job.orderNumber}...`);
        const tempDir = path.join(__dirname, 'temp_prints');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        const ext = path.extname(job.file?.filename || '') || '.pdf';
        const tempFile = path.join(tempDir, `order_${job.orderNumber}_${Date.now()}${ext}`);
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
    // ── Windows Printing Execution ──────────────────────────────
    const escapedFile = finalFilePath.replace(/'/g, "''");
    const escapedPrinter = printer.replace(/'/g, "''");

    // PowerShell Start-Process PrintTo command
    const psPrintCmd = `powershell -NoProfile -Command "Start-Process -FilePath '${escapedFile}' -Verb PrintTo -ArgumentList '${escapedPrinter}' -PassThru | Wait-Process -Timeout 30"`;
    log(`🖨️  [Windows] Dispatching Order #${job.orderNumber} to '${printer}'`);

    try {
      await run(psPrintCmd);
      log(`✅ [Windows] Order #${job.orderNumber} printed successfully on ${printer}`);
      await updateJob(job.id, 'COMPLETED', { printerName: printer });
    } catch (winErr) {
      log(`❌ [Windows] Primary Print Error: ${winErr.message}`);
      // Fallback: Try Out-Printer via PowerShell
      try {
        log(`🔄 [Windows] Attempting fallback print via Out-Printer...`);
        const fallbackCmd = `powershell -NoProfile -Command "Get-Content -Path '${escapedFile}' | Out-Printer -Name '${escapedPrinter}'"`;
        await run(fallbackCmd);
        await updateJob(job.id, 'COMPLETED', { printerName: printer });
      } catch (fbErr) {
        await updateJob(job.id, 'FAILED', { errorLog: winErr.message, printerName: printer });
      }
    }
  } else {
    // ── macOS / Linux CUPS Execution ────────────────────────────
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
    log(`🖨️  [CUPS] Submitting: ${cmd}`);

    try {
      const result = await run(cmd);
      log(`✅ CUPS dispatch result: ${result}`);
      await updateJob(job.id, 'COMPLETED', { printerName: printer });
    } catch (err) {
      log(`❌ CUPS error: ${err.message}`);
      await updateJob(job.id, 'FAILED', { errorLog: err.message, printerName: printer });
    }
  }
}

// ── Job Polling Loop ──────────────────────────────────────────
async function pollJobs() {
  if (isProcessingJob) return;

  try {
    const res = await request('GET', '/api/agent');
    if (res.status !== 200) return;

    const { jobs } = res.body;
    if (!jobs || jobs.length === 0) return;

    const job = jobs[0];
    log(
      `⚡ New Paid Job Received: Order #${job.orderNumber} (${job.copies}x ${job.colourMode} ${job.paperSize})`
    );

    isProcessingJob = true;
    try {
      await printJob(job);
    } finally {
      isProcessingJob = false;
    }
  } catch (e) {
    if (e.message !== 'Request timeout') {
      // Suppress transient poll errors
    }
  }
}

// ── Startup & Banner ──────────────────────────────────────────
async function start() {
  console.log('');
  console.log('╔═════════════════════════════════════════════════════════════╗');
  console.log('║       PRINTR — AUTONOMOUS HARDWARE PRINT AGENT              ║');
  console.log('╚═════════════════════════════════════════════════════════════╝');
  console.log(`OS Platform  : ${IS_WINDOWS ? 'Windows' : 'macOS / Linux'}`);
  console.log(`Web Hub URL  : ${BACKEND_URL}`);

  const printers = await discoverPrinters();
  const def = await getDefaultPrinter();

  if (printers.length === 0) {
    console.log('⚠️  No active printers detected. Connect USB/Network printer.');
  } else {
    console.log(`Printers     : ${printers.join(', ')}`);
    console.log(`Default      : ${def || printers[0]}`);
    selectedPrinter = process.env.PRINTER_NAME || def || printers[0];
    console.log(`Active Queue : ${selectedPrinter}`);
  }

  console.log('');
  log(`Printr Agent active and listening for incoming customer orders...`);

  await heartbeat();
  await pollJobs();

  setInterval(heartbeat, HEARTBEAT_MS);
  setInterval(pollJobs, POLL_MS);
}

start().catch((e) => {
  console.error('Fatal agent error:', e);
  process.exit(1);
});
