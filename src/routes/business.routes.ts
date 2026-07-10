import { Router } from 'express';
import { z } from 'zod';
import { BusinessController } from '../controllers/business.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { Emirate } from '../entities/enums';

const router = Router();

export const updateBusinessSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(255).optional(),
    vat_number: z.string().trim().length(15).optional(),
    tl_number: z.string().trim().min(1).max(50).optional(),
    industry_id: z.number().int().positive().optional(),
    emirate: z.nativeEnum(Emirate).optional(),
  }).strict().refine(data => Object.keys(data).length > 0, 'At least one field must be provided'),
});

router.use(authenticate);

router.get('/', BusinessController.getBusiness);
router.patch('/', authorize('OWNER'), validate(updateBusinessSchema), BusinessController.updateBusiness);

export default router;
