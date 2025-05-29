import { Role } from '@prisma/client';

export interface BasicUserInfo {
  id: string;
  email: string;
  role: Role;
  name?: string;
  phone?: string;
  cuitOrDni?: string;
}
