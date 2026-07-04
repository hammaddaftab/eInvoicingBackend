import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { Business } from '../entities/Business';
import { Role } from '../entities/Role';
import { UserRole } from '../entities/UserRole';
import { OtpChannel, OtpPurpose } from '../entities/enums';
import { OtpService } from './otp.service';
import type { SignupDTO, VerifyOtpDTO, LoginDTO, RefreshDTO, ResendOtpDTO } from '../routes/auth.routes';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

export class AuthService {
  static async signup(data: SignupDTO) {
    const userRepo = AppDataSource.getRepository(User);
    
    // Check uniqueness before starting transaction
    const existingEmail = await userRepo.findOne({ where: { email: data.email } });
    if (existingEmail) throw { status: 409, message: 'Email is already registered' };

    const existingPhone = await userRepo.findOne({ where: { phone: data.phone } });
    if (existingPhone) throw { status: 409, message: 'Phone number is already registered' };

    return await AppDataSource.manager.transaction(async (manager) => {
      // 1. Create Business
      const business = manager.create(Business, {
        name: data.business.name,
        vat_number: data.business.vat_number,
        tl_number: data.business.tl_number,
        industry: { id: data.business.industry_id },
        emirate: data.business.emirate as unknown as import('../entities/enums').Emirate,
      });
      await manager.save(business);

      // 2. Create User
      const password = await bcrypt.hash(data.password, 12);
      const user = manager.create(User, {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password,
        business,
      });
      await manager.save(user);

      // 3. Create Default System Roles
      const rolesToCreate = [
        { name: 'OWNER', description: 'Full business control', is_system: true, business },
        { name: 'ADMIN', description: 'User and settings management', is_system: true, business },
        { name: 'ACCOUNTANT', description: 'Invoice management', is_system: true, business },
        { name: 'VIEWER', description: 'Read-only access', is_system: true, business },
      ];
      const savedRoles = await manager.save(Role, rolesToCreate);
      
      const ownerRole = savedRoles.find((r) => r.name === 'OWNER')!;

      // 4. Assign OWNER role to user
      const userRole = manager.create(UserRole, { user, role: ownerRole });
      await manager.save(userRole);

      // 5. Generate OTPs (Phone & Email)
      await OtpService.createVerification(user, OtpChannel.PHONE, user.phone, OtpPurpose.SIGNUP);
      await OtpService.createVerification(user, OtpChannel.EMAIL, user.email, OtpPurpose.SIGNUP);

      return {
        message: 'Account created. Please verify your phone and email.',
        user_id: user.id,
        business_id: business.id,
      };
    });
  }

  static async verifyOtp(data: VerifyOtpDTO) {
    await OtpService.verifyOtp(data.user_id, data.channel as import('../entities/enums').OtpChannel, data.purpose as import('../entities/enums').OtpPurpose, data.code);
    
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({
      where: { id: data.user_id },
      relations: { business: true, user_roles: { role: true } },
    });

    if (!user) throw { status: 404, message: 'User not found' };

    if (data.channel === OtpChannel.PHONE) user.is_phone_verified = true;
    if (data.channel === OtpChannel.EMAIL) user.is_email_verified = true;
    
    await userRepo.save(user);

    // Only issue tokens if both are verified during signup? Or just return success.
    // The user requested to handle both unverified cases in login, so we can just return success here.
    return {
      message: `${data.channel} verified successfully.`,
      is_phone_verified: user.is_phone_verified,
      is_email_verified: user.is_email_verified,
    };
  }

  static async login(data: LoginDTO) {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({
      where: { email: data.email },
      relations: { business: true, user_roles: { role: true } },
    });

    if (!user) throw { status: 401, message: 'Invalid email or password' };

    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) throw { status: 401, message: 'Invalid email or password' };

    // Check verification status
    if (!user.is_phone_verified && !user.is_email_verified) {
      throw {
        status: 403,
        code: 'UNVERIFIED_BOTH',
        message: 'Please verify your phone and email to continue.',
        user_id: user.id,
      };
    } else if (!user.is_phone_verified) {
      throw {
        status: 403,
        code: 'UNVERIFIED_PHONE',
        message: 'Please verify your phone number to continue.',
        user_id: user.id,
      };
    } else if (!user.is_email_verified) {
      throw {
        status: 403,
        code: 'UNVERIFIED_EMAIL',
        message: 'Please verify your email to continue.',
        user_id: user.id,
      };
    }

    const roles = user.user_roles.map((ur) => ur.role.name);

    const access_token = jwt.sign(
      { user_id: user.id, business_id: user.business.id, roles, type: 'access' },
      JWT_SECRET,
      { expiresIn: ACCESS_EXPIRES_IN }
    );

    const refresh_token = jwt.sign(
      { user_id: user.id, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: REFRESH_EXPIRES_IN }
    );

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles,
        business: {
          id: user.business.id,
          name: user.business.name,
        },
      },
    };
  }

  static async refresh(data: RefreshDTO) {
    try {
      const decoded = jwt.verify(data.refresh_token, JWT_SECRET) as any;
      if (decoded.type !== 'refresh') throw new Error();

      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOne({
        where: { id: decoded.user_id },
        relations: { business: true, user_roles: { role: true } },
      });

      if (!user) throw new Error();

      const roles = user.user_roles.map((ur) => ur.role.name);

      const access_token = jwt.sign(
        { user_id: user.id, business_id: user.business.id, roles, type: 'access' },
        JWT_SECRET,
        { expiresIn: ACCESS_EXPIRES_IN }
      );

      const refresh_token = jwt.sign(
        { user_id: user.id, type: 'refresh' },
        JWT_SECRET,
        { expiresIn: REFRESH_EXPIRES_IN }
      );

      return { access_token, refresh_token };
    } catch {
      throw { status: 401, message: 'Invalid or expired refresh token' };
    }
  }

  static async resendOtp(data: ResendOtpDTO) {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: data.user_id } });
    
    if (!user) throw { status: 404, message: 'User not found' };

    const destination = data.channel === OtpChannel.PHONE ? user.phone : user.email;
    await OtpService.createVerification(user, data.channel as import('../entities/enums').OtpChannel, destination, data.purpose as import('../entities/enums').OtpPurpose);

    return { message: 'OTP sent successfully.' };
  }
}
