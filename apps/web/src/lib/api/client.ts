import { cookies } from "next/headers";

const API_BASE_URL = process.env.API_URL || "http://localhost:4001/api";

type FetchOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

/**
 * Server-side API client for calling the NestJS backend.
 *
 * Auth model: Bearer tokens are stored client-side (localStorage).
 * Server Components cannot access localStorage, so this client is used
 * only for unauthenticated prefetch or when an access token is explicitly
 * provided via options.headers.
 */
export async function apiClient<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<{ data: T | null; error: string | null; status: number }> {
  const headers: Record<string, string> = {
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
 * Check if the user is logged in by reading the `logged_in` cookie marker.
 *
 * This does NOT verify the token — it only checks the marker set by
 * browser-client.ts. Real auth verification is done by NestJS when the
 * client-side code sends Bearer tokens.
 */
export async function getCurrentUser(): Promise<{
  userId: string;
  email: string;
} | null> {
  const cookieStore = await cookies();
  const loggedIn = cookieStore.get("logged_in");

  if (loggedIn?.value !== "true") {
    return null;
  }

  // We know the user was logged in (marker exists), but we can't
  // verify the token server-side. Return a minimal placeholder.
  // The actual profile data will be fetched client-side via browser-client.
  return { userId: "", email: "" };
}
