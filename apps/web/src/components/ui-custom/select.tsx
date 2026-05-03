"use client";

import * as React from "react";
import {
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectValue,
  BaseSelect,
} from "@/components/ui/select";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface CustomSelectProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string | undefined) => void;
  placeholder?: string;
  options: SelectOption[];
  className?: string;
  disabled?: boolean;
  name?: string;
  required?: boolean;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}

export const CustomSelect = React.forwardRef<HTMLButtonElement, CustomSelectProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      placeholder = "Select...",
      options,
      className,
      disabled,
      name,
      required,
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": ariaDescribedBy,
    },
    ref,
  ) => {
    const currentValue = value ?? defaultValue;
    const selectedOption = options.find((opt) => opt.value === currentValue);
    const displayText = selectedOption?.label ?? placeholder;

    const handleValueChange = (val: string | null) => {
      onChange?.(val ?? undefined);
    };

    return (
      <BaseSelect
        value={currentValue}
        defaultValue={defaultValue}
        onValueChange={handleValueChange}
        disabled={disabled}
        name={name}
        required={required}
      >
        <SelectTrigger
          ref={ref}
          className={className}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
        >
          <SelectValue placeholder={placeholder}>{displayText}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </BaseSelect>
    );
  },
);

CustomSelect.displayName = "CustomSelect";