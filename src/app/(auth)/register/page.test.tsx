import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RegisterPage from "./page";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

describe("RegisterPage", () => {
  it("redirects authenticated users to /dashboard", async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
    });

    await RegisterPage();

    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("renders register UI for unauthenticated users", async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    });

    const page = await RegisterPage();

    expect(page).toBeTruthy();
  });
});
