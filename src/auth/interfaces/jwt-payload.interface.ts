import { UserRole } from '../../user/entities/user.entity';

export interface JwtPayload {
  userId: string;
  login: string;
  role: UserRole;
}
