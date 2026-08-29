import { NextResponse } from 'next/server';
import db from '@/lib/db';

function calculatePrice(
  pageCount: number,
  copies: number,
  paperSize: string,
  colourMode: string
): number {
  const rates: Record<string, number> = {
    A4_MONOCHROME: 2,
    A4_COLOUR: 10,
    A3_MONOCHROME: 5,
    A3_COLOUR: 20,
  };
  const rate = rates[`${paperSize}_${colourMode}`] ?? 2;
  return rate * pageCount * copies;
}

let orderCounter = 1000;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      filename, filePath, mimeType, fileSize, pageCount,
      copies, colourMode, paperSize, duplexMode, pageRange, customerPhone,
    } = body;

    if (!filePath || !pageCount) {
      return NextResponse.json({ error: 'Missing file details' }, { status: 400 });
    }

    // Server-side price calculation — never trust the client
    const totalAmount = calculatePrice(
      Number(pageCount),
      Number(copies) || 1,
      paperSize || 'A4',
      colourMode || 'MONOCHROME'
    );

    orderCounter++;
    const orderNumber = `RX-${orderCounter}`;

    const order = await db.order.create({
      data: {
        orderNumber,
        customerPhone: customerPhone || null,
        totalAmount,
        status: 'AWAITING_PAYMENT',
        files: {
          create: { filename, filePath, mimeType, fileSize: Number(fileSize), pageCount: Number(pageCount) },
        },
        printJobs: {
          create: {
            copies: Number(copies) || 1,
            colourMode: colourMode || 'MONOCHROME',
            paperSize: paperSize || 'A4',
            duplexMode: duplexMode || 'SIMPLEX',
            pageRange: pageRange || null,
            status: 'PENDING',
          },
        },
      },
    });

    const payment = await db.payment.create({
      data: {
        orderId: order.id,
        gatewayOrderId: `rzp_order_${order.id}`,
        amount: totalAmount,
        status: 'created',
      },
    });

    // Cloud Firestore Sync (async non-blocking)
    try {
      const { syncOrderToFirestore } = await import('@/lib/firestoreService');
      await syncOrderToFirestore({
        id: order.id,
        orderNumber: order.orderNumber,
        customerPhone: customerPhone || null,
        totalAmount,
        status: 'AWAITING_PAYMENT',
        filename,
        pageCount: Number(pageCount),
        copies: Number(copies) || 1,
        colourMode: colourMode || 'MONOCHROME',
        paperSize: paperSize || 'A4',
        duplexMode: duplexMode || 'SIMPLEX',
        pageRange: pageRange || null,
        jobStatus: 'PENDING',
        printerName: null,
        errorLog: null,
        createdAt: order.createdAt || new Date().toISOString(),
        updatedAt: order.updatedAt || new Date().toISOString(),
      });
    } catch (fsErr) {
      console.warn('Firestore sync optional warning:', fsErr);
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: totalAmount,
      gatewayOrderId: payment.gatewayOrderId,
    });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
