import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NumberInput } from "../number-input";

describe("NumberInput", () => {
  it("emits null when input is cleared", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    render(<NumberInput value={12} onChange={handleChange} />);

    const input = screen.getByRole("textbox");
    await user.clear(input);

    expect(handleChange).toHaveBeenLastCalledWith(null);
  });

  it("does not emit an extra value for intermediate trailing dot", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    render(<NumberInput value={null} onChange={handleChange} />);

    const input = screen.getByRole("textbox");
    await user.type(input, "1.");

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenLastCalledWith(1);
  });

  it("updates by step when pressing arrow keys", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    render(<NumberInput value={10} onChange={handleChange} step={2} />);

    const input = screen.getByRole("textbox");
    await user.click(input);
    await user.keyboard("{ArrowUp}");

    expect(handleChange).toHaveBeenLastCalledWith(12);
  });
});
