import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getTenantBySlug } from '@/lib/tenantService';

const MASTER_AGENT_TOKEN =
  process.env.PRINT_AGENT_AUTH_SECRET || '99022997a3d1dd327bd67ed57eb370f25095edaccb2bd09db7678d8ea3f5ce63';

async function verifyTenantAgentAuth(request: Request, tenantId: string): Promise<boolean> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.replace('Bearer ', '').trim();

  // 1. Master token accepts all tenants (for platform debug/super-admin)
  if (token === MASTER_AGENT_TOKEN) return true;

  // 2. Verify shop-specific secret key
  const tenant = await getTenantBySlug(tenantId);
  if (tenant && tenant.agentSecretKey && tenant.agentSecretKey === token) {
    return true;
  }

  return false;
}

// POST /api/agent — Heartbeat with tenant registration
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantId = 'demo-prints', name, os, defaultPrinter } = body;
    const cleanTenantId = tenantId.toLowerCase().trim();

    const isAuthed = await verifyTenantAgentAuth(request, cleanTenantId);
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized: Invalid Agent Secret for this Shop' }, { status: 401 });
    }

    const agent = await db.printAgent.upsert({
      where: { tokenHash: `${cleanTenantId}_${name || 'agent'}` },
      update: { lastSeen: new Date(), isActive: true },
      create: {
        tenantId: cleanTenantId,
        name: name || `${cleanTenantId}-agent`,
        tokenHash: `${cleanTenantId}_${name || 'agent'}`,
        isActive: true,
        lastSeen: new Date(),
      },
    });

    return NextResponse.json({ success: true, agentId: agent.id, tenantId: cleanTenantId });
  } catch (error) {
    console.error('Agent Heartbeat error:', error);
    return NextResponse.json({ error: 'Heartbeat failed' }, { status: 500 });
  }
}

// GET /api/agent — Fetch pending jobs STRICTLY filtered by tenantId
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'demo-prints';
    const cleanTenantId = tenantId.toLowerCase().trim();

    const isAuthed = await verifyTenantAgentAuth(request, cleanTenantId);
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized: Access Denied for this Shop' }, { status: 401 });
    }

    const pendingJobs = await db.printJob.findMany({
      where: { status: 'PENDING' },
    });

    // Tenant Isolation: Only return jobs whose order matches the tenantId AND status is PAID
    const tenantPaidJobs = pendingJobs.filter(
      (j: any) =>
        j.order &&
        j.order.status === 'PAID' &&
        (j.order.tenantId === cleanTenantId || (!j.order.tenantId && cleanTenantId === 'demo-prints'))
    );

    const formatted = tenantPaidJobs.map((j: any) => {
      const files = j.order?.files || [];
      const file = files[0] || {};
      return {
        id: j.id,
        orderId: j.orderId,
        tenantId: cleanTenantId,
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

    return NextResponse.json({ success: true, tenantId: cleanTenantId, jobs: formatted });
  } catch (error) {
    console.error('Fetch tenant jobs error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}
