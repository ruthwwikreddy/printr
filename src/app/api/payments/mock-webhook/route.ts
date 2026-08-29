import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();

    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Mark payment as captured
    const payments = order.payments || [];
    if (payments[0]) {
      await db.payment.update({
        where: { gatewayOrderId: payments[0].gatewayOrderId },
        data: {
          status: 'captured',
          gatewayPaymentId: `mock_pay_${Date.now()}`,
          signature: 'verified',
        },
      });
    }

    // Transition order to PAID
    await db.order.update({
      where: { id: orderId },
      data: { status: 'PAID' },
    });

    // Cloud Firestore Sync (async non-blocking)
    try {
      const { updateFirestoreOrderStatus } = await import('@/lib/firestoreService');
      await updateFirestoreOrderStatus(orderId, {
        status: 'PAID',
        jobStatus: 'PENDING',
      });
    } catch (fsErr) {
      console.warn('Firestore status sync warning:', fsErr);
    }

    // Job stays as PENDING — agent will pick it up
    console.log(`[Payment] Order ${order.orderNumber} marked PAID, waiting for agent.`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Payment webhook error:', error);
    return NextResponse.json({ error: 'Payment processing failed' }, { status: 500 });
  }
}
