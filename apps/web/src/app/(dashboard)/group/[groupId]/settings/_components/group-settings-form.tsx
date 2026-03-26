"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateGroup } from "@/hooks/api/use-group-queries";
import {
  groupSettingsSchema,
  type GroupSettingsInput,
} from "@/app/api/groups/[groupId]/group-settings-schema";

type GroupSettingsFormProps = {
  groupId: string;
  initialValues: GroupSettingsInput;
  isAdmin: boolean;
};

const DAY_OPTIONS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function getScheduleText(values: GroupSettingsInput) {
  if (
    typeof values.exercise_deadline_day !== "number" ||
    !values.exercise_deadline_time
  ) {
    return "No schedule";
  }

  return `Every ${DAY_OPTIONS[values.exercise_deadline_day]} at ${values.exercise_deadline_time}`;
}

export function GroupSettingsForm({
  groupId,
  initialValues,
  isAdmin,
}: GroupSettingsFormProps) {
  const router = useRouter();
  const updateGroupMutation = useUpdateGroup(groupId);
  const form = useForm<GroupSettingsInput>({
    resolver: zodResolver(groupSettingsSchema),
    defaultValues: initialValues,
  });

  const selectedDay = form.watch("exercise_deadline_day");
  const showTimeInput = typeof selectedDay === "number";
  const readOnlySchedule = useMemo(() => getScheduleText(initialValues), [initialValues]);

  async function onSubmit(values: GroupSettingsInput) {
    form.clearErrors("root");

    const payload: GroupSettingsInput = {
      name: values.name,
      description: values.description ?? "",
      exercise_deadline_day:
        typeof values.exercise_deadline_day === "number" ? values.exercise_deadline_day : null,
      exercise_deadline_time:
        typeof values.exercise_deadline_day === "number"
          ? values.exercise_deadline_time || null
          : null,
    };

    try {
      await updateGroupMutation.mutateAsync(payload);
      toast.success("Settings saved.");
      router.refresh();
    } catch (error) {
      const typedError = error as Error & {
        field?: "name" | "description" | "exercise_deadline_day" | "exercise_deadline_time";
      };
      if (typedError.field === "name") {
          form.setError("name", {
            type: "server",
            message: typedError.message ?? "Could not save group name.",
          });
        return;
      }
      form.setError("root", {
        type: "server",
        message: typedError.message ?? "Network error. Please try again.",
      });
    }
  }

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Group name</p>
          <p className="font-medium">{initialValues.name}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Description</p>
          <p>{initialValues.description || "No description"}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Weekly exercise deadline</p>
          <p>{readOnlySchedule}</p>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <div className="space-y-2">
        <Label htmlFor="name">Group name</Label>
        <Input
          id="name"
          {...form.register("name")}
          aria-invalid={form.formState.errors.name ? "true" : "false"}
        />
        {form.formState.errors.name ? (
          <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...form.register("description")}
          aria-invalid={form.formState.errors.description ? "true" : "false"}
        />
        {form.formState.errors.description ? (
          <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label id="exercise_deadline_day_label">Weekly exercise deadline day</Label>
        <Select
          value={typeof selectedDay === "number" ? String(selectedDay) : null}
          onValueChange={(val) => {
            const day = !val || val === "clear" ? null : Number(val);
            form.setValue("exercise_deadline_day", day, { shouldValidate: true });
            if (day === null) {
              form.setValue("exercise_deadline_time", null, { shouldValidate: true });
            }
          }}
        >
          <SelectTrigger
            aria-labelledby="exercise_deadline_day_label"
            className="w-full"
          >
            <SelectValue placeholder="No schedule" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="clear">No schedule</SelectItem>
            {DAY_OPTIONS.map((day, index) => (
              <SelectItem key={day} value={String(index)}>
                {day}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showTimeInput ? (
        <div className="space-y-2">
          <Label htmlFor="exercise_deadline_time">Weekly exercise deadline time</Label>
          <Input
            id="exercise_deadline_time"
            type="time"
            {...form.register("exercise_deadline_time")}
            aria-invalid={form.formState.errors.exercise_deadline_time ? "true" : "false"}
          />
          {form.formState.errors.exercise_deadline_time ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.exercise_deadline_time.message}
            </p>
          ) : null}
        </div>
      ) : null}

      {form.formState.errors.root ? (
        <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
      ) : null}

      <Button type="submit" disabled={form.formState.isSubmitting || updateGroupMutation.isPending}>
        {form.formState.isSubmitting || updateGroupMutation.isPending ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
