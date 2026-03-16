"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createGroupSchema,
  type CreateGroupInput,
} from "@/app/api/groups/group-schema";

type CreateGroupApiResponse = {
  ok?: boolean;
  message?: string;
  field?: "name" | "description";
  group?: {
    id: string;
    name: string;
    inviteCode: string;
  };
};

export function CreateGroupForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<CreateGroupInput>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      description: "",
    },
    mode: "onSubmit",
  });

  async function onSubmit(values: CreateGroupInput) {
    setSubmitError(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const payload = (await response.json()) as CreateGroupApiResponse;

      if (!response.ok) {
        if (payload.field) {
          form.setError(payload.field, {
            type: "server",
            message: payload.message ?? "Could not save this field.",
          });
          return;
        }

        setSubmitError(payload.message ?? "Could not create group. Please try again.");
        return;
      }

      if (!payload.group?.id) {
        setSubmitError("Group created but redirect failed. Please refresh.");
        return;
      }

      router.push(`/group/${payload.group.id}`);
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <div className="space-y-2">
        <Label htmlFor="name">Group name</Label>
        <Input
          id="name"
          placeholder="IELTS Warriors"
          {...form.register("name")}
          aria-invalid={form.formState.errors.name ? "true" : "false"}
        />
        {form.formState.errors.name ? (
          <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          placeholder="What your group will focus on..."
          {...form.register("description")}
          aria-invalid={form.formState.errors.description ? "true" : "false"}
        />
        {form.formState.errors.description ? (
          <p className="text-xs text-destructive">
            {form.formState.errors.description.message}
          </p>
        ) : null}
      </div>

      {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

      <Button type="submit" disabled={isSaving}>
        {isSaving ? "Creating group..." : "Create Group"}
      </Button>
    </form>
  );
}
