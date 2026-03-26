"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegister } from "@/hooks/api/use-auth-queries";
import {
  duplicateEmailMessage,
  registerSchema,
  type RegisterInput,
} from "../register-schema";

export function RegisterForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const registerMutation = useRegister();

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      acceptPrivacy: false,
    },
    mode: "onSubmit",
  });

  async function onSubmit(values: RegisterInput) {
    setSubmitError(null);

    try {
      await registerMutation.mutateAsync(values);
      router.push("/dashboard");
    } catch (error) {
      const typedError = error as Error & {
        field?: "email" | "password" | "displayName" | "acceptPrivacy";
      };
      if (typedError.field) {
        form.setError(typedError.field, {
          type: "server",
          message:
            typedError.message ??
            (typedError.field === "email" ? duplicateEmailMessage : "Request failed."),
        });
        return;
      }
      setSubmitError(typedError.message ?? "Network error. Please try again.");
    }
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <div className="space-y-2">
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          autoComplete="nickname"
          placeholder="Your display name"
          {...form.register("displayName")}
          aria-invalid={form.formState.errors.displayName ? "true" : "false"}
        />
        {form.formState.errors.displayName ? (
          <p className="text-xs text-destructive">{form.formState.errors.displayName.message}</p>
        ) : null}
      </div>

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
          autoComplete="new-password"
          placeholder="At least 6 characters"
          {...form.register("password")}
          aria-invalid={form.formState.errors.password ? "true" : "false"}
        />
        {form.formState.errors.password ? (
          <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="acceptPrivacy" className="flex items-start gap-2 text-sm leading-5">
          <input
            id="acceptPrivacy"
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-input"
            {...form.register("acceptPrivacy")}
          />
          <span>
            I agree to the{" "}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
              privacy policy
            </Link>
            .
          </span>
        </label>
        {form.formState.errors.acceptPrivacy ? (
          <p className="text-xs text-destructive">{form.formState.errors.acceptPrivacy.message}</p>
        ) : null}
      </div>

      {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

      <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
        {registerMutation.isPending ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
