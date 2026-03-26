import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_URL || "http://localhost:3001/api";

/**
 * Proxy a Next.js API route request to the NestJS backend.
 * Forwards cookies, headers, and body. Passes back Set-Cookie headers from NestJS.
 */
export async function proxyToApi(
  request: NextRequest,
  nestPath: string,
  options?: { method?: string },
): Promise<NextResponse> {
  const method = options?.method || request.method;
  const cookieHeader = request.headers.get("cookie") ?? "";
  const contentType = request.headers.get("content-type") ?? "";

  const headers: Record<string, string> = {
    cookie: cookieHeader,
  };

  if (contentType) {
    headers["content-type"] = contentType;
  }

  let body: BodyInit | undefined;
  if (method !== "GET" && method !== "HEAD") {
    if (contentType.includes("multipart/form-data")) {
      // For form data, pass through the raw body
      body = await request.arrayBuffer().then((buf) => Buffer.from(buf));
    } else {
      body = await request.text();
    }
  }

  const upstream = await fetch(`${API_BASE_URL}${nestPath}`, {
    method,
    headers,
    body,
  });

  const responseBody = await upstream.text();

  const response = new NextResponse(responseBody, {
    status: upstream.status,
    headers: { "content-type": "application/json" },
  });

  // Forward Set-Cookie headers from NestJS (for auth tokens)
  const setCookies = upstream.headers.getSetCookie();
  for (const cookie of setCookies) {
    response.headers.append("set-cookie", cookie);
  }

  return response;
}
