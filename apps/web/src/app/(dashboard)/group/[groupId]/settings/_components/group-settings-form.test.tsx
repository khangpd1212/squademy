import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GroupSettingsForm } from "./group-settings-form";
import { renderWithQueryClient } from "@/test-utils/render-with-query-client";

const refreshMock = jest.fn();
const toastSuccessMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: (...args: unknown[]) => refreshMock(...args),
  }),
}));

jest.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
  },
}));

function getInitialValues() {
  return {
    name: "IELTS Warriors",
    description: "Practice together",
    exercise_deadline_day: null,
    exercise_deadline_time: null,
  };
}

describe("GroupSettingsForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it("renders pre-populated name and description", () => {
    renderWithQueryClient(<GroupSettingsForm groupId="group-1" initialValues={getInitialValues()} isAdmin />);

    expect(screen.getByLabelText("Group name")).toHaveValue("IELTS Warriors");
    expect(screen.getByLabelText("Description")).toHaveValue("Practice together");
  });

  it('shows "No schedule" when exercise_deadline_day is null', () => {
    renderWithQueryClient(<GroupSettingsForm groupId="group-1" initialValues={getInitialValues()} isAdmin />);

    const trigger = screen.getByLabelText("Weekly exercise deadline day");
    expect(trigger).toHaveTextContent("No schedule");
  });

  it("shows time input when deadline day is selected", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<GroupSettingsForm groupId="group-1" initialValues={getInitialValues()} isAdmin />);

    expect(
      screen.queryByLabelText("Weekly exercise deadline time")
    ).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("Weekly exercise deadline day"));
    await user.click(await screen.findByText("Monday"));

    expect(screen.getByLabelText("Weekly exercise deadline time")).toBeInTheDocument();
  });

  it("shows inline error for empty name on submit", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<GroupSettingsForm groupId="group-1" initialValues={getInitialValues()} isAdmin />);

    await user.clear(screen.getByLabelText("Group name"));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Group name is required.")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("disables save button and shows loading text during submit", async () => {
    const user = userEvent.setup();

    let resolveFetch: (value: Response) => void;
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    (global.fetch as jest.Mock).mockReturnValue(fetchPromise);

    renderWithQueryClient(<GroupSettingsForm groupId="group-1" initialValues={getInitialValues()} isAdmin />);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();

    resolveFetch!({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);

    await waitFor(() => expect(refreshMock).toHaveBeenCalled());
  });

  it("triggers success toast on successful save", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    renderWithQueryClient(<GroupSettingsForm groupId="group-1" initialValues={getInitialValues()} isAdmin />);

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalledWith("Settings saved."));
  });

  it("sets field error on name when API returns name error", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({
        message: "Group name is required.",
        field: "name",
      }),
    });

    renderWithQueryClient(<GroupSettingsForm groupId="group-1" initialValues={getInitialValues()} isAdmin />);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Group name is required.")).toBeInTheDocument();
  });

  it("shows root error when API returns non-field error", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({
        message: "Could not save settings.",
      }),
    });

    renderWithQueryClient(<GroupSettingsForm groupId="group-1" initialValues={getInitialValues()} isAdmin />);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Could not save settings.")).toBeInTheDocument();
  });

  it("shows network error when fetch throws", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network failure"));

    renderWithQueryClient(<GroupSettingsForm groupId="group-1" initialValues={getInitialValues()} isAdmin />);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("Network failure")
    ).toBeInTheDocument();
  });

  it("sends correct schedule payload when day and time are set", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    renderWithQueryClient(
      <GroupSettingsForm
        groupId="group-1"
        initialValues={{
          name: "IELTS Warriors",
          description: "Practice together",
          exercise_deadline_day: 1,
          exercise_deadline_time: "14:30",
        }}
        isAdmin
      />
    );

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.exercise_deadline_day).toBe(1);
      expect(body.exercise_deadline_time).toBe("14:30");
    });
  });

  it("renders read-only content for non-admin", () => {
    renderWithQueryClient(
      <GroupSettingsForm groupId="group-1" initialValues={getInitialValues()} isAdmin={false} />
    );

    expect(screen.queryByLabelText("Group name")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
    expect(screen.getByText("IELTS Warriors")).toBeInTheDocument();
    expect(screen.getByText("No schedule")).toBeInTheDocument();
  });
});
