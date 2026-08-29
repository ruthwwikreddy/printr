import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { jobId } = await request.json();

    const job = await db.printJob.update({
      where: { id: jobId },
      data: { status: 'PENDING', errorLog: null },
    });

    if (job) {
      await db.order.update({
        where: { id: job.orderId },
        data: { status: 'PAID' },
      });
    }

    return NextResponse.json({ success: true, message: 'Print job reset to PENDING status successfully.' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reset job' }, { status: 500 });
  }
}
