import React, { useState, useEffect } from 'react';
import { adminAPI, hodAPI, teacherAPI } from '../services/api';
import Card from '../components/Card';
import { Link } from 'react-router-dom';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  ArcElement, 
  Title as ChartTitle, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { 
  Building2, 
  Megaphone, 
  UserX, 
  Plus, 
  AlertCircle, 
  CheckCircle,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  GraduationCap,
  ChevronRight,
  Search,
  Sparkles,
  Trash2,
  Users,
  FolderOpen,
  ArrowRight,
  Edit2,
  RefreshCw,
  Upload,
  Download,
  Calendar,
  Layers,
  Award,
  AlertTriangle,
  Sliders,
  Settings,
  HelpCircle,
  UserCheck
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, ChartTitle, Tooltip, Legend);

const AdminDashboard = () => {
  // Navigation
  const [activeTab, setActiveTab] = useState('overview');

  // Stats & Analytics Data
  const [stats, setStats] = useState(null);
  const [chartsData, setChartsData] = useState(null);

  // Lists
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [workloads, setWorkloads] = useState([]);
  const [orgDetails, setOrgDetails] = useState({
    departments: [],
    years: [],
    sections: [],
    programs: [],
    semesters: [],
    batches: [],
    classes: []
  });
  const [hierarchy, setHierarchy] = useState({});

  // Tree View Expand States (keyed by node string path)
  const [expandedNodes, setExpandedNodes] = useState({});

  // Search & Filters for Student Directory
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterSec, setFilterSec] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterGuide, setFilterGuide] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);

  // Search & Filters for Teacher Directory
  const [teacherSearch, setTeacherSearch] = useState('');

  // Dialog / Form States
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState({
    name: '',
    email: '',
    password: 'password123',
    roll_number: '',
    reg_number: '',
    univ_roll_number: '',
    mobile: '',
    department_id: '',
    year: 4,
    semester: 7,
    section: 'A',
    class_name: '',
    batch: '2023-2027',
    program: 'B.Tech',
    admission_year: 2023,
    cgpa: 8.0,
    guide_id: ''
  });

  const [editingStudent, setEditingStudent] = useState(null); // student object or null
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [newTeacherForm, setNewTeacherForm] = useState({
    name: '',
    email: '',
    password: 'password123',
    employee_id: '',
    department_id: '',
    designation: 'Assistant Professor',
    qualification: 'Ph.D.',
    experience: 0,
    phone: '',
    office_location: '',
    office_hours: 'Mon/Wed/Fri 10:00 AM - 12:00 PM',
    specializations: ['Artificial Intelligence']
  });

  const [editingTeacher, setEditingTeacher] = useState(null); // teacher object or null
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadSummary, setUploadSummary] = useState(null);

  // Allocation Forms
  const [manualAllocForm, setManualAllocForm] = useState({ student_id: '', teacher_id: '' });
  const [bulkAllocForm, setBulkAllocForm] = useState({ department_id: '', year: 4, section: 'A', teacher_id: '' });
  const [recommendProjectId, setRecommendProjectId] = useState('');
  const [recommendations, setRecommendations] = useState([]);

  // Org Config forms
  const [showAddDept, setShowAddDept] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: '', code: '' });
  
  const [showAddClass, setShowAddClass] = useState(false);
  const [classForm, setClassForm] = useState({
    name: '',
    department_id: '',
    academic_year_id: '',
    section_id: '',
    class_teacher_id: '',
    capacity: 60
  });

  const [showAddSec, setShowAddSec] = useState(false);
  const [secForm, setSecForm] = useState({ name: '' });

  const [showAddBatch, setShowAddBatch] = useState(false);
  const [batchForm, setBatchForm] = useState({ name: '' });

  // Notifications or Feedbacks
  const [announcements, setAnnouncements] = useState([]);
  const [newAnn, setNewAnn] = useState({ title: '', content: '', target_audience: 'all' });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch initial configuration & core data
  const fetchData = async () => {
    setLoading(true);
    try {
      const statsRes = await adminAPI.getOpsStats();
      setStats(statsRes);
      
      const chartsRes = await adminAPI.getCharts();
      setChartsData(chartsRes);

      const studentsRes = await adminAPI.getStudentsDir({
        search: searchQuery,
        year: filterYear,
        department_id: filterDept,
        section: filterSec,
        class_name: filterClass,
        guide_id: filterGuide,
        include_deleted: includeDeleted
      });
      setStudents(studentsRes);

      const teachersRes = await adminAPI.getTeachersDir(teacherSearch);
      setTeachers(teachersRes);

      const workloadRes = await adminAPI.getGuideWorkloads();
      setWorkloads(workloadRes);

      const orgRes = await adminAPI.getOrgDetails();
      setOrgDetails(orgRes);

      const hierarchyRes = await adminAPI.getStudentsHierarchy();
      setHierarchy(hierarchyRes);

      const annRes = await adminAPI.getAnnouncements();
      setAnnouncements(annRes);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch dashboard metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery, filterYear, filterDept, filterSec, filterClass, filterGuide, includeDeleted, teacherSearch]);

  const triggerReset = () => {
    setError(null);
    setSuccess(false);
    fetchData();
  };

  // Student Actions
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    try {
      await adminAPI.createStudentManual({
        ...newStudentForm,
        department_id: parseInt(newStudentForm.department_id),
        year: parseInt(newStudentForm.year),
        semester: parseInt(newStudentForm.semester),
        admission_year: parseInt(newStudentForm.admission_year),
        cgpa: parseFloat(newStudentForm.cgpa) || 8.0,
        guide_id: newStudentForm.guide_id ? parseInt(newStudentForm.guide_id) : null
      });
      setSuccess(true);
      setShowAddStudent(false);
      setNewStudentForm({
        name: '', email: '', password: 'password123', roll_number: '', reg_number: '', univ_roll_number: '',
        mobile: '', department_id: '', year: 4, semester: 7, section: 'A', class_name: '',
        batch: '2023-2027', program: 'B.Tech', admission_year: 2023, cgpa: 8.0, guide_id: ''
      });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create student profile.");
    }
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    try {
      await adminAPI.updateStudent(editingStudent.id, {
        name: editingStudent.name,
        roll_number: editingStudent.roll_number,
        reg_number: editingStudent.reg_number,
        univ_roll_number: editingStudent.univ_roll_number,
        email: editingStudent.email,
        mobile: editingStudent.mobile,
        department_id: parseInt(editingStudent.department_id),
        year: parseInt(editingStudent.year),
        semester: parseInt(editingStudent.semester),
        section: editingStudent.section,
        class_name: editingStudent.class_name,
        batch: editingStudent.batch,
        program: editingStudent.program,
        admission_year: parseInt(editingStudent.admission_year) || 2023,
        cgpa: parseFloat(editingStudent.cgpa) || 8.0,
        guide_id: editingStudent.guide_id ? parseInt(editingStudent.guide_id) : null
      });
      setSuccess(true);
      setEditingStudent(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update student profile.");
    }
  };

  const handleDeleteStudent = async (studentId, mode) => {
    if (mode === 'permanent' && !window.confirm("Are you sure you want to permanently delete this student profile? This action is irreversible.")) {
      return;
    }
    setError(null);
    setSuccess(false);
    try {
      await adminAPI.deleteStudent(studentId, mode);
      setSuccess(true);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || "Delete operation failed.");
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setError("Please select a file to upload.");
      return;
    }
    setError(null);
    setSuccess(false);
    try {
      const summary = await adminAPI.bulkUploadStudents(uploadFile);
      setUploadSummary(summary);
      setSuccess(true);
      setUploadFile(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || "Import bulk upload file failed.");
    }
  };

  // Teacher Actions
  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    try {
      const form = new FormData();
      Object.keys(newTeacherForm).forEach(k => {
        if (k === 'specializations') {
          form.append('specializations_json', JSON.stringify(newTeacherForm.specializations));
        } else {
          form.append(k, newTeacherForm[k]);
        }
      });
      await adminAPI.createTeacherManual(form);
      setSuccess(true);
      setShowAddTeacher(false);
      setNewTeacherForm({
        name: '', email: '', password: 'password123', employee_id: '', department_id: '',
        designation: 'Assistant Professor', qualification: 'Ph.D.', experience: 0, phone: '',
        office_location: '', office_hours: 'Mon/Wed/Fri 10:00 AM - 12:00 PM', specializations: ['Artificial Intelligence']
      });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create teacher profile.");
    }
  };

  const handleUpdateTeacher = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    try {
      const form = new FormData();
      form.append('name', editingTeacher.name);
      form.append('email', editingTeacher.email);
      form.append('designation', editingTeacher.designation);
      form.append('qualification', editingTeacher.qualification);
      form.append('experience', parseInt(editingTeacher.experience) || 0);
      form.append('phone', editingTeacher.phone);
      form.append('office_location', editingTeacher.office_location);
      form.append('office_hours', editingTeacher.office_hours);
      form.append('max_capacity', parseInt(editingTeacher.max_capacity) || 20);
      form.append('specializations_json', JSON.stringify(editingTeacher.specializations));

      await adminAPI.updateTeacher(editingTeacher.id, form);
      setSuccess(true);
      setEditingTeacher(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update teacher profile.");
    }
  };

  // Guide Allocations
  const handleManualAllocate = async (e) => {
    e.preventDefault();
    if (!manualAllocForm.student_id || !manualAllocForm.teacher_id) {
      setError("Please select both student and guide.");
      return;
    }
    setError(null);
    setSuccess(false);
    try {
      const res = await adminAPI.manualAllocateGuide(
        parseInt(manualAllocForm.student_id),
        parseInt(manualAllocForm.teacher_id)
      );
      setSuccess(true);
      if (res.capacity_exceeded_warning) {
        setError("Guide assigned successfully, but maximum supervisor limit was exceeded!");
      }
      setManualAllocForm({ student_id: '', teacher_id: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || "Guide allocation failed.");
    }
  };

  const handleBulkAllocate = async (e) => {
    e.preventDefault();
    if (!bulkAllocForm.department_id || !bulkAllocForm.teacher_id) {
      setError("Please fill in department and target guide.");
      return;
    }
    setError(null);
    setSuccess(false);
    try {
      await adminAPI.bulkAllocateGuides({
        department_id: parseInt(bulkAllocForm.department_id),
        year: parseInt(bulkAllocForm.year),
        section: bulkAllocForm.section,
        teacher_id: parseInt(bulkAllocForm.teacher_id)
      });
      setSuccess(true);
      setBulkAllocForm({ department_id: '', year: 4, section: 'A', teacher_id: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || "Bulk guide allocation failed.");
    }
  };

  const handleGetRecommendation = async (e) => {
    e.preventDefault();
    if (!recommendProjectId) return;
    setError(null);
    try {
      const res = await adminAPI.getSmartGuideRecommendation(parseInt(recommendProjectId));
      setRecommendations(res);
    } catch (err) {
      setError("Project recommendation query failed.");
    }
  };

  // Org Config Creators
  const handleCreateDept = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await adminAPI.addOrgDept(deptForm.name, deptForm.code);
      setSuccess(true);
      setShowAddDept(false);
      setDeptForm({ name: '', code: '' });
      fetchData();
    } catch (err) {
      setError("Department creation failed.");
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await adminAPI.addOrgClass({
        name: classForm.name,
        department_id: parseInt(classForm.department_id),
        academic_year_id: parseInt(classForm.academic_year_id),
        section_id: parseInt(classForm.section_id),
        class_teacher_id: classForm.class_teacher_id ? parseInt(classForm.class_teacher_id) : null,
        capacity: parseInt(classForm.capacity) || 60
      });
      setSuccess(true);
      setShowAddClass(false);
      setClassForm({ name: '', department_id: '', academic_year_id: '', section_id: '', class_teacher_id: '', capacity: 60 });
      fetchData();
    } catch (err) {
      setError("Class creation failed.");
    }
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await adminAPI.addOrgSection(secForm.name);
      setSuccess(true);
      setShowAddSec(false);
      setSecForm({ name: '' });
      fetchData();
    } catch (err) {
      setError("Section creation failed.");
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await adminAPI.addOrgBatch(batchForm.name);
      setSuccess(true);
      setShowAddBatch(false);
      setBatchForm({ name: '' });
      fetchData();
    } catch (err) {
      setError("Batch creation failed.");
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await adminAPI.createAnnouncement(newAnn);
      setSuccess(true);
      setNewAnn({ title: '', content: '', target_audience: 'all' });
      fetchData();
    } catch (err) {
      setError("Announcement publication failed.");
    }
  };

  // Toggle Nodes for tree hierarchy
  const toggleNode = (nodePath) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodePath]: !prev[nodePath]
    }));
  };

  // Chart datasets definitions
  const getDeptChartData = () => {
    if (!chartsData?.students_department) return { labels: [], datasets: [] };
    return {
      labels: chartsData.students_department.map(d => d.label),
      datasets: [{
        label: 'Students Count',
        data: chartsData.students_department.map(d => d.value),
        backgroundColor: '#0ea5e9'
      }]
    };
  };

  const getYearChartData = () => {
    if (!chartsData?.students_year) return { labels: [], datasets: [] };
    return {
      labels: chartsData.students_year.map(y => y.label),
      datasets: [{
        label: 'Enrolled Students',
        data: chartsData.students_year.map(y => y.value),
        backgroundColor: '#6366f1'
      }]
    };
  };

  const getWorkloadChartData = () => {
    if (!chartsData?.guide_workload) return { labels: [], datasets: [] };
    return {
      labels: chartsData.guide_workload.map(w => w.guide),
      datasets: [
        {
          label: 'Allocated Students',
          data: chartsData.guide_workload.map(w => w.assigned),
          backgroundColor: '#3b82f6'
        },
        {
          label: 'Max Limit Capacity',
          data: chartsData.guide_workload.map(w => w.capacity),
          backgroundColor: '#ef4444'
        }
      ]
    };
  };

  const getStatusChartData = () => {
    if (!chartsData?.project_status) return { labels: [], datasets: [] };
    return {
      labels: chartsData.project_status.map(s => s.label),
      datasets: [{
        data: chartsData.project_status.map(s => s.value),
        backgroundColor: ['#f59e0b', '#10b981', '#14b8a6', '#f43f5e']
      }]
    };
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto text-slate-800 dark:text-slate-100">
      {/* Header Banner */}
      <div className="flex justify-between items-center bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-500/10 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">University Control Center</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage global system parameters, departments, student registers, and academic guides.</p>
        </div>
        <button onClick={triggerReset} className="p-3 bg-white dark:bg-slate-900 border hover:bg-slate-50 dark:hover:bg-slate-850 rounded-2xl shadow-sm text-sky-500 transition-all">
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Message alerts */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-pulse">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-fade-in">
          <CheckCircle size={16} />
          <span>Action completed successfully!</span>
        </div>
      )}

      {/* Tabs navigation row */}
      <div className="border-b border-slate-200 dark:border-slate-800 overflow-x-auto flex space-x-2 pb-0.5 scrollbar-thin">
        {[
          { id: 'overview', label: 'Overview Metrics', icon: Layers },
          { id: 'hierarchy', label: 'Student Organization Tree', icon: Sliders },
          { id: 'students', label: 'Student Directory', icon: GraduationCap },
          { id: 'teachers', label: 'Teacher Directory', icon: Users },
          { id: 'allocations', label: 'Guide Allocations', icon: UserCheck },
          { id: 'org', label: 'Academic Setup', icon: Settings },
          { id: 'reports', label: 'Reports Export', icon: Download }
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center space-x-2 pb-3 px-4 text-xs font-bold transition-all border-b-2 shrink-0 ${
                isActive 
                  ? 'border-sky-500 text-sky-500 font-extrabold' 
                  : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Icon size={14} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}

      {/* 1. OVERVIEW METRICS */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fade-in">
          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Total Students', val: stats?.total_students, color: 'text-indigo-500' },
              { label: 'Total Teachers', val: stats?.total_teachers, color: 'text-sky-500' },
              { label: 'Total Guides', val: stats?.total_guides, color: 'text-emerald-500' },
              { label: 'Total Departments', val: stats?.total_departments, color: 'text-amber-500' },
              { label: 'Total Classes', val: stats?.total_classes, color: 'text-pink-500' },
              { label: 'Total Sections', val: stats?.total_sections, color: 'text-purple-500' },
              { label: 'Total Projects', val: stats?.total_projects, color: 'text-rose-500' },
              { label: 'Guide Pending', val: stats?.guide_allocations_pending, color: 'text-red-500' },
              { label: 'Active Projects', val: stats?.active_projects, color: 'text-cyan-500' },
              { label: 'Completed Projects', val: stats?.completed_projects, color: 'text-teal-500' }
            ].map((stat, idx) => (
              <Card key={idx} className="p-4 border-l-4 border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{stat.label}</span>
                <span className={`text-2xl font-extrabold block mt-2 ${stat.color}`}>{stat.val ?? 0}</span>
              </Card>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card title="Students Department-wise" subtitle="Breakdown of student registrations by branch.">
              <div className="h-[220px] flex items-center justify-center">
                {chartsData && <Bar data={getDeptChartData()} options={{ responsive: true, maintainAspectRatio: false }} />}
              </div>
            </Card>
            <Card title="Students Year-wise" subtitle="Academic batch distribution.">
              <div className="h-[220px] flex items-center justify-center">
                {chartsData && <Bar data={getYearChartData()} options={{ responsive: true, maintainAspectRatio: false }} />}
              </div>
            </Card>
            <Card title="Project Distribution Status" subtitle="Overview of project lifecycle stages.">
              <div className="h-[220px] flex items-center justify-center">
                {chartsData && <Pie data={getStatusChartData()} options={{ responsive: true, maintainAspectRatio: false }} />}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card title="Guide Workload Capacity Status" subtitle="Allocations vs limit capacity parameters per teacher.">
              <div className="h-[280px]">
                {chartsData && <Bar data={getWorkloadChartData()} options={{ responsive: true, maintainAspectRatio: false }} />}
              </div>
            </Card>
            
            {/* Announcements Panel */}
            <Card title="College Announcements Board" subtitle="Broadcast system alerts to faculty and students.">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="md:col-span-2 space-y-3">
                  <input
                    type="text"
                    placeholder="Announcement Title"
                    value={newAnn.title}
                    onChange={e => setNewAnn({...newAnn, title: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                  />
                  <textarea
                    rows={2}
                    placeholder="Message Content..."
                    value={newAnn.content}
                    onChange={e => setNewAnn({...newAnn, content: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Target Audience</label>
                  <select
                    value={newAnn.target_audience}
                    onChange={e => setNewAnn({...newAnn, target_audience: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs mb-3"
                  >
                    <option value="all">All Profiles</option>
                    <option value="student">Students Only</option>
                    <option value="teacher">Teachers Only</option>
                  </select>
                  <button onClick={handleCreateAnnouncement} className="w-full py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold">
                    Publish Alert
                  </button>
                </div>
              </div>
              <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100 dark:divide-slate-800">
                {announcements.map(ann => (
                  <div key={ann.id} className="pt-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">{ann.title}</span>
                      <span className="text-[8px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 uppercase font-bold">{ann.target_audience}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{ann.content}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 2. STUDENT ORGANIZATION TREE VIEW */}
      {activeTab === 'hierarchy' && (
        <Card title="Student Organization Roster Hierarchy" subtitle="Expand or collapse nested class groups (Program → Year → Dept → Section → Class → Students).">
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border rounded-3xl max-h-[700px] overflow-y-auto font-mono text-xs space-y-2">
            {Object.keys(hierarchy).length === 0 ? (
              <p className="text-slate-400 italic text-center py-8">No structured student records available.</p>
            ) : (
              Object.keys(hierarchy).map(prog => (
                <div key={prog} className="border-l-2 border-slate-200 dark:border-slate-800 pl-4">
                  <button onClick={() => toggleNode(prog)} className="flex items-center space-x-1.5 font-extrabold text-sky-500 py-1">
                    <span>{expandedNodes[prog] ? '▼' : '►'}</span>
                    <span>{prog} Program Group</span>
                  </button>
                  
                  {expandedNodes[prog] && Object.keys(hierarchy[prog]).map(year => {
                    const yearPath = `${prog}/${year}`;
                    return (
                      <div key={year} className="border-l-2 border-slate-200 dark:border-slate-800 pl-4 ml-2">
                        <button onClick={() => toggleNode(yearPath)} className="flex items-center space-x-1.5 font-bold text-indigo-500 py-1">
                          <span>{expandedNodes[yearPath] ? '▼' : '►'}</span>
                          <span>{year} Students</span>
                        </button>
                        
                        {expandedNodes[yearPath] && Object.keys(hierarchy[prog][year]).map(dept => {
                          const deptPath = `${yearPath}/${dept}`;
                          return (
                            <div key={dept} className="border-l-2 border-slate-200 dark:border-slate-800 pl-4 ml-2">
                              <button onClick={() => toggleNode(deptPath)} className="flex items-center space-x-1.5 font-semibold text-emerald-500 py-1">
                                <span>{expandedNodes[deptPath] ? '▼' : '►'}</span>
                                <span>Dept {dept}</span>
                              </button>
                              
                              {expandedNodes[deptPath] && Object.keys(hierarchy[prog][year][dept]).map(sec => {
                                const secPath = `${deptPath}/${sec}`;
                                return (
                                  <div key={sec} className="border-l-2 border-slate-200 dark:border-slate-800 pl-4 ml-2">
                                    <button onClick={() => toggleNode(secPath)} className="flex items-center space-x-1.5 text-amber-500 py-1">
                                      <span>{expandedNodes[secPath] ? '▼' : '►'}</span>
                                      <span>{sec}</span>
                                    </button>
                                    
                                    {expandedNodes[secPath] && Object.keys(hierarchy[prog][year][dept][sec]).map(cls => {
                                      const clsPath = `${secPath}/${cls}`;
                                      return (
                                        <div key={cls} className="border-l-2 border-slate-200 dark:border-slate-800 pl-4 ml-2">
                                          <button onClick={() => toggleNode(clsPath)} className="flex items-center space-x-1.5 text-purple-400 py-1">
                                            <span>{expandedNodes[clsPath] ? '▼' : '►'}</span>
                                            <span>{cls}</span>
                                          </button>
                                          
                                          {expandedNodes[clsPath] && (
                                            <div className="pl-6 ml-2 space-y-1 bg-white dark:bg-slate-950 p-2 rounded-xl mt-1 max-w-xl">
                                              {hierarchy[prog][year][dept][sec][cls].map(s => (
                                                <div key={s.id} className="py-1 border-b last:border-b-0 flex items-center justify-between text-[11px]">
                                                  <div>
                                                    <span className="font-bold text-slate-800 dark:text-slate-200">{s.name}</span>
                                                    <span className="text-slate-400 ml-1.5">({s.roll_number})</span>
                                                  </div>
                                                  <div className="text-[10px] text-right">
                                                    <span className="block text-sky-500">Guide: {s.guide}</span>
                                                    <span className="block text-slate-400">{s.project}</span>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* 3. STUDENT DIRECTORY */}
      {activeTab === 'students' && (
        <div className="space-y-6 animate-fade-in">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 border p-6 rounded-3xl shadow-sm">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button onClick={() => setShowAddStudent(!showAddStudent)} className="flex items-center space-x-1 py-2 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold shadow-md shadow-sky-500/10">
                <Plus size={14} />
                <span>Register Student</span>
              </button>
              <button onClick={() => setShowUploadModal(true)} className="flex items-center space-x-1 py-2 px-4 bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 text-slate-700 dark:text-slate-350 border rounded-xl font-bold">
                <Upload size={14} />
                <span>Bulk Import</span>
              </button>
            </div>
            
            {/* Search Box */}
            <div className="relative w-72">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Search size={14} /></span>
              <input
                type="text"
                placeholder="Search students..."
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Filters shelf */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 p-4 bg-slate-50/50 dark:bg-slate-900/10 border rounded-2xl text-xs">
            <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl">
              <option value="">All Academic Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
            
            <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl">
              <option value="">All Departments</option>
              {orgDetails.departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Filter section..."
              value={filterSec}
              onChange={e => setFilterSec(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
            />

            <input
              type="text"
              placeholder="Filter class..."
              value={filterClass}
              onChange={e => setFilterClass(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
            />

            <select value={filterGuide} onChange={e => setFilterGuide(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl">
              <option value="">All Guides</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>

            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input type="checkbox" checked={includeDeleted} onChange={e => setIncludeDeleted(e.target.checked)} className="rounded" />
              <span>Show Soft-Deleted</span>
            </label>
          </div>

          {/* Form manual add */}
          {showAddStudent && (
            <Card title="Add Student Roster Manually" subtitle="Automatically generates ID credential profile on submit.">
              <form onSubmit={handleCreateStudent} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Student Name</label>
                  <input required type="text" value={newStudentForm.name} onChange={e => setNewStudentForm({...newStudentForm, name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Email Address</label>
                  <input required type="email" value={newStudentForm.email} onChange={e => setNewStudentForm({...newStudentForm, email: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Roll Number</label>
                  <input required type="text" value={newStudentForm.roll_number} onChange={e => setNewStudentForm({...newStudentForm, roll_number: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Univ Roll</label>
                  <input required type="text" value={newStudentForm.univ_roll_number} onChange={e => setNewStudentForm({...newStudentForm, univ_roll_number: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Reg Number</label>
                  <input required type="text" value={newStudentForm.reg_number} onChange={e => setNewStudentForm({...newStudentForm, reg_number: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Mobile</label>
                  <input type="text" value={newStudentForm.mobile} onChange={e => setNewStudentForm({...newStudentForm, mobile: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Department</label>
                  <select required value={newStudentForm.department_id} onChange={e => setNewStudentForm({...newStudentForm, department_id: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl">
                    <option value="">Select Branch...</option>
                    {orgDetails.departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Academic Year</label>
                  <select value={newStudentForm.year} onChange={e => setNewStudentForm({...newStudentForm, year: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl">
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                    <option value={4}>4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Semester</label>
                  <input type="number" min={1} max={8} value={newStudentForm.semester} onChange={e => setNewStudentForm({...newStudentForm, semester: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Section</label>
                  <input type="text" value={newStudentForm.section} onChange={e => setNewStudentForm({...newStudentForm, section: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Class Name</label>
                  <input type="text" value={newStudentForm.class_name} onChange={e => setNewStudentForm({...newStudentForm, class_name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Batch</label>
                  <input type="text" value={newStudentForm.batch} onChange={e => setNewStudentForm({...newStudentForm, batch: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Program</label>
                  <input type="text" value={newStudentForm.program} onChange={e => setNewStudentForm({...newStudentForm, program: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">CGPA</label>
                  <input type="number" step="0.01" min={0} max={10} value={newStudentForm.cgpa} onChange={e => setNewStudentForm({...newStudentForm, cgpa: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Academic Guide</label>
                  <select value={newStudentForm.guide_id} onChange={e => setNewStudentForm({...newStudentForm, guide_id: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl">
                    <option value="">Select advisor...</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button type="submit" className="w-full py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold">Register Profile</button>
                </div>
              </form>
            </Card>
          )}

          {/* Student table directory */}
          <Card title="Student Directory Listing">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-xs text-slate-400 uppercase font-bold">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Roll</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Class Year & Sec</th>
                    <th className="py-3 px-4">Project & Progress</th>
                    <th className="py-3 px-4">Advisor Guide</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-850">
                  {students.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-6 text-slate-500 italic">No student records found.</td></tr>
                  ) : (
                    students.map(s => (
                      <tr key={s.id} className={`hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors ${s.is_deleted ? 'opacity-50 line-through bg-red-500/5' : ''}`}>
                        <td className="py-3 px-4">
                          <span className="font-bold">{s.name}</span>
                          <span className="block text-[10px] text-slate-400 font-normal">{s.email}</span>
                        </td>
                        <td className="py-3 px-4 font-mono">{s.roll_number}</td>
                        <td className="py-3 px-4">{s.department_name}</td>
                        <td className="py-3 px-4">{s.year} Year (Sec {s.section} / {s.class_name || 'N/A'})</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold block truncate max-w-[180px]">{s.project_title}</span>
                          {s.project_title !== "No Project" && (
                            <div className="w-24 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                              <div className="bg-sky-500 h-1.5" style={{ width: `${s.project_progress}%` }}></div>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sky-500 font-semibold">{s.guide_name}</td>
                        <td className="py-3 px-4 text-right space-x-1.5 shrink-0">
                          <button onClick={() => setEditingStudent(s)} className="p-1 text-sky-500 hover:bg-sky-500/10 rounded" title="Edit Roster">
                            <Edit2 size={12} />
                          </button>
                          {s.is_deleted ? (
                            <>
                              <button onClick={() => handleDeleteStudent(s.id, 'restore')} className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded" title="Restore">
                                <UserCheck size={12} />
                              </button>
                              <button onClick={() => handleDeleteStudent(s.id, 'permanent')} className="p-1 text-rose-500 hover:bg-rose-500/10 rounded" title="Permanent Delete">
                                <Trash2 size={12} />
                              </button>
                            </>
                          ) : (
                            <button onClick={() => handleDeleteStudent(s.id, 'soft')} className="p-1 text-amber-500 hover:bg-amber-500/10 rounded" title="Soft Delete">
                              <Trash2 size={12} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* 4. TEACHER DIRECTORY */}
      {activeTab === 'teachers' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 border p-6 rounded-3xl shadow-sm">
            <button onClick={() => setShowAddTeacher(!showAddTeacher)} className="flex items-center space-x-1 py-2 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/10">
              <Plus size={14} />
              <span>Register Faculty</span>
            </button>
            <div className="relative w-72">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Search size={14} /></span>
              <input
                type="text"
                placeholder="Search teachers..."
                value={teacherSearch}
                onChange={e => setTeacherSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
              />
            </div>
          </div>

          {showAddTeacher && (
            <Card title="Add Faculty Profile" subtitle="Register a new academic guide or class teacher.">
              <form onSubmit={handleCreateTeacher} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Faculty Name</label>
                  <input required type="text" value={newTeacherForm.name} onChange={e => setNewTeacherForm({...newTeacherForm, name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Email Address</label>
                  <input required type="email" value={newTeacherForm.email} onChange={e => setNewTeacherForm({...newTeacherForm, email: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Employee ID</label>
                  <input required type="text" value={newTeacherForm.employee_id} onChange={e => setNewTeacherForm({...newTeacherForm, employee_id: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Department</label>
                  <select required value={newTeacherForm.department_id} onChange={e => setNewTeacherForm({...newTeacherForm, department_id: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl">
                    <option value="">Select Branch...</option>
                    {orgDetails.departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Designation</label>
                  <input type="text" value={newTeacherForm.designation} onChange={e => setNewTeacherForm({...newTeacherForm, designation: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Qualification</label>
                  <input type="text" value={newTeacherForm.qualification} onChange={e => setNewTeacherForm({...newTeacherForm, qualification: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Experience (Years)</label>
                  <input type="number" value={newTeacherForm.experience} onChange={e => setNewTeacherForm({...newTeacherForm, experience: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Phone</label>
                  <input type="text" value={newTeacherForm.phone} onChange={e => setNewTeacherForm({...newTeacherForm, phone: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Office Location</label>
                  <input type="text" value={newTeacherForm.office_location} onChange={e => setNewTeacherForm({...newTeacherForm, office_location: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Office Hours</label>
                  <input type="text" value={newTeacherForm.office_hours} onChange={e => setNewTeacherForm({...newTeacherForm, office_hours: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Specializations (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="AI, Machine Learning, Deep Learning"
                    onChange={e => setNewTeacherForm({...newTeacherForm, specializations: e.target.value.split(',').map(s => s.trim())})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
                <div className="md:col-span-4 flex justify-end">
                  <button type="submit" className="py-2.5 px-6 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold">Register Faculty</button>
                </div>
              </form>
            </Card>
          )}

          <Card title="Teacher Directory Listing" subtitle="Browse details, specialties, or edit allocations.">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-xs text-slate-400 uppercase font-bold">
                    <th className="py-3 px-4">Faculty Name</th>
                    <th className="py-3 px-4">Employee ID</th>
                    <th className="py-3 px-4">Department & Desg</th>
                    <th className="py-3 px-4">Experience & Qual</th>
                    <th className="py-3 px-4">Specializations</th>
                    <th className="py-3 px-4">Load Ratio</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-850">
                  {teachers.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold">{t.name}</span>
                        <span className="block text-[10px] text-slate-400 font-normal">{t.email} • {t.phone}</span>
                      </td>
                      <td className="py-3 px-4 font-mono">{t.employee_id}</td>
                      <td className="py-3 px-4">{t.designation} ({t.department_name})</td>
                      <td className="py-3 px-4">{t.qualification} ({t.experience} Years Exp)</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {t.specializations.map((spec, i) => (
                            <span key={i} className="bg-sky-500/10 text-sky-500 dark:text-sky-400 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">{spec}</span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        <span className={t.assigned_students > t.max_capacity ? "text-rose-500 font-bold" : "text-emerald-500"}>
                          {t.assigned_students} / {t.max_capacity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => setEditingTeacher(t)} className="p-1 text-sky-500 hover:bg-sky-500/10 rounded">
                          <Edit2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* 5. GUIDE ALLOCATION MODULE */}
      {activeTab === 'allocations' && (
        <div className="space-y-8 animate-fade-in">
          {/* Main allocation workload table */}
          <Card title="Guide Workload Overview" subtitle="Tracks supervisor limits, assigned groups, and pending abstract reviews. High workload guides will display in red warning colors.">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-xs text-slate-400 uppercase font-bold">
                    <th className="py-3 px-4">Supervisor Name</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Specialization Tags</th>
                    <th className="py-3 px-4">Total Capacity</th>
                    <th className="py-3 px-4">Assigned Students</th>
                    <th className="py-3 px-4">Remaining Capacity</th>
                    <th className="py-3 px-4">Projects Completed</th>
                    <th className="py-3 px-4">Pending Abstract Evaluations</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-850">
                  {workloads.map(wl => (
                    <tr key={wl.id} className={`hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors ${wl.is_overloaded ? 'bg-rose-500/5 text-rose-500' : ''}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5">
                          {wl.is_overloaded && <AlertTriangle size={14} className="text-rose-500 shrink-0" />}
                          <span className="font-bold">{wl.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{wl.department}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {wl.specializations.map((spec, i) => (
                            <span key={i} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold">{spec}</span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold">{wl.max_capacity}</td>
                      <td className="py-3 px-4 font-semibold">{wl.assigned_students}</td>
                      <td className="py-3 px-4">{wl.remaining_capacity}</td>
                      <td className="py-3 px-4">{wl.completed_projects}</td>
                      <td className="py-3 px-4">{wl.pending_reviews}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Manual Allocation Panel */}
            <Card title="Manual Guide Allocation" subtitle="Assign academic advisors individually to active student profiles.">
              <form onSubmit={handleManualAllocate} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Select Student</label>
                  <select required value={manualAllocForm.student_id} onChange={e => setManualAllocForm({...manualAllocForm, student_id: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl">
                    <option value="">Select Student...</option>
                    {students.filter(s => !s.is_deleted).map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.roll_number})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Select Academic Guide</label>
                  <select required value={manualAllocForm.teacher_id} onChange={e => setManualAllocForm({...manualAllocForm, teacher_id: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl">
                    <option value="">Select Guide...</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.department_name})</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="py-2.5 px-6 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold shadow-md shadow-sky-500/10">Assign Guide</button>
              </form>
            </Card>

            {/* Bulk Guide Allocation Panel */}
            <Card title="Bulk Guide Allocation" subtitle="Allocate a specific supervisor to an entire section or branch batch at once.">
              <form onSubmit={handleBulkAllocate} className="space-y-4 text-xs">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Department</label>
                    <select required value={bulkAllocForm.department_id} onChange={e => setBulkAllocForm({...bulkAllocForm, department_id: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl">
                      <option value="">Select Branch...</option>
                      {orgDetails.departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Class Year</label>
                    <select value={bulkAllocForm.year} onChange={e => setBulkAllocForm({...bulkAllocForm, year: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl">
                      <option value={1}>1st Year</option>
                      <option value={2}>2nd Year</option>
                      <option value={3}>3rd Year</option>
                      <option value={4}>4th Year</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Section</label>
                    <input type="text" value={bulkAllocForm.section} onChange={e => setBulkAllocForm({...bulkAllocForm, section: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Select Supervisor Guide</label>
                  <select required value={bulkAllocForm.teacher_id} onChange={e => setBulkAllocForm({...bulkAllocForm, teacher_id: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl">
                    <option value="">Select Guide...</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.department_name})</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="py-2.5 px-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold shadow-md shadow-indigo-500/10">Bulk Allocate Guide</button>
              </form>
            </Card>
          </div>

          {/* Smart Guide Recommendation */}
          <Card title="Intelligent Smart Guide Advisor Recommendations" subtitle="Enter a student's project ID to automatically analyze technology keyword overlap and workload limits to suggest matching guides.">
            <form onSubmit={handleGetRecommendation} className="flex space-x-3 mb-6">
              <select
                required
                value={recommendProjectId}
                onChange={e => setRecommendProjectId(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs max-w-sm w-full"
              >
                <option value="">Select Project to Recommend Guide...</option>
                {students.filter(s => s.project_title !== "No Project").map(s => (
                  <option key={s.id} value={s.id}>{s.name} - Project: {s.project_title}</option>
                ))}
              </select>
              <button type="submit" className="py-2 px-5 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-indigo-500/10">
                <Sparkles size={14} />
                <span>Get Recommendations</span>
              </button>
            </form>

            <div className="space-y-4">
              {recommendations.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No recommendations searched yet.</p>
              ) : (
                recommendations.map((rec, i) => (
                  <div key={i} className="p-4 border rounded-2xl bg-gradient-to-r from-sky-500/5 to-indigo-500/5 flex items-center justify-between">
                    <div>
                      <h6 className="font-extrabold text-xs text-indigo-500">{rec.teacher_name}</h6>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal">{rec.reason}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {rec.matching_keywords.map((kw, idx) => (
                          <span key={idx} className="bg-sky-500/10 text-sky-500 dark:text-sky-400 px-1.5 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider">{kw} Match</span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setManualAllocForm({ student_id: recommendProjectId, teacher_id: rec.teacher_id });
                        setError(null);
                        setSuccess(false);
                      }}
                      className="py-1.5 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-[10px] font-bold"
                    >
                      Use Recommendation
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* 6. ACADEMIC SETUP TAB */}
      {activeTab === 'org' && (
        <div className="space-y-8 animate-fade-in text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Depts */}
            <Card title="Departments Index">
              <button onClick={() => setShowAddDept(!showAddDept)} className="flex items-center space-x-1 py-1.5 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-bold mb-4">
                <Plus size={12} />
                <span>Create Department</span>
              </button>
              {showAddDept && (
                <form onSubmit={handleCreateDept} className="p-4 bg-slate-50 dark:bg-slate-900 border rounded-2xl space-y-3 mb-4">
                  <input required placeholder="Department Name" value={deptForm.name} onChange={e => setDeptForm({...deptForm, name: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-950 border rounded-xl" />
                  <input required placeholder="Code (e.g. CSE)" value={deptForm.code} onChange={e => setDeptForm({...deptForm, code: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-955 border rounded-xl" />
                  <button type="submit" className="py-1.5 px-4 bg-sky-500 text-white rounded-xl font-bold">Add</button>
                </form>
              )}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {orgDetails.departments.map(d => (
                  <div key={d.id} className="p-3 border rounded-xl flex justify-between items-center bg-slate-50/20 dark:bg-slate-900/10">
                    <span className="font-bold">{d.name}</span>
                    <span className="font-mono text-slate-400">{d.code}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Sections */}
            <Card title="Sections Directory">
              <button onClick={() => setShowAddSec(!showAddSec)} className="flex items-center space-x-1 py-1.5 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-bold mb-4">
                <Plus size={12} />
                <span>Create Section</span>
              </button>
              {showAddSec && (
                <form onSubmit={handleCreateSection} className="p-4 bg-slate-50 dark:bg-slate-900 border rounded-2xl space-y-3 mb-4">
                  <input required placeholder="Section Name (e.g. Section A)" value={secForm.name} onChange={e => setSecForm({...secForm, name: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-950 border rounded-xl" />
                  <button type="submit" className="py-1.5 px-4 bg-sky-500 text-white rounded-xl font-bold">Add</button>
                </form>
              )}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {orgDetails.sections.map(s => (
                  <div key={s.id} className="p-3 border rounded-xl flex justify-between items-center bg-slate-50/20 dark:bg-slate-900/10">
                    <span>{s.name}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Classes */}
            <Card title="Classes Allocation Manager" className="md:col-span-2">
              <button onClick={() => setShowAddClass(!showAddClass)} className="flex items-center space-x-1 py-1.5 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-bold mb-4">
                <Plus size={12} />
                <span>Create Class & Assign Teacher</span>
              </button>
              {showAddClass && (
                <form onSubmit={handleCreateClass} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-900 border rounded-2xl mb-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Class Name</label>
                    <input required placeholder="e.g. Class A1" value={classForm.name} onChange={e => setClassForm({...classForm, name: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-950 border rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Department</label>
                    <select required value={classForm.department_id} onChange={e => setClassForm({...classForm, department_id: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-950 border rounded-xl">
                      <option value="">Select Branch...</option>
                      {orgDetails.departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Year</label>
                    <select required value={classForm.academic_year_id} onChange={e => setClassForm({...classForm, academic_year_id: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-950 border rounded-xl">
                      <option value="">Select Year...</option>
                      {orgDetails.years.map(y => (
                        <option key={y.id} value={y.id}>{y.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Section</label>
                    <select required value={classForm.section_id} onChange={e => setClassForm({...classForm, section_id: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-950 border rounded-xl">
                      <option value="">Select Section...</option>
                      {orgDetails.sections.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Class Teacher</label>
                    <select value={classForm.class_teacher_id} onChange={e => setClassForm({...classForm, class_teacher_id: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-950 border rounded-xl">
                      <option value="">Select Faculty...</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Capacity</label>
                    <input type="number" value={classForm.capacity} onChange={e => setClassForm({...classForm, capacity: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-950 border rounded-xl" />
                  </div>
                  <div className="flex items-end md:col-span-2">
                    <button type="submit" className="py-2.5 px-6 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold w-full">Create Class</button>
                  </div>
                </form>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {orgDetails.classes.map(c => {
                  const dept = orgDetails.departments.find(d => d.id === c.department_id)?.code || "N/A";
                  const yr = orgDetails.years.find(y => y.id === c.academic_year_id)?.name || "N/A";
                  const sec = orgDetails.sections.find(s => s.id === c.section_id)?.name || "N/A";
                  const teacher = teachers.find(t => t.id === c.class_teacher_id)?.name || "Unassigned";
                  return (
                    <div key={c.id} className="p-4 border rounded-2xl bg-slate-50/20 dark:bg-slate-900/10">
                      <span className="font-extrabold text-sm block">{c.name}</span>
                      <p className="text-slate-400 text-[10px] mt-1">Branch: {dept} • {yr} • {sec}</p>
                      <span className="block text-sky-500 mt-2">Teacher: {teacher}</span>
                      <span className="block text-slate-500">Student Capacity: {c.capacity}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 7. REPORTS EXPORTER */}
      {activeTab === 'reports' && (
        <Card title="College Academic Project System Reports Center" subtitle="Generate structured lists or workload diagnostics files in spreadsheet formats.">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs mt-4">
            {[
              { id: 'student_list', label: 'All Registered Students', desc: 'Enrolled profiles, rolls, assigned guides, and project details.' },
              { id: 'teacher_list', label: 'Faculty Directory & Specialties', desc: 'Employee records, designation, qualification, and specialty arrays.' },
              { id: 'guide_workload', label: 'Supervisor Load Report', desc: 'Allocated load metrics, capacity flags, and completed group counts.' }
            ].map(rep => (
              <div key={rep.id} className="p-5 border rounded-2xl bg-slate-50/20 dark:bg-slate-900/10 flex flex-col justify-between h-[160px]">
                <div>
                  <h6 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{rep.label}</h6>
                  <p className="text-slate-450 text-[11px] mt-1.5 leading-normal">{rep.desc}</p>
                </div>
                <div className="flex space-x-2 pt-4">
                  <a
                    href={adminAPI.getReportsDownloadUrl(rep.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold flex items-center justify-center space-x-1.5 shadow-md shadow-sky-500/10"
                  >
                    <Download size={12} />
                    <span>Download CSV</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* EDIT STUDENT DIALOG */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-y-auto p-8 shadow-2xl relative text-xs">
            <h3 className="font-extrabold text-lg mb-4">Edit Student Portfolio</h3>
            <form onSubmit={handleUpdateStudent} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Student Name</label>
                <input required type="text" value={editingStudent.name} onChange={e => setEditingStudent({...editingStudent, name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Email</label>
                <input required type="email" value={editingStudent.email} onChange={e => setEditingStudent({...editingStudent, email: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Roll Number</label>
                <input required type="text" value={editingStudent.roll_number} onChange={e => setEditingStudent({...editingStudent, roll_number: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Univ Roll</label>
                <input required type="text" value={editingStudent.univ_roll_number} onChange={e => setEditingStudent({...editingStudent, univ_roll_number: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Reg Number</label>
                <input required type="text" value={editingStudent.reg_number} onChange={e => setEditingStudent({...editingStudent, reg_number: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Mobile</label>
                <input type="text" value={editingStudent.mobile || ''} onChange={e => setEditingStudent({...editingStudent, mobile: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Department</label>
                <select required value={editingStudent.department_id} onChange={e => setEditingStudent({...editingStudent, department_id: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl">
                  {orgDetails.departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Class Year</label>
                <select value={editingStudent.year} onChange={e => setEditingStudent({...editingStudent, year: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl">
                  <option value={1}>1st Year</option>
                  <option value={2}>2nd Year</option>
                  <option value={3}>3rd Year</option>
                  <option value={4}>4th Year</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Semester</label>
                <input type="number" min={1} max={8} value={editingStudent.semester} onChange={e => setEditingStudent({...editingStudent, semester: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Section</label>
                <input type="text" value={editingStudent.section} onChange={e => setEditingStudent({...editingStudent, section: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Class Name</label>
                <input type="text" value={editingStudent.class_name || ''} onChange={e => setEditingStudent({...editingStudent, class_name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Batch</label>
                <input type="text" value={editingStudent.batch || ''} onChange={e => setEditingStudent({...editingStudent, batch: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Program</label>
                <input type="text" value={editingStudent.program || ''} onChange={e => setEditingStudent({...editingStudent, program: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">CGPA</label>
                <input type="number" step="0.01" min={0} max={10} value={editingStudent.cgpa || ''} onChange={e => setEditingStudent({...editingStudent, cgpa: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Guide Advisor</label>
                <select value={editingStudent.guide_id || ''} onChange={e => setEditingStudent({...editingStudent, guide_id: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl">
                  <option value="">Unassigned</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3 flex justify-end space-x-2 pt-4">
                <button type="button" onClick={() => setEditingStudent(null)} className="py-2 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl font-bold border">Cancel</button>
                <button type="submit" className="py-2.5 px-6 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TEACHER DIALOG */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-y-auto p-8 shadow-2xl relative text-xs">
            <h3 className="font-extrabold text-lg mb-4">Edit Faculty Profile</h3>
            <form onSubmit={handleUpdateTeacher} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Faculty Name</label>
                <input required type="text" value={editingTeacher.name} onChange={e => setEditingTeacher({...editingTeacher, name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Email</label>
                <input required type="email" value={editingTeacher.email} onChange={e => setEditingTeacher({...editingTeacher, email: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Designation</label>
                <input type="text" value={editingTeacher.designation} onChange={e => setEditingTeacher({...editingTeacher, designation: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Qualification</label>
                <input type="text" value={editingTeacher.qualification} onChange={e => setEditingTeacher({...editingTeacher, qualification: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Experience (Years)</label>
                <input type="number" value={editingTeacher.experience} onChange={e => setEditingTeacher({...editingTeacher, experience: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Phone</label>
                <input type="text" value={editingTeacher.phone} onChange={e => setEditingTeacher({...editingTeacher, phone: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Office Location</label>
                <input type="text" value={editingTeacher.office_location} onChange={e => setEditingTeacher({...editingTeacher, office_location: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Office Hours</label>
                <input type="text" value={editingTeacher.office_hours} onChange={e => setEditingTeacher({...editingTeacher, office_hours: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Maximum Allocation Capacity</label>
                <input type="number" value={editingTeacher.max_capacity} onChange={e => setEditingTeacher({...editingTeacher, max_capacity: parseInt(e.target.value) || 20})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>
              <div className="md:col-span-3">
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Specializations (comma-separated)</label>
                <input
                  type="text"
                  value={editingTeacher.specializations.join(', ')}
                  onChange={e => setEditingTeacher({...editingTeacher, specializations: e.target.value.split(',').map(s => s.trim())})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>
              <div className="md:col-span-3 flex justify-end space-x-2 pt-4">
                <button type="button" onClick={() => setEditingTeacher(null)} className="py-2 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl font-bold border">Cancel</button>
                <button type="submit" className="py-2.5 px-6 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK UPLOAD MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in text-xs">
          <div className="bg-white dark:bg-slate-900 border rounded-3xl w-full max-w-lg p-8 shadow-2xl relative">
            <h3 className="font-extrabold text-lg mb-2">Bulk Import Students</h3>
            <p className="text-slate-450 text-[10px] mb-4">Supported formats: Excel (.xlsx), CSV (.csv). Ensure headers match name, email, roll, class details.</p>
            
            <form onSubmit={handleBulkUpload} className="space-y-4">
              <input
                required
                type="file"
                accept=".csv, .xlsx"
                onChange={e => setUploadFile(e.target.files[0])}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl border-dashed cursor-pointer"
              />
              {uploadSummary && (
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border rounded-2xl text-[11px] font-mono leading-relaxed space-y-1">
                  <span className="block text-emerald-500 font-bold">{uploadSummary.imported} Students Imported</span>
                  <span className="block text-amber-500 font-bold">{uploadSummary.duplicates} Duplicate Records Bypassed</span>
                  <span className="block text-rose-500 font-bold">{uploadSummary.invalid} Invalid Records Bypassed</span>
                </div>
              )}
              <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={() => { setShowUploadModal(false); setUploadSummary(null); }} className="py-2 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl border font-bold">Close</button>
                <button type="submit" className="py-2.5 px-6 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold">Start Import</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
