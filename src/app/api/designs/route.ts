import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

type RouteContext = { params?: Promise<Record<string,string>> | Record<string,string> };

export async function GET() {
  try {
    // Include layers (and their asset relation) so the UI can preview layers for each design
    const designs = await prisma.design.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        layers: {
          include: { asset: true },
          orderBy: { zIndex: 'asc' },
        },
      },
    });
    return NextResponse.json(designs);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch designs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, width, height, thumbnail, layers } = body as { title?: string; width?: number; height?: number; thumbnail?: string | null; layers?: unknown };

    // Log thumbnail presence/size for debugging large payloads
    if (thumbnail) {
      try {
        const len = typeof thumbnail === 'string' ? thumbnail.length : 0
        console.log(`designs.POST: received thumbnail length=${len}`)
      } catch (e) {
        console.log('designs.POST: received thumbnail (unable to compute length)')
      }
    }

    if (!title || typeof width !== 'number' || typeof height !== 'number') {
      return NextResponse.json({ error: 'Missing required fields: title, width, height' }, { status: 400 });
    }

    const design = await prisma.design.create({ data: { title, width, height, thumbnail } });

    // Create layers referencing the new design
    if (Array.isArray(layers)) {
      const createPromises = layers.map((l: unknown) => {
        const ll = l as Record<string, unknown>;
        const data: any = {
          type: (ll['type'] as string) ?? 'IMAGE',
          designId: design.id,
          assetId: (ll['assetId'] as string) ?? null,
          x: (ll['x'] as number) ?? 0,
          y: (ll['y'] as number) ?? 0,
          width: ll['width'] as number,
          height: ll['height'] as number,
          rotation: (ll['rotation'] as number) ?? 0,
          flipX: (ll['flipX'] as boolean) ?? false,
          flipY: (ll['flipY'] as boolean) ?? false,
          opacity: (ll['opacity'] as number) ?? 1,
          zIndex: (ll['zIndex'] as number) ?? 0,
          cropX: (ll['cropX'] as number) ?? null,
          cropY: (ll['cropY'] as number) ?? null,
          cropW: (ll['cropW'] as number) ?? null,
          cropH: (ll['cropH'] as number) ?? null,
          visible: (ll['visible'] as boolean) ?? true,
          locked: (ll['locked'] as boolean) ?? false,
        };
        return prisma.layer.create({ data });
      });
      await Promise.all(createPromises);
    }

    // Fetch the full created design with layers + asset relation so the response includes everything the UI expects
    const full = await prisma.design.findUnique({
      where: { id: design.id },
      include: {
        layers: { include: { asset: true }, orderBy: { zIndex: 'asc' } },
      },
    });

    return NextResponse.json(full ?? design, { status: 201 });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create design" }, { status: 500 });
  }
}
