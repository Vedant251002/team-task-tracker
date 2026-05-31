import request from 'supertest';
import app from '../../src/server';
import { sequelize } from '../../src/config/database';

describe('Refresh Token Integration Tests', () => {
  let refreshToken: string;
  let accessToken: string;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Register user
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'refresh@test.com',
        password: 'Test123!',
        name: 'Refresh User',
        organizationName: 'Refresh Org',
      });

    refreshToken = response.body.refreshToken;
    accessToken = response.body.accessToken;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.accessToken).not.toBe(accessToken);
    });

    it('should fail with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
    });

    it('should fail without refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout and invalidate refresh token', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'refresh@test.com',
          password: 'Test123!',
        });

      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .send({ refreshToken: loginResponse.body.refreshToken });

      expect(logoutResponse.status).toBe(200);

      // Try to use the refresh token after logout
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: loginResponse.body.refreshToken });

      expect(refreshResponse.status).toBe(401);
    });
  });
});
