import { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api/proxy";

export async function PATCH(request: NextRequest) {
  return proxyToApi(request, "/users/me");
}
