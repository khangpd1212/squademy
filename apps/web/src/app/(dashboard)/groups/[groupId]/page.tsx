import { GroupOverview } from "./_components/group-overview";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;

  return <GroupOverview groupId={groupId} />;
}
