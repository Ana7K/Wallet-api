import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import { WalletService } from './wallet.service';
import { JwtGuard } from '../auth/jwt.guard';
import { TransferDto } from './dto/transfer.dto';

import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @UseGuards(JwtGuard)
  @Get()
  // only allows requests with a valid JWT to access this endpoint
  getWallet(@Request() request: any) {
    // find the wallet for the user
    return this.walletService.findByUserId(request.user.userId);
  }

  @UseGuards(JwtGuard)
  @Post('transfer')
  transfer(@Request() request: any, @Body() transferDto: TransferDto) {
    return this.walletService.transfer(request.user.userId, transferDto);
  }

  @UseGuards(JwtGuard)
  @Get('analytics')
  async getAnalytics(@Request() request: any) {
    return this.walletService.getAnalytics(request.user.userId);
  }
}
