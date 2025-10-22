// app/api/images/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import { z } from 'zod';

const imageUploadSchema = z.object({
  originalName: z.string(),
  mimeType: z.string().refine(type => type.startsWith('image/'), { message: "Invalid Mime Type" }),
  url: z.string().refine(url => url.startsWith('data:image/'), { message: "URL must be a base64 data URL" }),
  width: z.number().optional().nullable(),
  height: z.number().optional().nullable(),
});

function decodeBase64Image(dataString: string) {
  const matches = dataString.match(/^data:(.+);base64,(.+)$/);
  if (!matches || matches.length !== 3) throw new Error('Invalid base64 string');
  return { mime: matches[1], buffer: Buffer.from(matches[2], 'base64') };
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const body = imageUploadSchema.parse(json);

    const { buffer, mime } = decodeBase64Image(body.url);
    const sha256 = createHash('sha256').update(buffer).digest('hex');
    const extension = mime.split('/')[1] || 'png';
    const fileName = `${sha256}.${extension}`;
    
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const publicUrl = `/uploads/${fileName}`;

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), buffer);

    const asset = await prisma.asset.create({
      data: {
        originalName: body.originalName,
        mimeType: mime,
        width: body.width,
        height: body.height,
        sizeBytes: buffer.length,
        url: publicUrl,
        sha256,
      },
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error('Image Upload Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.format() }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}