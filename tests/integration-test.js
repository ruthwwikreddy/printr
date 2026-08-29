import { exec } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

// Load environmental variables or use default configurations
const PORT = process.env.PORT || 3000;
const AGENT_TOKEN = process.env.PRINT_AGENT_AUTH_SECRET || 'super-secret-agent-token-123';
const BACKEND_URL = `http://localhost:${PORT}`;

console.log('--- STARTING PRINT SHOP INTEGRATION TEST ---');

// Mock a simulated order via customer UI simulation
async function createMockOrder() {
  const payload = JSON.stringify({
    filename: 'test_assignment.pdf',
    filePath: path.join(process.cwd(), 'test_assignment.pdf'),
    mimeType: 'application/pdf',
    fileSize: 1024 * 150,
    pageCount: 3,
    copies: 2,
    colourMode: 'MONOCHROME',
    paperSize: 'A4',
    duplexMode: 'SIMPLEX',
    pageRange: '1-3',
    customerPhone: '9876543210'
  });

  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// Simulate pay click callback
async function simulatePayment(orderId) {
  const payload = JSON.stringify({ orderId });
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/payments/mock-webhook',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runTest() {
  try {
    // 1. Create a mock PDF test file to prevent CUPS CLI from failing
    const mockPDFPath = path.join(process.cwd(), 'test_assignment.pdf');
    fs.writeFileSync(mockPDFPath, '%PDF-1.4 ... Fake PDF Content for Xerox CUPS Test ...');
    console.log(`✓ Generated dummy test PDF at: ${mockPDFPath}`);

    // 2. Submit order
    console.log('Submitting mock order payload to localhost Next.js app...');
    const orderRes = await createMockOrder();
    console.log('Order created successfully:', orderRes);

    // 3. Pay
    console.log('Verifying mock payment webhook hook...');
    const payRes = await simulatePayment(orderRes.orderId);
    console.log('Payment Webhook capture verification:', payRes);

    console.log('\nSUCCESS: Test order is now queued in the database. Start the agent.js script now to execute physical print.');
  } catch (err) {
    console.error('Integration test failure:', err);
  }
}

// Run test with a delay to ensure server started
setTimeout(runTest, 2000);
