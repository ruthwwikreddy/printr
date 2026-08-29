import { NextResponse } from 'next/server';
import { getTenantBySlug, upsertTenant } from '@/lib/tenantService';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    const tenant = await getTenantBySlug(slug);

    if (!tenant) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Public sanitized representation (omit raw internal secret if not needed)
    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        phone: tenant.phone,
        address: tenant.address,
        upiId: tenant.upiId,
        pricing: tenant.pricing,
        branding: tenant.branding,
        status: tenant.status,
        supportedFormats: tenant.supportedFormats,
        maxFileSizeMB: tenant.maxFileSizeMB,
        printers: tenant.printers,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch shop details' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    const body = await request.json();

    const tenant = await upsertTenant({
      ...body,
      slug,
    });

    return NextResponse.json({ success: true, tenant });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update shop' }, { status: 500 });
  }
}
