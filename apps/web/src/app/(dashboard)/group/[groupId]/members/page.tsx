import { GroupMembersView } from "./_components/group-members-view";

export default async function GroupMembersPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;

  return <GroupMembersView groupId={groupId} />;
}
