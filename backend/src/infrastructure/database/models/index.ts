import Organization from './Organization';
import User from './User';
import Task from './Task';
import RefreshToken from './RefreshToken';

// Define associations
Organization.hasMany(User, {
  foreignKey: 'organizationId',
  as: 'users',
  onDelete: 'CASCADE',
});

User.belongsTo(Organization, {
  foreignKey: 'organizationId',
  as: 'organization',
});

Organization.hasMany(Task, {
  foreignKey: 'organizationId',
  as: 'tasks',
  onDelete: 'CASCADE',
});

Task.belongsTo(Organization, {
  foreignKey: 'organizationId',
  as: 'organization',
});

User.hasMany(Task, {
  foreignKey: 'assigneeId',
  as: 'assignedTasks',
  onDelete: 'SET NULL',
});

Task.belongsTo(User, {
  foreignKey: 'assigneeId',
  as: 'assignee',
});

User.hasMany(Task, {
  foreignKey: 'creatorId',
  as: 'createdTasks',
  onDelete: 'CASCADE',
});

Task.belongsTo(User, {
  foreignKey: 'creatorId',
  as: 'creator',
});

User.hasMany(RefreshToken, {
  foreignKey: 'userId',
  as: 'refreshTokens',
  onDelete: 'CASCADE',
});

RefreshToken.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

export { Organization, User, Task, RefreshToken };
