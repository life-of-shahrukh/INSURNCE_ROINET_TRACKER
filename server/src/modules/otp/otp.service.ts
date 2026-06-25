import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';

const OTP_VALID_MINUTES = 15;
const OTP_RATE_LIMIT_SECONDS = 60;
const BCRYPT_ROUNDS = 10;

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
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

    this.logger.log(`OTP sent to mobile ending ***${mobile.slice(-4)}`);
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
      this.logger.log(`Customer ${customerId} mobile verified via OTP`);
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
      this.logger.error(`Telsp SMS failed: HTTP ${resp.status}`);
      throw new ServiceUnavailableException('Failed to send OTP SMS');
    }
    const body = await resp.text();
    this.logger.log(`Telsp response: ${body}`);
  }
}
