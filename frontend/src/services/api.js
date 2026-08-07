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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.data && error.response.data.detail) {
      const detail = error.response.data.detail;
      if (Array.isArray(detail)) {
        const messages = detail.map(errObj => {
          if (typeof errObj === 'string') {
            return errObj;
          }
          if (errObj && typeof errObj === 'object') {
            const field = errObj.loc ? errObj.loc[errObj.loc.length - 1] : '';
            return field ? `${field}: ${errObj.msg || JSON.stringify(errObj)}` : (errObj.msg || JSON.stringify(errObj));
          }
          return String(errObj);
        });
        error.response.data.detail = messages.join(', ');
      } else if (typeof detail === 'object') {
        error.response.data.detail = JSON.stringify(detail);
      }
    }
    return Promise.reject(error);
  }
);

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
  },
  // Redesigned Teacher Dashboard API Extensions
  getStats: async () => {
    const res = await api.get('/teachers/ops/stats');
    return res.data;
  },
  updateProfile: async (data) => {
    const res = await api.put('/teachers/ops/profile', data);
    return res.data;
  },
  getStudentsTree: async () => {
    const res = await api.get('/teachers/ops/students-tree');
    return res.data;
  },
  allocateProject: async (studentId, data) => {
    const res = await api.post('/teachers/ops/allocate', data, {
      params: { student_id: studentId }
    });
    return res.data;
  },
  reassignGuide: async (studentId, newGuideId) => {
    const res = await api.post('/teachers/ops/reassign-guide', null, {
      params: { student_id: studentId, new_guide_id: newGuideId }
    });
    return res.data;
  },
  getAllocationHistory: async () => {
    const res = await api.get('/teachers/ops/allocation/history');
    return res.data;
  },
  reviewAbstract: async (projectId, data) => {
    const res = await api.post('/teachers/ops/abstract/review', data, {
      params: { project_id: projectId }
    });
    return res.data;
  },
  evaluateAbstractAI: async (projectId) => {
    const res = await api.post('/teachers/ops/abstract/evaluate-ai', null, {
      params: { project_id: projectId }
    });
    return res.data;
  },
  reviewSynopsis: async (data) => {
    const res = await api.post('/teachers/ops/synopsis/review', data);
    return res.data;
  },
  reviewWeeklyProgress: async (data) => {
    const res = await api.post('/teachers/ops/weekly/review', data);
    return res.data;
  },
  reviewReport: async (data) => {
    const res = await api.post('/teachers/ops/report/review', data);
    return res.data;
  },
  evaluateReportAI: async (projectId, reportType) => {
    const res = await api.post('/teachers/ops/report/evaluate-ai', null, {
      params: { project_id: projectId, report_type: reportType }
    });
    return res.data;
  },
  checkPlagiarism: async (projectId) => {
    const res = await api.post('/teachers/ops/plagiarism/check', null, {
      params: { project_id: projectId }
    });
    return res.data;
  },
  evaluateViva: async (data) => {
    const res = await api.post('/teachers/ops/viva/evaluate', data);
    return res.data;
  },
  evaluateRubric: async (data) => {
    const res = await api.post('/teachers/ops/rubrics/evaluate', data);
    return res.data;
  },
  recommendRubricMarksAI: async (projectId) => {
    const res = await api.post('/teachers/ops/rubrics/recommend-ai', null, {
      params: { project_id: projectId }
    });
    return res.data;
  },
  getExportUrl: (reportType) => {
    const token = localStorage.getItem('token');
    return `${API_URL}/teachers/ops/export?report_type=${reportType}&token=${token}`;
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
  },
  getOpsStats: async () => {
    const res = await api.get('/admin/ops/stats');
    return res.data;
  },
  getCharts: async () => {
    const res = await api.get('/admin/ops/charts');
    return res.data;
  },
  getStudentsDir: async (params = {}) => {
    const res = await api.get('/admin/ops/students', { params });
    return res.data;
  },
  createStudentManual: async (data) => {
    const res = await api.post('/admin/ops/students', data);
    return res.data;
  },
  updateStudent: async (studentId, data) => {
    const res = await api.put(`/admin/ops/students/${studentId}`, data);
    return res.data;
  },
  deleteStudent: async (studentId, mode = 'soft') => {
    const res = await api.delete(`/admin/ops/students/${studentId}`, { params: { mode } });
    return res.data;
  },
  bulkUploadStudents: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/admin/ops/students/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  getStudentsHierarchy: async () => {
    const res = await api.get('/admin/ops/students/hierarchy');
    return res.data;
  },
  getTeachersDir: async (search = '') => {
    const res = await api.get('/admin/ops/teachers', { params: { search } });
    return res.data;
  },
  createTeacherManual: async (formData) => {
    const res = await api.post('/admin/ops/teachers', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  updateTeacher: async (teacherId, formData) => {
    const res = await api.put(`/admin/ops/teachers/${teacherId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  getGuideWorkloads: async () => {
    const res = await api.get('/admin/ops/allocations/workload');
    return res.data;
  },
  manualAllocateGuide: async (studentId, teacherId) => {
    const res = await api.post('/admin/ops/allocations/manual', null, {
      params: { student_id: studentId, teacher_id: teacherId }
    });
    return res.data;
  },
  bulkAllocateGuides: async (data) => {
    const res = await api.post('/admin/ops/allocations/bulk', null, { params: data });
    return res.data;
  },
  getSmartGuideRecommendation: async (projectId) => {
    const res = await api.get('/admin/ops/allocations/recommend', { params: { project_id: projectId } });
    return res.data;
  },
  getOrgDetails: async () => {
    const res = await api.get('/admin/ops/org/details');
    return res.data;
  },
  addOrgDept: async (name, code) => {
    const res = await api.post('/admin/ops/org/departments', null, { params: { name, code } });
    return res.data;
  },
  addOrgClass: async (data) => {
    const res = await api.post('/admin/ops/org/classes', null, { params: data });
    return res.data;
  },
  addOrgSection: async (name) => {
    const res = await api.post('/admin/ops/org/sections', null, { params: { name } });
    return res.data;
  },
  addOrgBatch: async (name) => {
    const res = await api.post('/admin/ops/org/batches', null, { params: { name } });
    return res.data;
  },
  getReportsDownloadUrl: (reportType) => {
    const token = localStorage.getItem('token');
    return `${API_URL}/admin/ops/reports/download?report_type=${reportType}&token=${token}`;
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

export const lifecycleAPI = {
  // Proposals
  saveProposalDraft: async (formData) => {
    const res = await api.post('/lifecycle/proposal/draft', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  submitProposal: async (formData) => {
    const res = await api.post('/lifecycle/proposal/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  getMyProposal: async () => {
    const res = await api.get('/lifecycle/proposal/my');
    return res.data;
  },
  deleteProposalDraft: async (id) => {
    const res = await api.delete(`/lifecycle/proposal/${id}`);
    return res.data;
  },
  getPendingProposals: async () => {
    const res = await api.get('/lifecycle/proposal/pending');
    return res.data;
  },
  evaluateProposal: async (id, action, remarks, deadline) => {
    const formData = new FormData();
    formData.append('action', action);
    if (remarks) formData.append('remarks', remarks);
    if (deadline) formData.append('deadline', deadline);
    const res = await api.post(`/lifecycle/proposal/${id}/action`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  // Weekly Progress
  submitWeeklyProgress: async (formData) => {
    const res = await api.post('/lifecycle/weekly/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  getMyWeeklyProgress: async () => {
    const res = await api.get('/lifecycle/weekly/my');
    return res.data;
  },
  getProjectWeeklyProgress: async (projectId) => {
    const res = await api.get(`/lifecycle/weekly/project/${projectId}`);
    return res.data;
  },
  evaluateWeeklyProgress: async (id, status, comments, weeklyMarks) => {
    const formData = new FormData();
    formData.append('status', status);
    if (comments) formData.append('comments', comments);
    formData.append('weekly_marks', weeklyMarks);
    const res = await api.post(`/lifecycle/weekly/${id}/feedback`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  // Meetings
  requestMeeting: async (formData) => {
    const res = await api.post('/lifecycle/meetings/request', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  getMyMeetings: async () => {
    const res = await api.get('/lifecycle/meetings/my');
    return res.data;
  },
  approveMeeting: async (id, status, discussion, actionItems, attendance) => {
    const formData = new FormData();
    formData.append('status', status);
    if (discussion) formData.append('discussion', discussion);
    if (actionItems) formData.append('action_items', actionItems);
    if (attendance) formData.append('attendance', attendance);
    const res = await api.post(`/lifecycle/meetings/${id}/approve`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  // Final submission
  submitFinalReport: async (formData) => {
    const res = await api.post('/lifecycle/final/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  getMyFinalSubmission: async () => {
    const res = await api.get('/lifecycle/final/my');
    return res.data;
  },
  evaluateFinalProject: async (formData) => {
    const res = await api.post('/lifecycle/final/evaluate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  getProjectFinalEvaluation: async (projectId) => {
    const res = await api.get(`/lifecycle/evaluation/project/${projectId}`);
    return res.data;
  },

  // Research paper lifecycle
  uploadResearchPaper: async (formData) => {
    const res = await api.post('/lifecycle/research-paper/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  getMyResearchPaper: async () => {
    const res = await api.get('/lifecycle/research-paper/my');
    return res.data;
  },
  evaluateResearchPaper: async (id, status, reviewFeedback) => {
    const formData = new FormData();
    formData.append('status', status);
    if (reviewFeedback) formData.append('review_feedback', reviewFeedback);
    const res = await api.post(`/lifecycle/research-paper/${id}/action`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  // AI reviews
  reviewResearchPaperAI: async (formData) => {
    const res = await api.post('/lifecycle/ai/review-paper', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  reviewProjectReportAI: async (formData) => {
    const res = await api.post('/lifecycle/ai/review-report', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  // Plagiarism checks
  runPlagiarismCheck: async (formData) => {
    const res = await api.post('/lifecycle/plagiarism/check', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
};

export default api;
