import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function GET() {
  try {
    const layers = await prisma.layer.findMany({ include: { asset: true } });
    return NextResponse.json(layers);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch layers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Basic validation: these fields are required by the Prisma model
    const required = ["type", "designId", "width", "height"];
    for (const key of required) {
      // treat `undefined` or `null` as missing — clients sometimes send null for optional ids
      if (body[key] === undefined || body[key] === null) {
        return NextResponse.json({ error: `Missing required field: ${key}` }, { status: 400 });
      }
    }

    // Build create data with sensible defaults for optional fields
    const data: any = {
      type: body.type,
      designId: body.designId,
      assetId: body.assetId ?? null,
      x: body.x ?? 0,
      y: body.y ?? 0,
      width: body.width,
      height: body.height,
      rotation: body.rotation ?? 0,
      flipX: body.flipX ?? false,
      flipY: body.flipY ?? false,
      opacity: body.opacity ?? 1,
      zIndex: body.zIndex ?? 0,
      cropX: body.cropX ?? null,
      cropY: body.cropY ?? null,
      cropW: body.cropW ?? null,
      cropH: body.cropH ?? null,
      visible: body.visible ?? true,
      locked: body.locked ?? false,
    };

    const layer = await prisma.layer.create({ data });
    return NextResponse.json(layer, { status: 201 });
  } catch (err) {
    // Log the error server-side for easier debugging during development
    console.error('layers.POST error:', err);
    return NextResponse.json({ error: "Failed to create layer" }, { status: 500 });
  }
}
