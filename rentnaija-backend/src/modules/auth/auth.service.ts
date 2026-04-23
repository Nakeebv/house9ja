import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  const visible = local.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(local.length - 2, 3))}@${domain}`;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private email: EmailService,
  ) {}

  async register(data: {
    email: string;
    phone: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'TENANT' | 'LANDLORD' | 'AGENT';
    acceptedTerms: boolean;
  }) {
    if (!data.acceptedTerms) {
      throw new BadRequestException('You must accept the Terms & Conditions to register.');
    }

    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { phone: data.phone }] },
    });
    if (exists) throw new ConflictException('Email or phone already registered');

    const passwordHash = await bcrypt.hash(data.password, 12);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        acceptedTerms: true,
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: expiry,
      },
      select: {
        id: true, email: true, phone: true,
        firstName: true, lastName: true, role: true,
        isVerified: true, avatarUrl: true, createdAt: true,
        emailVerified: true,
      },
    });

    await this.email.sendVerificationEmail(user.email, user.firstName, verificationToken);

    return { status: 'success', data: { message: 'Registration successful. Please verify your email before signing in.' } };
  }

  async login(email: string, password: string) {
    const GENERIC_ERROR = 'Invalid email or password';

    const user = await this.prisma.user.findUnique({ where: { email } });

    const dummyHash = '$2a$12$invalidhashtopreventtimingattacksXXXXXXXXXXXXXXXXXXXXX';
    const valid = await bcrypt.compare(password, user?.passwordHash ?? dummyHash);

    if (!user || !user.passwordHash || !valid) {
      if (user) {
        const attempts = user.failedLoginAttempts + 1;
        const shouldLock = attempts >= MAX_FAILED_ATTEMPTS;
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: attempts,
            lockedUntil: shouldLock
              ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
              : undefined,
          },
        });
        if (shouldLock) {
          this.logger.warn(`Account locked after ${MAX_FAILED_ATTEMPTS} failed attempts: ${email}`);
        }
      }
      throw new UnauthorizedException(GENERIC_ERROR);
    }

    if (user.deletedAt) throw new UnauthorizedException('Account is deactivated');
    if (user.isBlocked) throw new UnauthorizedException('Account has been suspended. Please contact support.');

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(
        `Account temporarily locked due to too many failed login attempts. Try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`,
      );
    }

    if (!user.emailVerified) throw new UnauthorizedException('EMAIL_NOT_VERIFIED');

    // Reset failed attempts
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    // Issue OTP instead of JWT
    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: otpHash,
        otpExpiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
        otpAttempts: 0,
      },
    });

    await this.email.sendOtpEmail(user.email, user.firstName, otp);

    return {
      status: 'otp_required',
      data: { email: maskEmail(user.email) },
    };
  }

  async verifyOtp(email: string, otp: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.otpCode || !user.otpExpiresAt) {
      throw new UnauthorizedException('No pending verification for this account');
    }

    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { otpCode: null, otpExpiresAt: null, otpAttempts: 0 },
      });
      throw new UnauthorizedException('Too many incorrect attempts. Please log in again.');
    }

    if (user.otpExpiresAt < new Date()) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { otpCode: null, otpExpiresAt: null, otpAttempts: 0 },
      });
      throw new UnauthorizedException('OTP_EXPIRED');
    }

    const otpHash = hashOtp(otp);
    if (otpHash !== user.otpCode) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { otpAttempts: user.otpAttempts + 1 },
      });
      const remaining = MAX_OTP_ATTEMPTS - (user.otpAttempts + 1);
      throw new UnauthorizedException(
        remaining > 0
          ? `Incorrect code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
          : 'Too many incorrect attempts. Please log in again.',
      );
    }

    // OTP valid — clear it, issue JWT
    await this.prisma.user.update({
      where: { id: user.id },
      data: { otpCode: null, otpExpiresAt: null, otpAttempts: 0 },
    });

    const token = this.jwt.sign({ sub: user.id, role: user.role });
    const { passwordHash, emailVerificationToken, emailVerificationExpiry, failedLoginAttempts, lockedUntil, otpCode, otpExpiresAt, otpAttempts, ...safeUser } = user;
    return { status: 'success', data: { user: safeUser, accessToken: token } };
  }

  async resendOtp(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Always succeed to prevent enumeration
    if (!user || !user.emailVerified) {
      return { status: 'success', data: { message: 'If that account exists, a new code has been sent.' } };
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: otpHash,
        otpExpiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
        otpAttempts: 0,
      },
    });

    await this.email.sendOtpEmail(user.email, user.firstName, otp);
    return { status: 'success', data: { message: 'New code sent.' } };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpiry: { gt: new Date() },
      },
    });
    if (!user) throw new BadRequestException('Invalid or expired verification link');

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      },
    });

    return { status: 'success', data: { message: 'Email verified successfully. You can now sign in.' } };
  }

  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.emailVerified) {
      return { status: 'success', data: { message: 'If that email exists, a verification link has been sent.' } };
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken: verificationToken, emailVerificationExpiry: expiry },
    });

    await this.email.sendVerificationEmail(user.email, user.firstName, verificationToken);
    return { status: 'success', data: { message: 'Verification email sent.' } };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Always return success to prevent email enumeration
    if (!user || !user.emailVerified || user.deletedAt) {
      return { status: 'success', data: { message: 'If that account exists, a reset link has been sent.' } };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry: expiry },
    });

    await this.email.sendPasswordResetEmail(user.email, user.firstName, resetToken);
    return { status: 'success', data: { message: 'If that account exists, a reset link has been sent.' } };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
    });
    if (!user) throw new BadRequestException('Invalid or expired reset link. Please request a new one.');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExpiry: null, failedLoginAttempts: 0, lockedUntil: null },
    });

    return { status: 'success', data: { message: 'Password reset successfully. You can now sign in.' } };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, phone: true,
        firstName: true, lastName: true, role: true,
        isVerified: true, isVerifiedLandlord: true, avatarUrl: true,
        emailVerified: true,
      },
    });
    return user;
  }
}
