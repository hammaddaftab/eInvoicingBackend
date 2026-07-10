import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { AuthController } from '../controllers/auth.controller';
import { Emirate, OtpChannel, OtpPurpose } from '../entities/enums';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/;
const passwordMessage = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email(),
  }).strict(),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email(),
    code: z.string().trim().regex(/^\d{6}$/, 'Must be a 6-digit number'),
    new_password: z.string().trim().min(8).regex(passwordRegex, passwordMessage),
  }).strict(),
});

const router = Router();

export const signupSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().toLowerCase().email(),
    phone: z.string().trim().regex(/^\+?[1-9]\d{1,14}$/, 'Must be a valid E.164 phone number'),
    password: z.string().trim().min(8).regex(passwordRegex, passwordMessage),
    business: z.object({
      name: z.string().trim().min(2).max(255),
      vat_number: z.string().trim().length(15),
      tl_number: z.string().trim().max(50),
      industry_id: z.number().int().positive(),
      emirate: z.nativeEnum(Emirate),
    }).strict(),
  }).strict(),
});

export type SignupDTO = z.infer<typeof signupSchema>['body'];

export const verifyOtpSchema = z.object({
  body: z.object({
    identifier: z.string().trim(),
    code: z.string().trim().regex(/^\d{6}$/, 'Must be a 6-digit number'),
    purpose: z.enum([OtpPurpose.SIGNUP, OtpPurpose.RESET_PASSWORD]),
  }).strict(),
});

export type VerifyOtpDTO = z.infer<typeof verifyOtpSchema>['body'];

export const resendOtpSchema = z.object({
  body: z.object({
    identifier: z.string().trim(),
    purpose: z.enum([OtpPurpose.SIGNUP, OtpPurpose.RESET_PASSWORD]),
  }).strict(),
});

export type ResendOtpDTO = z.infer<typeof resendOtpSchema>['body'];

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().trim().min(1),
  }).strict(),
});

export type LoginDTO = z.infer<typeof loginSchema>['body'];

export const refreshSchema = z.object({
  body: z.object({
    refresh_token: z.string().trim().min(1),
  }).strict(),
});

export type RefreshDTO = z.infer<typeof refreshSchema>['body'];

router.post('/signup', validate(signupSchema), AuthController.signup);
router.post('/verify-otp', validate(verifyOtpSchema), AuthController.verifyOtp);
router.post('/resend-otp', validate(resendOtpSchema), AuthController.resendOtp);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/refresh', validate(refreshSchema), AuthController.refresh);
router.post('/forgot-password', validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), AuthController.resetPassword);

export default router;
