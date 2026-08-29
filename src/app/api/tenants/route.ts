import { NextResponse } from 'next/server';
import { getAllTenants, upsertTenant, getTenantBySlug, initializeDefaultTenant } from '@/lib/tenantService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (slug) {
      const tenant = await getTenantBySlug(slug);
      if (!tenant) {
        return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, tenant });
    }

    const tenants = await getAllTenants();
    if (tenants.length === 0) {
      const def = await initializeDefaultTenant();
      tenants.push(def);
    }

    return NextResponse.json({ success: true, tenants });
  } catch (error: any) {
    console.error('API /api/tenants GET error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch shops' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, name, ownerEmail, upiId, pricing, phone, address, plan, branding } = body;

    if (!slug || !name) {
      return NextResponse.json({ error: 'Shop slug and name are required' }, { status: 400 });
    }

    const tenant = await upsertTenant({
      slug,
      name,
      ownerEmail,
      upiId,
      pricing,
      phone,
      address,
      plan,
      branding,
    });

    return NextResponse.json({ success: true, tenant });
  } catch (error: any) {
    console.error('API /api/tenants POST error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to save shop' }, { status: 500 });
  }
}
