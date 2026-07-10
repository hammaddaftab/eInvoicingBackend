import { Router } from 'express';
import { z } from 'zod';
import { BusinessController } from '../controllers/business.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';

const router = Router();

export const updateBusinessSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  vat_number: z.string().length(15).optional(),
  tl_number: z.string().min(1).max(50).optional(),
  industry_id: z.number().int().positive().optional(),
  emirate: z.enum(['ABU_DHABI', 'DUBAI', 'SHARJAH', 'AJMAN', 'UMM_AL_QUWAIN', 'RAS_AL_KHAIMAH', 'FUJAIRAH']).optional(),
});

router.use(authenticate);

router.get('/', BusinessController.getBusiness);
router.patch('/', authorize('OWNER'), validate(updateBusinessSchema), BusinessController.updateBusiness);

export default router;
