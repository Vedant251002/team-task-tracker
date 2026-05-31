import { useEffect, useState } from 'react';
import { taskService } from '../services/task.service';
import { Task, TaskStatus, Priority, Role } from '../types';
import { useAuth } from '../contexts/AuthContext';
import TaskModal from '../components/TaskModal';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../hooks/useToast';
import { format } from 'date-fns';

const TasksPage = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    taskId: string | null;
  }>({ isOpen: false, taskId: null });
  const { toasts, removeToast, success, error: showError } = useToast();
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
  });

  useEffect(() => {
    loadTasks();
  }, [filters]);

  const loadTasks = async () => {
    try {
      const params: any = { limit: 50 };
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      
      const response = await taskService.getTasks(params);
      setTasks(response.tasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    setConfirmDialog({ isOpen: true, taskId });
  };

  const confirmDelete = async () => {
    if (!confirmDialog.taskId) return;

    try {
      await taskService.deleteTask(confirmDialog.taskId);
      success('Task deleted successfully!');
      loadTasks();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to delete task');
    } finally {
      setConfirmDialog({ isOpen: false, taskId: null });
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await taskService.updateTaskStatus(taskId, newStatus);
      success('Task status updated!');
      loadTasks();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
    loadTasks();
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return 'bg-gray-100 text-gray-800';
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case TaskStatus.IN_REVIEW:
        return 'bg-yellow-100 text-yellow-800';
      case TaskStatus.DONE:
        return 'bg-green-100 text-green-800';
      case TaskStatus.BLOCKED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.HIGH:
        return 'text-red-600';
      case Priority.MEDIUM:
        return 'text-yellow-600';
      case Priority.LOW:
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const canEditTask = (task: Task) => {
    if (user?.role === Role.ADMIN || user?.role === Role.MANAGER) return true;
    return task.assigneeId === user?.id;
  };

  const canDeleteTask = () => {
    return user?.role === Role.ADMIN || user?.role === Role.MANAGER;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading tasks..." />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      <div className="sm:flex sm:items-center sm:justify-between mb-6 animate-slideDown">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage and track your team's tasks
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={handleCreateTask}
            className="inline-flex items-center px-6 py-2.5 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Task
          </button>
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-lg mb-6 p-5 animate-slideDown card-hover border border-gray-100">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Status Filter
              </span>
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="block w-full pl-4 pr-10 py-2.5 text-base border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg transition-all duration-200 hover:border-indigo-300 bg-white cursor-pointer shadow-sm"
            >
              <option value="">All Statuses</option>
              {Object.values(TaskStatus).map((status) => (
                <option key={status} value={status}>
                  {status.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                </svg>
                Priority Filter
              </span>
            </label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="block w-full pl-4 pr-10 py-2.5 text-base border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg transition-all duration-200 hover:border-indigo-300 bg-white cursor-pointer shadow-sm"
            >
              <option value="">All Priorities</option>
              {Object.values(Priority).map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md animate-slideUp">
        <ul className="divide-y divide-gray-200">
          {tasks.length === 0 ? (
            <li className="px-6 py-12 text-center text-gray-500">
              No tasks found. Create your first task!
            </li>
          ) : (
            tasks.map((task) => (
              <li key={task.id} className="transition-all duration-200 hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          {task.title}
                        </p>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(task.status)} transition-all duration-200`}>
                          {task.status.replace('_', ' ')}
                        </span>
                        <span className={`text-xs font-semibold ${getPriorityColor(task.priority)} transition-all duration-200`}>
                          {task.priority}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <p className="truncate">{task.description || 'No description'}</p>
                      </div>
                      <div className="mt-2 flex items-center text-xs text-gray-500 space-x-4">
                        {task.assignee && (
                          <span>Assigned to: {task.assignee.name}</span>
                        )}
                        {task.dueDate && (
                          <span>Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}</span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
                      {canEditTask(task) && (
                        <>
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                            className="text-xs border-2 border-gray-300 rounded-lg py-1.5 px-2 transition-all duration-200 hover:border-indigo-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white cursor-pointer shadow-sm"
                          >
                            {Object.values(TaskStatus).map((status) => (
                              <option key={status} value={status}>
                                {status.replace('_', ' ')}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleEditTask(task)}
                            className="px-3 py-1.5 text-indigo-600 hover:text-white hover:bg-indigo-600 text-sm font-medium transition-all duration-200 transform hover:scale-110 rounded-lg border border-indigo-600"
                          >
                            Edit
                          </button>
                        </>
                      )}
                      {canDeleteTask() && (
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="px-3 py-1.5 text-red-600 hover:text-white hover:bg-red-600 text-sm font-medium transition-all duration-200 transform hover:scale-110 rounded-lg border border-red-600"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {isModalOpen && (
        <TaskModal
          task={selectedTask}
          onClose={handleModalClose}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, taskId: null })}
      />
    </div>
  );
};

export default TasksPage;
