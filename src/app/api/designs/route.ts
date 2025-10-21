import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function GET() {
  try {
    const designs = await prisma.design.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(designs);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch designs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { title, width, height, thumbnail, layers } = await req.json();
    const design = await prisma.design.create({ data: { title, width, height, thumbnail } });

    // Create layers referencing the new design
    if (Array.isArray(layers)) {
      const createPromises = layers.map((l: any) => {
        const data: any = {
          type: l.type,
          designId: design.id,
          assetId: l.assetId ?? null,
          x: l.x ?? 0,
          y: l.y ?? 0,
          width: l.width,
          height: l.height,
          rotation: l.rotation ?? 0,
          flipX: l.flipX ?? false,
          flipY: l.flipY ?? false,
          opacity: l.opacity ?? 1,
          zIndex: l.zIndex ?? 0,
          cropX: l.cropX ?? null,
          cropY: l.cropY ?? null,
          cropW: l.cropW ?? null,
          cropH: l.cropH ?? null,
          visible: l.visible ?? true,
          locked: l.locked ?? false,
        };
        return prisma.layer.create({ data });
      });
      await Promise.all(createPromises);
    }

    return NextResponse.json(design, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create design" }, { status: 500 });
  }
}
