import { User, RefreshToken, Organization } from '../../infrastructure/database/models';
import { jwtService, JwtPayload } from '../../infrastructure/security/jwt.service';
import { passwordService } from '../../infrastructure/security/password.service';
import { Role } from '../../domain/enums';
import { AppError } from '../../utils/errors';

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  organizationName?: string;
  role?: Role;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    organizationId: string;
  };
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  async register(dto: RegisterDto): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: dto.email } });
    if (existingUser) {
      throw new AppError('User with this email already exists', 400, 'USER_EXISTS');
    }

    // Hash password
    const hashedPassword = await passwordService.hash(dto.password);

    // Create or find organization
    let organization: Organization;
    if (dto.organizationName) {
      organization = await Organization.create({ name: dto.organizationName });
    } else {
      // For simplicity, use a default organization
      organization = await Organization.findOne() || await Organization.create({ name: 'Default Organization' });
    }

    // Create user
    const user = await User.create({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
      role: dto.role || Role.MEMBER,
      organizationId: organization.id,
    });

    // Generate tokens
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    const accessToken = jwtService.generateAccessToken(payload);
    const refreshToken = jwtService.generateRefreshToken(payload);

    // Store refresh token
    await RefreshToken.create({
      token: refreshToken,
      userId: user.id,
      expiresAt: jwtService.getRefreshTokenExpiry(),
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
      },
      accessToken,
      refreshToken,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    // Find user
    const user = await User.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Verify password
    const isPasswordValid = await passwordService.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Generate tokens
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    const accessToken = jwtService.generateAccessToken(payload);
    const refreshToken = jwtService.generateRefreshToken(payload);

    // Store refresh token
    await RefreshToken.create({
      token: refreshToken,
      userId: user.id,
      expiresAt: jwtService.getRefreshTokenExpiry(),
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
      },
      accessToken,
      refreshToken,
    };
  }

  async refresh(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Verify refresh token
    let payload: JwtPayload;
    try {
      payload = jwtService.verifyRefreshToken(token);
    } catch (error) {
      throw new AppError('Invalid refresh token', 401, 'INVALID_TOKEN');
    }

    // Check if token exists in database
    const storedToken = await RefreshToken.findOne({ where: { token } });
    if (!storedToken) {
      throw new AppError('Refresh token not found', 401, 'TOKEN_NOT_FOUND');
    }

    // Check if token is expired
    if (new Date() > storedToken.expiresAt) {
      await storedToken.destroy();
      throw new AppError('Refresh token expired', 401, 'TOKEN_EXPIRED');
    }

    // Delete old refresh token (rotation)
    await storedToken.destroy();

    // Generate new tokens
    const newAccessToken = jwtService.generateAccessToken(payload);
    const newRefreshToken = jwtService.generateRefreshToken(payload);

    // Store new refresh token
    await RefreshToken.create({
      token: newRefreshToken,
      userId: payload.userId,
      expiresAt: jwtService.getRefreshTokenExpiry(),
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(token: string): Promise<void> {
    await RefreshToken.destroy({ where: { token } });
  }
}

export const authService = new AuthService();
