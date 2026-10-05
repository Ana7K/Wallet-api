import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

// defining the possible transaction types
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

// defining the possible transaction categories
export enum TransactionCategory {
  TOPUP = 'TOPUP',
  TRANSFER = 'TRANSFER',
}

// defining the possible transaction statuses
export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// telling TypeORM to create a transactions table in the database
@Entity('transactions')
@Index(['walletId', 'createdAt']) // index on walletId and createdAt columns for faster queries
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string; // auto-incrementing ID

  @Column()
  walletId!: string; // wallet ID of the transaction

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type!: TransactionType; // type of transaction (income or expense)

  @Column({
    type: 'enum',
    enum: TransactionCategory,
  })
  category!: TransactionCategory; // category of transaction (topup or transfer)

  @Column({
    type: 'numeric',
    precision: 15,
    scale: 2,
  })
  amount!: string; // amount of transaction

  @Column({
    type: 'enum',
    enum: TransactionStatus,
  })
  status!: TransactionStatus; // status of transaction (pending, completed, failed)

  @Column({ type: 'varchar', nullable: true })
  description!: string | null; // description of transaction

  @Column({ type: 'varchar', nullable: true })
  referenceId!: string | null; // reference ID of transaction

  @Column({ type: 'varchar', nullable: true })
  counterpartyWalletId!: string | null; // counterparty / other user'swallet ID

  @CreateDateColumn()
  createdAt!: Date; // date and time the transaction was made
}
