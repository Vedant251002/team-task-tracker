import request from 'supertest';
import app from '../../src/server';
import { sequelize } from '../../src/config/database';
import { Role } from '../../src/domain/enums';

describe('User Management Integration Tests', () => {
  let adminToken: string;
  let memberToken: string;
  let adminUserId: string;
  let memberUserId: string;
  let organizationId: string;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Register admin user
    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'admin@test.com',
        password: 'Admin123!',
        name: 'Admin User',
        organizationName: 'Test Organization',
      });

    adminToken = adminResponse.body.accessToken;
    adminUserId = adminResponse.body.user.id;
    organizationId = adminResponse.body.user.organizationId;

    // Register member user
    const memberResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'member@test.com',
        password: 'Member123!',
        name: 'Member User',
        organizationName: 'Test Organization',
      });

    memberToken = memberResponse.body.accessToken;
    memberUserId = memberResponse.body.user.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/users', () => {
    it('should get all users in organization', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      expect(response.body[0]).not.toHaveProperty('password');
    });

    it('should fail without authentication', async () => {
      const response = await request(app).get('/api/users');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user by id', async () => {
      const response = await request(app)
        .get(`/api/users/${memberUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(memberUserId);
      expect(response.body.email).toBe('member@test.com');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/users/:id/role', () => {
    it('should update user role as admin', async () => {
      const response = await request(app)
        .patch(`/api/users/${memberUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: Role.ADMIN });

      expect(response.status).toBe(200);
      expect(response.body.role).toBe(Role.ADMIN);
    });

    it('should fail when member tries to update role', async () => {
      const response = await request(app)
        .patch(`/api/users/${adminUserId}/role`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ role: Role.MEMBER });

      expect(response.status).toBe(403);
    });

    it('should fail with invalid role', async () => {
      const response = await request(app)
        .patch(`/api/users/${memberUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'INVALID_ROLE' });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user as admin', async () => {
      // Create a user to delete
      const newUser = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'todelete@test.com',
          password: 'Delete123!',
          name: 'To Delete',
          organizationName: 'Test Organization',
        });

      const response = await request(app)
        .delete(`/api/users/${newUser.body.user.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(204);

      // Verify user is deleted
      const getResponse = await request(app)
        .get(`/api/users/${newUser.body.user.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('should fail when member tries to delete user', async () => {
      const response = await request(app)
        .delete(`/api/users/${adminUserId}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(response.status).toBe(403);
    });
  });
});
