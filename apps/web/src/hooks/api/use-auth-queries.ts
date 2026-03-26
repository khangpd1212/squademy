"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiRequest,
  clearAuthTokens,
  setAuthTokens,
} from "@/lib/api/browser-client";
import { queryKeys } from "@/lib/api/query-keys";

export type AuthUser = {
  userId: string;
  email: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type LoginResponse = {
  accessToken?: string;
  refreshToken?: string;
};

type RegisterInput = {
  displayName: string;
  email: string;
  password: string;
  acceptPrivacy: boolean;
};

type RegisterResponse = {
  field?: "email" | "password" | "displayName" | "acceptPrivacy";
  accessToken?: string;
  refreshToken?: string;
};

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: async () => {
      const result = await apiRequest<AuthUser>("/auth/me");
      if (result.error) {
        return null;
      }
      return result.data ?? null;
    },
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: LoginInput) => {
      const result = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
      });

      if (result.error || !result.data?.accessToken || !result.data.refreshToken) {
        throw new Error(result.error ?? "Invalid credentials.");
      }

      setAuthTokens(result.data.accessToken, result.data.refreshToken);
      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: RegisterInput) => {
      const result = await apiRequest<RegisterResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(values),
      });

      if (result.error || !result.data) {
        const raw = (result.raw ?? {}) as RegisterResponse;
        const err = new Error(result.error ?? "Could not create account.");
        (err as Error & { field?: RegisterResponse["field"] }).field = raw.field;
        throw err;
      }

      if (result.data.accessToken && result.data.refreshToken) {
        setAuthTokens(result.data.accessToken, result.data.refreshToken);
      }

      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiRequest("/auth/logout", { method: "POST" });
      clearAuthTokens();
    },
    onSuccess: async () => {
      await queryClient.removeQueries({ queryKey: queryKeys.auth.me() });
    },
  });
}
