import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

// Note: Next's generated validator may pass context.params as a Promise; accept any shape here
export async function GET(req: Request, context: any) {
  const params = await context?.params;
  try {
    const image = await prisma.asset.findUnique({ where: { id: params.id } });
    if (!image) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(image);
  } catch {
    return NextResponse.json({ error: "Error fetching image" }, { status: 500 });
  }
}

export async function PUT(req: Request, context: any) {
  const params = await context?.params;
  try {
    const { originalName, mimeType, url, width, height, sizeBytes, sha256 } = await req.json();
    const updated = await prisma.asset.update({ where: { id: params.id }, data: { originalName, mimeType, url, width, height, sizeBytes, sha256 } });
    return NextResponse.json(updated);
  } catch (err: any) {
    if (err?.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ error: "Error updating image" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: any) {
  const params = await context?.params;
  try {
    await prisma.asset.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (err: any) {
    if (err?.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ error: "Error deleting image" }, { status: 500 });
  }
}
