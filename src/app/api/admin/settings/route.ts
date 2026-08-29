import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const SETTINGS_DOC = 'config/shop_settings';

export async function GET() {
  try {
    const ref = doc(db, 'config', 'shop_settings');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return NextResponse.json({ success: true, settings: snap.data() });
    }
    // Default settings
    return NextResponse.json({
      success: true,
      settings: {
        upiId: 'shopowner@upi',
        shopName: 'PrintShop',
        pricing: {
          A4_MONOCHROME: 2,
          A4_COLOUR: 10,
          A3_MONOCHROME: 5,
          A3_COLOUR: 20,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to load settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { upiId, shopName, pricing } = body;

    if (!upiId || typeof upiId !== 'string') {
      return NextResponse.json({ error: 'upiId is required' }, { status: 400 });
    }

    const settings = {
      upiId: upiId.trim(),
      shopName: (shopName || 'PrintShop').trim(),
      pricing: {
        A4_MONOCHROME: Number(pricing?.A4_MONOCHROME ?? 2),
        A4_COLOUR: Number(pricing?.A4_COLOUR ?? 10),
        A3_MONOCHROME: Number(pricing?.A3_MONOCHROME ?? 5),
        A3_COLOUR: Number(pricing?.A3_COLOUR ?? 20),
      },
      updatedAt: new Date().toISOString(),
    };

    const ref = doc(db, 'config', 'shop_settings');
    await setDoc(ref, settings, { merge: true });

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to save settings' }, { status: 500 });
  }
}
