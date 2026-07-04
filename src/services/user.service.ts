import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
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
}
