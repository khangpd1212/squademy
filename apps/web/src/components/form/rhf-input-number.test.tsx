import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { renderWithQueryClient } from "@/test-utils/render-with-query-client";
import { RHFInputNumber } from "./rhf-input-number";

const schema = z.object({
  age: z.number().min(5).max(120).nullable(),
});

type FormValues = z.infer<typeof schema>;

function TestForm({ onSubmit }: { onSubmit: (values: FormValues) => void }) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { age: null },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <label htmlFor="age">Age</label>
      <RHFInputNumber<FormValues> id="age" name="age" control={form.control} min={5} max={120} />
      <button type="submit">Submit</button>
    </form>
  );
}

describe("RHFInputNumber", () => {
  it("submits null for empty value", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    renderWithQueryClient(<TestForm onSubmit={onSubmit} />);
    const input = screen.getByLabelText("Age");
    await user.clear(input);
    await user.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ age: null }, expect.anything()));
  });

  it("normalizes out-of-range value on blur", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    renderWithQueryClient(<TestForm onSubmit={onSubmit} />);
    const input = screen.getByLabelText("Age");
    await user.type(input, "999");
    await user.tab();
    await user.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ age: 120 }, expect.anything()));
  });
});
