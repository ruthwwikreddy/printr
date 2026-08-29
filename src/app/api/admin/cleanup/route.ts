import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { promises as fs } from 'fs';

export async function POST(request: Request) {
  try {
    // 1. Find completed/failed files older than 24 hours
    const thresholdDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const oldFiles = await prisma.orderFile.findMany({
      where: {
        createdAt: { lt: thresholdDate },
      },
    });

    let deletedCount = 0;
    for (const file of oldFiles) {
      try {
        await fs.unlink(file.filePath);
        deletedCount++;
      } catch (err) {
        // file might have already been deleted or moved
      }
    }

    // Clean up corresponding DB entries if desired, or keep metadata but erase the storage paths
    await prisma.orderFile.updateMany({
      where: {
        createdAt: { lt: thresholdDate },
      },
      data: {
        filePath: 'DELETED_DUE_TO_RETENTION_POLICY',
      },
    });

    return NextResponse.json({ success: true, deletedCount });
  } catch (error) {
    return NextResponse.json({ error: 'Retention cleanup execution failed' }, { status: 500 });
  }
}
