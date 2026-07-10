import { Emirate } from '../entities/enums';
import { Business } from '../entities/Business';

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

export interface BusinessResponseDto {
  id: number;
  name: string;
  vat_number?: string;
  tl_number?: string;
  emirate: Emirate;
  industry?: {
    id: number;
    name: string;
  };
}

export interface UpdateBusinessResponseDto {
  message: string;
  business: BusinessResponseDto;
}

export function toBusinessDto(business: Business): BusinessResponseDto {
  return {
    id: business.id,
    name: business.name,
    vat_number: business.vat_number || undefined,
    tl_number: business.tl_number || undefined,
    emirate: business.emirate,
    industry: business.industry ? { id: business.industry.id, name: business.industry.name } : undefined
  };
}
