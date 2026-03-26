import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api/client";
import RegisterPage from "./page";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("@/lib/api/client", () => ({
  getCurrentUser: jest.fn(),
}));

describe("RegisterPage", () => {
  it("redirects authenticated users to /dashboard", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({
      userId: "user-1",
      email: "u@example.com",
    });

    await RegisterPage();

    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("renders register UI for unauthenticated users", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);

    const page = await RegisterPage();

    expect(page).toBeTruthy();
  });
});
