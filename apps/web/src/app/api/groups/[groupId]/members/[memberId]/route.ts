import { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/api/proxy";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string; memberId: string }> },
) {
  const { groupId, memberId } = await params;
  return proxyToApi(request, `/groups/${groupId}/members/${memberId}`);
}
