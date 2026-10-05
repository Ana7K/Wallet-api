import {
  Body,
  Controller,
  Headers,
  Post,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { PaymentsService } from './payments.service';
import { CheckoutDto } from './dto/checkout.dto';
import { JwtGuard } from '../auth/jwt.guard';
import { WebhookDto } from './dto/webhook.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtGuard)
  @Post('checkout')
  checkout(@Request() request: any, @Body() checkoutDto: CheckoutDto) {
    return this.paymentsService.checkout(request.user.userId, checkoutDto);
  }

  @Post('webhook')
  webhook(
    @Headers('x-webhook-secret') webhookSecret: string,
    @Body() webhookDto: WebhookDto,
  ) {
    // check if the webhook secret is valid
    if (webhookSecret !== process.env.WEBHOOK_SECRET) {
      throw new UnauthorizedException('Invalid webhook secret');
    }

    // process the webhook
    return this.paymentsService.webhook(
      webhookDto.transaction_id,
      webhookDto.status,
    );
  }
}
