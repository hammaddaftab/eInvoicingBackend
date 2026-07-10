import * as express from 'express';
import { Route, Get, Patch, Body, Controller, Tags, Security, Request } from 'tsoa';
import { BusinessService } from '../services/business.service';
import { UpdateBusinessDto } from '../dtos/business.dto';
import { z } from 'zod';
import { ValidateError } from 'tsoa';

const RequireOneFieldRules = z.object({}).catchall(z.any()).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
);


@Route('business')
@Tags('Business')
export class BusinessController extends Controller {
  @Get('')
  @Security('jwt')
  public async getBusiness(@Request() request: express.Request): Promise<any> {
    return BusinessService.getBusiness(request.user.business_id);
  }

  @Patch('')
  @Security('jwt', ['OWNER'])
  public async updateBusiness(@Request() request: express.Request, @Body() body: UpdateBusinessDto): Promise<any> {
    const parseResult = RequireOneFieldRules.safeParse(body);
    if (!parseResult.success) {
      throw new ValidateError({ body: { message: 'At least one field must be provided' } }, 'Validation Failed');
    }
    
    const data = await BusinessService.updateBusiness(request.user.business_id, body);
    return { message: 'Business updated successfully', business: data };
  }
}
