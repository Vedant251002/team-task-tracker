import { UserService } from '../../src/application/services/user.service';
import { User } from '../../src/infrastructure/database/models';
import { Role } from '../../src/domain/enums';
import { AppError } from '../../src/utils/errors';

jest.mock('../../src/infrastructure/database/models');

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should return all users for organization', async () => {
      const mockUsers = [
        { id: '1', name: 'User 1', email: 'user1@test.com' },
        { id: '2', name: 'User 2', email: 'user2@test.com' },
      ];
      (User.findAll as jest.Mock).mockResolvedValue(mockUsers);

      const result = await userService.getAllUsers('org123');

      expect(result).toEqual(mockUsers);
      expect(User.findAll).toHaveBeenCalledWith({
        where: { organizationId: 'org123' },
        attributes: { exclude: ['password'] },
        order: [['createdAt', 'DESC']],
      });
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const mockUser = { id: '1', name: 'User 1', email: 'user1@test.com' };
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.getUserById('1', 'org123');

      expect(result).toEqual(mockUser);
      expect(User.findOne).toHaveBeenCalledWith({
        where: { id: '1', organizationId: 'org123' },
        attributes: { exclude: ['password'] },
      });
    });

    it('should throw error when user not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(userService.getUserById('999', 'org123')).rejects.toThrow(AppError);
      await expect(userService.getUserById('999', 'org123')).rejects.toThrow('User not found');
    });
  });

  describe('updateUserRole', () => {
    it('should update user role successfully', async () => {
      const mockUser = {
        id: '1',
        name: 'User 1',
        role: Role.MEMBER,
        update: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({
          id: '1',
          name: 'User 1',
          role: Role.ADMIN,
          password: 'hashed',
        }),
      };
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.updateUserRole('1', Role.ADMIN, 'org123');

      expect(mockUser.update).toHaveBeenCalledWith({ role: Role.ADMIN });
      expect(result).not.toHaveProperty('password');
    });

    it('should throw error when user not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(userService.updateUserRole('999', Role.ADMIN, 'org123')).rejects.toThrow(AppError);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const mockUser = {
        id: '1',
        destroy: jest.fn().mockResolvedValue(true),
      };
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await userService.deleteUser('1', 'org123');

      expect(mockUser.destroy).toHaveBeenCalled();
    });

    it('should throw error when user not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(userService.deleteUser('999', 'org123')).rejects.toThrow(AppError);
    });
  });
});
