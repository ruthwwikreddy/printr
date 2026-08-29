import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { promises as fs } from 'fs';
import path from 'path';

const AGENT_TOKEN = process.env.PRINT_AGENT_AUTH_SECRET || '99022997a3d1dd327bd67ed57eb370f25095edaccb2bd09db7678d8ea3f5ce63';

function verifyToken(request: Request): boolean {
  const auth = request.headers.get('Authorization');
  return auth === `Bearer ${AGENT_TOKEN}`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const order = await db.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const files = order.files || [];
    const fileRecord = files[0];
    if (!fileRecord || !fileRecord.filePath) {
      return NextResponse.json({ error: 'File record not found' }, { status: 404 });
    }

    // Read local or cloud file
    try {
      const fileBuffer = await fs.readFile(fileRecord.filePath);
      const ext = path.extname(fileRecord.filePath) || '.pdf';
      const contentType = fileRecord.mimeType || (ext === '.pdf' ? 'application/pdf' : 'image/png');

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${fileRecord.filename || 'document' + ext}"`,
        },
      });
    } catch {
      return NextResponse.json({ error: 'File data not accessible on server' }, { status: 404 });
    }
  } catch (error) {
    console.error('File download route error:', error);
    return NextResponse.json({ error: 'Server download error' }, { status: 500 });
  }
}
