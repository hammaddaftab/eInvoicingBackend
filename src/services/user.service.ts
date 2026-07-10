import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { Role } from '../entities/Role';
import { UserRole } from '../entities/UserRole';
import { OtpService } from './otp.service';
import { OtpChannel, OtpPurpose } from '../entities/enums';
import { AppError } from '../utils/AppError';
import bcrypt from 'bcrypt';
import { UpdateMeDto, UpdateMyPasswordDto, AdminUpdateUserDto } from '../dtos/user.dto';

export class UserService {
  private static userRepo = AppDataSource.getRepository(User);
  private static roleRepo = AppDataSource.getRepository(Role);

  static async getMe(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: { business: true, user_roles: { role: true } }
    });

    if (!user) throw new AppError(404, 'User not found');

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      is_phone_verified: user.is_phone_verified,
      is_email_verified: user.is_email_verified,
      roles: user.user_roles.map(ur => ur.role.name),
      business: {
        id: user.business.id,
        name: user.business.name
      }
    };
  }

  static async updateMe(userId: number, data: UpdateMeDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new AppError(404, 'User not found');

    if (data.name) user.name = data.name;
    
    let emailChanged = false;
    if (data.email && data.email !== user.email) {
      user.email = data.email;
      user.is_email_verified = false;
      emailChanged = true;
    }

    let phoneChanged = false;
    if (data.phone && data.phone !== user.phone) {
      user.phone = data.phone;
      user.is_phone_verified = false;
      phoneChanged = true;
    }

    try {
      await this.userRepo.save(user);
    } catch (err: any) {
      if (err.code === '23505') {
        if (err.detail.includes('email')) throw new AppError(409, 'Email is already taken');
        if (err.detail.includes('phone')) throw new AppError(409, 'Phone number is already taken');
      }
      throw err;
    }

    if (emailChanged) {
      await OtpService.createVerification(user, OtpChannel.EMAIL, user.email, OtpPurpose.UPDATE_EMAIL);
    }

    if (phoneChanged) {
      await OtpService.createVerification(user, OtpChannel.PHONE, user.phone, OtpPurpose.UPDATE_PHONE);
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        is_phone_verified: user.is_phone_verified,
        is_email_verified: user.is_email_verified
      },
      email_verification_sent: emailChanged,
      phone_verification_sent: phoneChanged
    };
  }

  static async changePassword(userId: number, data: UpdateMyPasswordDto): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new AppError(404, 'User not found');

    const isValid = await bcrypt.compare(data.current_password, user.password);
    if (!isValid) throw new AppError(400, 'Incorrect current password');

    const hashedNewPassword = await bcrypt.hash(data.new_password, 12);
    user.password = hashedNewPassword;

    await this.userRepo.save(user);
  }

  static async getUsers(businessId: number, page: number, limit: number) {
    const [users, total] = await this.userRepo.findAndCount({
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
        roles: user.user_roles.map(ur => ur.role.name),
        is_phone_verified: user.is_phone_verified,
        is_email_verified: user.is_email_verified,
        created_at: user.created_at
      })),
      total,
      page,
      limit
    };
  }

  static async getUser(businessId: number, targetUserId: number) {
    const user = await this.userRepo.findOne({
      where: { id: targetUserId, business: { id: businessId } },
      relations: { user_roles: { role: true } }
    });

    if (!user) throw new AppError(404, 'User not found');

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      roles: user.user_roles.map(ur => ({ id: ur.role.id, name: ur.role.name })),
      is_phone_verified: user.is_phone_verified,
      is_email_verified: user.is_email_verified,
      created_at: user.created_at
    };
  }

  static async adminUpdateUser(businessId: number, targetUserId: number, data: AdminUpdateUserDto) {
    return await AppDataSource.manager.transaction(async (manager) => {
      const user = await manager.findOne(User, { 
        where: { id: targetUserId, business: { id: businessId } } 
      });

      if (!user) throw new AppError(404, 'User not found');

      if (data.name) {
        user.name = data.name;
        await manager.save(user);
      }

      if (data.role_ids && data.role_ids.length > 0) {
        const roles = await manager.find(Role, { where: data.role_ids.map((id: number) => ({ id })) });
        if (roles.length !== data.role_ids.length) throw new AppError(400, 'Invalid role provided');
        
        for (const role of roles) {
          if (!role.is_system && role.business && role.business.id !== businessId) {
             throw new AppError(403, `Invalid role ID ${role.id} for this business`);
          }
        }

        await manager.delete(UserRole, { user: { id: targetUserId } });
        
        const newRoles = roles.map((r: Role) => manager.create(UserRole, { user: { id: targetUserId }, role: { id: r.id } }));
        await manager.save(newRoles);
      }

      const updatedUser = await manager.findOne(User, {
        where: { id: targetUserId },
        relations: { user_roles: { role: true } }
      });

      if (!updatedUser) {
        throw new AppError(500, 'User disappeared during update');
      }

      return {
        id: updatedUser.id,
        name: updatedUser.name,
        roles: updatedUser.user_roles.map(ur => ({ id: ur.role.id, name: ur.role.name }))
      };
    });
  }

  static async removeUser(businessId: number, requestingUserId: number, targetUserId: number): Promise<void> {
    if (requestingUserId === targetUserId) {
      throw new AppError(400, 'You cannot remove yourself. Use account deletion instead.');
    }

    const targetUser = await this.userRepo.findOne({
      where: { id: targetUserId, business: { id: businessId } },
      relations: { user_roles: { role: true } }
    });

    if (!targetUser) throw new AppError(404, 'User not found in your business');

    const isTargetOwner = targetUser.user_roles.some(ur => ur.role.name === 'OWNER');
    
    if (isTargetOwner) {
      throw new AppError(403, 'You cannot remove another OWNER from the business');
    }

    await this.userRepo.remove(targetUser);
  }
}
