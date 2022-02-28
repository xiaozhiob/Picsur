import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { instanceToPlain, plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { JwtDataDto } from 'picsur-shared/dist/dto/auth.dto';
import { EUser } from 'picsur-shared/dist/entities/user.entity';
import { AsyncFailable, HasFailed, Fail } from 'picsur-shared/dist/types';
import { UsersService } from '../../../collections/userdb/userdb.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async createUser(username: string, password: string): AsyncFailable<EUser> {
    const hashedPassword = await bcrypt.hash(password, 12);
    return this.usersService.create(username, hashedPassword);
  }

  async deleteUser(user: string | EUser): AsyncFailable<EUser> {
    return this.usersService.delete(user);
  }

  async listUsers(): AsyncFailable<EUser[]> {
    return this.usersService.findAll();
  }

  async authenticate(username: string, password: string): AsyncFailable<EUser> {
    const user = await this.usersService.findOne(username, true);
    if (HasFailed(user)) return user;

    if (!(await bcrypt.compare(password, user.password)))
      return Fail('Wrong password');

    return await this.usersService.findOne(username);
  }

  async createToken(user: EUser): Promise<string> {
    const jwtData: JwtDataDto = plainToClass(JwtDataDto, {
      user,
    });

    const errors = await validate(jwtData, { forbidUnknownValues: true });
    if (errors.length > 0) {
      this.logger.warn(errors);
      throw new Error('Invalid jwt token generated');
    }

    return this.jwtService.signAsync(instanceToPlain(jwtData));
  }

  async makeAdmin(user: string | EUser): AsyncFailable<true> {
    return this.usersService.modifyAdmin(user, true);
  }

  async revokeAdmin(user: string | EUser): AsyncFailable<true> {
    return this.usersService.modifyAdmin(user, false);
  }
}
