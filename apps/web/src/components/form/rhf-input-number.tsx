import type { Control, FieldValues, Path } from "react-hook-form";
import { Controller } from "react-hook-form";
import { NumberInput, type NumberInputProps } from "@/components/ui/number-input";

type RHFInputNumberProps<TFieldValues extends FieldValues> = {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
} & Omit<NumberInputProps, "value" | "onChange" | "onBlur" | "name">;

export function RHFInputNumber<TFieldValues extends FieldValues>({
  name,
  control,
  ...numberInputProps
}: RHFInputNumberProps<TFieldValues>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <NumberInput
          {...numberInputProps}
          name={field.name}
          value={(field.value ?? null) as number | null}
          onChange={field.onChange}
          onBlur={field.onBlur}
          status={fieldState.error ? "error" : numberInputProps.status}
          ariaInvalid={Boolean(fieldState.error) || numberInputProps.ariaInvalid}
        />
      )}
    />
  );
}

export type { RHFInputNumberProps };
