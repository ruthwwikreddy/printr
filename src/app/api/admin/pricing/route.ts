import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { paperSize, colourMode, pricePerPage } = await request.json();

    if (!paperSize || !colourMode || pricePerPage === undefined) {
      return NextResponse.json({ error: 'Missing pricing fields' }, { status: 400 });
    }

    const rule = await prisma.pricingRule.upsert({
      where: { id: `${paperSize}_${colourMode}` },
      update: { pricePerPage: parseFloat(pricePerPage) },
      create: {
        id: `${paperSize}_${colourMode}`,
        paperSize,
        colourMode,
        pricePerPage: parseFloat(pricePerPage),
      },
    });

    return NextResponse.json({ success: true, rule });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update pricing rule' }, { status: 500 });
  }
}
