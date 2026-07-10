import { AppDataSource } from '../data-source';
import { Invitation } from '../entities/Invitation';
import { User } from '../entities/User';
import { Role } from '../entities/Role';
import { UserRole } from '../entities/UserRole';
import { AppError } from '../utils/AppError';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export class InvitationService {
  private static inviteRepo = AppDataSource.getRepository(Invitation);
  private static userRepo = AppDataSource.getRepository(User);
  private static roleRepo = AppDataSource.getRepository(Role);

  static async inviteUser(businessId: number, invitedById: number, email: string, roleId: number) {
    const existingUser = await this.userRepo.findOne({ where: { email } });
    if (existingUser) throw new AppError(409, 'User with this email already exists');

    const role = await this.roleRepo.findOne({ where: { id: roleId } });
    if (!role) throw new AppError(404, 'Role not found');
    if (!role.is_system && role.business && role.business.id !== businessId) {
      throw new AppError(403, 'Invalid role for this business');
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(rawToken, 12);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = this.inviteRepo.create({
      business: { id: businessId },
      invited_by: { id: invitedById },
      email,
      role: { id: roleId },
      token_hash: tokenHash,
      expires_at: expiresAt
    });

    try {
      await this.inviteRepo.save(invitation);
    } catch (err: any) {
      if (err.code === '23505') {
        throw new AppError(409, 'An invitation already exists for this email in this business');
      }
      throw err;
    }

    // In a real app, send the rawToken via email (e.g. https://frontend.com/accept-invite?token=rawToken)
    console.log(`[Email Mock] Sent invite to ${email} with token: ${rawToken}`);

    return {
      invitation_id: invitation.id,
      expires_at: invitation.expires_at
    };
  }

  static async acceptInvite(email: string, businessId: number, token: string, name: string, phone: string, password: string) {
    const validInvitation = await this.inviteRepo.findOne({
      where: { 
        email, 
        business: { id: businessId },
        accepted_at: null as any 
      },
      relations: { business: true, role: true, invited_by: true }
    });

    if (!validInvitation) {
      throw new AppError(400, 'Invalid or expired invitation');
    }

    if (validInvitation.expires_at < new Date()) {
      throw new AppError(400, 'Invitation has expired');
    }

    const isValid = await bcrypt.compare(token, validInvitation.token_hash);
    if (!isValid) {
      throw new AppError(400, 'Invalid or expired invitation');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    try {
      return await AppDataSource.manager.transaction(async (manager) => {
        const user = manager.create(User, {
          business: { id: validInvitation.business.id },
          name,
          email: validInvitation.email,
          phone,
          password: hashedPassword,
          is_email_verified: true,
          created_by: { id: validInvitation.invited_by.id }
        });
        await manager.save(user);

        const userRole = manager.create(UserRole, {
          user: { id: user.id },
          role: { id: validInvitation.role.id }
        });
        await manager.save(userRole);

        validInvitation.accepted_at = new Date();
        await manager.save(validInvitation);

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
          user: { id: user.id, name: user.name, email: user.email },
          tokens: { access_token: accessToken, refresh_token: refreshToken }
        };
      });
    } catch (err: any) {
      if (err.code === '23505') {
        if (err.detail.includes('phone')) throw new AppError(409, 'Phone number is already registered');
        if (err.detail.includes('email')) throw new AppError(409, 'Email is already registered');
      }
      throw err;
    }
  }

  static async getInvitations(businessId: number) {
    const invitations = await this.inviteRepo.find({
      where: { business: { id: businessId }, accepted_at: null as any },
      relations: { role: true, invited_by: true },
      order: { created_at: 'DESC' }
    });

    return invitations.map(inv => ({
      id: inv.id,
      email: inv.email,
      role: { id: inv.role.id, name: inv.role.name },
      invited_by: { id: inv.invited_by.id, name: inv.invited_by.name },
      is_expired: inv.expires_at < new Date(),
      expires_at: inv.expires_at,
      created_at: inv.created_at
    }));
  }

  static async deleteInvitation(businessId: number, invitationId: number): Promise<void> {
    const invitation = await this.inviteRepo.findOne({
      where: { id: invitationId, business: { id: businessId } }
    });

    if (!invitation) throw new AppError(404, 'Invitation not found');
    if (invitation.accepted_at) throw new AppError(400, 'Cannot cancel an accepted invitation');

    await this.inviteRepo.remove(invitation);
  }
}
