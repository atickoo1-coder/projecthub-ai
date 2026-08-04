import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const authAPI = {
  login: async (email, password) => {
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);
    const res = await api.post('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return res.data;
  },
  registerStudent: async (data) => {
    const res = await api.post('/auth/register/student', data);
    return res.data;
  },
  registerTeacher: async (data) => {
    const res = await api.post('/auth/register/teacher', data);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  changePassword: async (data) => {
    const res = await api.post('/auth/change-password', data);
    return res.data;
  },
  updateStudentProfile: async (data) => {
    const res = await api.put('/auth/student/profile', data);
    return res.data;
  }
};

export const projectAPI = {
  create: async (data) => {
    const res = await api.post('/projects', data);
    return res.data;
  },
  getAll: async (filters = {}) => {
    const res = await api.get('/projects', { params: filters });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/projects/${id}`);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/projects/${id}`, data);
    return res.data;
  },
  addProgress: async (id, data) => {
    const res = await api.post(`/projects/${id}/progress`, data);
    return res.data;
  },
  uploadFile: async (id, fileType, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(`/projects/${id}/upload/${fileType}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  getPortfolio: async (rollOrId) => {
    const res = await api.get(`/projects/portfolio/${rollOrId}`);
    return res.data;
  },
  addPortfolioItem: async (type, data) => {
    // type: certificates, achievements, research, internships, patents, hackathons
    const res = await api.post(`/projects/portfolio/${type}`, data);
    return res.data;
  },
  getMilestones: async (projectId) => {
    const res = await api.get(`/projects/${projectId}/milestones`);
    return res.data;
  },
  createMilestone: async (projectId, data) => {
    const res = await api.post(`/projects/${projectId}/milestones`, data);
    return res.data;
  },
  updateMilestone: async (milestoneId, data) => {
    const res = await api.put(`/projects/milestones/${milestoneId}`, data);
    return res.data;
  },
  deleteMilestone: async (milestoneId) => {
    const res = await api.delete(`/projects/milestones/${milestoneId}`);
    return res.data;
  },
  getGithubStats: async (projectId) => {
    const res = await api.get(`/projects/${projectId}/github`);
    return res.data;
  },
  syncGithubStats: async (projectId, data) => {
    const res = await api.post(`/projects/${projectId}/github`, data);
    return res.data;
  },
  getPlacements: async () => {
    const res = await api.get('/projects/placement/records');
    return res.data;
  },
  addPlacement: async (data) => {
    const res = await api.post('/projects/placement/records', data);
    return res.data;
  },
  deletePlacement: async (id) => {
    const res = await api.delete(`/projects/placement/records/${id}`);
    return res.data;
  }
};

export const teacherAPI = {
  getAssignedStudents: async () => {
    const res = await api.get('/teachers/students');
    return res.data;
  },
  getPendingProjects: async () => {
    const res = await api.get('/teachers/projects/pending');
    return res.data;
  },
  submitFeedback: async (projectId, data) => {
    const res = await api.post(`/teachers/projects/${projectId}/feedback`, data);
    return res.data;
  },
  updateProjectStatus: async (projectId, status) => {
    const res = await api.put(`/teachers/projects/${projectId}/status`, null, {
      params: { status }
    });
    return res.data;
  }
};

export const hodAPI = {
  getAnalytics: async (filters = {}) => {
    const res = await api.get('/hod/analytics', { params: filters });
    return res.data;
  },
  getStudents: async (filters = {}) => {
    const res = await api.get('/hod/students', { params: filters });
    return res.data;
  }
};

export const adminAPI = {
  getStats: async () => {
    const res = await api.get('/admin/stats');
    return res.data;
  },
  createDept: async (data) => {
    const res = await api.post('/admin/departments', data);
    return res.data;
  },
  getDepts: async () => {
    const res = await api.get('/admin/departments');
    return res.data;
  },
  deleteDept: async (deptId) => {
    const res = await api.delete(`/admin/departments/${deptId}`);
    return res.data;
  },
  createAnnouncement: async (data) => {
    const res = await api.post('/admin/announcements', data);
    return res.data;
  },
  getAnnouncements: async () => {
    const res = await api.get('/admin/announcements');
    return res.data;
  },
  toggleUser: async (userId, isActive) => {
    const res = await api.put(`/admin/users/${userId}/status`, null, {
      params: { is_active: isActive }
    });
    return res.data;
  },
  getStudents: async (search = '') => {
    const res = await api.get('/admin/students', { params: { search } });
    return res.data;
  },
  createStudent: async (data) => {
    const res = await api.post('/admin/students', data);
    return res.data;
  },
  deleteStudent: async (studentId) => {
    const res = await api.delete(`/admin/students/${studentId}`);
    return res.data;
  },
  getTeachers: async () => {
    const res = await api.get('/admin/teachers');
    return res.data;
  },
  allocateGuide: async (studentId, guideId) => {
    const res = await api.put(`/admin/students/${studentId}/guide`, null, {
      params: { guide_id: guideId }
    });
    return res.data;
  },
  getProjects: async (status = '') => {
    const res = await api.get('/admin/projects', { params: { status } });
    return res.data;
  }
};

export const chatAPI = {
  getThreads: async () => {
    const res = await api.get('/chat/threads');
    return res.data;
  },
  getHistory: async (otherId) => {
    const res = await api.get(`/chat/history/${otherId}`);
    return res.data;
  },
  sendMessage: async (receiverId, message) => {
    const res = await api.post('/chat/send', { receiver_id: receiverId, message });
    return res.data;
  },
  searchUsers: async (search = '', role = '') => {
    const res = await api.get('/chat/users', { params: { search, role } });
    return res.data;
  }
};

export const meetingAPI = {
  getAll: async () => {
    const res = await api.get('/meetings');
    return res.data;
  },
  schedule: async (data) => {
    const res = await api.post('/meetings', data);
    return res.data;
  },
  updateStatus: async (meetingId, status) => {
    const res = await api.put(`/meetings/${meetingId}/status`, null, {
      params: { status }
    });
    return res.data;
  }
};

export const aiAPI = {
  generateWeeklyReport: async (bulletPoints) => {
    const res = await api.post('/ai/weekly-progress', { bullet_points: bulletPoints });
    return res.data;
  },
  generateProjectSummary: async (title, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(`/ai/project-summary`, formData, {
      params: { title },
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  generateFeedback: async (title, weekSummary, grade) => {
    const res = await api.post('/ai/feedback', null, {
      params: { title, week_summary: weekSummary, grade }
    });
    return res.data;
  },
  getRecommendations: async (skills, domain, difficultyLevel) => {
    const res = await api.post('/ai/recommendations', { skills, domain, difficulty_level: difficultyLevel });
    return res.data;
  },
  getResume: async (studentId) => {
    const res = await api.get(`/ai/resume/${studentId}`);
    return res.data;
  },
  generatePortfolioDescription: async (projectTitle, technologies) => {
    const res = await api.post('/ai/portfolio-description', null, {
      params: { project_title: projectTitle, technologies }
    });
    return res.data;
  },
  analyzeCode: async (code) => {
    const res = await api.post('/ai/code-review', { bullet_points: code });
    return res.data;
  },
  getProjectHealth: async (projectId) => {
    const res = await api.get(`/ai/project-health/${projectId}`);
    return res.data;
  }
};

export const reportAPI = {
  getDownloadUrl: (reportType, format, deptId = null) => {
    const token = localStorage.getItem('token');
    let url = `${API_URL}/reports/export?report_type=${reportType}&export_format=${format}&token=${token}`;
    if (deptId) {
      url += `&dept_id=${deptId}`;
    }
    return url;
  }
};

export const notificationAPI = {
  getAll: async () => {
    const res = await api.get('/notifications');
    return res.data;
  },
  markAsRead: async (notifId) => {
    const res = await api.put(`/notifications/${notifId}/read`);
    return res.data;
  }
};

export default api;
