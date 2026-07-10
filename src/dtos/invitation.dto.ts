import { Invitation } from '../entities/Invitation';

export interface InvitationDto {
  id: number;
  email: string;
  role: { id: number; name: string };
  invited_by: { id: number; name: string };
  is_expired: boolean;
  expires_at: Date;
  created_at: Date;
}

export interface GetInvitationsResponseDto {
  invitations: InvitationDto[];
}

export function toInvitationDto(inv: Invitation): InvitationDto {
  return {
    id: inv.id,
    email: inv.email,
    role: { id: inv.role.id, name: inv.role.name },
    invited_by: { id: inv.invited_by.id, name: inv.invited_by.name },
    is_expired: inv.expires_at < new Date(),
    expires_at: inv.expires_at,
    created_at: inv.created_at
  };
}
