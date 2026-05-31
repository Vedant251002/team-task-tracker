import bcrypt from 'bcrypt';
import { sequelize } from '../../config/database';
import { Organization, User, Task } from './models';
import { Role, Priority, TaskStatus } from '../../domain/enums';

const seed = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Create organization
    const org = await Organization.create({
      name: 'Acme Corporation',
    });

    console.log('✅ Created organization:', org.name);

    // Create users
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    
    const admin = await User.create({
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      role: Role.ADMIN,
      organizationId: org.id,
    });

    const manager = await User.create({
      email: 'manager@example.com',
      password: await bcrypt.hash('Manager123!', 10),
      name: 'Manager User',
      role: Role.MANAGER,
      organizationId: org.id,
    });

    const member = await User.create({
      email: 'member@example.com',
      password: await bcrypt.hash('Member123!', 10),
      name: 'Member User',
      role: Role.MEMBER,
      organizationId: org.id,
    });

    console.log('✅ Created users: Admin, Manager, Member');

    // Create sample tasks
    await Task.create({
      title: 'Setup project repository',
      description: 'Initialize Git repository and setup project structure',
      priority: Priority.HIGH,
      status: TaskStatus.DONE,
      assigneeId: admin.id,
      creatorId: admin.id,
      organizationId: org.id,
      completedAt: new Date(),
    });

    await Task.create({
      title: 'Design database schema',
      description: 'Create ERD and define all tables and relationships',
      priority: Priority.HIGH,
      status: TaskStatus.IN_REVIEW,
      assigneeId: manager.id,
      creatorId: admin.id,
      organizationId: org.id,
    });

    await Task.create({
      title: 'Implement authentication',
      description: 'Build JWT-based authentication with refresh tokens',
      priority: Priority.MEDIUM,
      status: TaskStatus.IN_PROGRESS,
      assigneeId: member.id,
      creatorId: manager.id,
      organizationId: org.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    });

    await Task.create({
      title: 'Write API documentation',
      description: 'Create Swagger/OpenAPI documentation for all endpoints',
      priority: Priority.LOW,
      status: TaskStatus.TODO,
      assigneeId: member.id,
      creatorId: manager.id,
      organizationId: org.id,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    });

    await Task.create({
      title: 'Fix critical bug in login',
      description: 'Users cannot login with special characters in password',
      priority: Priority.HIGH,
      status: TaskStatus.BLOCKED,
      assigneeId: admin.id,
      creatorId: manager.id,
      organizationId: org.id,
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago (overdue)
    });

    console.log('✅ Created sample tasks');
    console.log('\n📋 Test Accounts:');
    console.log('Admin: admin@example.com / Admin123!');
    console.log('Manager: manager@example.com / Manager123!');
    console.log('Member: member@example.com / Member123!');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seed();
