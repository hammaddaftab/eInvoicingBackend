import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { AuthController } from '../controllers/auth.controller';
import { Emirate, OtpChannel, OtpPurpose } from '../entities/enums';

export const forgotPasswordSchema = z.object({
  email: z.email(),
});

export const resetPasswordSchema = z.object({
  email: z.email(),
  code: z.string().length(6),
  new_password: z.string().min(8),
});

const router = Router();

export const signupSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.email(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Must be a valid E.164 phone number'),
  password: z.string().min(8),
  business: z.object({
    name: z.string().min(2).max(255),
    vat_number: z.string().length(15),
    tl_number: z.string().max(50),
    industry_id: z.number().int().positive(),
    emirate: z.enum(Object.values(Emirate) as [string, ...string[]]),
  }),
});

export type SignupDTO = z.infer<typeof signupSchema>;

export const verifyOtpSchema = z.object({
  user_id: z.number().int().positive(),
  code: z.string().length(6),
  channel: z.enum(Object.values(OtpChannel) as [string, ...string[]]),
  purpose: z.enum(Object.values(OtpPurpose) as [string, ...string[]]),
});

export type VerifyOtpDTO = z.infer<typeof verifyOtpSchema>;

export const resendOtpSchema = z.object({
  user_id: z.number().int().positive(),
  channel: z.enum(Object.values(OtpChannel) as [string, ...string[]]),
  purpose: z.enum(Object.values(OtpPurpose) as [string, ...string[]]),
});

export type ResendOtpDTO = z.infer<typeof resendOtpSchema>;

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type LoginDTO = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  refresh_token: z.string().min(1),
});

export type RefreshDTO = z.infer<typeof refreshSchema>;

router.post('/signup', validate(signupSchema), AuthController.signup);
router.post('/verify-otp', validate(verifyOtpSchema), AuthController.verifyOtp);
router.post('/resend-otp', validate(resendOtpSchema), AuthController.resendOtp);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/refresh', validate(refreshSchema), AuthController.refresh);
router.post('/forgot-password', validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), AuthController.resetPassword);

export default router;
