import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
// gives us access to the PostgreSQL database and lets us create a database transaction

import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { Wallet } from '../wallet/wallet.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // start a database transaction
    return this.dataSource.transaction(async (manager) => {
      // manager is a database connection that allows us to perform database operations
      // get the repository for the User and Wallet entities
      const userRepository = manager.getRepository(User);
      const walletRepository = manager.getRepository(Wallet);

      // create a new user
      const user = userRepository.create({
        username: registerDto.username,
        email: registerDto.email,
        passwordHash: hashedPassword,
      });

      // save the user to the database
      await userRepository.save(user);

      // create a new wallet
      const wallet = walletRepository.create({
        userId: user.id,
        balance: '0.00',
      });

      // save the wallet to the database
      await walletRepository.save(wallet);

      // create a JWT payload
      const payload = {
        sub: user.id,
        email: user.email,
      };

      // sign the JWT payload
      const accessToken = await this.jwtService.signAsync(payload);

      return {
        message: 'User registered successfully',

        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },

        wallet: {
          id: wallet.id,
          balance: wallet.balance,
        },

        access_token: accessToken,
      };
    });
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      access_token: accessToken,
    };
  }
}
