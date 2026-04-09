import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AliveTextReveal } from "./alive-text-reveal";

jest.mock("@/lib/api/browser-client", () => ({
  apiRequest: jest.fn().mockResolvedValue({ ok: true }),
}));

describe("AliveTextReveal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders pulsing dots when not revealed", () => {
    render(
      <AliveTextReveal blockId="block-1" lessonId="lesson-1">
        Hidden content here
      </AliveTextReveal>,
    );

    expect(screen.getByRole("button", { name: /click to reveal/i })).toBeInTheDocument();
  });

  it("reveals content on click", async () => {
    const user = userEvent.setup();
    render(
      <AliveTextReveal blockId="block-1" lessonId="lesson-1">
        Hidden content here
      </AliveTextReveal>,
    );

    const dots = screen.getByRole("button", { name: /click to reveal/i });
    await user.click(dots);

    await waitFor(() => {
      expect(screen.getByText("Hidden content here")).toBeInTheDocument();
    });
  });

  it("calls API on reveal", async () => {
    const { apiRequest } = await import("@/lib/api/browser-client");
    const user = userEvent.setup();
    render(
      <AliveTextReveal blockId="block-1" lessonId="lesson-1">
        Hidden content here
      </AliveTextReveal>,
    );

    await user.click(screen.getByRole("button", { name: /click to reveal/i }));

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith("/lessons/lesson-1/interactions", {
        method: "POST",
        body: JSON.stringify({ blockId: "block-1", interactionType: "reveal" }),
      });
    });
  });

  it("does not call API if already revealed", async () => {
    const { apiRequest } = await import("@/lib/api/browser-client");
    const user = userEvent.setup();
    render(
      <AliveTextReveal blockId="block-1" lessonId="lesson-1">
        Hidden content here
      </AliveTextReveal>,
    );

    const dots = screen.getByRole("button", { name: /click to reveal/i });
    await user.click(dots);
    await user.click(dots);

    expect(apiRequest).toHaveBeenCalledTimes(1);
  });
});