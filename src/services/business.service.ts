import { AppDataSource } from '../data-source';
import { Business } from '../entities/Business';
import { Industry } from '../entities/Industry';
import { Emirate } from '../entities/enums';
import { Not } from 'typeorm';

export class BusinessService {
  static async getBusiness(businessId: number) {
    const businessRepo = AppDataSource.getRepository(Business);
    const business = await businessRepo.findOne({
      where: { id: businessId },
      relations: { industry: true }
    });

    if (!business) throw { status: 404, message: 'Business not found' };

    return business;
  }

  static async updateBusiness(businessId: number, data: {
    name?: string;
    vat_number?: string;
    tl_number?: string;
    industry_id?: number;
    emirate?: string;
  }) {
    const businessRepo = AppDataSource.getRepository(Business);
    const industryRepo = AppDataSource.getRepository(Industry);

    const business = await businessRepo.findOne({ where: { id: businessId } });
    if (!business) throw { status: 404, message: 'Business not found' };

    if (data.name) business.name = data.name;

    if (data.vat_number && data.vat_number !== business.vat_number) {
      const existingVat = await businessRepo.findOne({ where: { vat_number: data.vat_number, id: Not(businessId) } });
      if (existingVat) throw { status: 409, message: 'VAT number is already registered' };
      business.vat_number = data.vat_number;
    }

    if (data.tl_number && data.tl_number !== business.tl_number) {
      const existingTl = await businessRepo.findOne({ where: { tl_number: data.tl_number, id: Not(businessId) } });
      if (existingTl) throw { status: 409, message: 'TL number is already registered' };
      business.tl_number = data.tl_number;
    }

    if (data.industry_id) {
      const industry = await industryRepo.findOne({ where: { id: data.industry_id } });
      if (!industry) throw { status: 400, message: 'Invalid industry ID' };
      business.industry = industry;
    }

    if (data.emirate) {
      business.emirate = data.emirate as Emirate;
    }

    await businessRepo.save(business);
    return { message: 'Business updated successfully', business };
  }
}
