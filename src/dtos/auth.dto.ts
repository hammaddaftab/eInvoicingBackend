import { Emirate, OtpPurpose } from '../entities/enums';

export interface ForgotPasswordDto {
  /**
   * @format email
   */
  email: string;
}

export interface ResetPasswordDto {
  /**
   * @format email
   */
  email: string;
  /**
   * @pattern ^\d{6}$
   */
  code: string;
  /**
   * @minLength 8
   * @pattern ^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$
   */
  new_password: string;
}

export interface BusinessRegistrationDto {
  /**
   * @minLength 2
   * @maxLength 255
   */
  name: string;
  /**
   * @minLength 15
   * @maxLength 15
   */
  vat_number: string;
  /**
   * @maxLength 50
   */
  tl_number: string;
  /**
   * @isInt
   * @minimum 1
   */
  industry_id: number;
  emirate: Emirate;
}

export interface SignupDto {
  /**
   * @minLength 2
   * @maxLength 100
   */
  name: string;
  /**
   * @format email
   */
  email: string;
  /**
   * @pattern ^\+?[1-9]\d{1,14}$
   */
  phone: string;
  /**
   * @minLength 8
   * @pattern ^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$
   */
  password: string;
  business: BusinessRegistrationDto;
}

export interface VerifyOtpDto {
  identifier: string;
  /**
   * @pattern ^\d{6}$
   */
  code: string;
  purpose: OtpPurpose.SIGNUP | OtpPurpose.RESET_PASSWORD;
}

export interface ResendOtpDto {
  identifier: string;
  purpose: OtpPurpose.SIGNUP | OtpPurpose.RESET_PASSWORD;
}

export interface LoginDto {
  /**
   * @format email
   */
  email: string;
  /**
   * @minLength 1
   */
  password: string;
}

export interface RefreshDto {
  /**
   * @minLength 1
   */
  refresh_token: string;
}
