"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RHFInputNumber } from "@/components/form/rhf-input-number";
import { useUpdateProfile, ProfileUpdatePayload } from "@/hooks/api/use-user-queries";
import { profileFormSchema, ProfileFormValues, VALIDATION } from "@squademy/shared";

type ProfileFormProps = {
  initialProfile: ProfileFormValues;
};

function formatInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function ProfileForm({ initialProfile }: ProfileFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const updateProfileMutation = useUpdateProfile();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: initialProfile,
    mode: "onSubmit",
  });
  const avatarUrl = useWatch({ control: form.control, name: "avatarUrl" });
  const watchedDisplayName = useWatch({ control: form.control, name: "displayName" }) || initialProfile.displayName;

  const fallbackInitials = useMemo(
    () => formatInitials(initialProfile.displayName || "User"),
    [initialProfile.displayName],
  );

  async function handleSave(values: ProfileFormValues) {
    setSubmitError(null);
    setSaveSuccess(null);

    const { email: _email, ...updatePayload }: { email: string; } & ProfileUpdatePayload = values;

    try {
      await updateProfileMutation.mutateAsync(updatePayload);

      setSaveSuccess("Profile saved.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not save profile. Please try again.";
      setSubmitError(message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar size="lg">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={initialProfile.displayName} /> : null}
          <AvatarFallback>{fallbackInitials}</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <p className="font-medium" data-testid="profile-preview-name">
            {watchedDisplayName}
          </p>
          <p className="text-xs text-muted-foreground">
            Paste avatar URL to update preview and submit value.
          </p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={form.handleSubmit(handleSave)} onChange={() => setSaveSuccess(null)} noValidate>
        <div className="space-y-2">
          <Label htmlFor="avatarUrl">Avatar URL</Label>
          <Input
            id="avatarUrl"
            placeholder="https://example.com/avatar.png"
            autoComplete="url"
            {...form.register("avatarUrl", {
              setValueAs: (value: string) => {
                const trimmed = value?.trim?.() ?? "";
                return trimmed === "" ? undefined : trimmed;
              },
            })}
            aria-invalid={form.formState.errors.avatarUrl ? "true" : "false"}
          />
          {form.formState.errors.avatarUrl ? (
            <p className="text-xs text-destructive">{form.formState.errors.avatarUrl.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayName">Display name</Label>
          <Input
            id="displayName"
            autoComplete="nickname"
            {...form.register("displayName")}
            aria-invalid={form.formState.errors.displayName ? "true" : "false"}
          />
          {form.formState.errors.displayName ? (
            <p className="text-xs text-destructive">{form.formState.errors.displayName.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" autoComplete="name" {...form.register("fullName")} />
          {form.formState.errors.fullName ? (
            <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            autoComplete="email"
            value={initialProfile.email}
            readOnly
            className="bg-muted cursor-default"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="school">School</Label>
          <Input id="school" {...form.register("school")} />
          {form.formState.errors.school ? (
            <p className="text-xs text-destructive">{form.formState.errors.school.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" {...form.register("location")} />
          {form.formState.errors.location ? (
            <p className="text-xs text-destructive">{form.formState.errors.location.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <RHFInputNumber
            id="age"
            control={form.control}
            name="age"
            min={VALIDATION.AGE_MIN}
            max={VALIDATION.AGE_MAX}
            step={1}
            precision={0}
            inputMode="numeric"
            ariaDescribedBy={form.formState.errors.age ? "age-error-message" : undefined}
          />
          {form.formState.errors.age ? (
            <p id="age-error-message" className="text-xs text-destructive">
              {form.formState.errors.age.message}
            </p>
          ) : null}
        </div>

        {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending ? "Saving..." : "Save profile"}
          </Button>
          {saveSuccess ? (
            <p role="status" className="text-sm text-emerald-600 dark:text-emerald-400">
              {saveSuccess}
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}
