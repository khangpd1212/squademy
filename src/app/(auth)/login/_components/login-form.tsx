"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  invalidCredentialsMessage,
  loginSchema,
  type LoginInput,
} from "../login-schema";

type LoginApiResponse = {
  ok?: boolean;
  message?: string;
  redirectTo?: string;
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onSubmit",
  });

  async function onSubmit(values: LoginInput) {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const redirect = searchParams.get("redirect");
      const query = redirect ? `?redirect=${encodeURIComponent(redirect)}` : "";

      const response = await fetch(`/api/auth/login${query}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const payload = (await response.json()) as LoginApiResponse;

      if (!response.ok) {
        const message = payload.message ?? invalidCredentialsMessage;
        setSubmitError(message);
        if (message === invalidCredentialsMessage) {
          form.resetField("password");
        }
        return;
      }

      router.push(payload.redirectTo ?? "/dashboard");
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...form.register("email")}
          aria-invalid={form.formState.errors.email ? "true" : "false"}
        />
        {form.formState.errors.email ? (
          <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          {...form.register("password")}
          aria-invalid={form.formState.errors.password || submitError ? "true" : "false"}
        />
        {form.formState.errors.password ? (
          <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
        ) : null}
      </div>

      {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Logging in..." : "Log in"}
      </Button>

    </form>
  );
}
