import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type NumberInputProps = {
  value: number | null;
  onChange: (value: number | null) => void;
  onBlur?: () => void;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  allowEmpty?: boolean;
  parser?: (input: string) => number | null;
  formatter?: (
    value: number | null,
    info: { userTyping: boolean; input: string }
  ) => string;
  changeOnBlur?: boolean;
  changeOnWheel?: boolean;
  keyboard?: boolean;
  status?: "error" | "warning";
  disabled?: boolean;
  readOnly?: boolean;
  id?: string;
  name?: string;
  placeholder?: string;
  inputMode?: "numeric" | "decimal";
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
  className?: string;
};

function isIntermediateNumericInput(raw: string) {
  return raw === "-" || raw === "." || raw === "-." || /^-?\d+\.$/.test(raw);
}

function defaultParser(input: string): number | null {
  if (input.trim() === "") {
    return null;
  }
  const parsed = Number(input);
  return Number.isFinite(parsed) ? parsed : null;
}

function applyPrecision(value: number, precision?: number): number {
  if (precision === undefined) {
    return value;
  }
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function clamp(value: number, min?: number, max?: number): number {
  if (min !== undefined && value < min) {
    return min;
  }
  if (max !== undefined && value > max) {
    return max;
  }
  return value;
}

function formatValue(
  value: number | null,
  formatter: NumberInputProps["formatter"],
  userTyping: boolean,
  input: string
) {
  if (formatter) {
    return formatter(value, { userTyping, input });
  }
  return value === null ? "" : String(value);
}

export function NumberInput({
  value,
  onChange,
  onBlur,
  min,
  max,
  step = 1,
  precision,
  allowEmpty = true,
  parser,
  formatter,
  changeOnBlur = true,
  changeOnWheel = false,
  keyboard = true,
  status,
  disabled,
  readOnly,
  id,
  name,
  placeholder,
  inputMode = "decimal",
  ariaInvalid,
  ariaDescribedBy,
  className,
}: NumberInputProps) {
  const [displayValue, setDisplayValue] = useState(() =>
    formatValue(value, formatter, false, "")
  );
  const [isUserTyping, setIsUserTyping] = useState(false);
  const parse = useMemo(() => parser ?? defaultParser, [parser]);
  const resolvedValue = isUserTyping
    ? displayValue
    : formatValue(value, formatter, false, displayValue);

  function emitNormalizedFromRaw(raw: string) {
    const parsed = parse(raw);
    if (parsed === null) {
      return allowEmpty ? null : value;
    }
    const rounded = applyPrecision(parsed, precision);
    return clamp(rounded, min, max);
  }

  return (
    <Input
      id={id}
      name={name}
      type="text"
      value={resolvedValue}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      inputMode={inputMode}
      aria-invalid={ariaInvalid ? "true" : "false"}
      aria-describedby={ariaDescribedBy}
      className={cn(
        status === "warning"
          ? "border-amber-500 focus-visible:border-amber-500 focus-visible:ring-amber-500/40"
          : "",
        className
      )}
      onChange={(event) => {
        const raw = event.currentTarget.value;
        setDisplayValue(raw);
        setIsUserTyping(true);

        if (raw === "") {
          if (allowEmpty) {
            onChange(null);
          }
          return;
        }

        if (isIntermediateNumericInput(raw)) {
          return;
        }

        const parsed = parse(raw);
        if (parsed === null) {
          return;
        }

        onChange(parsed);
      }}
      onBlur={() => {
        setIsUserTyping(false);
        if (changeOnBlur) {
          const normalized = emitNormalizedFromRaw(displayValue);
          if (normalized !== undefined) {
            onChange(normalized);
            setDisplayValue(formatValue(normalized, formatter, false, displayValue));
          }
        }
        onBlur?.();
      }}
      onWheel={(event) => {
        if (!changeOnWheel) {
          event.preventDefault();
        }
      }}
      onKeyDown={(event) => {
        if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
          return;
        }

        if (!keyboard) {
          event.preventDefault();
          return;
        }

        const direction = event.key === "ArrowUp" ? 1 : -1;
        const current = emitNormalizedFromRaw(displayValue);
        const baseline = current ?? 0;
        const next = clamp(applyPrecision(baseline + direction * step, precision), min, max);

        onChange(next);
        setDisplayValue(formatValue(next, formatter, false, displayValue));
        setIsUserTyping(false);
        event.preventDefault();
      }}
    />
  );
}

export type { NumberInputProps };
