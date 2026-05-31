import { AuthService } from '../../src/application/services/auth.service';
import { User, Organization, RefreshToken } from '../../src/infrastructure/database/models';
import { passwordService } from '../../src/infrastructure/security/password.service';
import { jwtService } from '../../src/infrastructure/security/jwt.service';
import { AppError } from '../../src/utils/errors';

jest.mock('../../src/infrastructure/database/models');
jest.mock('../../src/infrastructure/security/password.service');
jest.mock('../../src/infrastructure/security/jwt.service');

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register new user with organization', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'Test123!',
        name: 'Test User',
        organizationName: 'Test Org',
      };

      const mockOrg = { id: 'org123', name: 'Test Org' };
      const mockUser = { 
        id: 'user123', 
        email: 'test@example.com',
        organizationId: 'org123',
        toJSON: jest.fn().mockReturnValue({ id: 'user123', email: 'test@example.com' }),
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (passwordService.hash as jest.Mock).mockResolvedValue('hashed-password');
      (Organization.create as jest.Mock).mockResolvedValue(mockOrg);
      (User.create as jest.Mock).mockResolvedValue(mockUser);
      (jwtService.generateAccessToken as jest.Mock).mockReturnValue('access-token');
      (jwtService.generateRefreshToken as jest.Mock).mockReturnValue('refresh-token');
      (RefreshToken.create as jest.Mock).mockResolvedValue({});

      const result = await authService.register(registerData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken', 'access-token');
      expect(result).toHaveProperty('refreshToken', 'refresh-token');
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: registerData.email } });
      expect(passwordService.hash).toHaveBeenCalledWith(registerData.password);
    });

    it('should throw error if email already exists', async () => {
      (User.findOne as jest.Mock).mockResolvedValue({ id: 'existing-user' });

      await expect(
        authService.register({
          email: 'existing@example.com',
          password: 'Test123!',
          name: 'Test User',
        })
      ).rejects.toThrow(AppError);
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        password: 'hashed-password',
        organizationId: 'org123',
        role: 'MEMBER',
        toJSON: jest.fn().mockReturnValue({ id: 'user123', email: 'test@example.com' }),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (passwordService.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.generateAccessToken as jest.Mock).mockReturnValue('access-token');
      (jwtService.generateRefreshToken as jest.Mock).mockReturnValue('refresh-token');
      (RefreshToken.create as jest.Mock).mockResolvedValue({});

      const result = await authService.login('test@example.com', 'Test123!');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(passwordService.compare).toHaveBeenCalledWith('Test123!', 'hashed-password');
    });

    it('should throw error with invalid credentials', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.login('test@example.com', 'WrongPassword')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error with wrong password', async () => {
      const mockUser = {
        id: 'user123',
        password: 'hashed-password',
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (passwordService.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.login('test@example.com', 'WrongPassword')
      ).rejects.toThrow('Invalid credentials');
    });
  });
});
