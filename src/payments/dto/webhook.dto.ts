import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';

export enum WebhookStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export class WebhookDto {
  @IsUUID()
  @IsNotEmpty()
  transaction_id!: string;

  @IsEnum(WebhookStatus)
  status!: WebhookStatus;
}
