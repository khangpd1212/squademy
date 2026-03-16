export function getSafeRedirectPath(candidate?: string | null): string | null {
  if (!candidate) {
    return null;
  }

  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return null;
  }

  return candidate;
}

export function getLoginRedirectTarget(candidate?: string | null): string {
  return getSafeRedirectPath(candidate) ?? "/dashboard";
}
