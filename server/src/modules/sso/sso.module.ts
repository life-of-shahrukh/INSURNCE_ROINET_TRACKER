import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SsoController } from './sso.controller';
import { SsoService } from './sso.service';
import { UserRepository } from '../auth/user.repository';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
      signOptions: { expiresIn: '8h' },
    }),
  ],
  controllers: [SsoController],
  providers: [SsoService, UserRepository],
})
export class SsoModule {}
