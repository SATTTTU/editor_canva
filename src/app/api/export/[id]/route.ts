// app/api/export/[id]/route.ts
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import prisma from '@/lib/prisma';
import path from 'path';

export async function GET(request: Request, context: any) {
  try {
    const params = await context?.params;
    const { id } = params;

    const design = await prisma.design.findUnique({
      where: { id },
      include: {
        layers: {
          where: { visible: true },
          include: { asset: true },
          orderBy: { zIndex: 'asc' },
        },
      },
    });

    if (!design) {
      return new NextResponse('Design not found', { status: 404 });
    }

    const compositeLayers = await Promise.all(design.layers.map(async (layer) => {
      if (!layer.asset?.url) return null;

      const assetPath = path.join(process.cwd(), 'public', layer.asset.url);
      let layerImage = sharp(assetPath);

      // Apply transformations in order
      if (layer.cropW && layer.cropH) {
        layerImage.extract({
          left: Math.round(layer.cropX ?? 0),
          top: Math.round(layer.cropY ?? 0),
          width: Math.round(layer.cropW),
          height: Math.round(layer.cropH),
        });
      }
      layerImage.resize(Math.round(layer.width), Math.round(layer.height));
      if (layer.flipY) layerImage.flip();
      if (layer.flipX) layerImage.flop();
      if (layer.rotation) layerImage.rotate(layer.rotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } });

      return {
        input: await layerImage.toBuffer(),
        top: Math.round(layer.y),
        left: Math.round(layer.x),
      };
    }));

    const validLayers = compositeLayers.filter(Boolean) as sharp.OverlayOptions[];

    const finalImageBuffer = await sharp({
      create: {
        width: design.width,
        height: design.height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
    .composite(validLayers)
    .png()
    .toBuffer();

    // Buffer isn't assignable to the web `BodyInit` type in TypeScript even
    // though it's acceptable at runtime (Node's Buffer extends Uint8Array).
    // Cast to satisfy the typechecker.
    return new NextResponse(finalImageBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="design-${design.id}.png"`,
      },
    });
  } catch (error) {
    console.error('Export Error:', error);
    return new NextResponse('Failed to export design', { status: 500 });
  }
}