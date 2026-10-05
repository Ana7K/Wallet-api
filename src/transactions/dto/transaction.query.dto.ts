import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

import { TransactionType } from '../transaction.entity';

export class TransactionQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1; // default page is 1

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10; // default limit is 10

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
