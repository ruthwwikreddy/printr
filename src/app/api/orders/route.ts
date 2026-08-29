import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getTenantBySlug } from '@/lib/tenantService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      tenantId,
      filename,
      filePath,
      mimeType,
      fileSize,
      pageCount,
      copies,
      colourMode,
      paperSize,
      duplexMode,
      pageRange,
      customerPhone,
    } = body;

    if (!filePath || !pageCount) {
      return NextResponse.json({ error: 'Missing file details' }, { status: 400 });
    }

    const cleanTenantId = (tenantId || 'demo-prints').toLowerCase().trim();
    const tenant = await getTenantBySlug(cleanTenantId);

    // Dynamic Shop-Specific Rates calculation
    const rates = tenant?.pricing || {
      A4_MONOCHROME: 2,
      A4_COLOUR: 10,
      A3_MONOCHROME: 5,
      A3_COLOUR: 20,
    };

    const rateKey = `${paperSize || 'A4'}_${colourMode || 'MONOCHROME'}` as keyof typeof rates;
    const unitPrice = rates[rateKey] ?? 2;
    const totalAmount = unitPrice * Number(pageCount) * (Number(copies) || 1);

    const prefix = cleanTenantId.slice(0, 3).toUpperCase();
    const orderNumber = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

    const order = await db.order.create({
      data: {
        orderNumber,
        tenantId: cleanTenantId,
        customerPhone: customerPhone || null,
        totalAmount,
        status: 'AWAITING_PAYMENT',
        files: {
          create: {
            filename,
            filePath,
            mimeType,
            fileSize: Number(fileSize),
            pageCount: Number(pageCount),
          },
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
        gatewayOrderId: `upi_order_${order.id}`,
        amount: totalAmount,
        status: 'created',
      },
    });

    // Sync to Cloud Firestore with strict tenantId scoping
    try {
      const { syncOrderToFirestore } = await import('@/lib/firestoreService');
      await syncOrderToFirestore({
        id: order.id,
        orderNumber: order.orderNumber,
        tenantId: cleanTenantId,
        customerPhone: customerPhone || null,
        totalAmount,
        status: 'AWAITING_PAYMENT',
        filename,
        filePath,
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
      console.warn('Firestore sync warning:', fsErr);
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      tenantId: cleanTenantId,
      amount: totalAmount,
      gatewayOrderId: payment.gatewayOrderId,
    });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
