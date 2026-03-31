import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InviteLinkSection } from "./invite-link-section";
import { renderWithQueryClient } from "@/test-utils/render-with-query-client";

jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const writeTextMock = jest.fn().mockResolvedValue(undefined);

describe("InviteLinkSection", () => {
  beforeEach(() => {
    writeTextMock.mockClear();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });
    global.fetch = jest.fn();
  });

  it("renders invite URL", () => {
    renderWithQueryClient(<InviteLinkSection inviteCode="abc123" groupId="g1" />);
    expect(screen.getByText(/\/join\/abc123/)).toBeInTheDocument();
  });

  it("copies link to clipboard and shows success message", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<InviteLinkSection inviteCode="abc123" groupId="g1" />);

    await user.click(screen.getByRole("button", { name: "Copy Invite Link" }));

    await waitFor(() => {
      expect(screen.getByText("Link copied!")).toBeInTheDocument();
    });
  });

  it("revoke opens dialog and calls API", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, inviteCode: "newcode999" }),
    });

    renderWithQueryClient(<InviteLinkSection inviteCode="abc123" groupId="g1" />);

    await user.click(screen.getByRole("button", { name: "Revoke Invite Link" }));
    expect(screen.getByTestId("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Revoke" }));

    await waitFor(() =>
      expect(screen.getByText(/\/join\/newcode999/)).toBeInTheDocument()
    );
  });
});
