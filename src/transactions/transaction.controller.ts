import {
  Controller,
  Get,
  Query,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import { TransactionsService } from './transactions.service';
import { TransactionQueryDto } from './dto/transaction.query.dto';
import { JwtGuard } from '../auth/jwt.guard';
import { WalletService } from '../wallet/wallet.service';

@Controller('wallet/transactions')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly walletService: WalletService,
  ) {}

  @UseGuards(JwtGuard)
  @Get()
  async getTransactions(
    @Request() request: any,
    @Query() query: TransactionQueryDto,
  ) {
    const wallet = await this.walletService.findByUserId(request.user.userId);

    return this.transactionsService.findUserTransactions(wallet.id, query);
  }

  @UseGuards(JwtGuard)
  @Get('export')
  async exportTransactions(
    @Request() request: any,
    @Query() query: TransactionQueryDto,
    @Res() response: Response,
  ) {
    const wallet = await this.walletService.findByUserId(request.user.userId);

    const csv = await this.transactionsService.exportTransactions(
      wallet.id,
      query,
    );

    response.setHeader('Content-Type', 'text/csv');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="transactions.csv"',
    );

    response.send(csv);
  }

  @UseGuards(JwtGuard)
  @Get('export/pdf')
  async exportTransactionsPdf(
    @Request() request: any,
    @Query() query: TransactionQueryDto,
    @Res() response: Response,
  ) {
    const wallet = await this.walletService.findByUserId(request.user.userId);

    const document = await this.transactionsService.exportTransactionsPdf(
      wallet.id,
      query,
    );

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="transactions.pdf"',
    );

    document.pipe(response);
  }
}
