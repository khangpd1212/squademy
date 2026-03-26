import { cookies } from "next/headers";

const API_BASE_URL = process.env.API_URL || "http://localhost:3001/api";

type FetchOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

/**
 * Server-side API client for calling the NestJS backend.
 * Automatically forwards auth cookies from the incoming request.
 */
export async function apiClient<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<{ data: T | null; error: string | null; status: number }> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const headers: Record<string, string> = {
    cookie: cookieHeader,
    ...options.headers,
  };

  if (options.body !== undefined) {
    headers["content-type"] = "application/json";
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Request failed" }));
    return {
      data: null,
      error: body.message || body.error || "Request failed",
      status: res.status,
    };
  }

  const body = await res.json().catch(() => ({}));
  return { data: body.data ?? body, error: null, status: res.status };
}

/**
 * Get the current user from the access_token cookie.
 * Returns null if not authenticated (no cookie or expired).
 */
export async function getCurrentUser(): Promise<{
  userId: string;
  email: string;
} | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token");

  if (!accessToken?.value) {
    return null;
  }

  const result = await apiClient<{ userId: string; email: string }>(
    "/auth/me",
  );
  if (result.error || !result.data) {
    return null;
  }

  return result.data;
}
