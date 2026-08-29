import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const validMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validMimeTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file format. Only PDF, JPG, PNG allowed.' }, { status: 400 });
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 50MB.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Determine page count server-side
    let pageCount = 1;
    if (file.type === 'application/pdf') {
      try {
        const pdfDoc = await PDFDocument.load(buffer);
        pageCount = pdfDoc.getPageCount();
      } catch {
        return NextResponse.json({ error: 'Could not read PDF. The file may be corrupted.' }, { status: 400 });
      }
    }

    // Save to uploads directory with random filename
    const uploadDir = path.join(process.cwd(), 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    const ext = path.extname(file.name) || (file.type === 'application/pdf' ? '.pdf' : '.png');
    const safeFilename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const filePath = path.join(uploadDir, safeFilename);
    await fs.writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      filename: file.name,
      filePath,
      mimeType: file.type,
      fileSize: file.size,
      pageCount,
    });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Failed to process file upload.' }, { status: 500 });
  }
}
