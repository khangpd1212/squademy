const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api";
const AUTH_STORAGE_KEY = "squademy.auth.tokens";

type StoredTokens = {
  accessToken: string | null;
  refreshToken: string | null;
};

let memoryTokens: StoredTokens = {
  accessToken: null,
  refreshToken: null,
};

let refreshPromise: Promise<boolean> | null = null;

function readStoredTokens(): StoredTokens {
  if (typeof window === "undefined") {
    return memoryTokens;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return memoryTokens;
  }

  try {
    const parsed = JSON.parse(raw) as StoredTokens;
    return {
      accessToken: parsed.accessToken ?? null,
      refreshToken: parsed.refreshToken ?? null,
    };
  } catch {
    return memoryTokens;
  }
}

function setLoginMarkerCookie(loggedIn: boolean) {
  if (typeof document === "undefined") return;
  if (loggedIn) {
    document.cookie = "logged_in=true;path=/;max-age=604800;SameSite=Lax";
  } else {
    document.cookie = "logged_in=;path=/;max-age=0;SameSite=Lax";
  }
}

function persistTokens(tokens: StoredTokens) {
  memoryTokens = tokens;
  if (typeof window === "undefined") {
    return;
  }

  if (!tokens.accessToken && !tokens.refreshToken) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    setLoginMarkerCookie(false);
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokens));
  setLoginMarkerCookie(true);
}

function getTokenState(): StoredTokens {
  if (memoryTokens.accessToken || memoryTokens.refreshToken) {
    return memoryTokens;
  }
  const stored = readStoredTokens();
  memoryTokens = stored;
  return stored;
}

export function getAccessToken() {
  return getTokenState().accessToken;
}

export function getRefreshToken() {
  return getTokenState().refreshToken;
}

export function setAuthTokens(accessToken: string, refreshToken: string) {
  persistTokens({ accessToken, refreshToken });
}

export function clearAuthTokens() {
  persistTokens({ accessToken: null, refreshToken: null });
}

function buildApiUrl(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}

function withAuthHeader(headers: Headers, token: string | null) {
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
}

function parseError(body: unknown): string {
  if (typeof body === "string") {
    return body;
  }
  if (body && typeof body === "object") {
    const obj = body as Record<string, unknown>;
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.error === "string") return obj.error;
  }
  return "Request failed";
}

async function tryRefreshTokens() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearAuthTokens();
    return false;
  }

  try {
    const response = await fetch(buildApiUrl("/auth/refresh"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const body = (await response.json().catch(() => ({}))) as {
      data?: { accessToken?: string; refreshToken?: string };
    };

    if (!response.ok || !body.data?.accessToken || !body.data?.refreshToken) {
      clearAuthTokens();
      return false;
    }

    setAuthTokens(body.data.accessToken, body.data.refreshToken);
    return true;
  } catch {
    clearAuthTokens();
    return false;
  }
}

async function refreshTokensOnce() {
  if (!refreshPromise) {
    refreshPromise = tryRefreshTokens().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function authFetch(path: string, init: RequestInit = {}, allowRefresh = true) {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData) && !headers.has("Content-Type") && init.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const accessToken = getAccessToken();
  withAuthHeader(headers, accessToken);

  const response = await fetch(buildApiUrl(path), {
    ...init,
    credentials: "include",
    headers,
  });

  if (response.status === 401 && allowRefresh) {
    const refreshed = await refreshTokensOnce();
    if (refreshed) {
      return authFetch(path, init, false);
    }
  }

  return response;
}

export async function apiRequest<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<{ data: T | null; error: string | null; status: number; raw: unknown }> {
  const response = await authFetch(path, init);
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  const data = (body.data ?? body) as T;

  if (!response.ok) {
    return {
      data: null,
      error: parseError(body),
      status: response.status,
      raw: body,
    };
  }

  return { data, error: null, status: response.status, raw: body };
}

export async function apiFetchRaw(path: string, init: RequestInit = {}) {
  return authFetch(path, init);
}
