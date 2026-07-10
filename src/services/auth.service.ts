import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { Business } from '../entities/Business';
import { Role } from '../entities/Role';
import { UserRole } from '../entities/UserRole';
import { OtpService } from './otp.service';
import { OtpChannel, OtpPurpose, Emirate } from '../entities/enums';
import { AppError } from '../utils/AppError';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { SignupDTO, VerifyOtpDTO, LoginDTO, ResendOtpDTO } from '../routes/auth.routes';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export class AuthService {
  private static userRepo = AppDataSource.getRepository(User);

  static async signup(data: SignupDTO) {

    const hashedPassword = await bcrypt.hash(data.password, 12);

    try {
      return await AppDataSource.manager.transaction(async (manager) => {
        // 1. Create Business
        const business = manager.create(Business, {
          name: data.business.name,
          vat_number: data.business.vat_number,
          tl_number: data.business.tl_number,
          industry: { id: data.business.industry_id },
          emirate: data.business.emirate as Emirate,
        });
        await manager.save(business);

        // 2. Create User
        const user = manager.create(User, {
          business,
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: hashedPassword,
        });
        await manager.save(user);

        // 3. Seed Default Roles
        const systemRoles = [
          manager.create(Role, { business, name: 'OWNER', description: 'Full system access', is_system: true }),
          manager.create(Role, { business, name: 'ADMIN', description: 'Manage users and settings', is_system: true }),
          manager.create(Role, { business, name: 'ACCOUNTANT', description: 'Manage invoices and payments', is_system: true }),
          manager.create(Role, { business, name: 'VIEWER', description: 'Read-only access', is_system: true }),
        ];
        await manager.save(systemRoles);

        const ownerRole = systemRoles.find((r) => r.name === 'OWNER')!;

        // 4. Assign OWNER Role
        const userRole = manager.create(UserRole, { user, role: ownerRole });
        await manager.save(userRole);

        // 5. Generate Signup OTPs for both Email and Phone
        await OtpService.createVerification(user, OtpChannel.PHONE, data.phone, OtpPurpose.SIGNUP);
        await OtpService.createVerification(user, OtpChannel.EMAIL, data.email, OtpPurpose.SIGNUP);

        return { user_id: user.id, business_id: business.id };
      });
    } catch (err: any) {
      if (err.code === '23505') {
        if (err.detail.includes('email')) throw new AppError(409, 'Email is already registered');
        if (err.detail.includes('phone')) throw new AppError(409, 'Phone number is already registered');
        if (err.detail.includes('vat_number')) throw new AppError(409, 'VAT number is already registered');
        if (err.detail.includes('tl_number')) throw new AppError(409, 'TL number is already registered');
      }
      throw err;
    }
  }

  static async verifyOtp(data: VerifyOtpDTO) {
    const isEmail = data.identifier.includes('@');
    const channel = isEmail ? OtpChannel.EMAIL : OtpChannel.PHONE;

    const user = await this.userRepo.findOne({
      where: isEmail ? { email: data.identifier } : { phone: data.identifier },
      relations: { business: true, user_roles: { role: true } },
    });

    if (!user) throw new AppError(404, 'User not found');

    await OtpService.verifyOtp(user.id, channel, data.purpose as OtpPurpose, data.code);

    if (data.purpose === OtpPurpose.SIGNUP) {
      if (channel === OtpChannel.PHONE) user.is_phone_verified = true;
      if (channel === OtpChannel.EMAIL) user.is_email_verified = true;
      await this.userRepo.save(user);

      if (!user.is_phone_verified || !user.is_email_verified) {
        return { is_complete: false };
      }
    }

    const roles = user.user_roles.map((ur) => ur.role.name);

    const accessToken = jwt.sign(
      { user_id: user.id, business_id: user.business.id, roles, type: 'access' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { user_id: user.id, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { is_complete: true, access_token: accessToken, refresh_token: refreshToken };
  }

  static async login(data: LoginDTO) {
    const user = await this.userRepo.findOne({
      where: { email: data.email },
      relations: { business: true, user_roles: { role: true } },
    });

    if (!user) throw new AppError(401, 'Invalid email or password');

    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) throw new AppError(401, 'Invalid email or password');

    if (!user.is_phone_verified || !user.is_email_verified) {
      // Trigger new OTPs for unverified channels
      if (!user.is_phone_verified) {
        await OtpService.createVerification(user, OtpChannel.PHONE, user.phone, OtpPurpose.SIGNUP);
      }
      if (!user.is_email_verified) {
        await OtpService.createVerification(user, OtpChannel.EMAIL, user.email, OtpPurpose.SIGNUP);
      }
      throw new AppError(403, 'Account not fully verified. New OTPs have been sent to your unverified channels.');
    }

    const roles = user.user_roles.map((ur) => ur.role.name);

    if (roles.length === 0) {
      throw new AppError(403, 'Your account has no assigned roles. Please contact your administrator.');
    }

    const accessToken = jwt.sign(
      { user_id: user.id, business_id: user.business.id, roles, type: 'access' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { user_id: user.id, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        business: {
          id: user.business.id,
          name: user.business.name,
        },
      },
    };
  }

  static async refresh(refreshToken: string) {
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, JWT_SECRET);
    } catch {
      throw new AppError(401, 'Invalid or expired refresh token');
    }

    if (decoded.type !== 'refresh') {
      throw new AppError(401, 'Invalid token type');
    }

    const user = await this.userRepo.findOne({
      where: { id: decoded.user_id },
      relations: { business: true, user_roles: { role: true } },
    });

    if (!user) {
      throw new AppError(401, 'User no longer exists');
    }

    const roles = user.user_roles.map((ur) => ur.role.name);

    const newAccessToken = jwt.sign(
      { user_id: user.id, business_id: user.business.id, roles, type: 'access' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const newRefreshToken = jwt.sign(
      { user_id: user.id, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { access_token: newAccessToken, refresh_token: newRefreshToken };
  }

  static async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { email } });

    // If not found, do nothing, return normally to prevent enumeration
    if (!user) return;

    await OtpService.createVerification(user, OtpChannel.EMAIL, email, OtpPurpose.RESET_PASSWORD);
  }

  static async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user) {
      throw new AppError(400, 'Invalid reset request');
    }

    await OtpService.verifyOtp(user.id, OtpChannel.EMAIL, OtpPurpose.RESET_PASSWORD, code);

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await this.userRepo.save(user);
  }

  static async resendOtp(data: ResendOtpDTO): Promise<void> {
    const isEmail = data.identifier.includes('@');
    const channel = isEmail ? OtpChannel.EMAIL : OtpChannel.PHONE;

    const user = await this.userRepo.findOne({
      where: isEmail ? { email: data.identifier } : { phone: data.identifier },
    });
    if (!user) throw new AppError(404, 'User not found');

    const destination = isEmail ? user.email : user.phone;
    await OtpService.createVerification(user, channel, destination, data.purpose as OtpPurpose);
  }
}
