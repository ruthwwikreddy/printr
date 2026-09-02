import { NextResponse } from 'next/server';
import db from '@/lib/db';

const MASTER_AGENT_TOKEN =
  process.env.PRINT_AGENT_AUTH_SECRET || '99022997a3d1dd327bd67ed57eb370f25095edaccb2bd09db7678d8ea3f5ce63';

function verifyAgentAuth(request: Request): boolean {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.replace('Bearer ', '').trim();
  return token === MASTER_AGENT_TOKEN;
}

// POST /api/agent — Heartbeat
export async function POST(request: Request) {
  try {
    if (!verifyAgentAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized: Invalid Agent Secret' }, { status: 401 });
    }

    const body = await request.json();
    const { name, os, defaultPrinter } = body;

    const agent = await db.printAgent.upsert({
      where: { tokenHash: `shop_agent_${name || 'default'}` },
      update: { lastSeen: new Date(), isActive: true },
      create: {
        name: name || 'Counter-Print-Agent',
        tokenHash: `shop_agent_${name || 'default'}`,
        isActive: true,
        lastSeen: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      agentId: agent.id,
      timestamp: new Date().toISOString(),
      defaultPrinter,
      os,
    });
  } catch (error) {
    console.error('Agent Heartbeat error:', error);
    return NextResponse.json({ error: 'Heartbeat failed' }, { status: 500 });
  }
}

// GET /api/agent — Fetch pending paid jobs
export async function GET(request: Request) {
  try {
    if (!verifyAgentAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized: Invalid Agent Secret' }, { status: 401 });
    }

    const pendingJobs = await db.printJob.findMany({
      where: { status: 'PENDING' },
    });

    // Only return jobs whose order status is PAID
    const paidJobs = pendingJobs.filter(
      (j: any) => j.order && (j.order.status === 'PAID' || j.order.status === 'COMPLETED')
    );

    const formatted = paidJobs.map((j: any) => {
      const files = j.order?.files || [];
      const file = files[0] || {};
      return {
        id: j.id,
        orderId: j.orderId,
        orderNumber: j.order?.orderNumber,
        copies: j.copies,
        colourMode: j.colourMode,
        paperSize: j.paperSize,
        duplexMode: j.duplexMode,
        pageRange: j.pageRange,
        downloadUrl: `/api/files/${j.orderId}`,
        file: {
          filename: file.filename,
          filePath: file.filePath,
          mimeType: file.mimeType,
        },
      };
    });

    return NextResponse.json({ success: true, jobs: formatted });
  } catch (error) {
    console.error('Fetch agent jobs error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}
