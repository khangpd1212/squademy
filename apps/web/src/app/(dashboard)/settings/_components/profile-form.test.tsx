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
          avatarUrl: undefined,
          fullName: undefined,
          school: undefined,
          location: undefined,
          age: null,
          email: "tina@example.com",
        }}
      />
    );

    const displayNameInput = screen.getByLabelText("Display name");
    await user.clear(displayNameInput);
    await user.click(screen.getByRole("button", { name: "Save profile" }));

    expect(await screen.findByText("Display name is required.")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows avatar placeholder message when upload is not configured", () => {
    renderWithQueryClient(
      <ProfileForm
        initialProfile={{
          displayName: "Tina",
          avatarUrl: undefined,
          fullName: undefined,
          school: undefined,
          location: undefined,
          age: null,
          email: "tina@example.com",
        }}
      />
    );

    expect(
      screen.getByText("Paste avatar URL to update preview and submit value.")
    ).toBeInTheDocument();
  });

  it("optimistically updates preview name and shows inline success", async () => {
    const user = userEvent.setup();
    const deferred = createDeferred<Response>();
    (global.fetch as jest.Mock).mockReturnValue(deferred.promise);

    renderWithQueryClient(
      <ProfileForm
        initialProfile={{
          displayName: "Tina",
            avatarUrl: undefined,
          fullName: undefined,
          school: undefined,
          location: undefined,
          age: null,
          email: "tina@example.com",
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
          avatarUrl: undefined,
          fullName: undefined,
          school: undefined,
          location: undefined,
          age: null,
          email: "tina@example.com",
        },
      }),
    } as Response);

    await waitFor(() => expect(screen.getByText("Profile saved.")).toBeInTheDocument());
  });

  it("wires age as null into profile update payload when input is empty", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        profile: {
          displayName: "Tina",
          avatarUrl: undefined,
          fullName: undefined,
          school: undefined,
          location: null,
          age: null,
          email: "tina@example.com",
        },
      }),
    } as Response);

    renderWithQueryClient(
      <ProfileForm
        initialProfile={{
          displayName: "Tina",
          avatarUrl: undefined,
          fullName: undefined,
          school: undefined,
          location: undefined,
          age: 20,
          email: "tina@example.com",
        }}
      />
    );

    const ageInput = screen.getByLabelText("Age");
    await user.clear(ageInput);
    await user.click(screen.getByRole("button", { name: "Save profile" }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    const requestInit = (global.fetch as jest.Mock).mock.calls[0][1];
    const payload = JSON.parse(requestInit.body as string) as { age: number | null };

    expect(payload.age).toBeNull();
  });

});
