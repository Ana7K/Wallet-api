import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Wallet } from './wallet.entity';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { User } from '../users/user.entity';
import { Transaction } from '../transactions/transaction.entity';

@Module({
  // registers the Wallet entity with the database
  imports: [TypeOrmModule.forFeature([Wallet, User, Transaction])],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
