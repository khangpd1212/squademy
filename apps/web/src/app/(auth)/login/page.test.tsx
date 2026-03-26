import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api/client";
import LoginPage from "./page";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("@/lib/api/client", () => ({
  getCurrentUser: jest.fn(),
}));

describe("LoginPage", () => {
  it("redirects authenticated users to /dashboard", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({
      userId: "user-1",
      email: "u@example.com",
    });

    await LoginPage();

    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("renders login UI for unauthenticated users", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);

    const page = await LoginPage();

    expect(page).toBeTruthy();
  });
});
