import { NextResponse } from 'next/server';
import db from '@/lib/db';

const AGENT_TOKEN = process.env.PRINT_AGENT_AUTH_SECRET || '99022997a3d1dd327bd67ed57eb370f25095edaccb2bd09db7678d8ea3f5ce63';

function verifyToken(request: Request): boolean {
  const auth = request.headers.get('Authorization');
  return auth === `Bearer ${AGENT_TOKEN}`;
}

// POST /api/agent — heartbeat
export async function POST(request: Request) {
  if (!verifyToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { name } = await request.json();
    const agent = await db.printAgent.upsert({
      where: { tokenHash: AGENT_TOKEN },
      update: { lastSeen: new Date(), isActive: true },
      create: {
        name: name || 'Shop MacBook',
        tokenHash: AGENT_TOKEN,
        isActive: true,
        lastSeen: new Date(),
      },
    });
    return NextResponse.json({ success: true, agentId: agent.id });
  } catch (error) {
    console.error('Heartbeat error:', error);
    return NextResponse.json({ error: 'Heartbeat failed' }, { status: 500 });
  }
}

// GET /api/agent — fetch pending jobs
export async function GET(request: Request) {
  if (!verifyToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const pendingJobs = await db.printJob.findMany({
      where: { status: 'PENDING' },
    });

    // Only return jobs whose parent order is PAID
    const paidJobs = pendingJobs.filter(
      (j: any) => j.order && j.order.status === 'PAID'
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
    console.error('Fetch jobs error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}
