import request from 'supertest';
import app from '../../src/server';
import { sequelize } from '../../src/config/database';
import { TaskStatus, Priority } from '../../src/domain/enums';

describe('Analytics Integration Tests', () => {
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Register user
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'analytics@test.com',
        password: 'Test123!',
        name: 'Analytics User',
        organizationName: 'Analytics Org',
      });

    accessToken = response.body.accessToken;
    userId = response.body.user.id;

    // Create test tasks
    // Overdue task
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Overdue Task',
        description: 'This is overdue',
        priority: Priority.HIGH,
        dueDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        assigneeId: userId,
      });

    // Completed task
    const completedTask = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Completed Task',
        description: 'This is completed',
        priority: Priority.MEDIUM,
      });

    // Move to in progress then done
    await request(app)
      .patch(`/api/tasks/${completedTask.body.id}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: TaskStatus.IN_PROGRESS });

    await request(app)
      .patch(`/api/tasks/${completedTask.body.id}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: TaskStatus.DONE });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/analytics/overdue', () => {
    it('should get overdue tasks analytics', async () => {
      const response = await request(app)
        .get('/api/analytics/overdue')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('userId');
      expect(response.body[0]).toHaveProperty('userName');
      expect(response.body[0]).toHaveProperty('overdueCount');
      expect(response.body[0].overdueCount).toBeGreaterThan(0);
    });

    it('should fail without authentication', async () => {
      const response = await request(app).get('/api/analytics/overdue');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/analytics/completion-time', () => {
    it('should get average completion time', async () => {
      const response = await request(app)
        .get('/api/analytics/completion-time')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('averageCompletionDays');
      expect(response.body).toHaveProperty('totalCompletedTasks');
      expect(typeof response.body.averageCompletionDays).toBe('number');
      expect(response.body.totalCompletedTasks).toBeGreaterThan(0);
    });

    it('should fail without authentication', async () => {
      const response = await request(app).get('/api/analytics/completion-time');

      expect(response.status).toBe(401);
    });
  });
});
