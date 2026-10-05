import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import {
  Transaction,
  TransactionCategory,
  TransactionStatus,
  TransactionType,
} from '../transactions/transaction.entity';
import { Wallet } from '../wallet/wallet.entity';
import { CheckoutDto } from './dto/checkout.dto';
import Decimal from 'decimal.js';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,

    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,

    private readonly dataSource: DataSource,
  ) {}

  async checkout(userId: string, checkoutDto: CheckoutDto) {
    const wallet = await this.walletRepository.findOne({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const transaction = this.transactionRepository.create({
      walletId: wallet.id,
      type: TransactionType.INCOME,
      category: TransactionCategory.TOPUP,
      amount: checkoutDto.amount.toFixed(2),
      status: TransactionStatus.PENDING,
      description: 'Wallet top-up',
      referenceId: null,
      counterpartyWalletId: null,
    });

    await this.transactionRepository.save(transaction);

    return {
      message: 'Payment created',
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        status: transaction.status,
        category: transaction.category,
      },
    };
  }

  async webhook(transactionId: string, status: string) {
    return this.dataSource.transaction(async (manager) => {
      const transactionRepository = manager.getRepository(Transaction);
      const walletRepository = manager.getRepository(Wallet);

      const transaction = await transactionRepository.findOne({
        where: { id: transactionId },
      });

      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }

      if (transaction.status === TransactionStatus.COMPLETED) {
        return {
          message: 'Transaction already completed',
          transaction,
        };
      }

      if (status === 'FAILED') {
        transaction.status = TransactionStatus.FAILED;

        await transactionRepository.save(transaction);

        return {
          message: 'Payment failed',
          transaction,
        };
      }

      if (status !== 'SUCCESS') {
        throw new BadRequestException('Invalid payment status');
      }

      const wallet = await walletRepository.findOne({
        where: { id: transaction.walletId },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      // wallet.balance = (
      //   Number(wallet.balance) + Number(transaction.amount)
      // ).toFixed(2);
      const walletBalance = new Decimal(wallet.balance);
      const transactionAmount = new Decimal(transaction.amount);

      wallet.balance = walletBalance.plus(transactionAmount).toFixed(2);

      transaction.status = TransactionStatus.COMPLETED;

      await walletRepository.save(wallet);
      await transactionRepository.save(transaction);

      return {
        message: 'Payment completed',
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
          status: transaction.status,
        },
        wallet: {
          id: wallet.id,
          balance: wallet.balance,
        },
      };
    });
  }
}
