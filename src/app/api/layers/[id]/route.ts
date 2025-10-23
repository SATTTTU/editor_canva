import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

type RouteContext = { params?: Record<string, string> } | { params?: Promise<Record<string, string> | undefined> };

export async function GET(req: Request, context: RouteContext) {
  const params = await context?.params;
  try {
    const id = params?.id as string;
    const layer = await prisma.layer.findUnique({ where: { id }, include: { asset: true } });
    if (!layer) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(layer);
  } catch (err: unknown) {
    console.error('layers/[id].GET error:', err);
    return NextResponse.json({ error: "Failed to fetch layer" }, { status: 500 });
  }
}

export async function PUT(req: Request, context: RouteContext) {
  const params = await context?.params;
  try {
    const id = params?.id as string;
    const body = (await req.json()) as Record<string, unknown>;

    // Only allow updating known fields
    const updates: Record<string, unknown> = {};
    const updatable = [
      "x",
      "y",
      "width",
      "height",
      "rotation",
      "flipX",
      "flipY",
      "opacity",
      "zIndex",
      "cropX",
      "cropY",
      "cropW",
      "cropH",
      "visible",
      "locked",
      "assetId",
    ];
    for (const k of updatable) {
      if (Object.prototype.hasOwnProperty.call(body, k)) updates[k] = body[k];
    }

    const updated = await prisma.layer.update({ where: { id }, data: updates as any });
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const e = err as any;
    if (e?.code === "P2025") {
      return NextResponse.json({ error: "Layer not found" }, { status: 404 });
    }
    console.error('layers/[id].PUT error:', err);
    return NextResponse.json({ error: "Failed to update layer" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  const params = await context?.params;
  try {
    const id = params?.id as string;
    await prisma.layer.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (err: unknown) {
    const e = err as any;
    if (e?.code === "P2025") {
      return NextResponse.json({ error: "Layer not found" }, { status: 404 });
    }
    console.error('layers/[id].DELETE error:', err);
    return NextResponse.json({ error: "Failed to delete layer" }, { status: 500 });
  }
}
