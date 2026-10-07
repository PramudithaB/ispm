import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT Bearer token to outgoing requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('securehemas_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle unauthorized 401 & expired tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired or invalid, clear local auth and dispatch event
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('securehemas_token');
        localStorage.removeItem('securehemas_user');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authService = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  verifyEmail: (token: string) => api.post('/auth/verify-email', { token }),
  resendVerification: (email: string) => api.post('/auth/resend-verification', { email }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; password: string; confirmPassword?: string }) =>
    api.post('/auth/reset-password', data),
};

// Users API
export const userService = {
  getUsers: (params?: any) => api.get('/users', { params }),
  getUserById: (id: string) => api.get(`/users/${id}`),
  createUser: (data: any) => api.post('/users', data),
  updateUser: (id: string, data: any) => api.put(`/users/${id}`, data),
  unlockUser: (id: string) => api.post(`/users/${id}/unlock`),
  getPendingRegistrations: () => api.get('/users/pending-registrations'),
  approveRegistration: (id: string) => api.post(`/users/${id}/approve`),
  rejectRegistration: (id: string, data?: { reason?: string }) =>
    api.post(`/users/${id}/reject`, data),
};

// Departments API
export const departmentService = {
  getDepartments: () => api.get('/departments'),
  getPublicDepartments: () => api.get('/departments/public'),
  createDepartment: (data: any) => api.post('/departments', data),
  updateDepartment: (id: string, data: any) => api.put(`/departments/${id}`, data),
  deleteDepartment: (id: string) => api.delete(`/departments/${id}`),
};

// Policies API
export const policyService = {
  getPolicies: (params?: any) => api.get('/policies', { params }),
  getPolicyById: (id: string) => api.get(`/policies/${id}`),
  createPolicy: (data: any) => api.post('/policies', data),
  updatePolicy: (id: string, data: any) => api.put(`/policies/${id}`, data),
  publishPolicy: (id: string) => api.post(`/policies/${id}/publish`),
  archivePolicy: (id: string) => api.post(`/policies/${id}/archive`),
  acknowledgePolicy: (id: string) => api.post(`/policies/${id}/acknowledge`),
  getAcknowledgements: (id: string) => api.get(`/policies/${id}/acknowledgements`),
};

// Training API
export const trainingService = {
  getTrainings: (params?: any) => api.get('/training', { params }),
  getTrainingById: (id: string) => api.get(`/training/${id}`),
  createTraining: (data: any) =>
    api.post('/training', data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    }),
  updateTraining: (id: string, data: any) =>
    api.put(`/training/${id}`, data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    }),
  deleteTraining: (id: string) => api.delete(`/training/${id}`),
  getQuiz: (id: string) => api.get(`/training/${id}/quiz`),
  getAdminQuiz: (id: string) => api.get(`/training/${id}/admin-quiz`),
  saveAdminQuiz: (id: string, data: any) => api.put(`/training/${id}/quiz`, data),
  deleteQuiz: (id: string) => api.delete(`/training/${id}/quiz`),
  submitQuiz: (id: string, data: { answers: Array<{ questionId: string; selectedOption: number }> }) =>
    api.post(`/training/${id}/submit-quiz`, data),
};

// Compliance API
export const complianceService = {
  getSummary: () => api.get('/compliance/summary'),
  getDepartmentCompliance: () => api.get('/compliance/department'),
  getDepartmentStaff: (deptId: string) => api.get(`/compliance/department/${deptId}`),
  getMyCompliance: () => api.get('/compliance/my'),
};

// Incidents API
export const incidentService = {
  getIncidents: (params?: any) => api.get('/incidents', { params }),
  getIncidentById: (id: string) => api.get(`/incidents/${id}`),
  reportIncident: (data: any) => api.post('/incidents', data),
  updateStatus: (id: string, data: any) => api.patch(`/incidents/${id}/status`, data),
};

// Notifications API
export const notificationService = {
  getNotifications: (params?: any) => api.get('/notifications', { params }),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/mark-all-read'),
};

// Audit Logs API
export const auditService = {
  getLogs: (params?: any) => api.get('/audit-logs', { params }),
};

// Reports API
export const reportService = {
  exportCompliance: (format: 'json' | 'csv' = 'csv') =>
    api.get(`/reports/compliance?format=${format}`, {
      responseType: format === 'csv' ? 'blob' : 'json',
    }),
  exportIncidents: (format: 'json' | 'csv' = 'csv') =>
    api.get(`/reports/incidents?format=${format}`, {
      responseType: format === 'csv' ? 'blob' : 'json',
    }),
  exportTraining: (format: 'json' | 'csv' = 'csv') =>
    api.get(`/reports/training?format=${format}`, {
      responseType: format === 'csv' ? 'blob' : 'json',
    }),
  exportAudit: (format: 'json' | 'csv' = 'csv') =>
    api.get(`/reports/audit-logs?format=${format}`, {
      responseType: format === 'csv' ? 'blob' : 'json',
    }),
};
