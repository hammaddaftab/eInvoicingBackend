import { AppDataSource } from '../data-source';
import { OtpVerification } from '../entities/OtpVerification';
import { OtpChannel, OtpPurpose } from '../entities/enums';
import { User } from '../entities/User';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export class OtpService {
  private static repo = AppDataSource.getRepository(OtpVerification);

  private static generateRandomCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async sendOtp(channel: OtpChannel, destination: string, code: string) {
    // Mock sending mechanism
    console.log(`[OTP] Sending ${code} to ${channel}: ${destination}`);
  }

  static async createVerification(user: User, channel: OtpChannel, destination: string, purpose: OtpPurpose) {
    const code = this.generateRandomCode();
    const code_hash = await bcrypt.hash(code, 10);
    const expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const verification = this.repo.create({
      user,
      channel,
      destination,
      code_hash,
      purpose,
      expires_at,
    });

    await this.repo.save(verification);
    await this.sendOtp(channel, destination, code);
    
    return verification;
  }

  static async verifyOtp(userId: number, channel: OtpChannel, purpose: OtpPurpose, code: string) {
    const verification = await this.repo.findOne({
      where: {
        user: { id: userId },
        channel,
        purpose,
      },
      order: { created_at: 'DESC' },
    });

    if (!verification || verification.verified_at) {
      throw { status: 400, message: 'Invalid or expired OTP' };
    }

    if (verification.expires_at < new Date()) {
      throw { status: 400, message: 'OTP has expired' };
    }

    if (verification.attempts >= verification.max_attempts) {
      throw { status: 429, message: 'Too many attempts. Please request a new OTP.' };
    }

    const isValid = await bcrypt.compare(code, verification.code_hash);

    if (!isValid) {
      verification.attempts += 1;
      await this.repo.save(verification);
      throw { status: 400, message: 'Invalid code' };
    }

    verification.verified_at = new Date();
    await this.repo.save(verification);

    return true;
  }
}
