import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (data) => api.post('/auth/login', data);
export const getProfile = () => api.get('/auth/profile');
export const changePassword = (data) => api.put('/auth/password', data);

// Users
export const getUsers = () => api.get('/users');
export const getLabos = () => api.get('/users/role/laboratoire');
export const createUser = (data) => api.post('/users', data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);

// Patients
export const getPatients = (params) => api.get('/patients', { params });
export const getPatient = (id) => api.get(`/patients/${id}`);
export const createPatient = (data) => api.post('/patients', data);
export const updatePatient = (id, data) => api.put(`/patients/${id}`, data);
export const deletePatient = (id) => api.delete(`/patients/${id}`);
export const mergePatients = (sourceId, targetId) => api.post('/patients/merge', { sourceId, targetId });
export const checkDuplicate = (data) => api.post('/patients/check-duplicate', data);

// Public endpoints
export const getPublicPatient = (id) => axios.get(`${API_URL}/public/patients/${id}`);
export const submitPublicHabitudes = (id, data) => axios.put(`${API_URL}/public/patients/${id}/habitudes`, data);

// Cases
export const getCases = (params) => api.get('/cases', { params });
export const getCasesByPatient = (patientId) => api.get(`/cases/patient/${patientId}`);
export const getCase = (id) => api.get(`/cases/${id}`);
export const createCase = (data) => api.post('/cases', data);
export const updateCase = (id, data) => api.put(`/cases/${id}`, data);
export const addTraitement = (data) => api.post('/traitements', data);
export const addRendezVous = (data) => api.post('/rendez-vous', data);

// Stats
export const getDashboardStats = (params) => api.get('/stats/dashboard', { params });
export const getAuditLogs = () => api.get('/stats/audit');

// Lab Requests
export const getLabRequestsByCase = (caseId) => api.get(`/lab-requests/case/${caseId}`);
export const getLabRequestsForLabo = () => api.get('/lab-requests/labo');
export const createLabRequest = (data) => api.post('/lab-requests', data);
export const uploadLabPdf = (id, data) => api.put(`/lab-requests/${id}/upload`, data, { headers: { 'Content-Type': 'multipart/form-data' } });

export default api;
