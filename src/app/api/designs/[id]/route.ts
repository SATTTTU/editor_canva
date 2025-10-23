import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';





// Define a schema for validating the PATCH request body. 
// This is good practice but not strictly necessary to fix the current error.
const designUpdateSchema = z.object({
  title: z.string().optional(),
  // You can add other fields you might want to update on the design level
});

type RouteContext = { params?: Record<string, string> } | { params?: Promise<Record<string, string> | undefined> };

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const params = await context?.params;
    const id = params?.id as string;

    const design = await prisma.design.findUnique({
      where: { id: id },
      include: {
        layers: {
          include: { asset: true },
          orderBy: { zIndex: 'asc' },
        },
      },
    });

    if (!design) {
      return NextResponse.json({ error: 'Design not found' }, { status: 404 });
    }

    return NextResponse.json(design);
  } catch (error) {
    console.error("Failed to fetch design:", error);
    return NextResponse.json({ error: 'Internal Server Error while fetching design' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const params = await context?.params;
    const id = params?.id as string;
    const json = await request.json();
    
    // Validate the incoming data
    const data = designUpdateSchema.parse(json);

    const updatedDesign = await prisma.design.update({
      where: { id: id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        layers: {
          include: { asset: true },
          orderBy: { zIndex: 'asc' },
        },
      },
    });

    return NextResponse.json(updatedDesign);
  } catch (error) { // <<< THE FIX IS HERE. THE UNDERSCORE IS GONE.
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.format() }, { status: 400 });
    }
    console.error("Failed to update design:", error);
    return NextResponse.json({ error: 'Internal Server Error while updating design' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const params = await context?.params;
    const id = params?.id as string;

    // Use a transaction to ensure related layers are deleted before the design
    await prisma.$transaction(async (tx) => {
      await tx.layer.deleteMany({
        where: { designId: id },
      });
      await tx.design.delete({
        where: { id: id },
      });
    });

    return new NextResponse(null, { status: 204 }); // Success, no content
  } catch (error) {
    console.error("Failed to delete design:", error);
    return NextResponse.json({ error: 'Internal Server Error while deleting design' }, { status: 500 });
  }
}