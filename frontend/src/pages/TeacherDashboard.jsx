import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { teacherAPI, meetingAPI, aiAPI, chatAPI } from '../services/api';
import Card from '../components/Card';
import { 
  Users, 
  FileText, 
  CheckSquare, 
  AlertCircle, 
  Plus, 
  MessageSquare,
  Sparkles,
  ChevronRight,
  Calendar,
  Search,
  Award,
  ShieldAlert,
  Send
} from 'lucide-react';
import { Link } from 'react-router-dom';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [pendingProjects, setPendingProjects] = useState([]);
  
  // Tab states
  const [activeTab, setActiveTab] = useState('overview');
  const [menteeSearch, setMenteeSearch] = useState('');
  
  // Evaluation modal state
  const [selectedProject, setSelectedProject] = useState(null);
  const [grade, setGrade] = useState(8);
  const [comments, setComments] = useState('');
  const [feedbackParts, setFeedbackParts] = useState({
    positive_points: '',
    areas_of_improvement: '',
    recommendations: ''
  });
  
  // Meeting scheduling state
  const [showMeetModal, setShowMeetModal] = useState(false);
  const [meetingForm, setMeetingForm] = useState({
    title: '',
    description: '',
    scheduled_at: '',
    duration_minutes: 30,
    student_id: ''
  });

  // Chat States
  const [chatThreads, setChatThreads] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatText, setChatText] = useState('');
  const [chatError, setChatError] = useState(null);
  const chatMessagesEndRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const fetchData = async () => {
    try {
      const studs = await teacherAPI.getAssignedStudents();
      setStudents(studs);
      const pends = await teacherAPI.getPendingProjects();
      setPendingProjects(pends);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      setGrade(selectedProject.marks ?? 8);
      
      // Look for latest feedback
      if (selectedProject.feedbacks && selectedProject.feedbacks.length > 0) {
        const fb = selectedProject.feedbacks[selectedProject.feedbacks.length - 1];
        setComments(fb.comments || '');
        setFeedbackParts({
          positive_points: fb.positive_points || '',
          areas_of_improvement: fb.areas_of_improvement || '',
          recommendations: fb.recommendations || ''
        });
      } else {
        setComments('');
        setFeedbackParts({
          positive_points: '',
          areas_of_improvement: '',
          recommendations: ''
        });
      }
    }
  }, [selectedProject]);

  const handleApproveStatus = async (projectId, status) => {
    try {
      await teacherAPI.updateProjectStatus(projectId, status);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAISuggestFeedback = async (proj) => {
    if (!proj) return;
    try {
      // Create a summary of current updates
      const weekSummary = proj.progress_updates && proj.progress_updates.length > 0 
        ? proj.progress_updates.map(u => u.work_done).join("; ")
        : "Initial layout and database initialization";
        
      const response = await aiAPI.generateFeedback(proj.title, weekSummary, grade);
      
      setComments(`Overall satisfactory development matching initial scope.`);
      setFeedbackParts({
        positive_points: response.positive_points ? response.positive_points.join('\n') : '',
        areas_of_improvement: response.areas_of_improvement ? response.areas_of_improvement.join('\n') : '',
        recommendations: response.recommendations || ''
      });
    } catch (err) {
      console.error("AI feedback generation failed:", err);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      await teacherAPI.submitFeedback(selectedProject.id, {
        rating: grade,
        comments,
        positive_points: feedbackParts.positive_points,
        areas_of_improvement: feedbackParts.areas_of_improvement,
        recommendations: feedbackParts.recommendations
      });
      // Set to approved automatically when feedback is given, unless it is already completed
      const newStatus = selectedProject.status === "completed" ? "completed" : "approved";
      await teacherAPI.updateProjectStatus(selectedProject.id, newStatus);
      setSelectedProject(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleScheduleMeeting = async (e) => {
    e.preventDefault();
    try {
      await meetingAPI.schedule(meetingForm);
      setShowMeetModal(false);
      setMeetingForm({
        title: '',
        description: '',
        scheduled_at: '',
        duration_minutes: 30,
        student_id: ''
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchChatThreads = async () => {
    try {
      const data = await chatAPI.getThreads();
      setChatThreads(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchChatHistory = async (otherId) => {
    try {
      const data = await chatAPI.getHistory(otherId);
      setChatHistory(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatText.trim() || !activeContact) return;
    setChatError(null);
    try {
      await chatAPI.sendMessage(activeContact.id, chatText);
      setChatText('');
      fetchChatHistory(activeContact.id);
      fetchChatThreads();
    } catch (err) {
      setChatError('Failed to send message.');
    }
  };

  const handleSearchStudents = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const data = await chatAPI.searchUsers(query, 'student');
      setSearchResults(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === 'discussion') {
      fetchChatThreads();
      if (activeContact) {
        fetchChatHistory(activeContact.id);
      }
      const interval = setInterval(() => {
        fetchChatThreads();
        if (activeContact) {
          fetchChatHistory(activeContact.id);
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, activeContact]);

  useEffect(() => {
    if (chatHistory.length > 0) {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  // Get all approved deliverables and active projects
  const approvedProjects = [];
  const activeProjects = [];
  students.forEach(s => {
    if (s.projects) {
      s.projects.forEach(p => {
        const mappedProj = {
          ...p,
          studentName: s.user?.name || s.name,
          studentRoll: s.roll_number,
          studentSection: s.section,
          studentYear: s.year
        };
        if (p.status === 'approved' || p.status === 'completed') {
          approvedProjects.push(mappedProj);
        }
        activeProjects.push(mappedProj);
      });
    }
  });

  const totalProgress = activeProjects.reduce((acc, p) => {
    const currentProg = p.progress_updates && p.progress_updates.length > 0
      ? [...p.progress_updates].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0].progress_percentage
      : 0;
    return acc + currentProg;
  }, 0);

  const averageProgress = activeProjects.length > 0
    ? Math.round(totalProgress / activeProjects.length)
    : 0;

  // Filter mentees
  const filteredStudents = students.filter(s => 
    (s.user?.name || '').toLowerCase().includes(menteeSearch.toLowerCase()) || 
    (s.roll_number || '').toLowerCase().includes(menteeSearch.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Guide Evaluation Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">Assigned Department: {user?.teacher_profile?.department_name} • Designation: {user?.teacher_profile?.designation}</p>
        </div>
        
        <button
          onClick={() => setShowMeetModal(true)}
          className="flex items-center justify-center space-x-2 py-3 px-6 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-sky-500/10"
        >
          <Calendar size={18} />
          <span>Schedule Session</span>
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 transition-colors ${activeTab === 'overview' ? 'border-b-2 border-sky-500 text-sky-500' : 'text-slate-400 hover:text-slate-100'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('mentees')}
          className={`pb-3 transition-colors ${activeTab === 'mentees' ? 'border-b-2 border-sky-500 text-sky-500' : 'text-slate-400 hover:text-slate-100'}`}
        >
          Assigned Mentees ({students.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 transition-colors ${activeTab === 'pending' ? 'border-b-2 border-sky-500 text-sky-500' : 'text-slate-400 hover:text-slate-100'}`}
        >
          Pending Approvals ({pendingProjects.length})
        </button>
        <button
          onClick={() => setActiveTab('deliverables')}
          className={`pb-3 transition-colors ${activeTab === 'deliverables' ? 'border-b-2 border-sky-500 text-sky-500' : 'text-slate-400 hover:text-slate-100'}`}
        >
          Approved Deliverables ({approvedProjects.length})
        </button>
        <button
          onClick={() => setActiveTab('progress')}
          className={`pb-3 transition-colors ${activeTab === 'progress' ? 'border-b-2 border-sky-500 text-sky-500' : 'text-slate-400 hover:text-slate-100'}`}
        >
          Average Progress ({averageProgress}%)
        </button>
        <button
          onClick={() => setActiveTab('discussion')}
          className={`pb-3 transition-colors ${activeTab === 'discussion' ? 'border-b-2 border-sky-500 text-sky-500' : 'text-slate-400 hover:text-slate-100'}`}
        >
          Discussion
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card 
          onClick={() => setActiveTab('mentees')}
          className="border-l-4 border-sky-500 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-all"
        >
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Assigned Mentees</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{students.length}</span>
            <span className="text-xs text-slate-400">Active students</span>
          </div>
        </Card>

        <Card 
          onClick={() => setActiveTab('pending')}
          className="border-l-4 border-amber-500 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-855/20 transition-all"
        >
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Pending Approvals</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{pendingProjects.length}</span>
            <span className="text-xs text-slate-400">Proposals to review</span>
          </div>
        </Card>

        <Card 
          onClick={() => setActiveTab('deliverables')}
          className="border-l-4 border-emerald-500 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-855/20 transition-all"
        >
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Approved Deliverables</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
              {approvedProjects.length}
            </span>
            <span className="text-xs text-slate-400">Total milestones approved</span>
          </div>
        </Card>

        <Card 
          onClick={() => setActiveTab('progress')}
          className="border-l-4 border-indigo-500 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-855/20 transition-all"
        >
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Average Progress</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{averageProgress}%</span>
            <span className="text-xs text-slate-400">Class completion index</span>
          </div>
        </Card>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          {/* Left Section: Proposals and Students */}
          <div className="lg:col-span-2 space-y-8">
            {/* Pending Reviews Card */}
            <Card title="Pending Proposals & Submissions" subtitle="Approve student abstracts or trigger formal evaluations.">
              {pendingProjects.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">All submitted proposals evaluated.</p>
              ) : (
                <div className="space-y-4">
                  {pendingProjects.slice(0, 2).map(proj => (
                    <div key={proj.id} className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/20 dark:bg-slate-900/10 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                      <div className="min-w-0 pr-4 flex-1">
                        <h4 className="font-bold text-sm text-slate-850 dark:text-slate-100 truncate">
                          <Link to={`/project/${proj.id}`} className="hover:text-sky-500 transition-colors">{proj.title}</Link>
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">Submitted by: <span className="font-semibold text-slate-700 dark:text-slate-350">{proj.student.user.name}</span> ({proj.student.roll_number})</p>
                        <div className="flex items-center space-x-2 mt-2 text-[10px] text-slate-400">
                          <span>Domain: {proj.domain || 'N/A'}</span>
                          <span>•</span>
                          <span>Tech: {proj.technologies || 'None'}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0 w-full md:w-auto">
                        <button
                          onClick={() => setSelectedProject(proj)}
                          className="py-1.5 px-3 bg-slate-850 dark:bg-slate-100 dark:text-slate-900 text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          Evaluate
                        </button>
                      </div>
                    </div>
                  ))}
                  {pendingProjects.length > 2 && (
                    <button onClick={() => setActiveTab('pending')} className="w-full text-center text-xs font-bold text-sky-500 hover:underline pt-2 block">
                      View all {pendingProjects.length} pending reviews
                    </button>
                  )}
                </div>
              )}
            </Card>

            {/* Assigned Students */}
            <Card title="Assigned Mentees Summary" subtitle="View active student files and progress.">
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {students.slice(0, 3).map(s => (
                  <div key={s.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-sm text-slate-850 dark:text-slate-100">{s.user?.name}</h5>
                      <p className="text-xs text-slate-500 mt-1">Roll Number: {s.roll_number} • Section: {s.section} • Year {s.year}</p>
                    </div>
                    <Link
                      to={`/portfolio/${s.id}`}
                      className="flex items-center space-x-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-bold transition-colors text-sky-500"
                    >
                      <span>View Portfolio</span>
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                ))}
                {students.length > 3 && (
                  <button onClick={() => setActiveTab('mentees')} className="w-full text-center text-xs font-bold text-sky-500 hover:underline pt-4 block">
                    View all {students.length} mentees
                  </button>
                )}
              </div>
            </Card>
          </div>

          {/* Right Section: Scheduled Syncs */}
          <div>
            <Card title="Sync Sessions">
              <p className="text-xs text-slate-500 mb-4">Meetings scheduled with assigned mentees.</p>
              <div className="space-y-4">
                <button
                  onClick={() => setShowMeetModal(true)}
                  className="w-full py-2.5 bg-slate-850 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center space-x-2 shadow-sm"
                >
                  <Plus size={14} />
                  <span>Schedule New Session</span>
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'mentees' && (
        <Card title="My Assigned Mentees Index" subtitle="Complete registry of assigned active students." className="animate-fade-in">
          <div className="relative w-80 mb-6">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={menteeSearch}
              onChange={(e) => setMenteeSearch(e.target.value)}
              placeholder="Search by student name or roll..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-450 uppercase font-semibold">
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Section / Year</th>
                  <th className="py-3 px-4">Submissions</th>
                  <th className="py-3 px-4">Milestones Approved</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-850">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">No mentee records found.</td>
                  </tr>
                ) : (
                  filteredStudents.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-100">{s.user?.name}</td>
                      <td className="py-3.5 px-4 text-slate-550 dark:text-slate-400">{s.roll_number}</td>
                      <td className="py-3.5 px-4">Sec {s.section} • Year {s.year}</td>
                      <td className="py-3.5 px-4 font-semibold text-sky-500">
                        {s.projects?.length || 0} Project(s)
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded text-[10px] font-bold">
                          {s.completed_projects || 0} Done
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-3">
                          {s.projects && s.projects.length > 0 && (
                            <Link to={`/project/${s.projects[0].id}`} className="text-sky-500 hover:underline font-bold">
                              Track Project
                            </Link>
                          )}
                          <Link
                            to={`/portfolio/${s.id}`}
                            className="flex items-center space-x-0.5 py-1 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-bold transition-colors text-slate-700 dark:text-slate-200"
                          >
                            <span>Portfolio</span>
                            <ChevronRight size={12} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'pending' && (
        <Card title="Submitted Proposals Review Board" subtitle="Inspect and approve student submissions." className="animate-fade-in">
          {pendingProjects.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-12">No project proposals are currently pending evaluation.</p>
          ) : (
            <div className="space-y-6">
              {pendingProjects.map(proj => (
                <div key={proj.id} className="p-6 border border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/10 dark:bg-slate-900/5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-850 dark:text-slate-100">{proj.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">Submitted by: <span className="font-bold text-slate-750 dark:text-slate-350">{proj.student.user.name}</span> ({proj.student.roll_number}) • Sec {proj.student.section}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleApproveStatus(proj.id, 'approved')}
                        className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApproveStatus(proj.id, 'revision_requested')}
                        className="py-1.5 px-3 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                      >
                        Revision
                      </button>
                      <button
                        onClick={() => setSelectedProject(proj)}
                        className="py-1.5 px-3 bg-slate-855 dark:bg-slate-100 dark:text-slate-900 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                      >
                        Evaluate
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-550 dark:text-slate-405 leading-relaxed bg-slate-50/50 dark:bg-slate-950/20 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/40">
                    <span className="font-bold block text-[10px] uppercase text-slate-400 mb-1">Abstract Synopsis:</span>
                    {proj.abstract || 'No abstract/synopsis provided by student.'}
                  </p>

                  <div className="flex flex-wrap gap-4 items-center justify-between text-xs pt-2">
                    <div className="flex items-center space-x-4">
                      <span className="bg-sky-500/10 text-sky-500 px-2 py-0.5 rounded text-[10px] font-bold">Domain: {proj.domain || 'N/A'}</span>
                      <span className="text-slate-450 font-semibold">Tech Stack: {proj.technologies || 'None'}</span>
                    </div>

                    {/* Downloadable files list */}
                    {proj.files && proj.files.length > 0 ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Deliverables:</span>
                        {proj.files.map(f => (
                          <a
                            key={f.id}
                            href={`http://localhost:8000/${f.file_path.replace(/\\/g, '/')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-sky-500/10 hover:text-sky-500 text-slate-500 dark:text-slate-350 rounded-lg text-[10px] font-bold border border-slate-200 dark:border-slate-700 transition-colors shrink-0"
                          >
                            Download {f.file_type.replace('_', ' ').toUpperCase()}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">No files uploaded yet.</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
      {activeTab === 'deliverables' && (
        <Card title="Approved Deliverables & Evaluated Milestones" subtitle="Monitor grading status and edit evaluations of approved projects." className="animate-fade-in">
          {approvedProjects.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-12">No project submissions have been approved yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-450 uppercase font-semibold">
                    <th className="py-3 px-4">Project Title</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Marks Given</th>
                    <th className="py-3 px-4">Evaluation Comments</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-850">
                  {approvedProjects.map(proj => {
                    const latestFeedback = proj.feedbacks && proj.feedbacks.length > 0
                      ? proj.feedbacks[proj.feedbacks.length - 1]
                      : null;
                    return (
                      <tr key={proj.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-100">
                          <Link to={`/project/${proj.id}`} className="hover:text-sky-500 transition-colors">{proj.title}</Link>
                        </td>
                        <td className="py-3.5 px-4 text-slate-550 dark:text-slate-400">
                          <div className="font-semibold text-slate-700 dark:text-slate-300">{proj.studentName}</div>
                          <div className="text-[10px] text-slate-400">{proj.studentRoll} • Sec {proj.studentSection}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase shrink-0 ${
                            proj.status === 'completed' ? 'bg-teal-500/10 text-teal-500' : 'bg-emerald-500/10 text-emerald-500'
                          }`}>{proj.status.replace('_', ' ')}</span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-100">
                          {proj.marks} / 10
                        </td>
                        <td className="py-3.5 px-4 text-slate-550 dark:text-slate-400 max-w-[200px] truncate" title={latestFeedback?.comments || 'No comments'}>
                          {latestFeedback?.comments || <span className="italic text-slate-400">No comments</span>}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => setSelectedProject(proj)}
                              className="py-1 px-2.5 bg-sky-550 hover:bg-sky-600 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                            >
                              Edit Evaluation
                            </button>
                            <Link
                              to={`/project/${proj.id}`}
                              className="py-1 px-2.5 bg-slate-105 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-bold transition-colors text-slate-700 dark:text-slate-200"
                            >
                              Details
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'progress' && (
        <Card title="Class Progress Analytics" subtitle="Track real-time project progress and completion logs of your mentees." className="animate-fade-in">
          {activeProjects.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-12">No active projects found for your mentees.</p>
          ) : (
            <div className="space-y-6">
              {/* Progress Summary Info */}
              <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <div>
                  <h4 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">{averageProgress}%</h4>
                  <p className="text-xs text-slate-500 mt-1">Average Completion Rate across {activeProjects.length} active project(s).</p>
                </div>
                <div className="w-full md:w-64 bg-slate-200 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${averageProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* Progress Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-450 uppercase font-semibold">
                      <th className="py-3 px-4">Student & Project</th>
                      <th className="py-3 px-4">Current Progress</th>
                      <th className="py-3 px-4">Latest Log / Work Done</th>
                      <th className="py-3 px-4">Last Updated</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-850">
                    {activeProjects.map(proj => {
                      const latestUpdate = proj.progress_updates && proj.progress_updates.length > 0
                        ? [...proj.progress_updates].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0]
                        : null;
                      const progVal = latestUpdate ? latestUpdate.progress_percentage : 0;
                      
                      return (
                        <tr key={proj.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                          <td className="py-4 px-4">
                            <div className="font-bold text-slate-800 dark:text-slate-100">{proj.title}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">Student: {proj.studentName} ({proj.studentRoll})</div>
                          </td>
                          <td className="py-4 px-4 w-60">
                            <div className="flex items-center space-x-3">
                              <div className="flex-1 bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    progVal < 30 ? 'bg-rose-500' :
                                    progVal < 70 ? 'bg-amber-500' :
                                    'bg-emerald-500'
                                  }`}
                                  style={{ width: `${progVal}%` }}
                                ></div>
                              </div>
                              <span className="font-bold shrink-0 text-slate-700 dark:text-slate-350 w-8">{progVal}%</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-slate-550 dark:text-slate-400 max-w-[240px] truncate" title={latestUpdate?.work_done || 'No updates logged'}>
                            {latestUpdate?.work_done || <span className="italic text-slate-450">No updates logged</span>}
                          </td>
                          <td className="py-4 px-4 text-slate-500">
                            {latestUpdate ? new Date(latestUpdate.updated_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <Link
                              to={`/project/${proj.id}`}
                              className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-bold transition-colors text-sky-500"
                            >
                              Details
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'discussion' && (
        <Card title="Direct Discussions" subtitle="Direct secure messaging channels with your assigned mentees." className="animate-fade-in">
          <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden h-[500px]">
            {/* Left Contact List (Assigned Mentees & General Search) */}
            <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 space-y-2">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-400 block">Your Mentees</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchStudents(e.target.value)}
                  placeholder="Search students to start chat..."
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {searchQuery.trim() !== '' ? (
                  searchResults.length === 0 ? (
                    <p className="p-6 text-center text-xs text-slate-500">No students found matching "{searchQuery}"</p>
                  ) : (
                    searchResults.map(u => {
                      const thread = chatThreads.find(t => t.id === u.id);
                      const isActive = activeContact?.id === u.id;
                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            const contact = {
                              id: u.id,
                              name: u.name,
                              role: 'student'
                            };
                            setActiveContact(contact);
                            fetchChatHistory(contact.id);
                            // Clear search to restore default view after select
                            setSearchQuery('');
                            setSearchResults([]);
                          }}
                          className={`w-full p-4 flex items-center space-x-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30 ${
                            isActive ? 'bg-sky-500/5 dark:bg-sky-500/10 border-l-4 border-sky-500 font-bold' : ''
                          }`}
                        >
                          <div className="w-9 h-9 rounded-full bg-slate-105 dark:bg-slate-800 flex items-center justify-center font-bold text-sky-500 text-xs shrink-0">
                            {u.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-xs text-slate-850 dark:text-slate-100 truncate">{u.name}</div>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">{u.email}</p>
                          </div>
                        </button>
                      );
                    })
                  )
                ) : (
                  students.length === 0 ? (
                    <p className="p-6 text-center text-xs text-slate-500">No assigned mentees found.</p>
                  ) : (
                    students.map(s => {
                      const thread = chatThreads.find(t => t.id === s.user?.id);
                      const isActive = activeContact?.id === s.user?.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => {
                            const contact = {
                              id: s.user?.id,
                              name: s.user?.name || s.name,
                              role: 'student'
                            };
                            setActiveContact(contact);
                            fetchChatHistory(contact.id);
                          }}
                          className={`w-full p-4 flex items-center space-x-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30 ${
                            isActive ? 'bg-sky-500/5 dark:bg-sky-500/10 border-l-4 border-sky-500' : ''
                          }`}
                        >
                          <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-sky-500 text-xs shrink-0">
                            {(s.user?.name || s.name || 'S').charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-xs text-slate-850 dark:text-slate-100 truncate">{s.user?.name || s.name}</span>
                              {thread && (
                                <span className="text-[9px] text-slate-400 shrink-0">
                                  {new Date(thread.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-550 truncate mt-0.5">
                              {thread ? thread.last_message : 'No messages yet. Start discussion.'}
                            </p>
                            {thread?.unread && (
                              <span className="inline-block w-2 h-2 bg-rose-500 rounded-full mt-1"></span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )
                )}
              </div>
            </div>

            {/* Right Message Window */}
            <div className="flex-1 flex flex-col bg-slate-50/20 dark:bg-slate-950/10">
              {activeContact ? (
                <>
                  {/* Header */}
                  <div className="p-4 border-b border-slate-200 dark:border-slate-855 flex items-center space-x-3 bg-white dark:bg-slate-900">
                    <div className="w-8 h-8 rounded-full bg-sky-500 text-white font-bold flex items-center justify-center text-xs">
                      {activeContact.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-850 dark:text-slate-100">{activeContact.name}</h4>
                      <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Mentee Chat</span>
                    </div>
                  </div>

                  {/* Messages Flow */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    {chatHistory.map(msg => {
                      const isOwn = msg.sender_id === user.id;
                      return (
                        <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] p-3 rounded-2xl text-xs leading-normal shadow-sm ${
                            isOwn 
                              ? 'bg-sky-500 text-white rounded-tr-none' 
                              : 'bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-tl-none text-slate-800 dark:text-slate-200'
                          }`}>
                            <p>{msg.message}</p>
                            <span className={`text-[8px] block text-right mt-1 ${isOwn ? 'text-white/60' : 'text-slate-400'}`}>
                              {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatMessagesEndRef} />
                  </div>

                  {/* Input Form */}
                  <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center space-x-2">
                    <input
                      type="text"
                      value={chatText}
                      onChange={(e) => setChatText(e.target.value)}
                      placeholder="Send a message to your mentee..."
                      className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-805 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="p-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl transition-colors shrink-0"
                    >
                      <Send size={14} />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
                  <MessageSquare size={32} className="mb-2 text-slate-400" />
                  <p className="text-xs font-semibold">Select a mentee from the list to start discussions.</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Evaluation and Feedback Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl max-h-[85vh] overflow-y-auto p-8 shadow-2xl relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl">Project Evaluation</h3>
              <button 
                onClick={() => setSelectedProject(null)}
                className="text-slate-500 hover:text-slate-750 dark:text-slate-400 font-bold text-sm shrink-0"
              >
                Close
              </button>
            </div>

            <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-2">Project: {selectedProject.title}</h4>

            {/* AI Assistant Banner */}
            <div className="bg-gradient-to-r from-sky-500/10 to-indigo-500/10 border border-sky-500/20 p-4 rounded-2xl flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2.5">
                <Sparkles className="text-sky-500 animate-pulse" size={20} />
                <div>
                  <h5 className="text-xs font-bold text-sky-500">AI Feedback Suggestion</h5>
                  <p className="text-[10px] text-slate-500">Autodraft bullet points based on student progress logs.</p>
                </div>
              </div>
              <button
                onClick={() => handleAISuggestFeedback(selectedProject)}
                className="py-1.5 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-[10px] font-extrabold transition-colors flex items-center space-x-1 shadow-sm"
              >
                <Sparkles size={12} />
                <span>Generate Draft</span>
              </button>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Marks (0-10)</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  required
                  value={grade}
                  onChange={(e) => setGrade(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">General Commentary</label>
                <textarea
                  required
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Enter comments on current progress..."
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Positive Points</label>
                <textarea
                  value={feedbackParts.positive_points}
                  onChange={(e) => setFeedbackParts({ ...feedbackParts, positive_points: e.target.value })}
                  placeholder="One per line..."
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Areas of Improvement</label>
                <textarea
                  value={feedbackParts.areas_of_improvement}
                  onChange={(e) => setFeedbackParts({ ...feedbackParts, areas_of_improvement: e.target.value })}
                  placeholder="One per line..."
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Recommendations</label>
                <textarea
                  value={feedbackParts.recommendations}
                  onChange={(e) => setFeedbackParts({ ...feedbackParts, recommendations: e.target.value })}
                  placeholder="Learning resources or design patterns..."
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-850 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white font-bold rounded-xl text-xs transition-colors shadow-md"
              >
                Submit Evaluation & Approve
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Meeting Modal */}
      {showMeetModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-8 shadow-2xl relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">Schedule Advisor Session</h3>
              <button 
                onClick={() => setShowMeetModal(false)}
                className="text-slate-500 hover:text-slate-750 dark:text-slate-400 font-bold text-sm shrink-0"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleScheduleMeeting} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Student Mentee</label>
                <select
                  required
                  value={meetingForm.student_id}
                  onChange={(e) => setMeetingForm({ ...meetingForm, student_id: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none"
                >
                  <option value="">Select a student...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.roll_number})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Session Title</label>
                <input
                  type="text"
                  required
                  value={meetingForm.title}
                  onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                  placeholder="UI Sync / Code evaluation"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  value={meetingForm.description}
                  onChange={(e) => setMeetingForm({ ...meetingForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={meetingForm.scheduled_at}
                    onChange={(e) => setMeetingForm({ ...meetingForm, scheduled_at: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Duration (mins)</label>
                  <input
                    type="number"
                    min={10}
                    required
                    value={meetingForm.duration_minutes}
                    onChange={(e) => setMeetingForm({ ...meetingForm, duration_minutes: parseInt(e.target.value) || 30 })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-sky-500/10"
              >
                Schedule Session
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
