import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginPage from "./page";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

describe("LoginPage", () => {
  it("redirects authenticated users to /dashboard", async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
    });

    await LoginPage();

    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("renders login UI for unauthenticated users", async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    });

    const page = await LoginPage();

    expect(page).toBeTruthy();
  });
});
