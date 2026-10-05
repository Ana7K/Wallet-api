import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import Decimal from 'decimal.js';

import { Wallet } from './wallet.entity';
import { TransferDto } from './dto/transfer.dto';
import { User } from '../users/user.entity';
import {
  Transaction,
  TransactionCategory,
  TransactionType,
  TransactionStatus,
} from '../transactions/transaction.entity';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,

    private readonly dataSource: DataSource,
  ) {}

  async findByUserId(userId: string) {
    // find the wallet for the user
    const wallet = await this.walletRepository.findOne({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  async transfer(senderUserId: string, transferDto: TransferDto) {
    return this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(User);
      const walletRepository = manager.getRepository(Wallet);
      const transactionRepository = manager.getRepository(Transaction);

      const receiver = await userRepository.findOne({
        where: { email: transferDto.receiver_email },
      });

      if (!receiver) {
        throw new NotFoundException('Receiver not found');
      }

      if (receiver.id === senderUserId) {
        throw new BadRequestException('You cannot transfer money to yourself');
      }

      const senderWallet = await walletRepository.findOne({
        where: { userId: senderUserId },
      });

      if (!senderWallet) {
        throw new NotFoundException('Sender wallet not found');
      }

      const receiverWallet = await walletRepository.findOne({
        where: { userId: receiver.id },
      });

      if (!receiverWallet) {
        throw new NotFoundException('Receiver wallet not found');
      }

      // const amount = Number(transferDto.amount);
      // const senderBalance = Number(senderWallet.balance);

      // if (senderBalance < amount) {
      //   throw new BadRequestException('Insufficient balance');
      // }

      // senderWallet.balance = (senderBalance - amount).toFixed(2);

      // receiverWallet.balance = (
      //   Number(receiverWallet.balance) + amount
      // ).toFixed(2);

      const amount = new Decimal(transferDto.amount);
      const senderBalance = new Decimal(senderWallet.balance);
      const receiverBalance = new Decimal(receiverWallet.balance);

      if (senderBalance.lessThan(amount)) {
        throw new BadRequestException('Insufficient balance');
      }

      senderWallet.balance = senderBalance.minus(amount).toFixed(2);

      receiverWallet.balance = receiverBalance.plus(amount).toFixed(2);

      /////////////////////////////

      await walletRepository.save(senderWallet);
      await walletRepository.save(receiverWallet);

      const expenseTransaction = transactionRepository.create({
        walletId: senderWallet.id,
        type: TransactionType.EXPENSE,
        category: TransactionCategory.TRANSFER,
        amount: amount.toFixed(2),
        status: TransactionStatus.COMPLETED,
        description: transferDto.description ?? null,
        referenceId: null,
        counterpartyWalletId: receiverWallet.id,
      });

      const incomeTransaction = transactionRepository.create({
        walletId: receiverWallet.id,
        type: TransactionType.INCOME,
        category: TransactionCategory.TRANSFER,
        amount: amount.toFixed(2),
        status: TransactionStatus.COMPLETED,
        description: transferDto.description ?? null,
        referenceId: null,
        counterpartyWalletId: senderWallet.id,
      });

      await transactionRepository.save(expenseTransaction);
      await transactionRepository.save(incomeTransaction);

      return {
        message: 'Transfer completed successfully',
        transfer: {
          amount: amount.toFixed(2),
          receiver: {
            id: receiver.id,
            email: receiver.email,
          },
          description: transferDto.description ?? null,
        },
        senderWallet: {
          id: senderWallet.id,
          balance: senderWallet.balance,
        },
        receiverWallet: {
          id: receiverWallet.id,
          balance: receiverWallet.balance,
        },
      };
    });
  }

  async getAnalytics(userId: string) {
    const wallet = await this.findByUserId(userId);

    const totals = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select(
        `COALESCE(SUM(CASE
          WHEN transaction.type = 'INCOME'
          AND transaction.status = 'COMPLETED'
          THEN transaction.amount
          ELSE 0
        END), 0)`,
        'totalIncome',
      )
      .addSelect(
        `COALESCE(SUM(CASE
          WHEN transaction.type = 'EXPENSE'
          AND transaction.status = 'COMPLETED'
          THEN transaction.amount
          ELSE 0
        END), 0)`,
        'totalExpense',
      )
      .where('transaction.walletId = :walletId', {
        walletId: wallet.id,
      })
      .getRawOne();

    const monthly = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select(`TO_CHAR(transaction.createdAt, 'YYYY-MM')`, 'month')
      .addSelect(
        `COALESCE(SUM(CASE
          WHEN transaction.type = 'INCOME'
          AND transaction.status = 'COMPLETED'
          THEN transaction.amount
          ELSE 0
        END), 0)`,
        'income',
      )
      .addSelect(
        `COALESCE(SUM(CASE
          WHEN transaction.type = 'EXPENSE'
          AND transaction.status = 'COMPLETED'
          THEN transaction.amount
          ELSE 0
        END), 0)`,
        'expense',
      )
      .where('transaction.walletId = :walletId', {
        walletId: wallet.id,
      })
      .groupBy(`TO_CHAR(transaction.createdAt, 'YYYY-MM')`)
      .orderBy('month', 'ASC')
      .getRawMany();

    return {
      totalIncome: totals.totalIncome,
      totalExpense: totals.totalExpense,
      monthly,
    };
  }
}
