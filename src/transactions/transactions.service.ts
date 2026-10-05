import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import PDFDocument from 'pdfkit';

import { Transaction } from './transaction.entity';
import { TransactionQueryDto } from './dto/transaction.query.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async findUserTransactions(walletId: string, query: TransactionQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const skip = (page - 1) * limit;

    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.walletId = :walletId', { walletId });
    //This ensures the user only gets their own wallet's transactions

    if (query.type) {
      queryBuilder.andWhere('transaction.type = :type', { type: query.type });
    }

    if (query.from) {
      queryBuilder.andWhere('transaction.createdAt >= :from', {
        from: query.from,
      });
    }

    if (query.to) {
      queryBuilder.andWhere('transaction.createdAt <= :to', { to: query.to });
    }

    queryBuilder
      // means newest transactions appear first
      .orderBy('transaction.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [transactions, total] = await queryBuilder.getManyAndCount();
    // gives us both the transactions and the total count, which we use for pagination

    return {
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async exportTransactions(walletId: string, query: TransactionQueryDto) {
    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.walletId = :walletId', {
        walletId,
      });

    if (query.type) {
      queryBuilder.andWhere('transaction.type = :type', { type: query.type });
    }

    if (query.from) {
      queryBuilder.andWhere('transaction.createdAt >= :from', {
        from: query.from,
      });
    }

    if (query.to) {
      queryBuilder.andWhere('transaction.createdAt <= :to', { to: query.to });
    }

    const transactions = await queryBuilder
      .orderBy('transaction.createdAt', 'DESC')
      .getMany();

    const header = 'ID,Type,Category,Amount,Status,Description,Created At\n';

    const rows = transactions
      .map((transaction) => {
        return [
          transaction.id,
          transaction.type,
          transaction.category,
          transaction.amount,
          transaction.status,
          `"${transaction.description ?? ''}"`,
          transaction.createdAt.toISOString(),
        ].join(',');
      })
      .join('\n');

    return header + rows;
  }

  async exportTransactionsPdf(
    walletId: string,
    query: TransactionQueryDto,
  ): Promise<PDFKit.PDFDocument> {
    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.walletId = :walletId', {
        walletId,
      });

    if (query.type) {
      queryBuilder.andWhere('transaction.type = :type', { type: query.type });
    }

    if (query.from) {
      queryBuilder.andWhere('transaction.createdAt >= :from', {
        from: query.from,
      });
    }

    if (query.to) {
      queryBuilder.andWhere('transaction.createdAt <= :to', { to: query.to });
    }

    const transactions = await queryBuilder
      .orderBy('transaction.createdAt', 'DESC')
      .getMany();

    const document = new PDFDocument({
      margin: 40,
    });

    document.fontSize(20).text('Wallet Transactions', {
      align: 'center',
    });

    document.moveDown();

    document.fontSize(10);

    for (const transaction of transactions) {
      document.text(`ID: ${transaction.id}`);

      document.text(
        `Type: ${transaction.type} | Category: ${transaction.category}`,
      );

      document.text(
        `Amount: ${transaction.amount} | Status: ${transaction.status}`,
      );

      document.text(`Description: ${transaction.description ?? ''}`);

      document.text(`Created At: ${transaction.createdAt.toISOString()}`);

      document.moveDown();
    }

    document.end();

    return document;
  }
}
