"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateProfile } from "@/hooks/api/use-user-queries";
import { profileFormSchema, ProfileFormValues, toNullableString, VALIDATION } from "@squademy/shared";

type ProfileFormProps = {
  initialProfile: {
    displayName: string;
    avatarUrl: string | null;
    fullName: string | null;
    school: string | null;
    location: string | null;
    age: number | null;
  };
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
  const [avatarUrl] = useState<string | null>(initialProfile.avatarUrl);
  const [displayNamePreview, setDisplayNamePreview] = useState(initialProfile.displayName);
  const updateProfileMutation = useUpdateProfile();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: initialProfile.displayName ?? "",
      fullName: initialProfile.fullName ?? "",
      school: initialProfile.school ?? "",
      location: initialProfile.location ?? "",
      age: initialProfile.age,
    },
    mode: "onSubmit",
  });

  const fallbackInitials = useMemo(
    () => formatInitials(displayNamePreview || initialProfile.displayName || "User"),
    [displayNamePreview, initialProfile.displayName]
  );

  async function handleSave(values: ProfileFormValues) {
    setSubmitError(null);
    setSaveSuccess(null);

    const previousDisplayName = displayNamePreview;
    const optimisticDisplayName = values.displayName.trim();
    setDisplayNamePreview(optimisticDisplayName);

    try {
      const response = await updateProfileMutation.mutateAsync({
          displayName: optimisticDisplayName,
          fullName: toNullableString(values.fullName),
          school: toNullableString(values.school),
          location: toNullableString(values.location),
          age: values.age,
      });
      const profile = response?.profile;
      if (profile?.displayName) {
        setDisplayNamePreview(profile.displayName);
      }

      setSaveSuccess("Profile saved.");
    } catch (error) {
      const typedError = error as Error & {
        field?: "displayName" | "fullName" | "school" | "location" | "age";
      };
      if (typedError.field) {
        form.setError(typedError.field, {
          type: "server",
          message: typedError.message ?? "Could not save this field.",
        });
      } else {
        setSubmitError(typedError.message ?? "Could not save profile. Please try again.");
      }
      setDisplayNamePreview(previousDisplayName);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar size="lg">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayNamePreview} /> : null}
          <AvatarFallback>{fallbackInitials}</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <p className="font-medium" data-testid="profile-preview-name">
            {displayNamePreview}
          </p>
          <p className="text-xs text-muted-foreground">
            Avatar upload will be available after file storage is configured.
          </p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={form.handleSubmit(handleSave)} noValidate>
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
          <Input
            id="age"
            type="number"
            min={VALIDATION.AGE_MIN}
            max={VALIDATION.AGE_MAX}
            {...form.register("age")}
            aria-invalid={form.formState.errors.age ? "true" : "false"}
          />
          {form.formState.errors.age ? (
            <p className="text-xs text-destructive">{form.formState.errors.age.message}</p>
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
