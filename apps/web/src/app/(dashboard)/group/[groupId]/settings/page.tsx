import { GroupSettingsView } from "./_components/group-settings-view";

export default async function GroupSettingsPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;

  return <GroupSettingsView groupId={groupId} />;
}
