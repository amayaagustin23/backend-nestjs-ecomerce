import { SetMetadata } from '@nestjs/common';
import { RoleEnum } from '../../constants';

export const HasRoleEnums = (...roles: RoleEnum[]) =>
  SetMetadata('roles', roles);
