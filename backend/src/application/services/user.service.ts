import { User } from '../../infrastructure/database/models';
import { Role } from '../../domain/enums';
import { AppError } from '../../utils/errors';

export class UserService {
  async getAllUsers(organizationId: string): Promise<User[]> {
    return User.findAll({
      where: { organizationId },
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
    });
  }

  async getUserById(userId: string, organizationId: string): Promise<User> {
    const user = await User.findOne({
      where: { id: userId, organizationId },
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return user;
  }

  async updateUserRole(userId: string, newRole: Role, organizationId: string): Promise<User> {
    const user = await User.findOne({
      where: { id: userId, organizationId },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    await user.update({ role: newRole });

    // Remove password from response
    const { password, ...userWithoutPassword } = user.toJSON();
    return userWithoutPassword as User;
  }

  async deleteUser(userId: string, organizationId: string): Promise<void> {
    const user = await User.findOne({
      where: { id: userId, organizationId },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    await user.destroy();
  }
}

export const userService = new UserService();
