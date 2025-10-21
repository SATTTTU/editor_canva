import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import path from 'path';
import { generateAssetFilename, getImageDimensions, isValidImageType } from '@/lib/image';
import { createHash } from 'crypto';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!isValidImageType(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Generate unique filename and calculate paths
    const fileName = generateAssetFilename(file.name);
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const filePath = path.join(uploadDir, fileName);

    // Ensure upload directory exists
    await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

    // Calculate SHA256 hash
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const sha256 = createHash('sha256').update(fileBuffer).digest('hex');

    // Get image dimensions
    const dimensions = await getImageDimensions(filePath);

    // Create asset record in database
    const asset = await prisma.asset.create({
      data: {
        originalName: file.name,
        mimeType: file.type,
        width: dimensions.width,
        height: dimensions.height,
        sizeBytes: file.size,
        url: fileName,
        sha256,
      },
    });

    return NextResponse.json(asset);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// GET endpoint to list assets
export async function GET() {
  try {
    const assets = await prisma.asset.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(assets);
  } catch (error) {
    console.error('List assets error:', error);
    return NextResponse.json(
      { error: 'Failed to list assets' },
      { status: 500 }
    );
  }
}