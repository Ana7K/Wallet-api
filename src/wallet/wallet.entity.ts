import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

// telling TypeORM to create a wallets table in the database
@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid') // auto-incrementing ID
  id!: string;

  @Column({ unique: true }) // unique user id, one user -> one wallet
  userId!: string;

  @Column({
    type: 'numeric',
    precision: 15, // 15 digits before the decimal point
    scale: 2, // 2 digits after the decimal point
    default: 0, // default balance is 0
  })
  balance!: string; // TypeORM commonly returns PostgreSQL numeric values as strings because JavaScript's number cannot safely represent arbitrary-precision decimal values

  @CreateDateColumn()
  createdAt!: Date; // date and time the wallet was created
}
