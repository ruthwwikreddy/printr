import { NextResponse } from 'next/server';
import { getShopSettings, saveShopSettings, DEFAULT_SHOP_SETTINGS } from '@/lib/firestoreService';

import { isAuthenticated } from '@/lib/adminAuth';

function unauthorized() {
  return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
}

export async function GET() {
  try {
    const settings = await getShopSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json(
      { success: true, settings: DEFAULT_SHOP_SETTINGS },
      { status: 200 }
    );
  }
}

export async function POST(request: Request) {
  if (!isAuthenticated()) return unauthorized();

  try {
    const body = await request.json();
    const { upiId, shopName, phone, address, tagline, pricing } = body;

    if (!upiId || typeof upiId !== 'string') {
      return NextResponse.json({ error: 'UPI ID is required' }, { status: 400 });
    }

    const payload = {
      upiId: upiId.trim(),
      shopName: (shopName || 'Quick Print Xerox').trim(),
      phone: (phone || '').trim(),
      address: (address || '').trim(),
      tagline: (tagline || '').trim(),
      pricing: {
        A4_MONOCHROME: Number(pricing?.A4_MONOCHROME ?? 2),
        A4_COLOUR: Number(pricing?.A4_COLOUR ?? 10),
        A3_MONOCHROME: Number(pricing?.A3_MONOCHROME ?? 5),
        A3_COLOUR: Number(pricing?.A3_COLOUR ?? 20),
      },
    };

    const updated = await saveShopSettings(payload);
    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to save settings' }, { status: 500 });
  }
}
