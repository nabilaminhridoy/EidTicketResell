import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    const session = token ? await verifyToken(token) : null;

    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // MIME Validation
    const validMimeTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validMimeTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only JPG/PNG allowed." }, { status: 400 });
    }

    // Size Validation (2MB limit = 2 * 1024 * 1024 bytes)
    if (file.size > 2097152) {
      return NextResponse.json({ error: "File exceeds 2MB limit." }, { status: 400 });
    }

    // Sanitize and define paths
    const ext = path.extname(file.name).toLowerCase();
    const safeFilename = `${uuidv4()}${ext}`; // Defeats path traversal and name collisions
    const relativeWebPath = `/uploads/gateways/${safeFilename}`;
    const absoluteUploadPath = path.join(process.cwd(), "public", relativeWebPath);

    // Save Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(absoluteUploadPath, buffer);

    return NextResponse.json({ success: true, url: relativeWebPath });
  } catch (error: any) {
    console.error("ADMIN_UPLOAD_ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
