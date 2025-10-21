import { NextResponse } from 'next/server';
import sharp from 'sharp';
import prisma from '@/lib/prisma';
import path from 'path';
import { getAssetPath } from '@/lib/image';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get design and its layers
    const design = await prisma.design.findUnique({
      where: { id: params.id },
      include: {
        layers: {
          include: { asset: true },
          orderBy: { zIndex: 'asc' },
        },
      },
    });

    if (!design) {
      return new NextResponse('Design not found', { status: 404 });
    }

    // Create a base canvas with the design dimensions
    let composition = sharp({
      create: {
        width: design.width,
        height: design.height,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      },
    });

    // Process each layer
    for (const layer of design.layers) {
      if (!layer.visible || !layer.asset) continue;

      // Read the layer's image
      const imagePath = getAssetPath(layer.asset.url);
      let layerImage = sharp(imagePath);

      // Apply transformations
      // Resize
      layerImage = layerImage.resize(
        Math.round(layer.width),
        Math.round(layer.height),
        { fit: 'fill' }
      );

      // Apply crop if specified
      if (layer.cropX !== null && layer.cropY !== null && 
          layer.cropW !== null && layer.cropH !== null) {
        layerImage = layerImage.extract({
          left: Math.round(layer.cropX),
          top: Math.round(layer.cropY),
          width: Math.round(layer.cropW),
          height: Math.round(layer.cropH),
        });
      }

      // Apply flip
      if (layer.flipX || layer.flipY) {
        layerImage = layerImage.flip(layer.flipY).flop(layer.flipX);
      }

      // Apply rotation
      if (layer.rotation !== 0) {
        layerImage = layerImage.rotate(layer.rotation);
      }

      // Convert to PNG buffer
      const layerBuffer = await layerImage.toBuffer();

      // Composite the layer onto the base canvas
      composition = composition.composite([
        {
          input: layerBuffer,
          top: Math.round(layer.y),
          left: Math.round(layer.x),
        },
      ]);
    }

    // Generate final image
    const outputBuffer = await composition.png().toBuffer();
    
    // Return the image with appropriate headers
    return new NextResponse(Buffer.from(outputBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="design-${design.id}.png"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return new NextResponse('Export failed', { status: 500 });
  }
}