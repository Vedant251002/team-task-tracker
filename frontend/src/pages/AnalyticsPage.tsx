import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';

interface OverdueTask {
  userId: string;
  userName: string;
  userEmail: string;
  overdueCount: number;
}

interface CompletionTime {
  averageCompletionDays: number;
  totalCompletedTasks: number;
}

const AnalyticsPage = () => {
  const { user } = useAuth();
  const [overdueTasks, setOverdueTasks] = useState<OverdueTask[]>([]);
  const [completionTime, setCompletionTime] = useState<CompletionTime | null>(null);
  const [loading, setLoading] = useState(true);
  const { toasts, removeToast, error: showError } = useToast();

  useEffect(() => {
    if (user?.role === Role.MEMBER) {
      showError('Access denied. Only admins and managers can view analytics.');
      setLoading(false);
      return;
    }
    loadAnalytics();
  }, [user]);

  const loadAnalytics = async () => {
    try {
      const [overdueResponse, completionResponse] = await Promise.all([
        api.get('/analytics/overdue'),
        api.get('/analytics/completion'),
      ]);
      setOverdueTasks(overdueResponse.data);
      setCompletionTime(completionResponse.data);
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role === Role.MEMBER) {
    return (
      <div className="px-4 sm:px-0">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-red-900">Access Denied</h3>
          <p className="mt-1 text-sm text-red-700">Only administrators and managers can view analytics.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading analytics..." />
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

      <div className="mb-6 animate-slideDown">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-2 text-sm text-gray-700">
          Track team performance and task completion metrics
        </p>
      </div>

      {/* Completion Time Card */}
      <div className="bg-white shadow rounded-lg p-6 mb-6 animate-slideUp">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="rounded-md bg-green-500 p-3">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                Average Task Completion Time
              </dt>
              <dd className="flex items-baseline">
                <div className="text-4xl font-semibold text-gray-900">
                  {completionTime?.averageCompletionDays.toFixed(1) || 0}
                </div>
                <div className="ml-2 text-sm text-gray-500">days</div>
              </dd>
              <dd className="mt-1 text-sm text-gray-500">
                Based on {completionTime?.totalCompletedTasks || 0} completed tasks
              </dd>
            </dl>
          </div>
        </div>
      </div>

      {/* Overdue Tasks Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg animate-slideUp" style={{ animationDelay: '0.1s' }}>
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Overdue Tasks by User
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Users with tasks past their due date
          </p>
        </div>
        
        {overdueTasks.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <svg className="mx-auto h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Overdue Tasks</h3>
            <p className="mt-1 text-sm text-gray-500">Great job! All tasks are on track.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Overdue Tasks
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {overdueTasks.map((item) => (
                <tr key={item.userId} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                          <span className="text-red-600 font-medium text-sm">
                            {item.userName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{item.userName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.userEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      {item.overdueCount} {item.overdueCount === 1 ? 'task' : 'tasks'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
