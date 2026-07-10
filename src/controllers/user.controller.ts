import * as express from "express";
import { Route, Get, Patch, Post, Delete, Body, Path, Controller, Tags, Security, Request, Query, SuccessResponse } from 'tsoa';
import { UserService } from '../services/user.service';
import { InvitationService } from '../services/invitation.service';
import { UserDto, UpdateMeDto, UpdateMyPasswordDto, InviteDto, AcceptInviteDto, AdminUpdateUserDto } from '../dtos/user.dto';
import { z } from 'zod';
import { ValidateError } from 'tsoa';

const RequireOneFieldRules = z.object({}).catchall(z.any()).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
);

const PasswordMatchRules = z.object({
  current_password: z.string(),
  new_password: z.string(),
}).refine(
  (data) => data.current_password !== data.new_password,
  { message: 'New password must be different from current password' }
);


@Route('users')
@Tags('Users')
export class UserController extends Controller {
  @Get('me')
  @Security('jwt')
  public async getMe(@Request() request: express.Request): Promise<any> {
    return UserService.getMe(request.user.user_id);
  }

  @Patch('me')
  @Security('jwt')
  public async updateMe(@Request() request: express.Request, @Body() body: UpdateMeDto): Promise<any> {
    const parseResult = RequireOneFieldRules.safeParse(body);
    if (!parseResult.success) {
      throw new ValidateError({ body: { message: 'At least one field must be provided' } }, 'Validation Failed');
    }
    if (body.email) body.email = body.email.trim().toLowerCase();
    
    const data = await UserService.updateMe(request.user.user_id, body);
    return { message: 'Profile updated successfully', ...data };
  }

  @Patch('me/password')
  @Security('jwt')
  public async changePassword(@Request() request: express.Request, @Body() body: UpdateMyPasswordDto): Promise<{ message: string }> {
    const parseResult = PasswordMatchRules.safeParse(body);
    if (!parseResult.success) {
      throw new ValidateError({ current_password: { message: 'New password must be different from current password' } }, 'Validation Failed');
    }

    await UserService.changePassword(request.user.user_id, body);
    return { message: 'Password changed successfully' };
  }

  @Post('invite')
  @Security('jwt', ['OWNER', 'ADMIN'])
  @SuccessResponse('201', 'Created')
  public async inviteUser(@Request() request: express.Request, @Body() body: InviteDto): Promise<any> {
    body.email = body.email.trim().toLowerCase();
    const data = await InvitationService.inviteUser(request.user.business_id, request.user.user_id, body.email, body.role_id);
    this.setStatus(201);
    return { message: `Invitation sent to ${body.email}`, ...data };
  }

  @Post('accept-invite')
  public async acceptInvite(@Body() body: AcceptInviteDto): Promise<any> {
    body.email = body.email.trim().toLowerCase();
    const data = await InvitationService.acceptInvite(body.email, body.business_id, body.token, body.name, body.phone, body.password);
    return { message: 'Invitation accepted successfully', ...data };
  }

  @Get('')
  @Security('jwt', ['OWNER', 'ADMIN'])
  public async getUsers(
    @Request() request: express.Request,
    @Query() page: number = 1,
    @Query() limit: number = 20
  ): Promise<any> {
    return UserService.getUsers(request.user.business_id, page, limit);
  }

  @Get('{id}')
  @Security('jwt', ['OWNER', 'ADMIN'])
  public async getUser(@Request() request: express.Request, @Path() id: number): Promise<any> {
    return UserService.getUser(request.user.business_id, id);
  }

  @Patch('{id}')
  @Security('jwt', ['OWNER', 'ADMIN'])
  public async adminUpdateUser(@Request() request: express.Request, @Path() id: number, @Body() body: AdminUpdateUserDto): Promise<any> {
    const parseResult = RequireOneFieldRules.safeParse(body);
    if (!parseResult.success) {
      throw new ValidateError({ body: { message: 'At least one field must be provided' } }, 'Validation Failed');
    }
    const data = await UserService.adminUpdateUser(request.user.business_id, id, body);
    return { message: 'User updated successfully', user: data };
  }

  @Delete('{id}')
  @Security('jwt', ['OWNER'])
  public async removeUser(@Request() request: express.Request, @Path() id: number): Promise<{ message: string }> {
    await UserService.removeUser(request.user.business_id, request.user.user_id, id);
    return { message: 'User removed successfully' };
  }
}
