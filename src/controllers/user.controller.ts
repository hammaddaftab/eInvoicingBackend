import * as express from "express";
import { Route, Get, Patch, Post, Delete, Body, Path, Controller, Tags, Security, Request, Query, SuccessResponse } from 'tsoa';
import { UserService } from '../services/user.service';
import { InvitationService } from '../services/invitation.service';
import { UserDto, UpdateMeDto, UpdateMyPasswordDto, InviteDto, AcceptInviteDto, AdminUpdateUserDto, MeResponseDto, UpdateMeResponseDto, InviteResponseDto, AcceptInviteResponseDto, GetUsersResponseDto, UserWithRolesDto, AdminUpdateUserResponseDto, toMeDto, toUserDto, toUserWithRolesDto } from '../dtos/user.dto';
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
  public async getMe(@Request() request: express.Request): Promise<MeResponseDto> {
    const user = await UserService.getMe(request.user.user_id);
    return toMeDto(user);
  }

  @Patch('me')
  @Security('jwt')
  public async updateMe(@Request() request: express.Request, @Body() body: UpdateMeDto): Promise<UpdateMeResponseDto> {
    const parseResult = RequireOneFieldRules.safeParse(body);
    if (!parseResult.success) {
      throw new ValidateError({ body: { message: 'At least one field must be provided' } }, 'Validation Failed');
    }
    if (body.email) body.email = body.email.trim().toLowerCase();
    
    const { user, email_verification_sent, phone_verification_sent } = await UserService.updateMe(request.user.user_id, body);
    return { 
      message: 'Profile updated successfully', 
      user: toUserDto(user),
      email_verification_sent,
      phone_verification_sent
    };
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
  public async inviteUser(@Request() request: express.Request, @Body() body: InviteDto): Promise<InviteResponseDto> {
    body.email = body.email.trim().toLowerCase();
    const invitation = await InvitationService.inviteUser(request.user.business_id, request.user.user_id, body.email, body.role_id);
    this.setStatus(201);
    return { 
      message: `Invitation sent to ${body.email}`, 
      invitation_id: invitation.id,
      expires_at: invitation.expires_at
    };
  }

  @Post('accept-invite')
  public async acceptInvite(@Body() body: AcceptInviteDto): Promise<AcceptInviteResponseDto> {
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
  ): Promise<GetUsersResponseDto> {
    const data = await UserService.getUsers(request.user.business_id, page, limit);
    return {
      users: data.users.map(toUserWithRolesDto),
      total: data.total,
      page: data.page,
      limit: data.limit
    };
  }

  @Get('{id}')
  @Security('jwt', ['OWNER', 'ADMIN'])
  public async getUser(@Request() request: express.Request, @Path() id: number): Promise<UserWithRolesDto> {
    const user = await UserService.getUser(request.user.business_id, id);
    return toUserWithRolesDto(user);
  }

  @Patch('{id}')
  @Security('jwt', ['OWNER', 'ADMIN'])
  public async adminUpdateUser(@Request() request: express.Request, @Path() id: number, @Body() body: AdminUpdateUserDto): Promise<AdminUpdateUserResponseDto> {
    const parseResult = RequireOneFieldRules.safeParse(body);
    if (!parseResult.success) {
      throw new ValidateError({ body: { message: 'At least one field must be provided' } }, 'Validation Failed');
    }
    const updatedUser = await UserService.adminUpdateUser(request.user.business_id, id, body);
    
    return { 
      message: 'User updated successfully', 
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        roles: (updatedUser.user_roles || []).map((ur: any) => ({ id: ur.role.id, name: ur.role.name }))
      } 
    };
  }

  @Delete('{id}')
  @Security('jwt', ['OWNER'])
  public async removeUser(@Request() request: express.Request, @Path() id: number): Promise<{ message: string }> {
    await UserService.removeUser(request.user.business_id, request.user.user_id, id);
    return { message: 'User removed successfully' };
  }
}
