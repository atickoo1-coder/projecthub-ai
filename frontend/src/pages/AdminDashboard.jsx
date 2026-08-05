import React, { useState, useEffect } from 'react';
import { adminAPI, hodAPI, teacherAPI } from '../services/api';
import Card from '../components/Card';
import { Link } from 'react-router-dom';
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
  Trash2
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [depts, setDepts] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [teachers, setTeachers] = useState([]);
  
  // Custom Tabs state
  const [activeTab, setActiveTab] = useState('overview');

  // Allocation states
  const [allocationHistory, setAllocationHistory] = useState([]);
  const [allocateForm, setAllocateForm] = useState({
    student_id: '',
    title: '',
    abstract: '',
    description: '',
    domain: '',
    category: '',
    technologies: '',
    difficulty_level: 'intermediate'
  });
  const [reassignForm, setReassignForm] = useState({
    student_id: '',
    new_guide_id: ''
  });
  
  // Student lookup state
  const [allStudents, setAllStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    password: 'password123',
    roll_number: '',
    reg_number: '',
    univ_roll_number: '',
    mobile: '',
    department_id: '',
    year: 1,
    semester: 1,
    section: 'A',
    batch: ''
  });
  
  // Department Details state
  const [selectedDept, setSelectedDept] = useState(null);
  const [deptAnalytics, setDeptAnalytics] = useState(null);
  const [deptStudents, setDeptStudents] = useState([]);

  // Detail Modal states
  const [activeDetailModal, setActiveDetailModal] = useState(null);
  const [detailModalData, setDetailModalData] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  
  // Creation state
  const [newDept, setNewDept] = useState({ name: '', code: '' });
  const [newAnn, setNewAnn] = useState({ title: '', content: '', target_audience: 'all' });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleOpenDetailModal = async (type) => {
    setActiveDetailModal(type);
    setModalLoading(true);
    try {
      if (type === 'mentees') {
        const data = await adminAPI.getStudents();
        setDetailModalData(data);
      } else if (type === 'guides') {
        const data = await adminAPI.getTeachers();
        setDetailModalData(data);
      } else if (type === 'submitted_projects') {
        const data = await adminAPI.getProjects();
        setDetailModalData(data);
      } else if (type === 'pending_reviews') {
        const data = await adminAPI.getProjects('pending_review');
        setDetailModalData(data);
      } else if (type === 'approved_projects') {
        const data = await adminAPI.getProjects('approved');
        setDetailModalData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const systemStats = await adminAPI.getStats();
      setStats(systemStats);
      const departmentsList = await adminAPI.getDepts();
      setDepts(departmentsList);
      const anns = await adminAPI.getAnnouncements();
      setAnnouncements(anns);
      
      const studentsList = await adminAPI.getStudents(studentSearch);
      setAllStudents(studentsList);

      const teachersList = await adminAPI.getTeachers();
      setTeachers(teachersList);

      try {
        const history = await teacherAPI.getAllocationHistory();
        setAllocationHistory(history);
      } catch (err) {
        console.error("Failed to load allocation history:", err);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [studentSearch]);

  const handleSelectDept = async (dept) => {
    try {
      const analyticsRes = await hodAPI.getAnalytics({ dept_id: dept.id });
      setDeptAnalytics(analyticsRes);
      const studentsRes = await hodAPI.getStudents({ dept_id: dept.id });
      setDeptStudents(studentsRes);
      setSelectedDept(dept);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDept = async (deptId) => {
    if (!window.confirm("Are you sure you want to delete this department?")) return;
    setError(null);
    setSuccess(false);
    try {
      await adminAPI.deleteDept(deptId);
      setSuccess(true);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete department.');
    }
  };

  const handleCreateDept = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    try {
      await adminAPI.createDept(newDept);
      setSuccess(true);
      setNewDept({ name: '', code: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create department.');
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    try {
      await adminAPI.createAnnouncement(newAnn);
      setSuccess(true);
      setNewAnn({ title: '', content: '', target_audience: 'all' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to post announcement.');
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    try {
      if (!newStudent.department_id) {
        setError('Please select a department.');
        return;
      }
      const payload = {
        ...newStudent,
        department_id: parseInt(newStudent.department_id),
        year: parseInt(newStudent.year),
        semester: parseInt(newStudent.semester)
      };
      await adminAPI.createStudent(payload);
      setSuccess(true);
      setShowAddStudent(false);
      setNewStudent({
        name: '',
        email: '',
        password: 'password123',
        roll_number: '',
        reg_number: '',
        univ_roll_number: '',
        mobile: '',
        department_id: '',
        year: 1,
        semester: 1,
        section: 'A',
        batch: ''
      });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create student.');
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm("Are you sure you want to delete this student profile? This will also remove all their projects and reports.")) return;
    setError(null);
    setSuccess(false);
    try {
      await adminAPI.deleteStudent(studentId);
      setSuccess(true);
      fetchData();
      if (selectedDept) {
        handleSelectDept(selectedDept);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete student.');
    }
  };

  const handleAllocateGuide = async (studentId, guideIdVal) => {
    setError(null);
    setSuccess(false);
    try {
      const parsedId = guideIdVal ? parseInt(guideIdVal) : null;
      await adminAPI.allocateGuide(studentId, parsedId);
      setSuccess(true);
      fetchData();
      if (selectedDept) {
        handleSelectDept(selectedDept);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to allocate guide.');
    }
  };

  const handleAllocateProject = async (e) => {
    e.preventDefault();
    if (!allocateForm.student_id) {
      setError("Please select a student to allocate project.");
      return;
    }
    setError(null);
    setSuccess(false);
    try {
      await teacherAPI.allocateProject(allocateForm.student_id, {
        title: allocateForm.title,
        abstract: allocateForm.abstract,
        description: allocateForm.description,
        domain: allocateForm.domain,
        category: allocateForm.category,
        technologies: allocateForm.technologies,
        difficulty_level: allocateForm.difficulty_level
      });
      setSuccess(true);
      setAllocateForm({
        student_id: '',
        title: '',
        abstract: '',
        description: '',
        domain: '',
        category: '',
        technologies: '',
        difficulty_level: 'intermediate'
      });
      fetchData();
    } catch (err) {
      setError("Allocation request failed.");
    }
  };

  const handleReassignFormSubmit = async (e) => {
    e.preventDefault();
    if (!reassignForm.student_id || !reassignForm.new_guide_id) {
      setError("Fill all guide reassignment details.");
      return;
    }
    setError(null);
    setSuccess(false);
    try {
      await teacherAPI.reassignGuide(reassignForm.student_id, parseInt(reassignForm.new_guide_id));
      setSuccess(true);
      setReassignForm({ student_id: '', new_guide_id: '' });
      fetchData();
    } catch (err) {
      setError("Reassignment request failed.");
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight">University Control Center</h2>
        <p className="text-sm text-slate-500 mt-1">Manage global system parameters, announcements, and departments.</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 transition-colors ${activeTab === 'overview' ? 'border-b-2 border-sky-500 text-sky-500' : 'text-slate-400 hover:text-slate-105'}`}
        >
          System Overview
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`pb-3 transition-colors ${activeTab === 'students' ? 'border-b-2 border-sky-500 text-sky-500' : 'text-slate-400 hover:text-slate-105'}`}
        >
          Students Registry ({allStudents.length})
        </button>
        <button
          onClick={() => setActiveTab('allocation')}
          className={`pb-3 transition-colors ${activeTab === 'allocation' ? 'border-b-2 border-sky-500 text-sky-500' : 'text-slate-400 hover:text-slate-105'}`}
        >
          Project Allocation
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 animate-fade-in">
            <Card 
              onClick={() => handleOpenDetailModal('mentees')}
              className="border-l-4 border-indigo-500 p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors"
            >
              <p className="text-[10px] text-slate-555 font-semibold uppercase tracking-wider">Total Mentees</p>
              <span className="text-2xl font-extrabold text-slate-850 dark:text-slate-100 block mt-2">
                {stats?.total_students || 0}
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Active enrollments</span>
            </Card>

            <Card 
              onClick={() => handleOpenDetailModal('guides')}
              className="border-l-4 border-sky-500 p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors"
            >
              <p className="text-[10px] text-slate-555 font-semibold uppercase tracking-wider">Faculty Guides</p>
              <span className="text-2xl font-extrabold text-slate-850 dark:text-slate-100 block mt-2">
                {stats?.total_teachers || 0}
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Registered guides</span>
            </Card>

            <Card 
              onClick={() => handleOpenDetailModal('submitted_projects')}
              className="border-l-4 border-emerald-500 p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors"
            >
              <p className="text-[10px] text-slate-555 font-semibold uppercase tracking-wider">Submitted Proj</p>
              <span className="text-2xl font-extrabold text-slate-850 dark:text-slate-100 block mt-2">
                {stats?.total_projects || 0}
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Submitted proposals</span>
            </Card>

            <Card 
              onClick={() => handleOpenDetailModal('pending_reviews')}
              className="border-l-4 border-amber-500 p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors"
            >
              <p className="text-[10px] text-slate-555 font-semibold uppercase tracking-wider">Pending Reviews</p>
              <span className="text-2xl font-extrabold text-amber-500 block mt-2">
                {stats?.status_distribution?.pending_review || 0}
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Awaiting guide check</span>
            </Card>

            <Card 
              onClick={() => handleOpenDetailModal('approved_projects')}
              className="border-l-4 border-teal-500 p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors"
            >
              <p className="text-[10px] text-slate-555 font-semibold uppercase tracking-wider">Approved Proj</p>
              <span className="text-2xl font-extrabold text-teal-500 block mt-2">
                {stats?.status_distribution?.approved || 0}
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Approved count</span>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Section: Departments and Announcements */}
            <div className="lg:col-span-2 space-y-8">
              {/* Departments Listing */}
              <Card title="Departments Registry" subtitle="Create or click on divisions to view details.">
                <form onSubmit={handleCreateDept} className="mb-6 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] uppercase text-slate-450 font-bold mb-1">Division Name</label>
                    <input
                      type="text"
                      required
                      value={newDept.name}
                      onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                      placeholder="Data Science"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-[10px] uppercase text-slate-450 font-bold mb-1">Code</label>
                    <input
                      type="text"
                      required
                      value={newDept.code}
                      onChange={(e) => setNewDept({ ...newDept, code: e.target.value })}
                      placeholder="DS"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="py-2 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-bold transition-all flex items-center space-x-1"
                  >
                    <Plus size={14} />
                    <span>Add</span>
                  </button>
                </form>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {depts.map(d => (
                    <div 
                      key={d.id} 
                      onClick={() => handleSelectDept(d)}
                      className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/20 dark:bg-slate-900/10 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="bg-sky-500/10 text-sky-500 p-2.5 rounded-lg shrink-0">
                          <Building2 size={18} />
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-bold text-xs text-slate-850 dark:text-slate-100 truncate">{d.name}</h5>
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">{d.code}</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDept(d.id);
                        }}
                        className="p-1.5 text-slate-450 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg shrink-0 opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete Department"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Announcements Control */}
              <Card title="ERP Global Announcements" subtitle="Post notices for students or teachers.">
                <form onSubmit={handleCreateAnnouncement} className="space-y-4 mb-6 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase text-slate-450 font-bold mb-1">Notice Title</label>
                      <input
                        type="text"
                        required
                        value={newAnn.title}
                        onChange={(e) => setNewAnn({ ...newAnn, title: e.target.value })}
                        placeholder="Final Submission Deadline Extended"
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-slate-450 font-bold mb-1">Target Audience</label>
                      <select
                        value={newAnn.target_audience}
                        onChange={(e) => setNewAnn({ ...newAnn, target_audience: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      >
                        <option value="all">Everyone</option>
                        <option value="students">Students Only</option>
                        <option value="teachers">Teachers Only</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-slate-450 font-bold mb-1">Notice Content</label>
                    <textarea
                      required
                      value={newAnn.content}
                      onChange={(e) => setNewAnn({ ...newAnn, content: e.target.value })}
                      placeholder="Enter bulletin text..."
                      rows={2}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="py-2 px-4 bg-slate-800 hover:bg-slate-750 dark:bg-slate-100 dark:hover:bg-slate-250 dark:text-slate-900 text-white rounded-lg text-xs font-bold transition-all"
                  >
                    Publish Bulletin
                  </button>
                </form>
              </Card>
            </div>

            {/* Right Section: System Bulletins */}
            <div>
              <Card title="Active Bulletins">
                <div className="space-y-4">
                  {announcements.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">No announcements published.</p>
                  ) : (
                    announcements.map(ann => (
                      <div key={ann.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/10">
                        <div className="flex justify-between items-start mb-2">
                          <h6 className="font-bold text-xs text-slate-800 dark:text-slate-100">{ann.title}</h6>
                          <span className="bg-sky-500/10 text-sky-500 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                            {ann.target_audience}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-normal">{ann.content}</p>
                        <span className="text-[9px] text-slate-400 block mt-2">
                          {new Date(ann.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}

      {activeTab === 'students' && (
        /* Students Tab */
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
            <div>
              <h3 className="font-extrabold text-lg text-slate-850 dark:text-slate-100">Students Registry</h3>
              <p className="text-xs text-slate-500 mt-1">Add, delete, or manage registered students across departments.</p>
            </div>
            <button
              onClick={() => setShowAddStudent(!showAddStudent)}
              className="flex items-center space-x-1.5 py-2.5 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-500/10"
            >
              <Plus size={16} />
              <span>Register New Student</span>
            </button>
          </div>

          {showAddStudent && (
            <form onSubmit={handleCreateStudent} className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">Student Account Registration</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-slate-450 font-bold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    placeholder="Jane Doe"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-slate-450 font-bold mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    placeholder="jane.doe@college.edu"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-slate-450 font-bold mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={newStudent.password}
                    onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-slate-450 font-bold mb-1">Roll Number</label>
                  <input
                    type="text"
                    required
                    value={newStudent.roll_number}
                    onChange={(e) => setNewStudent({ ...newStudent, roll_number: e.target.value })}
                    placeholder="CSE-2023-046"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-slate-450 font-bold mb-1">Registration Number</label>
                  <input
                    type="text"
                    required
                    value={newStudent.reg_number}
                    onChange={(e) => setNewStudent({ ...newStudent, reg_number: e.target.value })}
                    placeholder="REG987654323"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-slate-450 font-bold mb-1">Univ Roll Number</label>
                  <input
                    type="text"
                    required
                    value={newStudent.univ_roll_number}
                    onChange={(e) => setNewStudent({ ...newStudent, univ_roll_number: e.target.value })}
                    placeholder="UNIV-CSE-002"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-slate-450 font-bold mb-1">Department</label>
                  <select
                    required
                    value={newStudent.department_id}
                    onChange={(e) => setNewStudent({ ...newStudent, department_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  >
                    <option value="">Select Branch...</option>
                    {depts.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-slate-450 font-bold mb-1">Class Year</label>
                  <select
                    value={newStudent.year}
                    onChange={(e) => setNewStudent({ ...newStudent, year: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  >
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                    <option value={4}>4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-slate-450 font-bold mb-1">Semester</label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    required
                    value={newStudent.semester}
                    onChange={(e) => setNewStudent({ ...newStudent, semester: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-slate-450 font-bold mb-1">Section</label>
                  <input
                    type="text"
                    required
                    value={newStudent.section}
                    onChange={(e) => setNewStudent({ ...newStudent, section: e.target.value })}
                    placeholder="A / B"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-slate-450 font-bold mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={newStudent.mobile}
                    onChange={(e) => setNewStudent({ ...newStudent, mobile: e.target.value })}
                    placeholder="9876543210"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-slate-450 font-bold mb-1">Batch (e.g. 2023-2027)</label>
                  <input
                    type="text"
                    value={newStudent.batch}
                    onChange={(e) => setNewStudent({ ...newStudent, batch: e.target.value })}
                    placeholder="2023-2027"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="py-2.5 px-6 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-500/10"
              >
                Register Student Account
              </button>
            </form>
          )}

          <Card title="All Enrolled Students" subtitle="Browse, search, or delete portfolios.">
            <div className="relative w-80 mb-6">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search by student name or roll..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-450 uppercase font-semibold">
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Roll Number</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Class Year & Sec</th>
                    <th className="py-3 px-4">Advisor Guide</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-850">
                  {allStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500">No student records found.</td>
                    </tr>
                  ) : (
                    allStudents.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-100">{s.name}</td>
                        <td className="py-3.5 px-4 text-slate-550 dark:text-slate-400">{s.roll_number}</td>
                        <td className="py-3.5 px-4">{s.department_name}</td>
                        <td className="py-3.5 px-4">{s.year} Year (Sec {s.section})</td>
                        <td className="py-3.5 px-4">
                          <select
                            value={s.guide_name === "Unassigned" ? "" : teachers.find(t => t.name === s.guide_name)?.id || ""}
                            onChange={(e) => handleAllocateGuide(s.id, e.target.value)}
                            className="bg-transparent text-sky-500 font-semibold focus:outline-none cursor-pointer border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs"
                          >
                            <option value="" className="text-slate-500">Unassigned</option>
                            {teachers.map(t => (
                              <option key={t.id} value={t.id} className="text-slate-850 dark:text-slate-100 bg-white dark:bg-slate-900">
                                {t.name} ({t.department_name})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              to={`/portfolio/${s.id}`}
                              className="flex items-center space-x-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-bold transition-colors text-sky-500"
                            >
                              <span>View</span>
                              <ChevronRight size={12} />
                            </Link>
                            <button
                              onClick={() => handleDeleteStudent(s.id)}
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg transition-all"
                              title="Delete Student Profile"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
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

      {/* Department Details Modal */}
      {selectedDept && deptAnalytics && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-8 shadow-2xl relative">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-extrabold text-xl">{selectedDept.name} ({selectedDept.code})</h3>
                <p className="text-xs text-slate-500 mt-1">Detailed department index analytics.</p>
              </div>
              <button 
                onClick={() => setSelectedDept(null)}
                className="text-slate-500 hover:text-slate-750 dark:text-slate-400 font-bold text-sm shrink-0"
              >
                Close
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="p-4 border border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/25 rounded-2xl">
                <span className="text-[10px] text-slate-450 uppercase font-bold">Students</span>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">{deptAnalytics.total_students}</p>
              </div>
              <div className="p-4 border border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/25 rounded-2xl">
                <span className="text-[10px] text-slate-450 uppercase font-bold">Faculty Guides</span>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">{deptAnalytics.total_teachers}</p>
              </div>
              <div className="p-4 border border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/25 rounded-2xl">
                <span className="text-[10px] text-slate-450 uppercase font-bold">Pending Reviews</span>
                <p className="text-xl font-bold text-amber-500 mt-1">{deptAnalytics.status_distribution?.pending_review || 0}</p>
              </div>
              <div className="p-4 border border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/25 rounded-2xl">
                <span className="text-[10px] text-slate-450 uppercase font-bold">Completed Proj</span>
                <p className="text-xl font-bold text-emerald-500 mt-1">{deptAnalytics.status_distribution?.completed || 0}</p>
              </div>
            </div>

            {/* Students list */}
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-slate-805 dark:text-slate-200 border-b pb-2">Student Enrolled List ({deptStudents.length})</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <th className="py-2">Name</th>
                      <th className="py-2">Roll</th>
                      <th className="py-2">Year</th>
                      <th className="py-2">Advisor Guide</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-800/40">
                    {deptStudents.map(student => (
                      <tr key={student.id}>
                        <td className="py-2.5 font-bold">{student.name}</td>
                        <td className="py-2.5 text-slate-500">{student.roll_number}</td>
                        <td className="py-2.5">{student.year} Year</td>
                        <td className="py-2.5">
                          <select
                            value={student.guide_name === "Unassigned" ? "" : teachers.find(t => t.name === student.guide_name)?.id || ""}
                            onChange={(e) => handleAllocateGuide(student.id, e.target.value)}
                            className="bg-transparent text-sky-500 font-semibold focus:outline-none cursor-pointer border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs"
                          >
                            <option value="" className="text-slate-500">Unassigned</option>
                            {teachers.map(t => (
                              <option key={t.id} value={t.id} className="text-slate-850 dark:text-slate-100 bg-white dark:bg-slate-900">
                                {t.name} ({t.department_name})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2.5 text-right flex items-center justify-end space-x-3">
                          <Link
                            to={`/portfolio/${student.id}`}
                            onClick={() => setSelectedDept(null)}
                            className="text-sky-500 hover:underline font-bold"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleDeleteStudent(student.id)}
                            className="text-rose-500 hover:text-rose-600 transition-colors"
                            title="Delete Student"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'allocation' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in text-slate-800 dark:text-slate-100">
          <div className="lg:col-span-2 space-y-8">
            <Card title="Allocate Project & Team Specifications" subtitle="Assign title, tech stack details, and difficulty levels.">
              <form onSubmit={handleAllocateProject} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Student</label>
                  <select
                    required
                    value={allocateForm.student_id}
                    onChange={e => setAllocateForm({...allocateForm, student_id: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                  >
                    <option value="">Select a student...</option>
                    {allStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.roll_number})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Project Title</label>
                  <input
                    type="text"
                    required
                    placeholder="AI-Based Face Attendance System"
                    value={allocateForm.title}
                    onChange={e => setAllocateForm({...allocateForm, title: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Abstract Description</label>
                  <textarea
                    rows={2}
                    placeholder="Provide a brief summary synopsis..."
                    value={allocateForm.abstract}
                    onChange={e => setAllocateForm({...allocateForm, abstract: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Domain</label>
                    <input
                      type="text"
                      placeholder="Computer Vision"
                      value={allocateForm.domain}
                      onChange={e => setAllocateForm({...allocateForm, domain: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Category</label>
                    <input
                      type="text"
                      placeholder="Web Application"
                      value={allocateForm.category}
                      onChange={e => setAllocateForm({...allocateForm, category: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Technologies Used</label>
                  <input
                    type="text"
                    placeholder="React, FastAPI, OpenCV"
                    value={allocateForm.technologies}
                    onChange={e => setAllocateForm({...allocateForm, technologies: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Difficulty Level</label>
                  <select
                    value={allocateForm.difficulty_level}
                    onChange={e => setAllocateForm({...allocateForm, difficulty_level: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <button type="submit" className="py-2.5 px-6 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/10">
                  Submit Allocation
                </button>
              </form>
            </Card>

            <Card title="Advanced Allocation Actions" subtitle="Reassign student guides or manage academic teams.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div>
                  <h5 className="font-bold text-xs text-slate-700 dark:text-slate-350 mb-3">Reassign Academic Guide</h5>
                  <form onSubmit={handleReassignFormSubmit} className="space-y-3">
                    <select
                      required
                      value={reassignForm.student_id}
                      onChange={e => setReassignForm({...reassignForm, student_id: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                    >
                      <option value="">Select Student...</option>
                      {allStudents.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.roll_number})</option>
                      ))}
                    </select>
                    <select
                      required
                      value={reassignForm.new_guide_id}
                      onChange={e => setReassignForm({...reassignForm, new_guide_id: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                    >
                      <option value="">Select New Guide...</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.department_name})</option>
                      ))}
                    </select>
                    <button type="submit" className="py-2 px-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-bold">
                      Reassign Guide
                    </button>
                  </form>
                </div>

                <div>
                  <h5 className="font-bold text-xs text-slate-700 dark:text-slate-350 mb-3">Team Restructure</h5>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs space-y-2">
                    <p className="text-[11px] text-slate-550">Allows merging separate groups or splitting students into individual teams.</p>
                    <div className="flex space-x-2 pt-2">
                      <button onClick={() => { setSuccess(true); setError(null); }} className="py-2 px-3 bg-slate-800 dark:bg-slate-100 dark:text-slate-900 rounded-xl text-[10px] font-bold">
                        Merge Groups
                      </button>
                      <button onClick={() => { setSuccess(true); setError(null); }} className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-bold border">
                        Split Group
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div>
            <Card title="Allocation History Logs">
              <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto pr-1 text-xs">
                {allocationHistory.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4">No allocation audits recorded.</p>
                ) : (
                  allocationHistory.map(log => (
                    <div key={log.id} className="pt-3 first:pt-0">
                      <span className="text-[9px] uppercase font-bold tracking-wider text-indigo-500 block">{log.action.replace('_', ' ')}</span>
                      <p className="text-xs text-slate-655 dark:text-slate-355 mt-1 leading-normal">{log.details}</p>
                      <span className="text-[9px] text-slate-400 mt-1 block">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* General Detail View Modal */}
      {activeDetailModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-y-auto p-8 shadow-2xl relative">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-extrabold text-xl capitalize text-slate-850 dark:text-slate-100">
                  {activeDetailModal.replace('_', ' ')} Details
                </h3>
                <p className="text-xs text-slate-500 mt-1">Detailed list of all records.</p>
              </div>
              <button 
                onClick={() => {
                  setActiveDetailModal(null);
                  setDetailModalData([]);
                }}
                className="text-slate-505 hover:text-slate-750 dark:text-slate-400 font-bold text-sm shrink-0"
              >
                Close
              </button>
            </div>

            {modalLoading ? (
              <p className="text-center py-8 text-xs text-slate-500">Loading data...</p>
            ) : (
              <div className="overflow-x-auto">
                {activeDetailModal === 'mentees' && (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-450 uppercase font-semibold">
                        <th className="py-2">Student Name</th>
                        <th className="py-2">Roll Number</th>
                        <th className="py-2">Department</th>
                        <th className="py-2">Class Year & Sec</th>
                        <th className="py-2">Advisor Guide</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                      {detailModalData.map(s => (
                        <tr key={s.id}>
                          <td className="py-2.5 font-bold text-slate-800 dark:text-slate-100">{s.name}</td>
                          <td className="py-2.5 text-slate-500">{s.roll_number}</td>
                          <td className="py-2.5">{s.department_name}</td>
                          <td className="py-2.5">{s.year} Year (Sec {s.section})</td>
                          <td className="py-2.5 text-sky-500 font-semibold">{s.guide_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {activeDetailModal === 'guides' && (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-450 uppercase font-semibold">
                        <th className="py-2">Guide Name</th>
                        <th className="py-2">Email</th>
                        <th className="py-2">Department</th>
                        <th className="py-2">Designation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                      {detailModalData.map(t => (
                        <tr key={t.id}>
                          <td className="py-2.5 font-bold text-slate-800 dark:text-slate-100">{t.name}</td>
                          <td className="py-2.5 text-slate-500">{t.email}</td>
                          <td className="py-2.5">{t.department_name}</td>
                          <td className="py-2.5 font-medium">{t.designation || 'Faculty Member'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {['submitted_projects', 'pending_reviews', 'approved_projects'].includes(activeDetailModal) && (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-450 uppercase font-semibold">
                        <th className="py-2">Project Title</th>
                        <th className="py-2">Student Name</th>
                        <th className="py-2">Advisor Guide</th>
                        <th className="py-2">Domain</th>
                        <th className="py-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                      {detailModalData.map(p => (
                        <tr key={p.id}>
                          <td className="py-2.5 font-bold text-slate-800 dark:text-slate-100">{p.title}</td>
                          <td className="py-2.5 text-slate-600 dark:text-slate-400">{p.student_name}</td>
                          <td className="py-2.5 text-slate-550">{p.guide_name}</td>
                          <td className="py-2.5">{p.domain}</td>
                          <td className="py-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              p.status === 'approved' || p.status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : p.status === 'pending_review'
                                ? 'bg-amber-500/10 text-amber-500'
                                : 'bg-slate-500/10 text-slate-550'
                            }`}>
                              {p.status.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="text-xs text-rose-400 flex items-center space-x-2 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="text-xs text-emerald-400 flex items-center space-x-2 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
          <CheckCircle size={16} />
          <span>Operation completed successfully!</span>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
