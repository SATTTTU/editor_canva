import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET(req: Request, context: any) {
  const params = await context?.params;
  try {
    const layer = await prisma.layer.findUnique({ where: { id: params.id }, include: { asset: true } });
    if (!layer) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(layer);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch layer" }, { status: 500 });
  }
}

export async function PUT(req: Request, context: any) {
  const params = await context?.params;
  try {
    const body = await req.json();

    // Only allow updating known fields
    const allowed: any = {};
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
      if (body[k] !== undefined) allowed[k] = body[k];
    }

    const updated = await prisma.layer.update({ where: { id: params.id }, data: allowed });
    return NextResponse.json(updated);
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Layer not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update layer" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: any) {
  const params = await context?.params;
  try {
    await prisma.layer.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Layer not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete layer" }, { status: 500 });
  }
}
