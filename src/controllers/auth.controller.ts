import { Route, Post, Body, Controller, Tags, SuccessResponse } from 'tsoa';
import { AuthService } from '../services/auth.service';
import {
  SignupDto,
  VerifyOtpDto,
  ResendOtpDto,
  LoginDto,
  RefreshDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  SignupResponseDto,
  VerifyOtpResponseDto,
  LoginResponseDto,
  RefreshResponseDto
} from '../dtos/auth.dto';

@Route('auth')
@Tags('Auth')
export class AuthController extends Controller {
  @Post('signup')
  @SuccessResponse('201', 'Created')
  public async signup(@Body() body: SignupDto): Promise<SignupResponseDto> {
    body.email = body.email.trim().toLowerCase();
    const data = await AuthService.signup(body as any);
    this.setStatus(201);
    return { message: 'Account created. Please verify your email and phone number.', ...data };
  }

  @Post('verify-otp')
  public async verifyOtp(@Body() body: VerifyOtpDto): Promise<VerifyOtpResponseDto> {
    const data = await AuthService.verifyOtp(body);
    const msg = data.is_complete === false 
      ? 'Channel verified successfully. Please verify your other channel to complete signup.'
      : 'Verification successful.';
    return { message: msg, ...data };
  }

  @Post('resend-otp')
  public async resendOtp(@Body() body: ResendOtpDto): Promise<{ message: string }> {
    await AuthService.resendOtp(body);
    return { message: 'A new OTP has been sent.' };
  }

  @Post('login')
  public async login(@Body() body: LoginDto): Promise<LoginResponseDto> {
    body.email = body.email.trim().toLowerCase();
    return AuthService.login(body);
  }

  @Post('refresh')
  public async refresh(@Body() body: RefreshDto): Promise<RefreshResponseDto> {
    return AuthService.refresh(body.refresh_token);
  }

  @Post('forgot-password')
  public async forgotPassword(@Body() body: ForgotPasswordDto): Promise<{ message: string }> {
    body.email = body.email.trim().toLowerCase();
    await AuthService.forgotPassword(body.email);
    return { message: 'If an account exists, a reset code has been sent.' };
  }

  @Post('reset-password')
  public async resetPassword(@Body() body: ResetPasswordDto): Promise<{ message: string }> {
    body.email = body.email.trim().toLowerCase();
    await AuthService.resetPassword(body.email, body.code, body.new_password);
    return { message: 'Password reset successfully' };
  }
}
