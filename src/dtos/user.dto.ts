import { User } from '../entities/User';

export interface UserDto {
  id: number;
  name: string;
  email: string;
  phone: string;
  is_phone_verified: boolean;
  is_email_verified: boolean;
  created_at: Date;
}

export interface UserWithRoleDto extends UserDto {
  role: { id: number; name: string };
}

export interface MeResponseDto extends UserDto {
  role: string;
  business: { id: number; name: string };
}

export interface GetUsersResponseDto {
  users: UserWithRoleDto[];
  total: number;
  page: number;
  limit: number;
}

export interface UpdateMeResponseDto {
  message: string;
  user: UserDto;
  email_verification_sent: boolean;
  phone_verification_sent: boolean;
}

export interface AdminUpdateUserResponseDto {
  message: string;
  user: {
    id: number;
    name: string;
    role: { id: number; name: string };
  };
}

export interface InviteResponseDto {
  message: string;
  invitation_id: number;
  expires_at: Date;
}

export interface AcceptInviteResponseDto {
  message: string;
  user: { id: number; name: string; email: string };
  tokens: { access_token: string; refresh_token: string };
}

export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    is_phone_verified: user.is_phone_verified,
    is_email_verified: user.is_email_verified,
    created_at: user.created_at
  };
}

export function toUserWithRoleDto(user: User): UserWithRoleDto {
  return {
    ...toUserDto(user),
    role: user.role ? { id: user.role.id, name: user.role.name } : { id: 0, name: '' }
  };
}

export function toMeDto(user: User): MeResponseDto {
  return {
    ...toUserDto(user),
    role: user.role ? user.role.name : '',
    business: user.business ? { id: user.business.id, name: user.business.name } : { id: 0, name: '' }
  };
}
export interface UpdateMeDto {
  /**
   * @minLength 2
   * @maxLength 100
   */
  name?: string;
  /**
   * @format email
   */
  email?: string;
  /**
   * @pattern ^\+?[1-9]\d{1,14}$
   */
  phone?: string;
}

export interface UpdateMyPasswordDto {
  /**
   * @minLength 1
   */
  current_password: string;
  /**
   * @minLength 8
   * @pattern ^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$
   */
  new_password: string;
}

export interface InviteDto {
  /**
   * @format email
   */
  email: string;
  /**
   * @isInt
   * @minimum 1
   */
  role_id: number;
}

export interface AcceptInviteDto {
  /**
   * @format email
   */
  email: string;
  /**
   * @isInt
   * @minimum 1
   */
  business_id: number;
  /**
   * @minLength 1
   */
  token: string;
  /**
   * @minLength 2
   * @maxLength 100
   */
  name: string;
  /**
   * @pattern ^\+?[1-9]\d{1,14}$
   */
  phone: string;
  /**
   * @minLength 8
   * @pattern ^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$
   */
  password: string;
}

export interface AdminUpdateUserDto {
  /**
   * @minLength 2
   * @maxLength 100
   */
  name?: string;
  role_id?: number;
}
