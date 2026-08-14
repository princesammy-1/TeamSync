export const ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  MEMBER: "member",
  GUEST: "guest",
};

export const ROLE_LABELS = {
  [ROLES.OWNER]: "Owner",
  [ROLES.ADMIN]: "Admin",
  [ROLES.MEMBER]: "Member",
  [ROLES.GUEST]: "Guest",
};

export const ROLE_DESCRIPTIONS = {
  [ROLES.OWNER]: "Full control over the workspace, billing, and deletion.",
  [ROLES.ADMIN]: "Manages members, teams, and workspace settings.",
  [ROLES.MEMBER]: "Creates and edits content across the workspace.",
  [ROLES.GUEST]: "Read-only access to a limited set of teams and files.",
};

/**
 * Permission matrix. Higher roles implicitly inherit permissions of
 * lower roles via ROLE_RANK. `can(role, "permission")` is the single
 * source of truth for UI gating across the app.
 */
export const ROLE_RANK = {
  [ROLES.OWNER]: 4,
  [ROLES.ADMIN]: 3,
  [ROLES.MEMBER]: 2,
  [ROLES.GUEST]: 1,
};

const REQUIRED_RANK = {
  inviteMembers: 3,
  manageMembers: 3,
  manageWorkspace: 3,
  createTeam: 3,
  deleteTeam: 4,
  editRoles: 3,
  deleteAnyContent: 3,
  createContent: 2,
  editOwnContent: 2,
  viewAuditLog: 3,
  manageBilling: 4,
};

export function can(role, permission) {
  const required = REQUIRED_RANK[permission];
  if (required === undefined) return true;
  return ROLE_RANK[role] >= required;
}
