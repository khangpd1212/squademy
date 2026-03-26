import { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api/proxy";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await params;
  return proxyToApi(request, `/groups/${groupId}/invite-link`);
}

// Keep DELETE as alias for POST (frontend uses DELETE to "revoke" link)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await params;
  return proxyToApi(request, `/groups/${groupId}/invite-link`, { method: "POST" });
}
