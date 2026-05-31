import jwt from 'jsonwebtoken';
import { jwtConfig } from '../../config/jwt';
import { Role } from '../../domain/enums';

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  organizationId: string;
}

export class JwtService {
  generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn as any,
    });
  }

  generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload, jwtConfig.refreshSecret, {
      expiresIn: jwtConfig.refreshExpiresIn as any,
    });
  }

  verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, jwtConfig.secret) as JwtPayload;
  }

  verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(token, jwtConfig.refreshSecret) as JwtPayload;
  }

  getRefreshTokenExpiry(): Date {
    const expiresIn = jwtConfig.refreshExpiresIn;
    const days = parseInt(expiresIn.replace('d', ''));
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }
}

export const jwtService = new JwtService();
