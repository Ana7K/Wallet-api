import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { UsersModule } from './users/users.module';
import { WalletModule } from './wallet/wallet.module';
import { TransactionsModule } from './transactions/transactions.module';
import { AuthModule } from './auth/auth.module';
import { PaymentsModule } from './payments/payments.module';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    // loading .env variables
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 sec
        limit: 20, // max 20 req
      },
    ]),

    // connecting to the database NestJS -> TypeORM -> PostgreSQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),

    UsersModule,
    WalletModule,
    TransactionsModule,
    AuthModule,
    PaymentsModule,
  ],

  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
