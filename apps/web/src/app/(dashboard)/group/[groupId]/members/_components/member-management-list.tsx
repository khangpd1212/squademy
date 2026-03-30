"use client";

import { useEffect, useMemo, useState } from "react";
import { GROUP_ROLES, type MemberRole } from "@squademy/shared";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useRemoveMember,
  useUpdateMemberRole,
} from "@/hooks/api/use-member-queries";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Member = {
  user_id: string;
  role: string;
  joined_at: string;
  profiles: { display_name: string; avatar_url: string | null } | null;
};

type MemberManagementListProps = {
  members: Member[];
  currentUserId: string;
  isAdmin: boolean;
  groupId: string;
};

export function MemberManagementList({
  members: initialMembers,
  currentUserId,
  isAdmin,
  groupId,
}: MemberManagementListProps) {
  const [members, setMembers] = useState(initialMembers);
  const [errorsByUser, setErrorsByUser] = useState<Record<string, string>>({});
  const [updatingRoleFor, setUpdatingRoleFor] = useState<string | null>(null);
  const [roleChangeDialog, setRoleChangeDialog] = useState<{
    userId: string;
    displayName: string;
    newRole: MemberRole;
  } | null>(null);
  const [pendingRoleSelect, setPendingRoleSelect] = useState<
    Record<string, MemberRole>
  >({});

  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [removeDialogUserId, setRemoveDialogUserId] = useState<string | null>(null);
  const updateMemberRoleMutation = useUpdateMemberRole(groupId);
  const removeMemberMutation = useRemoveMember(groupId);

  const removeTarget = useMemo(
    () => members.find((member) => member.user_id === removeDialogUserId) ?? null,
    [members, removeDialogUserId],
  );

  const roleChangeTarget = useMemo(
    () =>
      members.find((member) => member.user_id === roleChangeDialog?.userId) ??
      null,
    [members, roleChangeDialog?.userId],
  );

  const roleOptions: MemberRole[] = Object.values(GROUP_ROLES) as MemberRole[];

  useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);

  async function handleRoleChange(userId: string, role: MemberRole) {
    setPendingRoleSelect((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
    setErrorsByUser((prev) => ({ ...prev, [userId]: "" }));

    const previousMembers = members;
    setUpdatingRoleFor(userId);
    setMembers((prev) =>
      prev.map((member) => (member.user_id === userId ? { ...member, role } : member))
    );

    try {
      await updateMemberRoleMutation.mutateAsync({ userId, role });
    } catch (err) {
      setMembers(previousMembers);
      setErrorsByUser((prev) => ({
        ...prev,
        [userId]: err instanceof Error ? err.message : "Network error. Please try again.",
      }));
    } finally {
      setUpdatingRoleFor(null);
    }
  }

  async function handleConfirmRoleChange() {
    if (!roleChangeDialog) return;
    const { userId, newRole } = roleChangeDialog;
    setRoleChangeDialog(null);
    await handleRoleChange(userId, newRole);
  }

  async function handleConfirmRemove() {
    if (!removeDialogUserId) return;

    const userId = removeDialogUserId;
    setErrorsByUser((prev) => ({ ...prev, [userId]: "" }));

    const previousMembers = members;
    setRemovingUserId(userId);
    setMembers((prev) => prev.filter((member) => member.user_id !== userId));

    try {
      await removeMemberMutation.mutateAsync(userId);
    } catch (err) {
      setMembers(previousMembers);
      setErrorsByUser((prev) => ({
        ...prev,
        [userId]: err instanceof Error ? err.message : "Network error. Please try again.",
      }));
    } finally {
      setRemoveDialogUserId(null);
      setRemovingUserId(null);
    }
  }

  return (
    <>
      <ul className="divide-y">
        {members.map((member) => {
          const profile = member.profiles;
          const displayName = profile?.display_name ?? "Unknown";
          const initials = displayName.slice(0, 2).toUpperCase();
          const memberRole =
            pendingRoleSelect[member.user_id] ??
            ((member.role as MemberRole) ?? GROUP_ROLES.MEMBER);
          const isCurrentUser = member.user_id === currentUserId;
          const isPending =
            updatingRoleFor === member.user_id || removingUserId === member.user_id;
          const rowError = errorsByUser[member.user_id];

          return (
            <li key={member.user_id} className="py-3">
              <div className="flex items-center gap-3">
                <Avatar>
                  {profile?.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt={displayName} />
                  ) : null}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {displayName}
                    {isCurrentUser ? " (You)" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Joined {new Date(member.joined_at).toLocaleDateString()}
                  </p>
                </div>

                {isAdmin ? (
                  <div className="flex items-center gap-2">
                    <label className="sr-only" htmlFor={`role-${member.user_id}`}>
                      Role for {displayName}
                    </label>
                    <select
                      id={`role-${member.user_id}`}
                      aria-label={`Role for ${displayName}`}
                      className="rounded-md border bg-background px-2 py-1 text-sm capitalize"
                      value={memberRole}
                      disabled={isPending}
                      onChange={(event) => {
                        const nextRole = event.target.value as MemberRole;
                        setPendingRoleSelect((prev) => ({
                          ...prev,
                          [member.user_id]: nextRole,
                        }));
                        setRoleChangeDialog({
                          userId: member.user_id,
                          displayName,
                          newRole: nextRole,
                        });
                      }}
                    >
                      {roleOptions.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-label={`Remove ${displayName}`}
                      disabled={isPending}
                      onClick={() => setRemoveDialogUserId(member.user_id)}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <Badge variant="outline" className="capitalize">
                    {member.role}
                  </Badge>
                )}
              </div>

              {rowError ? (
                <p className="mt-2 text-xs text-destructive">{rowError}</p>
              ) : null}
            </li>
          );
        })}
      </ul>

      <Dialog
        open={Boolean(roleChangeDialog)}
        onOpenChange={(open) => {
          if (!open && roleChangeDialog) {
            setPendingRoleSelect((prev) => {
              const next = { ...prev };
              delete next[roleChangeDialog.userId];
              return next;
            });
            setRoleChangeDialog(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change role?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {roleChangeDialog && roleChangeTarget
              ? `Set ${roleChangeTarget.profiles?.display_name ?? roleChangeDialog.displayName} to ${roleChangeDialog.newRole}.`
              : "Apply this role change?"}
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={Boolean(
                roleChangeDialog &&
                  updatingRoleFor === roleChangeDialog.userId,
              )}
              onClick={() => {
                if (roleChangeDialog) {
                  setPendingRoleSelect((prev) => {
                    const next = { ...prev };
                    delete next[roleChangeDialog.userId];
                    return next;
                  });
                }
                setRoleChangeDialog(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={Boolean(
                roleChangeDialog &&
                  updatingRoleFor === roleChangeDialog.userId,
              )}
              onClick={() => void handleConfirmRoleChange()}
            >
              Confirm change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(removeDialogUserId)}
        onOpenChange={(open) => {
          if (!open) setRemoveDialogUserId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove member?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {removeTarget
              ? `This will remove ${removeTarget.profiles?.display_name ?? "this member"} from the group.`
              : "This will remove the selected member from the group."}
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={Boolean(removingUserId)}
              onClick={() => setRemoveDialogUserId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={Boolean(removingUserId)}
              onClick={handleConfirmRemove}
            >
              Confirm Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
