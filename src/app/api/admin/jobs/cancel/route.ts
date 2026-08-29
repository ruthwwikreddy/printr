import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { jobId } = await request.json();
    const job = await db.printJob.update({
      where: { id: jobId },
      data: { status: 'CANCELLED' },
    });
    if (job) {
      await db.order.update({
        where: { id: job.orderId },
        data: { status: 'CANCELLED' },
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to cancel job' }, { status: 500 });
  }
}
