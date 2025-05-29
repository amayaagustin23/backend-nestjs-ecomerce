import { SetMetadata } from '@nestjs/common';
import { Role } from '../../constants';

export const HasRoles = (...roles: Role[]) => SetMetadata('roles', roles);
