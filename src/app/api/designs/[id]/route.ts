import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Layer update schema
const layerUpdateSchema = z.object({
  assetId: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  rotation: z.number().optional(),
  flipX: z.boolean().optional(),
  flipY: z.boolean().optional(),
  opacity: z.number().optional(),
  zIndex: z.number().optional(),
  cropX: z.number().nullable().optional(),
  cropY: z.number().nullable().optional(),
  cropW: z.number().nullable().optional(),
  cropH: z.number().nullable().optional(),
  visible: z.boolean().optional(),
  locked: z.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const design = await prisma.design.findUnique({
      where: { id: params.id },
      include: {
        layers: {
          include: {
            asset: true,
          },
          orderBy: {
            zIndex: 'asc',
          },
        },
      },
    });

    if (!design) {
      return NextResponse.json({ error: 'Design not found' }, { status: 404 });
    }

    return NextResponse.json(design);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch design' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const json = await request.json();
    const data = layerUpdateSchema.parse(json);

    const design = await prisma.design.update({
      where: { id: params.id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        layers: {
          include: {
            asset: true,
          },
          orderBy: {
            zIndex: 'asc',
          },
        },
      },
    });

    return NextResponse.json(design);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.format() }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to update design' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.design.delete({
      where: { id: params.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete design' },
      { status: 500 }
    );
  }
}