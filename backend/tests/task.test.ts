import request from 'supertest';
import app from '../src/server';
import { sequelize } from '../src/config/database';
import { TaskStatus } from '../src/domain/enums';

describe('Task Management Tests', () => {
  let accessToken: string;
  let taskId: string;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Register and login
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'tasktest@example.com',
        password: 'Test123!',
        name: 'Task Test User',
        organizationName: 'Task Test Org',
      });

    accessToken = registerResponse.body.accessToken;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Task',
          description: 'Test Description',
          priority: 'HIGH',
        });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('Test Task');
      expect(response.body.status).toBe(TaskStatus.TODO);
      taskId = response.body.id;
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Test Task',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/tasks/:id/status', () => {
    it('should update task status with valid transition', async () => {
      const response = await request(app)
        .patch(`/api/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          status: TaskStatus.IN_PROGRESS,
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('should fail with invalid status transition', async () => {
      const response = await request(app)
        .patch(`/api/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          status: TaskStatus.DONE,
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('INVALID_STATUS_TRANSITION');
    });
  });

  describe('GET /api/tasks', () => {
    it('should get tasks with pagination', async () => {
      const response = await request(app)
        .get('/api/tasks?page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tasks');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('totalPages');
    });
  });
});
