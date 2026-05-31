import { JwtService } from '../../src/infrastructure/security/jwt.service';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');

describe('JwtService', () => {
  let jwtService: JwtService;
  const mockSecret = 'test-secret';
  const mockRefreshSecret = 'test-refresh-secret';

  beforeEach(() => {
    process.env.JWT_SECRET = mockSecret;
    process.env.JWT_REFRESH_SECRET = mockRefreshSecret;
    jwtService = new JwtService();
    jest.clearAllMocks();
  });

  describe('generateAccessToken', () => {
    it('should generate access token with correct payload', () => {
      const payload = { userId: '123', organizationId: 'org456', role: 'ADMIN' };
      const mockToken = 'mock-access-token';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const token = jwtService.generateAccessToken(payload);

      expect(token).toBe(mockToken);
      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        mockSecret,
        expect.objectContaining({ expiresIn: '15m' })
      );
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate refresh token with correct payload', () => {
      const payload = { userId: '123' };
      const mockToken = 'mock-refresh-token';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const token = jwtService.generateRefreshToken(payload);

      expect(token).toBe(mockToken);
      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        mockRefreshSecret,
        expect.objectContaining({ expiresIn: '7d' })
      );
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify and return decoded token', () => {
      const mockDecoded = { userId: '123', organizationId: 'org456', role: 'ADMIN' };
      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      const result = jwtService.verifyAccessToken('valid-token');

      expect(result).toEqual(mockDecoded);
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', mockSecret);
    });

    it('should throw error for invalid token', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => jwtService.verifyAccessToken('invalid-token')).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify and return decoded refresh token', () => {
      const mockDecoded = { userId: '123' };
      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      const result = jwtService.verifyRefreshToken('valid-refresh-token');

      expect(result).toEqual(mockDecoded);
      expect(jwt.verify).toHaveBeenCalledWith('valid-refresh-token', mockRefreshSecret);
    });
  });
});
