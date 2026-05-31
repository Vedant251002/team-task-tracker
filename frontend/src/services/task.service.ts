import api from './api';
import { Task, TasksResponse, TaskStatus, Priority } from '../types';

export const taskService = {
  async getTasks(params?: {
    page?: number;
    limit?: number;
    status?: TaskStatus;
    priority?: Priority;
    assigneeId?: string;
  }): Promise<TasksResponse> {
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  async getTaskById(id: string): Promise<Task> {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  async createTask(data: {
    title: string;
    description?: string;
    priority?: Priority;
    assigneeId?: string;
    dueDate?: string;
  }): Promise<Task> {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  async updateTask(
    id: string,
    data: {
      title?: string;
      description?: string;
      priority?: Priority;
      assigneeId?: string;
      dueDate?: string;
    }
  ): Promise<Task> {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  },

  async updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
    const response = await api.patch(`/tasks/${id}/status`, { status });
    return response.data;
  },

  async deleteTask(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },
};
