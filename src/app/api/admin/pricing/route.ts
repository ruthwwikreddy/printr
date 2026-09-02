import { NextResponse } from 'next/server';
import db from '@/lib/db';

import { isAuthenticated } from '@/lib/adminAuth';

function unauthorized() {
  return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
}

export async function POST(request: Request) {
  if (!isAuthenticated()) return unauthorized();

  try {
    const { paperSize, colourMode, pricePerPage } = await request.json();

    if (!paperSize || !colourMode || pricePerPage === undefined) {
      return NextResponse.json({ error: 'Missing pricing fields' }, { status: 400 });
    }

    const rule = await db.pricingRule.upsert({
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
