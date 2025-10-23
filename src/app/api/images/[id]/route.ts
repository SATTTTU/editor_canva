import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

type RouteContext = { params?: Record<string, string> } | { params?: Promise<Record<string, string> | undefined> };

// Note: Next's generated validator may pass context.params as a Promise; accept typed shape
export async function GET(req: Request, context: RouteContext) {
  const params = await context?.params;
  try {
    const id = params?.id as string;
    const image = await prisma.asset.findUnique({ where: { id } });
    if (!image) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(image);
  } catch {
    return NextResponse.json({ error: "Error fetching image" }, { status: 500 });
  }
}

export async function PUT(req: Request, context: RouteContext) {
  const params = await context?.params;
  try {
    const id = params?.id as string;
    const { originalName, mimeType, url, width, height, sizeBytes, sha256 } = await req.json();
    const updated = await prisma.asset.update({ where: { id }, data: { originalName, mimeType, url, width, height, sizeBytes, sha256 } });
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const e = err as any;
    if (e?.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ error: "Error updating image" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  const params = await context?.params;
  try {
    const id = params?.id as string;
    await prisma.asset.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (err: unknown) {
    const e = err as any;
    if (e?.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ error: "Error deleting image" }, { status: 500 });
  }
}
