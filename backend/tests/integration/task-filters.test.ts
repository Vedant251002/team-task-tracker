import request from 'supertest';
import app from '../../src/server';
import { sequelize } from '../../src/config/database';
import { TaskStatus, Priority } from '../../src/domain/enums';

describe('Task Filtering Integration Tests', () => {
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'filter@test.com',
        password: 'Test123!',
        name: 'Filter User',
        organizationName: 'Filter Org',
      });

    accessToken = response.body.accessToken;
    userId = response.body.user.id;

    // Create test tasks with different statuses and priorities
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'High Priority TODO',
        priority: Priority.HIGH,
        assigneeId: userId,
      });

    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Medium Priority TODO',
        priority: Priority.MEDIUM,
      });

    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Low Priority TODO',
        priority: Priority.LOW,
      });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/tasks with filters', () => {
    it('should filter tasks by status', async () => {
      const response = await request(app)
        .get('/api/tasks?status=TODO')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.tasks.every((task: any) => task.status === TaskStatus.TODO)).toBe(true);
    });

    it('should filter tasks by priority', async () => {
      const response = await request(app)
        .get('/api/tasks?priority=HIGH')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.tasks.every((task: any) => task.priority === Priority.HIGH)).toBe(true);
    });

    it('should filter tasks by assignee', async () => {
      const response = await request(app)
        .get(`/api/tasks?assigneeId=${userId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.tasks.every((task: any) => task.assigneeId === userId)).toBe(true);
    });

    it('should combine multiple filters', async () => {
      const response = await request(app)
        .get(`/api/tasks?status=TODO&priority=HIGH&assigneeId=${userId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.tasks.every((task: any) => 
        task.status === TaskStatus.TODO && 
        task.priority === Priority.HIGH &&
        task.assigneeId === userId
      )).toBe(true);
    });

    it('should handle pagination', async () => {
      const response = await request(app)
        .get('/api/tasks?page=1&limit=2')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.tasks.length).toBeLessThanOrEqual(2);
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('totalPages');
    });
  });
});
