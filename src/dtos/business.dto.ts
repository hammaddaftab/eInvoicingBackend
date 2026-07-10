import { Emirate } from '../entities/enums';

export interface BusinessDto {
  id: number;
  name: string;
  vat_number: string;
  tl_number: string;
  industry_id: number;
  emirate: Emirate;
  created_at: Date;
}

export interface UpdateBusinessDto {
  /**
   * @minLength 2
   * @maxLength 255
   */
  name?: string;
  /**
   * @minLength 15
   * @maxLength 15
   */
  vat_number?: string;
  /**
   * @minLength 1
   * @maxLength 50
   */
  tl_number?: string;
  /**
   * @isInt
   * @minimum 1
   */
  industry_id?: number;
  emirate?: Emirate;
}
