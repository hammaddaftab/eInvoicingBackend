import { AppDataSource } from '../data-source';
import { Business } from '../entities/Business';
import { Industry } from '../entities/Industry';
import { Emirate } from '../entities/enums';
import { AppError } from '../utils/AppError';

export class BusinessService {
  private static businessRepo = AppDataSource.getRepository(Business);
  private static industryRepo = AppDataSource.getRepository(Industry);

  static async getBusiness(businessId: number) {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
      relations: { industry: true }
    });

    if (!business) throw new AppError(404, 'Business not found');

    return business;
  }

  static async updateBusiness(businessId: number, data: {
    name?: string;
    vat_number?: string;
    tl_number?: string;
    industry_id?: number;
    emirate?: string;
  }) {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) throw new AppError(404, 'Business not found');

    if (data.name) business.name = data.name;
    if (data.vat_number) business.vat_number = data.vat_number;
    if (data.tl_number) business.tl_number = data.tl_number;
    
    if (data.industry_id) {
      const industry = await this.industryRepo.findOne({ where: { id: data.industry_id } });
      if (!industry) throw new AppError(400, 'Invalid industry ID');
      business.industry = industry;
    }

    if (data.emirate) {
      business.emirate = data.emirate as Emirate;
    }

    try {
      await this.businessRepo.save(business);
      return business;
    } catch (err: any) {
      if (err.code === '23505') {
        if (err.detail.includes('vat_number')) throw new AppError(409, 'VAT number is already registered');
        if (err.detail.includes('tl_number')) throw new AppError(409, 'TL number is already registered');
      }
      throw err;
    }
  }
}
