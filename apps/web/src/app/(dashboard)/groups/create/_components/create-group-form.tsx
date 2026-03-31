"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateGroup } from "@/hooks/api/use-group-queries";
import {
  createGroupSchema,
  type CreateGroupInput,
} from "@squademy/shared";

export function CreateGroupForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createGroupMutation = useCreateGroup();

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

    try {
      const group = await createGroupMutation.mutateAsync({
        name: values.name,
        description: values.description,
      });
      if (!group?.id) {
        setSubmitError("Group created but redirect failed. Please refresh.");
        return;
      }

      router.push(`/group/${group.id}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Network error. Please try again.";
      setSubmitError(message);
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

      <Button type="submit" disabled={createGroupMutation.isPending}>
        {createGroupMutation.isPending ? "Creating group..." : "Create Group"}
      </Button>
    </form>
  );
}
