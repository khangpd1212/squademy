import {
  allowedAvatarMimeTypes,
  maxAvatarSizeBytes,
} from "@/app/(dashboard)/settings/profile-schema";
import { NextResponse } from "next/server";

function isAllowedAvatarType(type: string) {
  return allowedAvatarMimeTypes.includes(
    type as (typeof allowedAvatarMimeTypes)[number],
  );
}

export async function POST(request: Request) {
  // Auth check via cookie - if no access_token, unauthorized
  const cookieHeader = request.headers.get("cookie") ?? "";
  if (!cookieHeader.includes("access_token=")) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const formData = await request.formData();
  const fileEntry = formData.get("file");

  if (!(fileEntry instanceof File)) {
    return NextResponse.json(
      { message: "Missing file upload." },
      { status: 400 },
    );
  }

  if (!isAllowedAvatarType(fileEntry.type)) {
    return NextResponse.json(
      { message: "Avatar must be a JPG or PNG image." },
      { status: 400 },
    );
  }

  if (fileEntry.size === 0) {
    return NextResponse.json(
      { message: "Avatar file is empty." },
      { status: 400 },
    );
  }

  if (fileEntry.size > maxAvatarSizeBytes) {
    return NextResponse.json(
      { message: "Avatar must be 2MB or smaller." },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await fileEntry.arrayBuffer());
  const avatarDataUrl = `data:${fileEntry.type};base64,${buffer.toString("base64")}`;

  return NextResponse.json({ ok: true, url: avatarDataUrl });
}
