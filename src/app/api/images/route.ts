import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function GET() {
  try {
    const images = await prisma.asset.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(images);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { originalName, mimeType, url, width, height, sizeBytes, sha256 } = await req.json();
    const newAsset = await prisma.asset.create({
      data: { originalName, mimeType, url, width, height, sizeBytes, sha256 },
    });
    return NextResponse.json(newAsset, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create image" }, { status: 500 });
  }
}
