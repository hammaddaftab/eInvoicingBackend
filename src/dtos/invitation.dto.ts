export interface InvitationDto {
  id: number;
  email: string;
  role_id: number;
  invited_by: number;
  expires_at: Date;
  accepted_at?: Date;
  created_at: Date;
}
