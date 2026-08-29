import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await db.order.findUnique({ where: { id } });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const jobs = order.printJobs || [];
    const latestJob = jobs[jobs.length - 1];

    return NextResponse.json({
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.totalAmount,
      jobStatus: latestJob?.status || 'PENDING',
      printer: latestJob?.printerName || null,
      error: latestJob?.errorLog || null,
    });
  } catch (error: any) {
    console.error('Status fetch error:', error);
    return NextResponse.json({ error: 'Failed to retrieve order status' }, { status: 500 });
  }
}
