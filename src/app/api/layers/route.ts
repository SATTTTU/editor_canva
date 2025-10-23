import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

type RouteContext = { params?: Record<string, string> } | { params?: Promise<Record<string, string> | undefined> };

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

    // Build create data using the Prisma Layer model fields (ensure required fields)
    const data = {
      type: body.type as 'IMAGE',
      designId: String(body.designId),
      assetId: body.assetId ?? null,
      x: typeof body.x === 'number' ? body.x : Number(body.x ?? 0),
      y: typeof body.y === 'number' ? body.y : Number(body.y ?? 0),
      width: typeof body.width === 'number' ? body.width : Number(body.width),
      height: typeof body.height === 'number' ? body.height : Number(body.height),
      rotation: typeof body.rotation === 'number' ? body.rotation : Number(body.rotation ?? 0),
      flipX: Boolean(body.flipX ?? false),
      flipY: Boolean(body.flipY ?? false),
      opacity: typeof body.opacity === 'number' ? body.opacity : Number(body.opacity ?? 1),
      zIndex: typeof body.zIndex === 'number' ? body.zIndex : Number(body.zIndex ?? 0),
      cropX: body.cropX == null ? null : Number(body.cropX),
      cropY: body.cropY == null ? null : Number(body.cropY),
      cropW: body.cropW == null ? null : Number(body.cropW),
      cropH: body.cropH == null ? null : Number(body.cropH),
      visible: Boolean(body.visible ?? true),
      locked: Boolean(body.locked ?? false),
    };

    const layer = await prisma.layer.create({ data });
    return NextResponse.json(layer, { status: 201 });
  } catch (err) {
    // Log the error server-side for easier debugging during development
    console.error('layers.POST error:', err);
    return NextResponse.json({ error: "Failed to create layer" }, { status: 500 });
  }
}
