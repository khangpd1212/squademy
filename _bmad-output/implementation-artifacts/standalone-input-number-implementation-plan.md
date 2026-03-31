# Quick Tech Spec: Standalone InputNumber for Profile Age (No Story/Epic/Sprint Binding)

> Decision: This is a standalone implementation plan and is intentionally not linked to any BMAD story, epic, sprint, or sprint status.

## 1) Objective

Build an internal `InputNumber` solution for the profile `age` field that prevents string/number mismatch, guarantees `number | null` flow with React Hook Form + Zod v4, and provides clear UX for min/max/empty-value handling.

## 2) Scope

### In scope

- Create `NumberInput` UI component.
- Create `RHFInputNumber` adapter via `Controller`.
- Replace current `age` field in profile form.
- Add tests for numeric parsing, normalization, and integration with RHF.
- Keep prop naming close to Ant Design InputNumber patterns.

### Out of scope

- No external dependency addition in v1 (e.g. `rc-input-number`).
- No advanced spinner controls customization.
- No high precision string mode or BigInt support.
- No full-locale number formatting beyond current requirements.

## 3) Assumptions and constraints

- Stack: Next.js 16, React 19, React Hook Form v7, Zod v4, shadcn/base-ui.
- Source of truth for schema is `packages/shared/src/schemas/profile.ts`:
  - `age: z.number().min(...).max(...).nullable()`
- Existing field currently uses native `type="number"` with `register`, which can emit intermediate invalid string states.
- Implementation must remain backward-safe for the rest of `profile-form`.

## 4) API contract

### 4.1 NumberInput props

```ts
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
};
```

### 4.2 RHFInputNumber props

```ts
type RHFInputNumberProps<TFieldValues extends FieldValues> = {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  allowEmpty?: boolean;
  parser?: NumberInputProps["parser"];
  formatter?: NumberInputProps["formatter"];
  changeOnBlur?: boolean;
  changeOnWheel?: boolean;
  keyboard?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  id?: string;
  placeholder?: string;
  inputMode?: "numeric" | "decimal";
};
```

## 5) Data handling rules

- Empty string maps to `null` when `allowEmpty=true`.
- `onChange` contract must emit only `number | null`.
- Intermediate typing states (`"-"`, `"."`, `"1."`) are allowed in display state and should not crash nor emit invalid number payload.
- `NaN`, `Infinity`, `-Infinity` are invalid and must not be emitted.
- On blur with `changeOnBlur=true`:
  - Parse -> clamp (`min/max`) -> round (`precision`) -> emit normalized value.
- Prop updates to `min/max` should not auto-trigger user `onChange`.

## 6) UX and accessibility rules

- Default `changeOnWheel=false` to avoid accidental value changes on page scroll.
- `keyboard=true` supports `ArrowUp/ArrowDown` with `step`.
- For age, use `inputMode="numeric"` for mobile keypad optimization.
- Error state comes from RHF field state and maps to:
  - visual `status="error"`
  - `aria-invalid=true`
  - `aria-describedby` linked to error message element.
- Keep typing smooth without forced jump during intermediate input states.

## 7) File plan

### Add

- `apps/web/src/components/ui/number-input.tsx`
- `apps/web/src/components/form/rhf-input-number.tsx`
- `apps/web/src/components/ui/__tests__/number-input.test.tsx`
- `apps/web/src/components/form/__tests__/rhf-input-number.test.tsx`

### Update

- `apps/web/src/app/(dashboard)/settings/_components/profile-form.tsx`

## 8) Test plan

### Unit tests

- `"" -> null`
- `"12" -> 12`
- `"-"`, `"."`, `"1."` are handled as intermediate states
- `NaN` is not emitted
- Clamp behavior with min/max
- Precision rounding behavior
- Wheel does not change value when disabled
- Keyboard arrows update by step

### Integration tests

- RHF submit payload includes `age` as `number | null`
- Zod schema compatibility is preserved
- Error state is displayed and accessible attributes are present
- Blur normalization works through `Controller` wiring

### Manual checks

- Desktop typing + blur + arrows + wheel
- Mobile keypad behavior for numeric entry
- No regressions on other profile fields

## 9) Risks and mitigation

- Risk: UI state diverges from form state during typing.
  - Mitigation: separate display string state from committed numeric state.
- Risk: regression in profile submit payload.
  - Mitigation: RHF integration tests + payload assertion.
- Risk: over-scoping v1 with complex number UX.
  - Mitigation: keep v1 minimal and defer advanced features.

## 10) Rollout plan

1. Implement `NumberInput` core behavior.
2. Implement `RHFInputNumber` adapter.
3. Replace `age` field usage in profile form.
4. Add tests (unit + integration).
5. Run lint/tests and perform manual QA.

## 11) Definition of done

- `age` value is always `number | null` at submit boundary.
- Edge cases (`"-"`, `"."`, `"1."`, `NaN`, wheel, arrows) are covered and pass tests.
- Accessibility attributes are correct in error state.
- No external dependency added.
- Spec remains standalone and non-story-linked.

## 12) Acceptance criteria

- AC1: Submitting empty age sends `null`.
- AC2: Submitting valid age sends number within schema bounds.
- AC3: Out-of-range values are normalized by blur behavior when enabled.
- AC4: Invalid numeric intermediates do not crash and do not leak invalid payload.
- AC5: Error state displays field message and marks input invalid for assistive tech.
- AC6: Existing non-age profile fields behave unchanged.

