import { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api/proxy";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await params;
  return proxyToApi(request, `/groups/${groupId}`);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await params;
  return proxyToApi(request, `/groups/${groupId}`);
}
