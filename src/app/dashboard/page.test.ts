import { redirect } from "next/navigation";
import DashboardPage from "./page";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

describe("DashboardPage", () => {
  it("redirects to /review", () => {
    DashboardPage();

    expect(redirect).toHaveBeenCalledWith("/review");
  });
});
