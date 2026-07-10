import * as express from "express";
import { Route, Get, Patch, Post, Delete, Put, Body, Path, Controller, Tags, Security, Request, SuccessResponse } from 'tsoa';
import { RoleService } from '../services/role.service';
import { CreateRoleDto, UpdateRoleDto, SetPermissionsDto } from '../dtos/role.dto';
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
  public async createRole(@Request() request: express.Request, @Body() body: CreateRoleDto): Promise<any> {
    body.name = body.name.toUpperCase();
    const data = await RoleService.createRole(request.user.business_id, body);
    this.setStatus(201);
    return { message: 'Role created successfully', role: data };
  }

  @Get('')
  @Security('jwt', ['OWNER', 'ADMIN'])
  public async getRoles(@Request() request: express.Request): Promise<any> {
    const data = await RoleService.getRoles(request.user.business_id);
    return { roles: data };
  }

  @Get('{id}')
  @Security('jwt', ['OWNER', 'ADMIN'])
  public async getRole(@Request() request: express.Request, @Path() id: number): Promise<any> {
    return RoleService.getRole(request.user.business_id, id);
  }

  @Patch('{id}')
  @Security('jwt', ['OWNER'])
  public async updateRole(@Request() request: express.Request, @Path() id: number, @Body() body: UpdateRoleDto): Promise<any> {
    const parseResult = RequireOneFieldRules.safeParse(body);
    if (!parseResult.success) {
      throw new ValidateError({ body: { message: 'At least one field must be provided' } }, 'Validation Failed');
    }
    if (body.name) body.name = body.name.toUpperCase();
    
    const data = await RoleService.updateRole(request.user.business_id, id, body);
    return { message: 'Role updated successfully', role: data };
  }

  @Delete('{id}')
  @Security('jwt', ['OWNER'])
  public async deleteRole(@Request() request: express.Request, @Path() id: number): Promise<{ message: string }> {
    await RoleService.deleteRole(request.user.business_id, id);
    return { message: 'Role deleted successfully' };
  }

  @Put('{id}/permissions')
  @Security('jwt', ['OWNER'])
  public async setPermissions(@Request() request: express.Request, @Path() id: number, @Body() body: SetPermissionsDto): Promise<any> {
    const data = await RoleService.setPermissions(request.user.business_id, id, body.permissions);
    return { message: 'Permissions updated successfully', ...data };
  }
}
