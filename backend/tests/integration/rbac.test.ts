import request from 'supertest';
import app from '../../src/server';
import { sequelize } from '../../src/config/database';
import { Role } from '../../src/domain/enums';

describe('RBAC Integration Tests', () => {
  let adminToken: string;
  let memberToken: string;
  let viewerToken: string;
  let adminUserId: string;
  let memberUserId: string;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Register admin
    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'rbac-admin@test.com',
        password: 'Admin123!',
        name: 'RBAC Admin',
        organizationName: 'RBAC Test Org',
      });
    adminToken = adminResponse.body.accessToken;
    adminUserId = adminResponse.body.user.id;

    // Register member
    const memberResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'rbac-member@test.com',
        password: 'Member123!',
        name: 'RBAC Member',
        organizationName: 'RBAC Test Org',
      });
    memberToken = memberResponse.body.accessToken;
    memberUserId = memberResponse.body.user.id;

    // Register viewer
    const viewerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'rbac-viewer@test.com',
        password: 'Viewer123!',
        name: 'RBAC Viewer',
        organizationName: 'RBAC Test Org',
      });
    viewerToken = viewerResponse.body.accessToken;

    // Update viewer role
    await request(app)
      .patch(`/api/users/${viewerResponse.body.user.id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: Role.VIEWER });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Task Creation Permissions', () => {
    it('should allow admin to create task', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Admin Task',
          description: 'Created by admin',
          priority: 'HIGH',
        });

      expect(response.status).toBe(201);
    });

    it('should allow member to create task', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'Member Task',
          description: 'Created by member',
          priority: 'MEDIUM',
        });

      expect(response.status).toBe(201);
    });

    it('should deny viewer from creating task', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          title: 'Viewer Task',
          description: 'Should fail',
          priority: 'LOW',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('User Management Permissions', () => {
    it('should allow admin to update user roles', async () => {
      const response = await request(app)
        .patch(`/api/users/${memberUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: Role.ADMIN });

      expect(response.status).toBe(200);
    });

    it('should deny member from updating user roles', async () => {
      const response = await request(app)
        .patch(`/api/users/${adminUserId}/role`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ role: Role.MEMBER });

      expect(response.status).toBe(403);
    });

    it('should deny viewer from updating user roles', async () => {
      const response = await request(app)
        .patch(`/api/users/${memberUserId}/role`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ role: Role.ADMIN });

      expect(response.status).toBe(403);
    });
  });

  describe('Analytics Access Permissions', () => {
    it('should allow admin to access analytics', async () => {
      const response = await request(app)
        .get('/api/analytics/overdue')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    it('should allow member to access analytics', async () => {
      const response = await request(app)
        .get('/api/analytics/overdue')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(response.status).toBe(200);
    });

    it('should allow viewer to access analytics', async () => {
      const response = await request(app)
        .get('/api/analytics/overdue')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(response.status).toBe(200);
    });
  });
});
