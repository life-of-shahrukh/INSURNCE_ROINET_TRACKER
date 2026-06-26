import {
  BadRequestException,
  Injectable,
  Inject,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import type { Logger } from 'winston';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';

const OTP_VALID_MINUTES = 15;
const OTP_RATE_LIMIT_SECONDS = 60;
const BCRYPT_ROUNDS = 10;

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async sendOtp(mobile: string): Promise<{ requestId: string }> {
    await this.enforceRateLimit(mobile);

    const code = this.generateOtp();
    const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS);
    const expiresAt = new Date(Date.now() + OTP_VALID_MINUTES * 60 * 1000);

    const record = await this.prisma.otpRequest.create({
      data: { mobile, codeHash, expiresAt },
    });

    await this.dispatchSms(mobile, code);

    this.logger.info('OTP sent', {
      context: 'OtpService',
      mobileMasked: `***${mobile.slice(-4)}`,
      requestId: record.id,
      expiresAt,
    });
    return { requestId: record.id };
  }

  async verifyOtp(
    requestId: string,
    code: string,
    customerId?: string,
  ): Promise<{ verified: boolean }> {
    const record = await this.prisma.otpRequest.findUnique({
      where: { id: requestId },
    });

    if (!record) {
      throw new BadRequestException('Invalid OTP request');
    }
    if (record.used) {
      throw new BadRequestException('OTP has already been used');
    }
    if (record.expiresAt < new Date()) {
      throw new BadRequestException('OTP has expired');
    }

    const match = await bcrypt.compare(code, record.codeHash);
    if (!match) {
      this.logger.warn('OTP verification failed: incorrect code', {
        context: 'OtpService',
        requestId,
      });
      throw new BadRequestException('Incorrect OTP');
    }

    await this.prisma.otpRequest.update({
      where: { id: requestId },
      data: { used: true },
    });

    if (customerId) {
      await this.prisma.customer.update({
        where: { id: customerId },
        data: { mobileVerified: true },
      });
      this.logger.info('Customer mobile verified via OTP', {
        context: 'OtpService',
        customerId,
        requestId,
      });
    } else {
      this.logger.info('OTP verified', { context: 'OtpService', requestId });
    }

    return { verified: true };
  }

  private async enforceRateLimit(mobile: string): Promise<void> {
    const since = new Date(Date.now() - OTP_RATE_LIMIT_SECONDS * 1000);
    const recent = await this.prisma.otpRequest.findFirst({
      where: { mobile, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
    });
    if (recent) {
      const waitSeconds = Math.ceil(
        (recent.createdAt.getTime() + OTP_RATE_LIMIT_SECONDS * 1000 - Date.now()) / 1000,
      );
      throw new BadRequestException(
        `Please wait ${waitSeconds}s before requesting another OTP`,
      );
    }
  }

  private generateOtp(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  private async dispatchSms(mobile: string, code: string): Promise<void> {
    const username = this.config.get<string>('TELSP_USERNAME') ?? '';
    const apiKey = this.config.get<string>('TELSP_API_KEY') ?? '';
    const entityId = this.config.get<string>('TELSP_ENTITY_ID') ?? '';
    const templateId = this.config.get<string>('TELSP_TEMPLATE_ID') ?? '';
    const signature = this.config.get<string>('TELSP_SIGNATURE') ?? 'ROIINS';

    const msgText = encodeURIComponent(
      `Your OTP is ${code} and is valid for ${OTP_VALID_MINUTES} minutes. Please use this OTP to verify your account -ROI NET INSURANCE BROKERS `,
    );

    const url =
      `https://api.telsp.in/pushapi/sendmsg` +
      `?username=${username}` +
      `&dest=${mobile}` +
      `&apikey=${apiKey}` +
      `&signature=${signature}` +
      `&msgtype=PM` +
      `&msgtxt=${msgText}` +
      `&entityid=${entityId}` +
      `&templateid=${templateId}`;

    const resp = await fetch(url);
    if (!resp.ok) {
      this.logger.error('Telsp SMS dispatch failed', {
        context: 'OtpService',
        httpStatus: resp.status,
        mobileMasked: `***${mobile.slice(-4)}`,
      });
      throw new ServiceUnavailableException('Failed to send OTP SMS');
    }
    const body = await resp.text();
    this.logger.info('Telsp SMS dispatched', {
      context: 'OtpService',
      mobileMasked: `***${mobile.slice(-4)}`,
      telspResponse: body,
    });
  }
}
