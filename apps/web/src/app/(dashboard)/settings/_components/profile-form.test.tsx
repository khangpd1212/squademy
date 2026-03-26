import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileForm } from "./profile-form";
import { renderWithQueryClient } from "@/test-utils/render-with-query-client";

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

describe("ProfileForm", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("blocks save with inline validation when display name is empty", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(
      <ProfileForm
        initialProfile={{
          displayName: "Tina",
          avatarUrl: null,
          fullName: null,
          school: null,
          location: null,
          age: null,
        }}
      />
    );

    const displayNameInput = screen.getByLabelText("Display name");
    await user.clear(displayNameInput);
    await user.click(screen.getByRole("button", { name: "Save profile" }));

    expect(await screen.findByText("Display name is required.")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows avatar size validation error and blocks upload", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(
      <ProfileForm
        initialProfile={{
          displayName: "Tina",
          avatarUrl: null,
          fullName: null,
          school: null,
          location: null,
          age: null,
        }}
      />
    );

    const oversized = new File([new Uint8Array(2 * 1024 * 1024 + 1)], "big.png", {
      type: "image/png",
    });

    await user.upload(screen.getByLabelText("Avatar (JPG/PNG, up to 2MB)"), oversized);

    expect(await screen.findByText("Avatar must be 2MB or smaller.")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("optimistically updates preview name and shows inline success", async () => {
    const user = userEvent.setup();
    const deferred = createDeferred<Response>();
    (global.fetch as jest.Mock).mockReturnValue(deferred.promise);

    renderWithQueryClient(
      <ProfileForm
        initialProfile={{
          displayName: "Tina",
          avatarUrl: null,
          fullName: null,
          school: null,
          location: null,
          age: null,
        }}
      />
    );

    const displayNameInput = screen.getByLabelText("Display name");
    await user.clear(displayNameInput);
    await user.type(displayNameInput, "Tina Updated");
    await user.click(screen.getByRole("button", { name: "Save profile" }));

    expect(screen.getByTestId("profile-preview-name")).toHaveTextContent("Tina Updated");

    deferred.resolve({
      ok: true,
      json: async () => ({
        ok: true,
        profile: {
          displayName: "Tina Updated",
          avatarUrl: null,
          fullName: null,
          school: null,
          location: null,
          age: null,
        },
      }),
    } as Response);

    await waitFor(() => expect(screen.getByText("Profile saved.")).toBeInTheDocument());
  });
});
