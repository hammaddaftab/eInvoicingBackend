import { AppDataSource } from '../data-source';
import { Invitation } from '../entities/Invitation';
import { User } from '../entities/User';
import { UserRole } from '../entities/UserRole';
import { Role } from '../entities/Role';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export class InvitationService {
  static async invite(businessId: number, invitedById: number, email: string, roleId: number) {
    const userRepo = AppDataSource.getRepository(User);
    const roleRepo = AppDataSource.getRepository(Role);
    const inviteRepo = AppDataSource.getRepository(Invitation);

    // 1. Check if email already exists as a user
    const existingUser = await userRepo.findOne({ where: { email } });
    if (existingUser) {
      throw { status: 409, message: 'User with this email already exists' };
    }

    // 2. Validate role
    const role = await roleRepo.findOne({ 
      where: { id: roleId },
      relations: { business: true } 
    });
    if (!role) throw { status: 404, message: 'Role not found' };
    if (role.business.id !== businessId) {
      throw { status: 403, message: 'Invalid role for this business' };
    }

    // 3. Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const token_hash = await bcrypt.hash(token, 10);
    
    // Expires in 7 days
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + 7);

    // 4. Upsert Invitation (if one already exists, replace it, but TypeORM handles conflicts based on UNIQUE constraint)
    // We can delete the old one or overwrite it. Let's delete the old one if it's pending.
    await inviteRepo.delete({ email, business: { id: businessId }, accepted_at: null as any });

    const invitation = inviteRepo.create({
      business: { id: businessId },
      invited_by: { id: invitedById },
      role: { id: roleId },
      email,
      token_hash,
      expires_at
    });

    await inviteRepo.save(invitation);

    // In a real application, you would send the plain `token` via email here.
    return { 
      message: 'Invitation sent successfully', 
      _development_token: token 
    };
  }

  static async acceptInvite(email: string, businessId: number, token: string, name: string, phone: string, password: string) {
    const inviteRepo = AppDataSource.getRepository(Invitation);
    const userRepo = AppDataSource.getRepository(User);

    // Look up the exact invitation using the unique compound index
    const validInvitation = await inviteRepo.findOne({
      where: { 
        email, 
        business: { id: businessId },
        accepted_at: null as any 
      },
      relations: { business: true, role: true }
    });

    if (!validInvitation) {
      throw { status: 400, message: 'Invalid or expired invitation' };
    }

    if (validInvitation.expires_at < new Date()) {
      throw { status: 400, message: 'Invitation has expired' };
    }

    const isValid = await bcrypt.compare(token, validInvitation.token_hash);
    if (!isValid) {
      throw { status: 400, message: 'Invalid or expired invitation' };
    }

    // Check phone uniqueness
    const existingPhone = await userRepo.findOne({ where: { phone } });
    if (existingPhone) throw { status: 409, message: 'Phone number is already registered' };

    const hashedPassword = await bcrypt.hash(password, 12);

    return await AppDataSource.manager.transaction(async (manager) => {
      // 1. Create User
      const user = manager.create(User, {
        business: { id: validInvitation.business.id },
        name,
        email: validInvitation.email,
        phone,
        password: hashedPassword,
        is_email_verified: true, // Auto-verified because they clicked the email link
        created_by: { id: validInvitation.invited_by.id }
      });
      await manager.save(user);

      // 2. Assign Role
      const userRole = manager.create(UserRole, {
        user: { id: user.id },
        role: { id: validInvitation.role.id }
      });
      await manager.save(userRole);

      // 3. Mark Invitation Accepted
      validInvitation.accepted_at = new Date();
      await manager.save(validInvitation);

      // 4. Generate JWT
      const accessToken = jwt.sign(
        { user_id: user.id, business_id: validInvitation.business.id, roles: [validInvitation.role.name], type: 'access' },
        JWT_SECRET,
        { expiresIn: '15m' }
      );
      const refreshToken = jwt.sign(
        { user_id: user.id, type: 'refresh' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        message: 'Invitation accepted successfully',
        user: { id: user.id, name: user.name, email: user.email },
        tokens: { access_token: accessToken, refresh_token: refreshToken }
      };
    });
  }

  static async getInvitations(businessId: number) {
    const inviteRepo = AppDataSource.getRepository(Invitation);
    const invitations = await inviteRepo.find({
      where: { business: { id: businessId }, accepted_at: null as any },
      relations: { role: true, invited_by: true },
      order: { created_at: 'DESC' }
    });

    return {
      invitations: invitations.map(inv => ({
        id: inv.id,
        email: inv.email,
        role: { id: inv.role.id, name: inv.role.name },
        invited_by: { id: inv.invited_by.id, name: inv.invited_by.name },
        is_expired: inv.expires_at < new Date(),
        expires_at: inv.expires_at,
        created_at: inv.created_at
      }))
    };
  }

  static async deleteInvitation(businessId: number, invitationId: number) {
    const inviteRepo = AppDataSource.getRepository(Invitation);
    const invitation = await inviteRepo.findOne({
      where: { id: invitationId, business: { id: businessId } }
    });

    if (!invitation) throw { status: 404, message: 'Invitation not found' };
    if (invitation.accepted_at) throw { status: 400, message: 'Cannot cancel an accepted invitation' };

    await inviteRepo.remove(invitation);

    return { message: 'Invitation cancelled successfully' };
  }
}
