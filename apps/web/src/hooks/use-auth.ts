"use client";

import { useCurrentUser } from "@/hooks/api/use-auth-queries";

export type AuthUser = {
  userId: string;
  email: string;
};

export function useAuth() {
  const { data, isLoading } = useCurrentUser();
  return { user: data ?? null, loading: isLoading };
}
