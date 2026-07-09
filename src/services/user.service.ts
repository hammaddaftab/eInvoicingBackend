import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { UserRole } from '../entities/UserRole';
import { Role } from '../entities/Role';
import { OtpService } from './otp.service';
import { OtpChannel, OtpPurpose } from '../entities/enums';
import type { UpdateMeDTO, UpdateMyPasswordDTO } from '../routes/user.routes';
import bcrypt from 'bcrypt';

export class UserService {
  static async getMe(userId: number) {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({
      where: { id: userId },
      relations: { business: true, user_roles: { role: true } },
    });

    if (!user) throw { status: 404, message: 'User not found' };

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      is_email_verified: user.is_email_verified,
      is_phone_verified: user.is_phone_verified,
      created_at: user.created_at,
      business: {
        id: user.business.id,
        name: user.business.name,
      },
      roles: user.user_roles.map((ur) => ur.role.name),
    };
  }

  static async updateMe(userId: number, data: UpdateMeDTO) {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });

    if (!user) throw { status: 404, message: 'User not found' };

    let emailChanged = false;
    let phoneChanged = false;

    if (data.name) user.name = data.name;
    
    if (data.email && data.email !== user.email) {
      const existingEmail = await userRepo.findOne({ where: { email: data.email } });
      if (existingEmail) throw { status: 409, message: 'Email is already taken' };
      
      user.email = data.email;
      user.is_email_verified = false;
      emailChanged = true;
    }

    if (data.phone && data.phone !== user.phone) {
      const existingPhone = await userRepo.findOne({ where: { phone: data.phone } });
      if (existingPhone) throw { status: 409, message: 'Phone number is already taken' };

      user.phone = data.phone;
      user.is_phone_verified = false;
      phoneChanged = true;
    }

    await userRepo.save(user);

    if (emailChanged) {
      await OtpService.createVerification(user, OtpChannel.EMAIL, user.email, OtpPurpose.UPDATE_EMAIL);
    }
    if (phoneChanged) {
      await OtpService.createVerification(user, OtpChannel.PHONE, user.phone, OtpPurpose.UPDATE_PHONE);
    }

    return {
      message: 'Profile updated successfully.' + 
               (emailChanged || phoneChanged ? ' Please verify your new contact details.' : ''),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        is_email_verified: user.is_email_verified,
        is_phone_verified: user.is_phone_verified,
      }
    };
  }

  static async updateMyPassword(userId: number, data: UpdateMyPasswordDTO) {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });

    if (!user) throw { status: 404, message: 'User not found' };

    const isValid = await bcrypt.compare(data.current_password, user.password);
    if (!isValid) throw { status: 400, message: 'Incorrect current password' };

    user.password = await bcrypt.hash(data.new_password, 12);
    await userRepo.save(user);

    return { message: 'Password updated successfully' };
  }

  // --- ADMIN ROUTES ---

  static async getUsers(businessId: number, page: number = 1, limit: number = 20) {
    const userRepo = AppDataSource.getRepository(User);
    const [users, total] = await userRepo.findAndCount({
      where: { business: { id: businessId } },
      relations: { user_roles: { role: true } },
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' }
    });

    return {
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        is_email_verified: user.is_email_verified,
        is_phone_verified: user.is_phone_verified,
        roles: user.user_roles.map(ur => ur.role.name),
        created_at: user.created_at
      })),
      total,
      page,
      limit
    };
  }

  static async getUser(businessId: number, userId: number) {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({
      where: { id: userId, business: { id: businessId } },
      relations: { user_roles: { role: true } }
    });

    if (!user) throw { status: 404, message: 'User not found' };

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      is_email_verified: user.is_email_verified,
      is_phone_verified: user.is_phone_verified,
      roles: user.user_roles.map(ur => ({ id: ur.role.id, name: ur.role.name })),
      created_at: user.created_at
    };
  }

  static async adminUpdateUser(businessId: number, userId: number, data: { name?: string; role_ids?: number[] }) {
    const userRepo = AppDataSource.getRepository(User);
    const roleRepo = AppDataSource.getRepository(Role);
    
    return await AppDataSource.manager.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id: userId, business: { id: businessId } }
      });
      if (!user) throw { status: 404, message: 'User not found' };

      if (data.name) {
        user.name = data.name;
        await manager.save(user);
      }

      if (data.role_ids && data.role_ids.length > 0) {
        // Validate that roles exist and belong to the same business (or are system)
        const roles = await manager.find(Role, { where: data.role_ids.map(id => ({ id })) });
        if (roles.length !== data.role_ids.length) throw { status: 400, message: 'Invalid role provided' };
        
        for (const role of roles) {
          // If custom role, must match business
          const roleWithBus = await manager.findOne(Role, { where: { id: role.id }, relations: { business: true }});
          if (!roleWithBus || roleWithBus.business.id !== businessId) {
             throw { status: 403, message: `Invalid role ID ${role.id} for this business` };
          }
        }

        // Delete old roles and insert new ones
        await manager.delete(UserRole, { user: { id: userId } });
        
        const newRoles = roles.map((r: Role) => manager.create(UserRole, { user: { id: userId }, role: { id: r.id } }));
        await manager.save(newRoles);
      }

      return { message: 'User updated successfully' };
    });
  }

  static async removeUser(businessId: number, executorId: number, targetUserId: number) {
    if (executorId === targetUserId) {
      throw { status: 400, message: 'You cannot remove yourself. Use account deletion instead.' };
    }

    const userRepo = AppDataSource.getRepository(User);
    const targetUser = await userRepo.findOne({
      where: { id: targetUserId, business: { id: businessId } },
      relations: { user_roles: { role: true } }
    });

    if (!targetUser) throw { status: 404, message: 'User not found in your business' };

    // Check if target is an OWNER
    const isTargetOwner = targetUser.user_roles.some(ur => ur.role.name === 'OWNER');
    if (isTargetOwner) {
      throw { status: 403, message: 'You cannot remove another OWNER from the business' };
    }

    // Deleting the user will cascade delete user_roles (due to ON DELETE CASCADE)
    // Wait, let's just delete the user.
    await userRepo.remove(targetUser);
    
    return { message: 'User removed successfully' };
  }
}
