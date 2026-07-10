import * as express from "express";
import { Route, Get, Delete, Path, Controller, Tags, Security, Request } from 'tsoa';
import { InvitationService } from '../services/invitation.service';

@Route('invitations')
@Tags('Invitations')
export class InvitationController extends Controller {
  @Get('')
  @Security('jwt', ['OWNER', 'ADMIN'])
  public async getInvitations(@Request() request: express.Request): Promise<any> {
    const data = await InvitationService.getInvitations(request.user.business_id);
    return { invitations: data };
  }

  @Delete('{id}')
  @Security('jwt', ['OWNER', 'ADMIN'])
  public async deleteInvitation(@Request() request: express.Request, @Path() id: number): Promise<{ message: string }> {
    await InvitationService.deleteInvitation(request.user.business_id, id);
    return { message: 'Invitation cancelled successfully' };
  }
}
