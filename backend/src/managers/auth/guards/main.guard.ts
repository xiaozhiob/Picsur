import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { plainToClass } from 'class-transformer';
import { isArray, isEnum, isString, validate } from 'class-validator';
import {
  Permissions,
  PermissionsList
} from 'picsur-shared/dist/dto/permissions';
import { Roles } from 'picsur-shared/dist/dto/roles.dto';
import { Fail, Failable, HasFailed } from 'picsur-shared/dist/types';
import { UsersService } from '../../../collections/userdb/userdb.service';
import { EUserBackend } from '../../../models/entities/user.entity';

@Injectable()
export class MainAuthGuard extends AuthGuard(['jwt', 'guest']) {
  private readonly logger = new Logger('MainAuthGuard');

  constructor(
    private reflector: Reflector,
    private usersService: UsersService,
  ) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const result = await super.canActivate(context);
    if (result !== true) {
      this.logger.error('Main Auth has denied access, this should not happen');
      throw new InternalServerErrorException();
    }

    const user = await this.validateUser(
      context.switchToHttp().getRequest().user,
    );

    const permissions = this.extractPermissions(context);
    if (HasFailed(permissions)) {
      this.logger.warn(permissions.getReason());
      throw new InternalServerErrorException();
    }

    const userPermissions = await this.usersService.getPermissions(user);
    if (HasFailed(userPermissions)) {
      this.logger.warn(userPermissions.getReason());
      throw new InternalServerErrorException();
    }

    if (permissions.every((permission) => userPermissions.includes(permission)))
      return true;
    else throw new ForbiddenException('Permission denied');
  }

  private extractPermissions(context: ExecutionContext): Failable<Permissions> {
    const handlerName = context.getHandler().name;
    const permissions =
      this.reflector.get<Permissions>('permissions', context.getHandler()) ??
      this.reflector.get<Permissions>('permissions', context.getClass());

    if (permissions === undefined) {
      return Fail(
        `${handlerName} does not have any permissions defined, denying access`,
      );
    }

    if (!this.isPermissionsArray(permissions)) {
      return Fail(`Permissions for ${handlerName} is not a string array`);
    }

    return permissions;
  }

  private isPermissionsArray(value: any): value is Roles {
    if (!isArray(value)) return false;
    if (!value.every((item: unknown) => isString(item))) return false;
    if (!value.every((item: string) => isEnum(item, PermissionsList)))
      return false;
    return true;
  }

  private async validateUser(user: EUserBackend): Promise<EUserBackend> {
    const userClass = plainToClass(EUserBackend, user);
    const errors = await validate(userClass, {
      forbidUnknownValues: true,
    });

    if (errors.length > 0) {
      this.logger.error(
        'Invalid user object, where it should always be valid: ' + errors,
      );
      throw new InternalServerErrorException();
    }
    return userClass;
  }
}