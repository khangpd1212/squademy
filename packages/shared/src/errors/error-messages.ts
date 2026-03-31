import { ErrorCode } from "../constants";

export const ErrorMessage: Record<string, string> = {
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: "Invalid email or password.",
  [ErrorCode.AUTH_PRIVACY_NOT_ACCEPTED]: "You must accept the privacy policy.",
  [ErrorCode.AUTH_EMAIL_CONFLICT]: "An account with this email already exists.",
  [ErrorCode.AUTH_ACCESS_DENIED]: "Access denied.",
  [ErrorCode.AUTH_REFRESH_TOKEN_REQUIRED]: "Session expired. Please log in again.",
  [ErrorCode.GROUP_NOT_FOUND]: "Group not found.",
  [ErrorCode.GROUP_INVALID_INVITE_CODE]: "Invalid invite code.",
  [ErrorCode.GROUP_ALREADY_MEMBER]: "You are already a member of this group.",
  [ErrorCode.MEMBER_NOT_FOUND]: "Member not found.",
  [ErrorCode.MEMBER_ADMIN_REQUIRED]: "Admin access required.",
  [ErrorCode.MEMBER_SOLE_ADMIN_REMOVE]: "Cannot remove the sole admin. Transfer admin role first.",
  [ErrorCode.MEMBER_SOLE_ADMIN_DEMOTE]: "Cannot demote the sole admin. Promote another admin first.",
  [ErrorCode.INVITATION_ADMIN_ONLY]: "Only admins can send invitations.",
  [ErrorCode.INVITATION_ALREADY_MEMBER]: "User is already a member of this group.",
  [ErrorCode.INVITATION_ALREADY_PENDING]: "Invitation already pending for this user.",
  [ErrorCode.INVITATION_NOT_FOUND]: "Invitation not found.",
  [ErrorCode.INVITATION_NOT_OWNER]: "You can only respond to your own invitations.",
  [ErrorCode.INVITATION_ALREADY_RESPONDED]: "Invitation has already been responded to.",
  [ErrorCode.FORBIDDEN_NOT_MEMBER]: "You are not a member of this group.",
  [ErrorCode.FORBIDDEN_NOT_ADMIN]: "Admin access required.",
  [ErrorCode.FORBIDDEN_MISSING_CONTEXT]: "Missing context.",
  [ErrorCode.USER_NOT_FOUND]: "User not found.",
  [ErrorCode.GROUP_DELETE_FAILED]: "Failed to delete group. Please try again.",
};

export function getErrorMessage(code: string): string {
  return ErrorMessage[code] ?? "An unexpected error occurred.";
}
