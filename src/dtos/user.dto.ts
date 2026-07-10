export interface UserDto {
  id: number;
  name: string;
  email: string;
  phone: string;
  is_phone_verified: boolean;
  is_email_verified: boolean;
  created_at: Date;
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
  role_ids?: number[];
}
