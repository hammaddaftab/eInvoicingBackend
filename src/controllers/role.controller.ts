import * as express from "express";
import { Route, Get, Patch, Post, Delete, Put, Body, Path, Controller, Tags, Security, Request, SuccessResponse } from 'tsoa';
import { RoleService } from '../services/role.service';
import { CreateRoleDto, UpdateRoleDto, SetPermissionsDto, GetRolesResponseDto, RoleDetailResponseDto, CreateRoleResponseDto, UpdateRoleResponseDto, SetPermissionsResponseDto, toRoleDto, toRoleDetailDto } from '../dtos/role.dto';
import { z } from 'zod';
import { ValidateError } from 'tsoa';

const RequireOneFieldRules = z.object({}).catchall(z.any()).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
);


@Route('roles')
@Tags('Roles')
export class RoleController extends Controller {
  @Post('')
  @Security('jwt', ['OWNER'])
  @SuccessResponse('201', 'Created')
  public async createRole(@Request() request: express.Request, @Body() body: CreateRoleDto): Promise<CreateRoleResponseDto> {
    body.name = body.name.toUpperCase();
    const role = await RoleService.createRole(request.user.business_id, body);
    this.setStatus(201);
    return { message: 'Role created successfully', role: toRoleDto(role) };
  }

  @Get('')
  @Security('jwt', ['OWNER', 'ADMIN'])
  public async getRoles(@Request() request: express.Request): Promise<GetRolesResponseDto> {
    const roles = await RoleService.getRoles(request.user.business_id);
    return { roles: roles.map(toRoleDto) };
  }

  @Get('{id}')
  @Security('jwt', ['OWNER', 'ADMIN'])
  public async getRole(@Request() request: express.Request, @Path() id: number): Promise<RoleDetailResponseDto> {
    const role = await RoleService.getRole(request.user.business_id, id);
    return toRoleDetailDto(role);
  }

  @Patch('{id}')
  @Security('jwt', ['OWNER'])
  public async updateRole(@Request() request: express.Request, @Path() id: number, @Body() body: UpdateRoleDto): Promise<UpdateRoleResponseDto> {
    const parseResult = RequireOneFieldRules.safeParse(body);
    if (!parseResult.success) {
      throw new ValidateError({ body: { message: 'At least one field must be provided' } }, 'Validation Failed');
    }
    if (body.name) body.name = body.name.toUpperCase();
    
    const role = await RoleService.updateRole(request.user.business_id, id, body);
    return { message: 'Role updated successfully', role: toRoleDto(role) };
  }

  @Delete('{id}')
  @Security('jwt', ['OWNER'])
  public async deleteRole(@Request() request: express.Request, @Path() id: number): Promise<{ message: string }> {
    await RoleService.deleteRole(request.user.business_id, id);
    return { message: 'Role deleted successfully' };
  }

  @Put('{id}/permissions')
  @Security('jwt', ['OWNER'])
  public async setPermissions(@Request() request: express.Request, @Path() id: number, @Body() body: SetPermissionsDto): Promise<SetPermissionsResponseDto> {
    const role = await RoleService.setPermissions(request.user.business_id, id, body.permissions);
    
    const detailDto = toRoleDetailDto(role);
    return { 
      message: 'Permissions updated successfully', 
      role_id: detailDto.id,
      permissions: detailDto.permissions
    };
  }
}
