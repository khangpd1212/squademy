"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  allowedAvatarMimeTypes,
  maxAvatarSizeBytes,
  profileFormSchema,
  toNullableProfileValue,
  type ProfileFormValues,
} from "../profile-schema";

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

type ProfileApiResponse = {
  ok?: boolean;
  message?: string;
  field?: "displayName" | "fullName" | "school" | "location" | "age";
  profile?: {
    displayName: string | null;
    avatarUrl: string | null;
    fullName: string | null;
    school: string | null;
    location: string | null;
    age: number | null;
  };
};

type UploadApiResponse = {
  ok?: boolean;
  message?: string;
  url?: string;
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
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialProfile.avatarUrl);
  const [displayNamePreview, setDisplayNamePreview] = useState(initialProfile.displayName);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: initialProfile.displayName ?? "",
      fullName: initialProfile.fullName ?? "",
      school: initialProfile.school ?? "",
      location: initialProfile.location ?? "",
      age: typeof initialProfile.age === "number" ? String(initialProfile.age) : "",
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

    setIsSaving(true);
    try {
      const normalizedAge = values.age.trim();
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName: optimisticDisplayName,
          fullName: toNullableProfileValue(values.fullName),
          school: toNullableProfileValue(values.school),
          location: toNullableProfileValue(values.location),
          age: normalizedAge === "" ? null : Number(normalizedAge),
        }),
      });

      const payload = (await response.json()) as ProfileApiResponse;
      if (!response.ok) {
        if (payload.field) {
          form.setError(payload.field, {
            type: "server",
            message: payload.message ?? "Could not save this field.",
          });
        } else {
          setSubmitError(payload.message ?? "Could not save profile. Please try again.");
        }

        setDisplayNamePreview(previousDisplayName);
        return;
      }

      if (payload.profile?.displayName) {
        setDisplayNamePreview(payload.profile.displayName);
      }
      if (payload.profile?.avatarUrl !== undefined) {
        setAvatarUrl(payload.profile.avatarUrl);
      }

      setSaveSuccess("Profile saved.");
    } catch {
      setDisplayNamePreview(previousDisplayName);
      setSubmitError("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAvatarChange(file: File | null) {
    setAvatarError(null);
    setSaveSuccess(null);

    if (!file) {
      return;
    }

    if (!allowedAvatarMimeTypes.includes(file.type as (typeof allowedAvatarMimeTypes)[number])) {
      setAvatarError("Avatar must be a JPG or PNG image.");
      return;
    }

    if (file.size > maxAvatarSizeBytes) {
      setAvatarError("Avatar must be 2MB or smaller.");
      return;
    }

    const previousAvatarUrl = avatarUrl;
    const optimisticPreviewUrl = URL.createObjectURL(file);
    setAvatarUrl(optimisticPreviewUrl);
    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.set("file", file);

      const uploadResponse = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });
      const uploadPayload = (await uploadResponse.json()) as UploadApiResponse;

      if (!uploadResponse.ok || !uploadPayload.url) {
        setAvatarUrl(previousAvatarUrl);
        setAvatarError(uploadPayload.message ?? "Avatar upload failed.");
        return;
      }

      const profileResponse = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName: form.getValues("displayName"),
          fullName: toNullableProfileValue(form.getValues("fullName")),
          school: toNullableProfileValue(form.getValues("school")),
          location: toNullableProfileValue(form.getValues("location")),
          age:
            form.getValues("age").trim() === ""
              ? null
              : Number(form.getValues("age").trim()),
          avatarUrl: uploadPayload.url,
        }),
      });

      const profilePayload = (await profileResponse.json()) as ProfileApiResponse;
      if (!profileResponse.ok) {
        setAvatarUrl(previousAvatarUrl);
        setAvatarError(profilePayload.message ?? "Could not save avatar URL.");
        return;
      }

      setAvatarUrl(uploadPayload.url);
      setSaveSuccess("Profile saved.");
    } catch {
      setAvatarUrl(previousAvatarUrl);
      setAvatarError("Network error. Please try again.");
    } finally {
      URL.revokeObjectURL(optimisticPreviewUrl);
      setIsUploadingAvatar(false);
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
          <Label htmlFor="avatar" className="text-sm">
            Avatar (JPG/PNG, up to 2MB)
          </Label>
          <Input
            id="avatar"
            type="file"
            accept="image/jpeg,image/png"
            onChange={(event) => {
              const selected = event.target.files?.[0] ?? null;
              void handleAvatarChange(selected);
              event.currentTarget.value = "";
            }}
            disabled={isUploadingAvatar || isSaving}
          />
          {avatarError ? <p className="text-xs text-destructive">{avatarError}</p> : null}
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
            min={5}
            max={120}
            {...form.register("age")}
            aria-invalid={form.formState.errors.age ? "true" : "false"}
          />
          {form.formState.errors.age ? (
            <p className="text-xs text-destructive">{form.formState.errors.age.message}</p>
          ) : null}
        </div>

        {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSaving || isUploadingAvatar}>
            {isSaving ? "Saving..." : "Save profile"}
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
