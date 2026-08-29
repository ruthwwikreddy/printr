import { NextResponse } from 'next/server';
import db from '@/lib/db';

const AGENT_TOKEN = process.env.PRINT_AGENT_AUTH_SECRET || '99022997a3d1dd327bd67ed57eb370f25095edaccb2bd09db7678d8ea3f5ce63';

function verifyToken(request: Request): boolean {
  const auth = request.headers.get('Authorization');
  return auth === `Bearer ${AGENT_TOKEN}`;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { status, printerName, cupsJobId, errorLog } = await request.json();

    console.log(`[Agent] Job ${id} → ${status}${printerName ? ` on ${printerName}` : ''}`);

    const job = await db.printJob.update({
      where: { id },
      data: { status, printerName, cupsJobId, errorLog },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Sync the parent order status
    const orderStatusMap: Record<string, string> = {
      PROCESSING: 'PRINTING',
      COMPLETED: 'COMPLETED',
      FAILED: 'FAILED',
    };
    const mappedOrderStatus = orderStatusMap[status] || status;
    if (orderStatusMap[status]) {
      await db.order.update({
        where: { id: job.orderId },
        data: { status: mappedOrderStatus },
      });
    }

    // Cloud Firestore Sync (async non-blocking)
    try {
      const { updateFirestoreOrderStatus } = await import('@/lib/firestoreService');
      await updateFirestoreOrderStatus(job.orderId, {
        status: mappedOrderStatus,
        jobStatus: status,
        printerName: printerName || null,
        errorLog: errorLog || null,
      });
    } catch (fsErr) {
      console.warn('Firestore status sync warning:', fsErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Job status update error:', error);
    return NextResponse.json({ error: 'Failed to update job status' }, { status: 500 });
  }
}
