import type { RoleChangeLog } from "../entities/RoleChangeLog";

/** Shape of a role-change audit entry sent to clients. */
export interface RoleChangeResponse {
  id: number;
  targetUserId: number | null;
  targetEmail: string;
  actorUserId: number | null;
  actorEmail: string;
  oldRole: RoleChangeLog["oldRole"];
  newRole: RoleChangeLog["newRole"];
  createdAt: Date;
}

export function toRoleChangeResponse(entry: RoleChangeLog): RoleChangeResponse {
  return {
    id: entry.id,
    targetUserId: entry.targetUserId,
    targetEmail: entry.targetEmail,
    actorUserId: entry.actorUserId,
    actorEmail: entry.actorEmail,
    oldRole: entry.oldRole,
    newRole: entry.newRole,
    createdAt: entry.createdAt,
  };
}
