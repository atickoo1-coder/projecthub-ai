import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { projectAPI, authAPI, aiAPI, meetingAPI } from '../services/api';
import Card from '../components/Card';
import Kanban from '../components/Kanban';
import Calendar from '../components/Calendar';
import { 
  Sparkles, 
  User, 
  Settings, 
  Folder, 
  CalendarDays, 
  Github, 
  Link2, 
  Award, 
  BookOpen, 
  Briefcase, 
  BarChart, 
  Send, 
  Trash2, 
  Edit2, 
  UploadCloud, 
  RefreshCw, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Plus, 
  ChevronRight, 
  FileCode, 
  CheckCircle2, 
  QrCode,
  Eye,
  Check,
  Video,
  Play
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import InteractiveTimeline from '../components/InteractiveTimeline';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title as ChartTitle,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  ChartTitle,
  Tooltip,
  Legend
);

const StudentDashboard = ({ defaultTab = 'profile' }) => {
  const { user, login, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [portfolioData, setPortfolioData] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // Profile Edit State
  const [profileForm, setProfileForm] = useState({
    name: '',
    mobile: '',
    gender: '',
    date_of_birth: '',
    address: '',
    college: '',
    program: 'B.Tech',
    class_name: '',
    admission_year: '',
    cgpa: '',
    linkedin: '',
    github: '',
    resume_url: '',
    profile_pic_url: '',
    roll_number: '',
    reg_number: '',
    univ_roll_number: '',
    department_id: 1,
    section: '',
    year: 1,
    semester: 1,
    batch: ''
  });
  const [skills, setSkills] = useState([]);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);

  // New Project Form Modal
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    abstract: '',
    description: '',
    domain: '',
    category: '',
    technologies: '',
    difficulty_level: 'intermediate',
    team_size: 1,
    github_repo: '',
    live_url: ''
  });
  const [membersList, setMembersList] = useState([
    { name: '', univ_roll: '', contact: '', section: '' }
  ]);

  // Weekly Progress Form State
  const [weeklyForm, setWeeklyForm] = useState({
    week_number: '',
    work_done: '',
    progress_percentage: '',
    hours_worked: '',
    challenges: '',
    next_week_plan: '',
    github_link: '',
    file_attachment: null
  });

  // Certificate / Placement Form State
  const [certForm, setCertForm] = useState({ title: '', issuing_organization: '', issue_date: '', credential_id: '', credential_url: '' });
  const [placementForm, setPlacementForm] = useState({ company_name: '', role: '', status: 'applied', salary_package: '', interview_date: '' });
  const [milestoneForm, setMilestoneForm] = useState({ title: '', description: '', deadline: '', status: 'pending', max_marks: 20 });
  const [paperForm, setPaperForm] = useState({ title: '', journal: '', publication_date: '', paper_url: '', authors: '' });

  // GitHub Integration Cache State
  const [githubStats, setGithubStats] = useState(null);
  const [syncingGithub, setSyncingGithub] = useState(false);
  const [editingGithub, setEditingGithub] = useState(false);
  const [githubForm, setGithubForm] = useState({
    repo_name: '',
    branch: 'main',
    commit_count: 0,
    stars: 0,
    issues: 0,
    latest_commit: ''
  });
  const [editingLive, setEditingLive] = useState(false);
  const [liveUrlForm, setLiveUrlForm] = useState('');

  // AI Tool states
  const [aiWeeklyInput, setAiWeeklyInput] = useState('');
  const [aiWeeklyResult, setAiWeeklyResult] = useState('');
  const [aiHealth, setAiHealth] = useState(null);
  const [aiCodeInput, setAiCodeInput] = useState('');
  const [aiCodeResult, setAiCodeResult] = useState('');
  const [aiRecommendationResult, setAiRecommendationResult] = useState([]);
  const [aiReportType, setAiReportType] = useState('synopsis');
  const [aiReportResult, setAiReportResult] = useState('');

  // File Locker upload file state
  const [fileToUpload, setFileToUpload] = useState(null);
  const [fileTypeToUpload, setFileTypeToUpload] = useState('report_pdf');

  const fetchData = async () => {
    try {
      if (user?.student_profile?.id) {
        const portfolio = await projectAPI.getPortfolio(user.student_profile.id);
        setPortfolioData(portfolio);
        setProjects(portfolio.projects || []);
        
        if (portfolio.projects && portfolio.projects.length > 0) {
          const currentProj = portfolio.projects[0];
          setActiveProject(currentProj);
          
          // Fetch milestones
          try {
            const mData = await projectAPI.getMilestones(currentProj.id);
            setMilestones(mData);
          } catch (e) {
            console.error("Error loading milestones:", e);
          }
          
          // Fetch GitHub stats
          try {
            const gitData = await projectAPI.getGithubStats(currentProj.id);
            setGithubStats(gitData);
            if (gitData) {
              setGithubForm({
                repo_name: gitData.repo_name || '',
                branch: gitData.branch || 'main',
                commit_count: gitData.commit_count || 0,
                stars: gitData.stars || 0,
                issues: gitData.issues || 0,
                latest_commit: gitData.latest_commit || ''
              });
            }
          } catch (e) {
            console.error("Error loading GitHub stats:", e);
          }
          setLiveUrlForm(currentProj.live_url || '');
        }
        
        // Fetch placement records
        try {
          const plRecords = await projectAPI.getPlacements();
          setPlacements(plRecords);
        } catch (e) {
          console.error("Error loading placements:", e);
        }

        // Populate profile form
        const sp = user.student_profile || {};
        setProfileForm({
          name: user.name || '',
          mobile: sp.mobile || '',
          gender: sp.gender || '',
          date_of_birth: sp.date_of_birth || '',
          address: sp.address || '',
          college: sp.college || 'University College of Engineering',
          program: sp.program || 'B.Tech',
          class_name: sp.class_name || '',
          admission_year: sp.admission_year || '',
          cgpa: sp.cgpa || '',
          linkedin: sp.linkedin || '',
          github: sp.github || '',
          resume_url: sp.resume_url || '',
          profile_pic_url: sp.profile_pic_url || '',
          roll_number: sp.roll_number || '',
          reg_number: sp.reg_number || '',
          univ_roll_number: sp.univ_roll_number || '',
          department_id: sp.department_id || 1,
          section: sp.section || '',
          year: sp.year || 1,
          semester: sp.semester || 1,
          batch: sp.batch || ''
        });
        setSkills(sp.skills ? JSON.parse(sp.skills) : []);
      }
      
      const meetData = await meetingAPI.getAll();
      setMeetings(meetData);
    } catch (e) {
      console.error("Error loading data:", e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Handle profile edit save
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        ...profileForm,
        skills: JSON.stringify(skills)
      };
      await authAPI.updateStudentProfile(payload);
      setSuccess("Profile details updated successfully!");
      setEditingProfile(false);
      
      // Update local storage / user state
      if (typeof refreshProfile === 'function') {
        await refreshProfile();
      }
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  // Create Project
  const handleCreateProject = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...newProject,
        group_members: JSON.stringify(membersList)
      };
      await projectAPI.create(payload);
      setShowAddProjectModal(false);
      setSuccess("Project proposal submitted successfully!");
      fetchData();
    } catch (err) {
      setError("Failed to create project proposal.");
    } finally {
      setLoading(false);
    }
  };

  // Submit Weekly progress
  const handleSubmitWeeklyProgress = async (e) => {
    e.preventDefault();
    if (!activeProject) {
      setError("No active project found to log progress.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        week_number: parseInt(weeklyForm.week_number),
        work_done: weeklyForm.work_done,
        progress_percentage: parseInt(weeklyForm.progress_percentage),
        hours_worked: parseInt(weeklyForm.hours_worked || 0),
        challenges: weeklyForm.challenges,
        next_week_plan: weeklyForm.next_week_plan,
        github_link: weeklyForm.github_link
      };
      await projectAPI.addProgress(activeProject.id, payload);
      setSuccess(`Weekly progress for Week ${weeklyForm.week_number} logged!`);
      setWeeklyForm({
        week_number: '',
        work_done: '',
        progress_percentage: '',
        hours_worked: '',
        challenges: '',
        next_week_plan: '',
        github_link: '',
        file_attachment: null
      });
      fetchData();
    } catch (err) {
      setError("Failed to log progress updates.");
    } finally {
      setLoading(false);
    }
  };

  // Sync GitHub repository caches
  const handleSyncGithub = async () => {
    if (!activeProject) return;
    setSyncingGithub(true);
    try {
      // Simulate real-time fetch and persist to DB
      const mockStats = {
        repo_name: githubStats?.repo_name || "anshultickoo/attendance-cnn",
        branch: "main",
        commit_count: (githubStats?.commit_count || 45) + 3,
        stars: (githubStats?.stars || 10) + 1,
        issues: Math.max(0, (githubStats?.issues || 2) - 1),
        latest_commit: "Fixed convolutional layer speed benchmarks"
      };
      const response = await projectAPI.syncGithubStats(activeProject.id, mockStats);
      setGithubStats(response);
      setSuccess("GitHub repository statistics synchronized!");
    } catch (err) {
      console.error(err);
    } finally {
      setSyncingGithub(false);
    }
  };

  // Update GitHub repository details
  const handleUpdateGithub = async (e) => {
    e.preventDefault();
    if (!activeProject) return;
    try {
      const response = await projectAPI.syncGithubStats(activeProject.id, githubForm);
      setGithubStats(response);
      
      // Update project model github_repo link to keep in sync
      const updatedProj = await projectAPI.updateProject(activeProject.id, {
        github_repo: githubForm.repo_name
      });
      setActiveProject(updatedProj);
      setProjects(projects.map(p => p.id === updatedProj.id ? updatedProj : p));
      
      setSuccess("GitHub integration settings saved!");
      setEditingGithub(false);
    } catch (err) {
      console.error(err);
      setError("Failed to update GitHub integration.");
    }
  };

  // Update Live project deploy credentials
  const handleUpdateLiveUrl = async (e) => {
    e.preventDefault();
    if (!activeProject) return;
    try {
      const updatedProj = await projectAPI.updateProject(activeProject.id, {
        live_url: liveUrlForm
      });
      setActiveProject(updatedProj);
      setSuccess("Live project deploy credentials updated!");
      setEditingLive(false);
      setProjects(projects.map(p => p.id === updatedProj.id ? updatedProj : p));
    } catch (err) {
      console.error(err);
      setError("Failed to update deployment URL.");
    }
  };

  const handleCancelEditGithub = () => {
    if (githubStats) {
      setGithubForm({
        repo_name: githubStats.repo_name || '',
        branch: githubStats.branch || 'main',
        commit_count: githubStats.commit_count || 0,
        stars: githubStats.stars || 0,
        issues: githubStats.issues || 0,
        latest_commit: githubStats.latest_commit || ''
      });
    }
    setEditingGithub(false);
  };

  const handleCancelEditLive = () => {
    if (activeProject) {
      setLiveUrlForm(activeProject.live_url || '');
    }
    setEditingLive(false);
  };

  // Add Placement Record
  const handleAddPlacement = async (e) => {
    e.preventDefault();
    try {
      await projectAPI.addPlacement({
        ...placementForm,
        interview_date: placementForm.interview_date ? placementForm.interview_date : null
      });
      setSuccess("Placement tracker updated!");
      setPlacementForm({ company_name: '', role: '', status: 'applied', salary_package: '', interview_date: '' });
      fetchData();
    } catch (err) {
      setError("Failed to add placement log.");
    }
  };

  const handleDeletePlacement = async (id) => {
    try {
      await projectAPI.deletePlacement(id);
      fetchData();
    } catch (err) {
      setError("Failed to delete placement record.");
    }
  };

  // Add Certificate
  const handleAddCertificate = async (e) => {
    e.preventDefault();
    try {
      await projectAPI.addPortfolioItem('certificates', {
        ...certForm,
        issue_date: certForm.issue_date ? certForm.issue_date : null
      });
      setSuccess("Certificate uploaded successfully!");
      setCertForm({ title: '', issuing_organization: '', issue_date: '', credential_id: '', credential_url: '' });
      fetchData();
    } catch (err) {
      setError("Failed to save certificate.");
    }
  };

  // Add Research paper
  const handleAddResearchPaper = async (e) => {
    e.preventDefault();
    try {
      await projectAPI.addPortfolioItem('research', {
        ...paperForm,
        publication_date: paperForm.publication_date ? paperForm.publication_date : null
      });
      setSuccess("Research paper publication recorded!");
      setPaperForm({ title: '', journal: '', publication_date: '', paper_url: '', authors: '' });
      fetchData();
    } catch (err) {
      setError("Failed to add publication.");
    }
  };

  // Add Project Milestone
  const handleAddMilestone = async (e) => {
    e.preventDefault();
    if (!activeProject) return;
    setLoading(true);
    try {
      await projectAPI.createMilestone(activeProject.id, {
        title: milestoneForm.title,
        description: milestoneForm.description,
        deadline: milestoneForm.deadline,
        status: milestoneForm.status,
        max_marks: parseInt(milestoneForm.max_marks) || 20
      });
      setSuccess("Project milestone added successfully!");
      setMilestoneForm({ title: '', description: '', deadline: '', status: 'pending', max_marks: 20 });
      // Reload milestones
      const miles = await projectAPI.getMilestones(activeProject.id);
      setMilestones(miles);
    } catch (err) {
      setError("Failed to create milestone.");
    } finally {
      setLoading(false);
    }
  };

  // Delete Project Milestone
  const handleDeleteMilestone = async (milestoneId) => {
    if (!window.confirm("Are you sure you want to delete this milestone?")) return;
    setLoading(true);
    try {
      await projectAPI.deleteMilestone(milestoneId);
      setSuccess("Milestone deleted successfully!");
      // Reload milestones
      const miles = await projectAPI.getMilestones(activeProject.id);
      setMilestones(miles);
    } catch (err) {
      setError("Failed to delete milestone.");
    } finally {
      setLoading(false);
    }
  };

  // Upload file in ERP File Locker
  const handleUploadFileLocker = async (e) => {
    e.preventDefault();
    if (!fileToUpload || !activeProject) return;
    setLoading(true);
    try {
      await projectAPI.uploadFile(activeProject.id, fileTypeToUpload, fileToUpload);
      setSuccess("File uploaded and version logged in system locker!");
      setFileToUpload(null);
      fetchData();
    } catch (err) {
      setError("File upload failed.");
    } finally {
      setLoading(false);
    }
  };

  // AI Weekly Report Generator
  const handleAIWeeklyGenerate = async () => {
    if (!aiWeeklyInput.trim()) return;
    setLoading(true);
    try {
      const res = await aiAPI.generateWeeklyReport(aiWeeklyInput);
      setAiWeeklyResult(res.summary);
      setWeeklyForm(prev => ({ ...prev, work_done: res.summary }));
    } catch (err) {
      setError("AI generation failed.");
    } finally {
      setLoading(false);
    }
  };

  // AI Project Health check
  const handleAICheckHealth = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const res = await aiAPI.getProjectHealth(activeProject.id);
      setAiHealth(res);
    } catch (err) {
      setError("AI health diagnostic failed.");
    } finally {
      setLoading(false);
    }
  };

  // AI Code Reviewer
  const handleAICodeReview = async () => {
    if (!aiCodeInput.trim()) return;
    setLoading(true);
    try {
      const res = await aiAPI.analyzeCode(aiCodeInput);
      setAiCodeResult(res.review);
    } catch (err) {
      setError("AI Code Review failed.");
    } finally {
      setLoading(false);
    }
  };

  // AI Project Recommendations
  const handleAIRecommendations = async () => {
    setLoading(true);
    try {
      const res = await aiAPI.getRecommendations(skills, activeProject?.domain || "AI", "intermediate");
      setAiRecommendationResult(res.recommendations || []);
    } catch (err) {
      setError("AI recommendation failed.");
    } finally {
      setLoading(false);
    }
  };

  // AI Report outline generator
  const handleAIReportGenerate = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const prompt = `Generate a comprehensive academic ${aiReportType} outline for project titled '${activeProject.title}' built using ${activeProject.technologies}. Provide chapters, key modules, database model mappings, and functional tests structure.`;
      const res = await aiAPI.generateWeeklyReport(prompt); // Reusing generator engine
      setAiReportResult(res.summary);
    } catch (err) {
      setError("AI Report outline generation failed.");
    } finally {
      setLoading(false);
    }
  };

  // Skill Chip Operations
  const handleAddSkill = async (skill) => {
    if (!skills.includes(skill)) {
      const newSkills = [...skills, skill];
      setSkills(newSkills);
      try {
        await authAPI.updateStudentProfile({ skills: JSON.stringify(newSkills) });
      } catch (err) {
        console.error("Failed to update skills in db:", err);
      }
    }
  };
  const handleRemoveSkill = async (skill) => {
    const newSkills = skills.filter(s => s !== skill);
    setSkills(newSkills);
    try {
      await authAPI.updateStudentProfile({ skills: JSON.stringify(newSkills) });
    } catch (err) {
      console.error("Failed to update skills in db:", err);
    }
  };

  const handleSubmitCustomSkill = () => {
    const val = customSkillInput.trim();
    if (val && !skills.includes(val)) {
      handleAddSkill(val);
      setCustomSkillInput('');
    }
  };

  // Helper stats values
  const getOverallProgress = () => {
    if (!activeProject || !activeProject.progress_updates || activeProject.progress_updates.length === 0) return 0;
    return Math.max(...activeProject.progress_updates.map(up => up.progress_percentage));
  };

  const getUpcomingMilestone = () => {
    const pending = milestones.filter(m => m.status !== 'completed');
    return pending.length > 0 ? pending[0] : null;
  };

  // Analytics Chart Data Configuration
  const getWeeklyProgressChartData = () => {
    const sortedUpdates = activeProject?.progress_updates 
      ? [...activeProject.progress_updates].sort((a, b) => a.week_number - b.week_number)
      : [];
    
    return {
      labels: sortedUpdates.map(u => `Week ${u.week_number}`),
      datasets: [
        {
          label: 'Progress Percentage',
          data: sortedUpdates.map(u => u.progress_percentage),
          borderColor: 'rgb(14, 165, 233)',
          backgroundColor: 'rgba(14, 165, 233, 0.2)',
          tension: 0.3,
          fill: true
        }
      ]
    };
  };

  const getMilestoneChartData = () => {
    return {
      labels: milestones.map(m => m.title),
      datasets: [
        {
          label: 'Marks Awarded',
          data: milestones.map(m => m.marks || 0),
          backgroundColor: 'rgba(99, 102, 241, 0.75)',
          borderRadius: 8
        },
        {
          label: 'Max Marks',
          data: milestones.map(m => m.max_marks || 20),
          backgroundColor: 'rgba(226, 232, 240, 0.5)',
          borderRadius: 8
        }
      ]
    };
  };

  const getHoursWorkedChartData = () => {
    const sortedUpdates = activeProject?.progress_updates 
      ? [...activeProject.progress_updates].sort((a, b) => a.week_number - b.week_number)
      : [];
    return {
      labels: sortedUpdates.map(u => `W${u.week_number}`),
      datasets: [
        {
          label: 'Hours Worked',
          data: sortedUpdates.map(u => u.hours_worked || 8),
          backgroundColor: [
            'rgba(56, 189, 248, 0.8)',
            'rgba(14, 165, 233, 0.8)',
            'rgba(3, 105, 161, 0.8)',
            'rgba(99, 102, 241, 0.8)'
          ],
          borderWidth: 0
        }
      ]
    };
  };

  const nextMilestone = getUpcomingMilestone();
  const progressPercent = getOverallProgress();

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-500/10 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 overflow-hidden flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Welcome, {user?.name || "Student"}!</h2>
          <p className="text-sm text-slate-500 mt-1">
            {user?.student_profile?.college} • {user?.student_profile?.program} in {user?.student_profile?.department_name}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddProjectModal(true)}
            className="flex items-center space-x-1.5 py-2.5 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-500/10"
          >
            <Plus size={16} />
            <span>New Proposal</span>
          </button>
        </div>
      </div>

      {/* Notifications and Alerts banners */}
      {success && (
        <div className="text-xs text-emerald-400 flex items-center space-x-2 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="text-xs text-rose-400 flex items-center space-x-2 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Top ERP summary cards list */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-l-4 border-sky-500 bg-white dark:bg-slate-900 p-4">
          <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Guide</span>
          <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 block mt-1.5 truncate">
            {user?.student_profile?.guide_name || 'Unallocated'}
          </span>
          <span className="text-[9px] text-slate-400 block mt-1">Assigned Academic Mentor</span>
        </Card>

        <Card className="border-l-4 border-emerald-500 bg-white dark:bg-slate-900 p-4">
          <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Overall Progress</span>
          <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100 block mt-1">{progressPercent}%</span>
          <div className="w-full bg-slate-200 dark:bg-slate-850 h-1.5 rounded-full overflow-hidden mt-1.5">
            <div className="bg-emerald-500 h-full" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </Card>

        <Card className="border-l-4 border-amber-500 bg-white dark:bg-slate-900 p-4">
          <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Next Milestone</span>
          <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 block mt-1.5 truncate">
            {nextMilestone ? nextMilestone.title : 'All Done'}
          </span>
          <span className="text-[9px] text-slate-450 block mt-1">
            Status: <span className="font-semibold text-amber-500 capitalize">{nextMilestone ? nextMilestone.status : 'N/A'}</span>
          </span>
        </Card>

        <Card className="border-l-4 border-purple-500 bg-white dark:bg-slate-900 p-4">
          <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Upcoming Deadline</span>
          <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 block mt-1.5">
            {nextMilestone ? nextMilestone.deadline : 'No tasks pending'}
          </span>
          <span className="text-[9px] text-slate-400 block mt-1">Submission Target Date</span>
        </Card>

        <Card className="border-l-4 border-indigo-500 bg-white dark:bg-slate-900 p-4">
          <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Latest Feedback</span>
          <span className="text-xs text-slate-500 block mt-2 truncate italic" title={activeProject?.feedbacks?.[0]?.comments || "No comments"}>
            "{activeProject?.feedbacks?.[0]?.comments || 'No comments'}"
          </span>
          <span className="text-[9px] text-slate-400 block mt-1">Marks: {activeProject?.feedbacks?.[0]?.rating || 0}/10</span>
        </Card>
      </div>

      {/* Main navigation row tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 overflow-x-auto flex space-x-1.5 pb-0.5 scrollbar-thin">
        {[
          { id: 'profile', label: 'Profile & Skills', icon: User },
          { id: 'overview', label: 'Overview', icon: Folder },
          { id: 'progress', label: 'Weekly Reports', icon: Clock },
          { id: 'milestones', label: 'Milestones & Tasks', icon: CheckCircle },
          { id: 'files', label: 'File Locker', icon: UploadCloud },
          { id: 'integrations', label: 'GitHub & Live', icon: Github },
          { id: 'guide', label: 'Advisor Guide', icon: User },
          { id: 'placements', label: 'Placement Board', icon: Briefcase },
          { id: 'certificates', label: 'Certificates', icon: Award },
          { id: 'publications', label: 'Research & Publications', icon: BookOpen },
          { id: 'ai_copilot', label: 'AI Workspace', icon: Sparkles },
          { id: 'analytics', label: 'Performance Analytics', icon: BarChart }
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center space-x-1.5 pb-3 px-4 text-xs font-bold transition-all border-b-2 shrink-0 ${
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

      {/* Tab panel sections */}

      {/* 1. OVERVIEW DASHBOARD */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          <div className="lg:col-span-2 space-y-8">
            <Card title="Current Project Allocation" subtitle="Active academic project specifications.">
              {activeProject ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-base text-slate-855 dark:text-slate-100">{activeProject.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">{activeProject.abstract}</p>
                    </div>
                    <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider">
                      {activeProject.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">Domain</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">{activeProject.domain || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">Category</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">{activeProject.category || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">Difficulty</span>
                      <span className="font-bold text-slate-850 dark:text-slate-100 capitalize">{activeProject.difficulty_level}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">Marks scored</span>
                      <span className="font-extrabold text-sky-500">{activeProject.marks} / 100</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Technology Stack</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {(Array.isArray(activeProject.technologies)
                        ? activeProject.technologies
                        : (activeProject.technologies?.split(',') || [])
                      ).map((t, idx) => (
                        <span key={idx} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 px-2 py-0.5 rounded text-[10px] font-semibold">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <p className="text-xs text-slate-500 font-medium">No project allocated yet. Propose a new project now.</p>
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-8">
            <Card title="Guide Sync Calendar">
              <Calendar meetings={meetings.filter(m => m.status === 'scheduled').slice(0, 3)} />
            </Card>

            <Card title="Announcements & Alerts">
              <div className="space-y-3">
                <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                  <h5 className="font-bold text-xs text-indigo-500">Midterm evaluation scheduled</h5>
                  <p className="text-[10px] text-slate-550 leading-relaxed mt-1">Midterm project verification and SRS inspection will take place next Monday at HOD cabin.</p>
                </div>
                <div className="p-3 bg-sky-500/5 border border-sky-500/10 rounded-2xl">
                  <h5 className="font-bold text-xs text-sky-500">FastAPI project guidelines uploaded</h5>
                  <p className="text-[10px] text-slate-555 leading-relaxed mt-1">Review guidelines for proper database mapping design standards.</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 2. PROFILE & SKILLS */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          <div className="lg:col-span-2 space-y-8">
            <Card 
              title="ERP Profile Details" 
              subtitle="Personal and academic university records."
              headerAction={
                <button
                  onClick={() => setEditingProfile(!editingProfile)}
                  className="flex items-center space-x-1.5 py-1.5 px-3 bg-slate-105 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-all text-slate-700 dark:text-slate-200"
                >
                  <Edit2 size={12} />
                  <span>{editingProfile ? "Cancel" : "Edit Profile"}</span>
                </button>
              }
            >
              {editingProfile ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={profileForm.name} 
                        onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Mobile Number</label>
                      <input 
                        type="text" 
                        value={profileForm.mobile} 
                        onChange={e => setProfileForm({...profileForm, mobile: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Gender</label>
                      <select
                        value={profileForm.gender}
                        onChange={e => setProfileForm({...profileForm, gender: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      >
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Date of Birth</label>
                      <input 
                        type="date" 
                        value={profileForm.date_of_birth} 
                        onChange={e => setProfileForm({...profileForm, date_of_birth: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Current CGPA</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={profileForm.cgpa} 
                        onChange={e => setProfileForm({...profileForm, cgpa: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Admission Year</label>
                      <input 
                        type="number" 
                        value={profileForm.admission_year} 
                        onChange={e => setProfileForm({...profileForm, admission_year: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">College</label>
                      <input 
                        type="text" 
                        value={profileForm.college} 
                        onChange={e => setProfileForm({...profileForm, college: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Program</label>
                      <input 
                        type="text" 
                        value={profileForm.program} 
                        onChange={e => setProfileForm({...profileForm, program: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Section</label>
                      <input 
                        type="text" 
                        value={profileForm.section} 
                        onChange={e => setProfileForm({...profileForm, section: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Roll Number</label>
                      <input 
                        type="text" 
                        value={profileForm.roll_number} 
                        onChange={e => setProfileForm({...profileForm, roll_number: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Registration Number</label>
                      <input 
                        type="text" 
                        value={profileForm.reg_number} 
                        onChange={e => setProfileForm({...profileForm, reg_number: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">University Roll Number</label>
                      <input 
                        type="text" 
                        value={profileForm.univ_roll_number} 
                        onChange={e => setProfileForm({...profileForm, univ_roll_number: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Year</label>
                      <input 
                        type="number" 
                        value={profileForm.year} 
                        onChange={e => setProfileForm({...profileForm, year: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Semester</label>
                      <input 
                        type="number" 
                        value={profileForm.semester} 
                        onChange={e => setProfileForm({...profileForm, semester: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Batch / Grad Year</label>
                      <input 
                        type="text" 
                        value={profileForm.batch} 
                        onChange={e => setProfileForm({...profileForm, batch: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Resume Link (URL)</label>
                      <input 
                        type="url" 
                        value={profileForm.resume_url} 
                        onChange={e => setProfileForm({...profileForm, resume_url: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Profile Photo Link (URL)</label>
                      <input 
                        type="url" 
                        value={profileForm.profile_pic_url} 
                        onChange={e => setProfileForm({...profileForm, profile_pic_url: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">LinkedIn Profile Link</label>
                      <input 
                        type="url" 
                        value={profileForm.linkedin} 
                        onChange={e => setProfileForm({...profileForm, linkedin: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">GitHub Profile Link</label>
                      <input 
                        type="url" 
                        value={profileForm.github} 
                        onChange={e => setProfileForm({...profileForm, github: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Address</label>
                    <textarea 
                      value={profileForm.address} 
                      onChange={e => setProfileForm({...profileForm, address: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      rows={2}
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="py-2.5 px-6 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-500/10"
                  >
                    Save Profile
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  {/* Nesting Graphic hierarchy */}
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-4 border border-slate-200 dark:border-slate-800/80 rounded-2xl flex flex-col md:flex-row items-center justify-around space-y-4 md:space-y-0 text-center">
                    <div>
                      <span className="text-[10px] text-slate-455 uppercase font-bold block">College</span>
                      <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{user?.student_profile?.college || 'U.C.E'}</span>
                    </div>
                    <ChevronRight className="text-slate-300 hidden md:block" />
                    <div>
                      <span className="text-[10px] text-slate-455 uppercase font-bold block">Program</span>
                      <span className="font-extrabold text-sm text-slate-850 dark:text-slate-100">{user?.student_profile?.program || 'B.Tech'}</span>
                    </div>
                    <ChevronRight className="text-slate-300 hidden md:block" />
                    <div>
                      <span className="text-[10px] text-slate-455 uppercase font-bold block">Department</span>
                      <span className="font-extrabold text-sm text-slate-850 dark:text-slate-100">{user?.student_profile?.department_name || 'CSE'}</span>
                    </div>
                    <ChevronRight className="text-slate-300 hidden md:block" />
                    <div>
                      <span className="text-[10px] text-slate-455 uppercase font-bold block">Section</span>
                      <span className="font-extrabold text-sm text-slate-850 dark:text-slate-100">Section {user?.student_profile?.section || 'A'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs leading-normal">
                    <div>
                      <span className="text-slate-400 font-bold block">Roll Number</span>
                      <span className="font-bold text-slate-800 dark:text-slate-150">{user?.student_profile?.roll_number}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block">Registration Number</span>
                      <span className="font-bold text-slate-800 dark:text-slate-150">{user?.student_profile?.reg_number}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block">University Roll</span>
                      <span className="font-bold text-slate-800 dark:text-slate-150">{user?.student_profile?.univ_roll_number}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block">CGPA</span>
                      <span className="font-extrabold text-sky-500">{user?.student_profile?.cgpa || '8.25'} / 10</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs border-t pt-4">
                    <div>
                      <span className="text-slate-400 font-bold block">Mobile</span>
                      <span className="font-bold text-slate-800 dark:text-slate-150">{user?.student_profile?.mobile || '9876543210'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block">Gender</span>
                      <span className="font-bold text-slate-800 dark:text-slate-150">{user?.student_profile?.gender || 'Female'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block">Date of Birth</span>
                      <span className="font-bold text-slate-800 dark:text-slate-150">{user?.student_profile?.date_of_birth || '2003-04-12'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block">Admission Year</span>
                      <span className="font-bold text-slate-800 dark:text-slate-150">{user?.student_profile?.admission_year || '2023'}</span>
                    </div>
                  </div>

                  <div className="border-t pt-4 text-xs">
                    <span className="text-slate-400 font-bold block">Campus Residence / Address</span>
                    <p className="font-bold text-slate-700 dark:text-slate-200 mt-1">{user?.student_profile?.address || '123 Academic Lane, Campus Town'}</p>
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-8">
            {/* Skills chips selector */}
            <Card title="Programming & Skills Stack">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block mb-2">My Current Skills</span>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((s, idx) => (
                      <span key={idx} className="bg-sky-500/10 text-sky-500 px-2.5 py-1 rounded-xl text-xs font-bold flex items-center space-x-1">
                        <span>{s}</span>
                        <button onClick={() => handleRemoveSkill(s)} className="hover:text-rose-500 font-bold ml-1">×</button>
                      </span>
                    ))}
                    {skills.length === 0 && (
                      <span className="text-xs text-slate-400 italic">No skills registered yet. Add some below.</span>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block">Add Custom Skill</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Docker, AWS, Go"
                      value={customSkillInput}
                      onChange={e => setCustomSkillInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSubmitCustomSkill();
                        }
                      }}
                    />
                    <button
                      onClick={handleSubmitCustomSkill}
                      className="py-1.5 px-3.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-500/10"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block mb-2">Quick Add programming languages</span>
                  <div className="flex flex-wrap gap-1.5">
                    {["C", "C++", "Java", "Python", "PHP", "JavaScript", "HTML", "Solidity"].map(s => (
                      <button 
                        key={s} 
                        onClick={() => handleAddSkill(s)} 
                        className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-350 px-2 py-0.5 rounded text-[10px] font-semibold"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block mb-2">Frameworks</span>
                  <div className="flex flex-wrap gap-1.5">
                    {["React", "Angular", "Django", "Flask", "Node.js", "FastAPI", "Express"].map(s => (
                      <button 
                        key={s} 
                        onClick={() => handleAddSkill(s)} 
                        className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-355 px-2 py-0.5 rounded text-[10px] font-semibold"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block mb-2">Databases & AI</span>
                  <div className="flex flex-wrap gap-1.5">
                    {["MySQL", "PostgreSQL", "MongoDB", "TensorFlow", "PyTorch", "OpenCV"].map(s => (
                      <button 
                        key={s} 
                        onClick={() => handleAddSkill(s)} 
                        className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-355 px-2 py-0.5 rounded text-[10px] font-semibold"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 3. WEEKLY REPORTS */}
      {activeTab === 'progress' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          <div className="lg:col-span-1 space-y-8">
            <Card title="Log Weekly Project Progress">
              <form onSubmit={handleSubmitWeeklyProgress} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1">Week Number</label>
                    <input 
                      type="number" 
                      required 
                      placeholder="e.g. 3"
                      value={weeklyForm.week_number} 
                      onChange={e => setWeeklyForm({...weeklyForm, week_number: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1">Hours Worked</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 12"
                      value={weeklyForm.hours_worked} 
                      onChange={e => setWeeklyForm({...weeklyForm, hours_worked: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1">Work Accomplished</label>
                  <textarea 
                    required 
                    placeholder="Describe tasks completed this week..."
                    value={weeklyForm.work_done} 
                    onChange={e => setWeeklyForm({...weeklyForm, work_done: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1">Progress % (Cumulative)</label>
                    <input 
                      type="number" 
                      max="100"
                      required
                      placeholder="e.g. 45"
                      value={weeklyForm.progress_percentage} 
                      onChange={e => setWeeklyForm({...weeklyForm, progress_percentage: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1">GitHub Link (Optional)</label>
                    <input 
                      type="url" 
                      placeholder="https://github.com/..."
                      value={weeklyForm.github_link} 
                      onChange={e => setWeeklyForm({...weeklyForm, github_link: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1">Challenges Encountered</label>
                  <input 
                    type="text" 
                    placeholder="e.g. OpenCV configuration errors"
                    value={weeklyForm.challenges} 
                    onChange={e => setWeeklyForm({...weeklyForm, challenges: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1">Next Week Target Plan</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Design relational SQL schema"
                    value={weeklyForm.next_week_plan} 
                    onChange={e => setWeeklyForm({...weeklyForm, next_week_plan: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-500/10"
                >
                  Log Progress Update
                </button>
              </form>
            </Card>
          </div>

          {/* Weekly progress log list */}
          <div className="lg:col-span-2 space-y-8">
            <Card title="Weekly Progress Log History" subtitle="Chronological summary of all logged academic milestones.">
              {activeProject?.progress_updates && activeProject.progress_updates.length > 0 ? (
                <div className="space-y-6">
                  {[...activeProject.progress_updates].sort((a,b) => b.week_number - a.week_number).map((update, idx) => (
                    <div key={idx} className="relative pl-6 border-l-2 border-sky-500/30 last:border-0 pb-6 last:pb-0">
                      <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-sky-500"></div>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-extrabold text-xs text-sky-500">Week {update.week_number} Update</span>
                          <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">{new Date(update.updated_at).toLocaleDateString()}</span>
                        </div>
                        <span className="bg-sky-500/10 text-sky-500 px-2 py-0.5 rounded text-[10px] font-bold">
                          {update.progress_percentage}% Done
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-355 leading-relaxed mt-2">{update.work_done}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3 text-[10px] text-slate-455 font-bold bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                        <div>Hours Worked: <span className="text-slate-700 dark:text-slate-200">{update.hours_worked || 8}h</span></div>
                        {update.challenges && <div className="truncate">Challenges: <span className="text-rose-500">{update.challenges}</span></div>}
                        {update.next_week_plan && <div className="truncate">Next: <span className="text-slate-700 dark:text-slate-200">{update.next_week_plan}</span></div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-xs text-slate-500 italic">No progress logs recorded yet.</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* 4. MILESTONES & KANBAN */}
      {activeTab === 'milestones' && (
        <div className="space-y-8 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left side: Add milestone form */}
            <div className="lg:col-span-1">
              <Card title="Add Project Milestone" subtitle="Submit new project deliverable targets.">
                <form onSubmit={handleAddMilestone} className="space-y-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Milestone Title</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Database Architecture"
                      value={milestoneForm.title} 
                      onChange={e => setMilestoneForm({...milestoneForm, title: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Description</label>
                    <textarea 
                      required 
                      placeholder="Specify targets..."
                      value={milestoneForm.description} 
                      onChange={e => setMilestoneForm({...milestoneForm, description: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Target Date</label>
                      <input 
                        type="date" 
                        required
                        value={milestoneForm.deadline} 
                        onChange={e => setMilestoneForm({...milestoneForm, deadline: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Max Marks</label>
                      <input 
                        type="number" 
                        required
                        value={milestoneForm.max_marks} 
                        onChange={e => setMilestoneForm({...milestoneForm, max_marks: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Initial Status</label>
                    <select
                      value={milestoneForm.status}
                      onChange={e => setMilestoneForm({...milestoneForm, status: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-500/10">
                    Add Milestone
                  </button>
                </form>
              </Card>
            </div>

            {/* Right side: Milestones Table */}
            <div className="lg:col-span-2">
              <Card title="Milestone Assessments & Evaluator Reviews" subtitle="Academic scores and guides evaluation feedback.">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 uppercase font-semibold">
                        <th className="py-2.5 px-4">Milestone</th>
                        <th className="py-2.5 px-4">Description</th>
                        <th className="py-2.5 px-4">Target Date</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4">Score</th>
                        <th className="py-2.5 px-4">Guide Comments</th>
                        <th className="py-2.5 px-4 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-850">
                      {milestones.map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                          <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-150">{m.title}</td>
                          <td className="py-3 px-4 text-slate-500 max-w-[150px] truncate" title={m.description}>{m.description}</td>
                          <td className="py-3 px-4 text-slate-500 font-semibold">{m.deadline}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              m.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                              m.status === 'in_progress' ? 'bg-sky-500/10 text-sky-500' :
                              'bg-slate-200 text-slate-500 dark:bg-slate-800'
                            }`}>
                              {m.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-extrabold text-indigo-500">{m.marks !== null ? `${m.marks} / ${m.max_marks}` : 'Awaiting'}</td>
                          <td className="py-3 px-4 text-slate-605 dark:text-slate-355 italic truncate max-w-[120px]" title={m.feedback || 'No comments'}>
                            "{m.feedback || 'No feedback yet'}"
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button onClick={() => handleDeleteMilestone(m.id)} className="text-rose-500 hover:text-rose-600 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {milestones.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center py-6 text-slate-450">No milestones configured for this project.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </div>

          <Card>
            <Kanban />
          </Card>
        </div>
      )}

      {/* 5. ERP FILE LOCKER */}
      {activeTab === 'files' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          <div className="space-y-8">
            <Card title="Upload Project Files Locker" subtitle="Store synopsis, SRS documentation, source code files.">
              <form onSubmit={handleUploadFileLocker} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-455 mb-1">Document Category</label>
                  <select
                    value={fileTypeToUpload}
                    onChange={e => setFileTypeToUpload(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  >
                    <option value="synopsis">Synopsis Draft</option>
                    <option value="report_pdf">Project SRS / Report (PDF)</option>
                    <option value="ppt">Presentation PPT</option>
                    <option value="zip_code">Source Code ZIP</option>
                    <option value="image">Screenshot Image</option>
                    <option value="video">Demo Video Link / File</option>
                  </select>
                </div>

                <div className="border-2 border-dashed border-slate-250 dark:border-slate-800 rounded-2xl p-6 text-center hover:bg-slate-50/50 transition-colors relative cursor-pointer">
                  <input
                    type="file"
                    required
                    onChange={e => setFileToUpload(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <UploadCloud className="text-slate-400 mx-auto mb-2" size={32} />
                  <span className="text-xs font-bold text-slate-650 dark:text-slate-350 block">
                    {fileToUpload ? fileToUpload.name : "Drag & Drop or Click to Select File"}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">Supports PDF, PPTX, ZIP, PNG (Max 15MB)</span>
                </div>

                <button
                  type="submit"
                  disabled={!fileToUpload}
                  className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-500/10 disabled:opacity-50"
                >
                  Log to File Version Locker
                </button>
              </form>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <Card title="ERP File Locker Index" subtitle="Track and download project documentation files version history.">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 uppercase font-semibold">
                      <th className="py-2.5 px-4">Document Category</th>
                      <th className="py-2.5 px-4">Filename</th>
                      <th className="py-2.5 px-4">Upload Date</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-850">
                    {activeProject?.files && activeProject.files.map((file, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                        <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-100 capitalize">
                          {file.file_type.replace('_', ' ')}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-medium truncate max-w-[200px]" title={file.file_name}>
                          {file.file_name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-450">
                          {new Date(file.uploaded_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <a
                            href={`${projectAPI.getPortfolio}/${file.file_path}`} // Download mockup
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-500 hover:underline font-bold"
                          >
                            Download
                          </a>
                        </td>
                      </tr>
                    ))}
                    {(!activeProject?.files || activeProject.files.length === 0) && (
                      <tr>
                        <td colSpan={4} className="text-center py-6 text-slate-450 italic">No files uploaded in local database locker.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 6. INTEGRATIONS & LIVE */}
      {activeTab === 'integrations' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          {/* GitHub widget */}
          <Card 
            title="GitHub Integration Dashboard"
            headerAction={
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => editingGithub ? handleCancelEditGithub() : setEditingGithub(true)}
                  className="flex items-center space-x-1.5 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-all text-slate-700 dark:text-slate-200"
                >
                  <Edit2 size={12} />
                  <span>{editingGithub ? "Cancel" : "Edit Settings"}</span>
                </button>
                {!editingGithub && (
                  <button
                    onClick={handleSyncGithub}
                    disabled={syncingGithub}
                    className="flex items-center space-x-1.5 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-all"
                  >
                    <RefreshCw className={syncingGithub ? "animate-spin" : ""} size={12} />
                    <span>Refresh Repo</span>
                  </button>
                )}
              </div>
            }
          >
            {editingGithub ? (
              <form onSubmit={handleUpdateGithub} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Repository Path</label>
                  <input
                    type="text"
                    required
                    placeholder="owner/repo-name"
                    value={githubForm.repo_name}
                    onChange={e => setGithubForm({...githubForm, repo_name: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Active Branch</label>
                  <input
                    type="text"
                    required
                    placeholder="main"
                    value={githubForm.branch}
                    onChange={e => setGithubForm({...githubForm, branch: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Commits</label>
                    <input
                      type="number"
                      value={githubForm.commit_count}
                      onChange={e => setGithubForm({...githubForm, commit_count: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Stars</label>
                    <input
                      type="number"
                      value={githubForm.stars}
                      onChange={e => setGithubForm({...githubForm, stars: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Issues</label>
                    <input
                      type="number"
                      value={githubForm.issues}
                      onChange={e => setGithubForm({...githubForm, issues: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Latest Commit Message</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fixed convolutional layer speed"
                    value={githubForm.latest_commit}
                    onChange={e => setGithubForm({...githubForm, latest_commit: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-55 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <button type="submit" className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-500/10">
                  Save GitHub Settings
                </button>
              </form>
            ) : githubStats ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-900/60 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <Github size={24} className="text-slate-800 dark:text-slate-100" />
                  <div>
                    <h5 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{githubStats.repo_name}</h5>
                    <span className="text-[10px] text-slate-455 font-bold block mt-0.5">Active Branch: <span className="text-sky-500 font-semibold">{githubStats.branch}</span></span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-slate-50 dark:bg-slate-900/40 p-3 border border-slate-100 dark:border-slate-850 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Commits</span>
                    <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{githubStats.commit_count}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/40 p-3 border border-slate-100 dark:border-slate-850 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Stars</span>
                    <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{githubStats.stars}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/40 p-3 border border-slate-100 dark:border-slate-850 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Open Issues</span>
                    <span className="text-lg font-extrabold text-slate-850 dark:text-slate-100">{githubStats.issues}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50/50 dark:bg-slate-900/20 rounded-xl text-xs">
                  <span className="text-[10px] text-slate-400 block font-bold">LATEST COMMIT MESSAGE</span>
                  <p className="text-slate-700 dark:text-slate-200 mt-1 font-mono italic">"{githubStats.latest_commit}"</p>
                </div>

                <a
                  href={`https://github.com/${githubStats.repo_name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center space-x-1.5 py-2.5 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <Github size={14} />
                  <span>Open GitHub Repository</span>
                </a>
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-xs text-slate-500">No GitHub repository configured yet. Click edit to set one up.</p>
              </div>
            )}
          </Card>

          {/* Live Demo Credentials */}
          <Card 
            title="Live Project Deploy Credentials"
            headerAction={
              <button
                onClick={() => editingLive ? handleCancelEditLive() : setEditingLive(true)}
                className="flex items-center space-x-1.5 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-all text-slate-700 dark:text-slate-200"
              >
                <Edit2 size={12} />
                <span>{editingLive ? "Cancel" : "Edit Credentials"}</span>
              </button>
            }
          >
            {editingLive ? (
              <form onSubmit={handleUpdateLiveUrl} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Production Live URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://my-app.vercel.app"
                    value={liveUrlForm}
                    onChange={e => setLiveUrlForm(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <button type="submit" className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-500/10">
                  Save Deploy Credentials
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Production URL</span>
                  <a
                    href={activeProject?.live_url || "https://attendance.example.com"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-500 hover:underline font-semibold text-xs flex items-center space-x-1"
                  >
                    <Link2 size={12} />
                    <span>{activeProject?.live_url || "https://attendance.example.com"}</span>
                  </a>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">API Endpoint Mock</span>
                  <span className="font-mono text-xs text-slate-700 dark:text-slate-300 block bg-slate-100 dark:bg-slate-850 p-2 rounded-xl border">
                    https://api.projecthub.edu/projects/{activeProject?.id || 1}/live
                  </span>
                </div>

                <div className="flex items-center space-x-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  {/* Dynamically generated mock QR Code */}
                  <div className="w-24 h-24 bg-white border border-slate-200 p-1.5 rounded-xl shrink-0 flex items-center justify-center">
                    <QrCode size={80} className="text-slate-850" />
                  </div>
                  <div className="text-xs leading-normal">
                    <span className="font-bold text-slate-800 dark:text-slate-155 block">Mobile Web QR Code</span>
                    <p className="text-slate-455 text-[10px] mt-1">Scan this code to instantly open the compiled prototype on any smartphone device.</p>
                    <span className="bg-sky-500/10 text-sky-500 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider block mt-2.5 w-fit">
                      Active Deploy
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* 7. ADVISOR GUIDE */}
      {activeTab === 'guide' && (
        <div className="max-w-2xl mx-auto animate-fade-in">
          <Card title="Advisor Guide Information" subtitle="Your assigned academic project guide details.">
            {user?.student_profile?.guide_name ? (
              <div className="space-y-6 text-xs leading-normal">
                <div className="flex items-center space-x-4 pb-4 border-b border-slate-100 dark:border-slate-800/60">
                  <div className="w-12 h-12 bg-sky-500 text-white font-bold text-base rounded-full flex items-center justify-center uppercase shrink-0">
                    {user.student_profile.guide_name.charAt(0)}
                  </div>
                  <div>
                    <h5 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{user.student_profile.guide_name}</h5>
                    <span className="text-[10px] text-slate-455 uppercase block font-semibold">Associate Professor</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Department</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{user.student_profile.department_name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Cabin / Office Address</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Room 403, Technology Block</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Office Consulting Hours</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Tue, Thu: 2:00 PM - 4:00 PM</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <Link
                    to="/chat"
                    className="flex items-center justify-center space-x-1.5 py-3 px-4 bg-slate-900 hover:bg-slate-850 text-white font-bold rounded-xl text-xs transition-all text-center"
                  >
                    <Send size={12} />
                    <span>Send Direct Message</span>
                  </Link>
                  <Link
                    to="/meetings"
                    className="flex items-center justify-center space-x-1.5 py-3 px-4 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl text-xs transition-all text-center"
                  >
                    <CalendarDays size={12} />
                    <span>Request Meeting Session</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-455 italic">No advisor guide has been allocated to you yet.</div>
            )}
          </Card>
        </div>
      )}

      {/* 7. PLACEMENTS BOARD */}
      {activeTab === 'placements' && (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          <Card title="Placement Track Board" subtitle="Log and monitor your active job interview processes.">
            <div className="space-y-6">
              <form onSubmit={handleAddPlacement} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/40 p-4 border rounded-2xl">
                <div>
                  <input 
                    type="text" 
                    required 
                    placeholder="Company Name"
                    value={placementForm.company_name} 
                    onChange={e => setPlacementForm({...placementForm, company_name: e.target.value})}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <input 
                    type="text" 
                    placeholder="Target Role"
                    value={placementForm.role} 
                    onChange={e => setPlacementForm({...placementForm, role: e.target.value})}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <select
                    value={placementForm.status}
                    onChange={e => setPlacementForm({...placementForm, status: e.target.value})}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  >
                    <option value="applied">Applied</option>
                    <option value="interviewing">Interviewing</option>
                    <option value="offered">Offered</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <button type="submit" className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl text-xs font-bold transition-colors">
                  Log Application
                </button>
              </form>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b text-[10px] text-slate-400 uppercase font-semibold">
                      <th className="py-2 px-2">Company</th>
                      <th className="py-2 px-2">Role</th>
                      <th className="py-2 px-2">Status</th>
                      <th className="py-2 px-2 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-150">
                    {placements.map((pl, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-2 font-bold text-slate-800 dark:text-slate-100">{pl.company_name}</td>
                        <td className="py-2.5 px-2 text-slate-500 font-medium">{pl.role || 'N/A'}</td>
                        <td className="py-2.5 px-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            pl.status === 'offered' ? 'bg-emerald-500/10 text-emerald-500' :
                            pl.status === 'interviewing' ? 'bg-sky-500/10 text-sky-500' :
                            pl.status === 'rejected' ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {pl.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <button onClick={() => handleDeletePlacement(pl.id)} className="text-rose-500 hover:text-rose-650">
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {placements.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-4 text-slate-450 italic">No job application records registered.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 7. CERTIFICATES */}
      {activeTab === 'certificates' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          <div className="lg:col-span-1">
            <Card title="Upload Industry Certificates" subtitle="Coursera, Udemy, NPTEL internships credentials.">
              <form onSubmit={handleAddCertificate} className="space-y-3">
                <div>
                  <label className="block text-[10px] text-slate-455 font-bold uppercase mb-1">Certificate Title</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. AWS Solutions Architect"
                    value={certForm.title} 
                    onChange={e => setCertForm({...certForm, title: e.target.value})}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-455 font-bold uppercase mb-1">Issuing Authority</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Coursera / Amazon"
                    value={certForm.issuing_organization} 
                    onChange={e => setCertForm({...certForm, issuing_organization: e.target.value})}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-455 font-bold uppercase mb-1">Issue Date</label>
                    <input 
                      type="date" 
                      value={certForm.issue_date} 
                      onChange={e => setCertForm({...certForm, issue_date: e.target.value})}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-455 font-bold uppercase mb-1">Verify Link</label>
                    <input 
                      type="url" 
                      placeholder="Credential URL"
                      value={certForm.credential_url} 
                      onChange={e => setCertForm({...certForm, credential_url: e.target.value})}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-500/10">
                  Add Certificate
                </button>
              </form>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card title="Uploaded Certificates Index" subtitle="All registered credentials.">
              <div className="space-y-4">
                {portfolioData?.certificates && portfolioData.certificates.map((c, idx) => (
                  <div key={idx} className="p-4 border rounded-xl bg-white dark:bg-slate-900/50 flex justify-between items-center text-xs">
                    <div>
                      <h6 className="font-bold text-slate-800 dark:text-slate-100">{c.title}</h6>
                      <p className="text-[10px] text-slate-450 mt-1">{c.issuing_organization} • {c.issue_date || 'No date'}</p>
                    </div>
                    {c.credential_url && (
                      <a href={c.credential_url} target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline font-bold">
                        Verify
                      </a>
                    )}
                  </div>
                ))}
                {(!portfolioData?.certificates || portfolioData.certificates.length === 0) && (
                  <p className="text-xs text-slate-455 italic text-center py-6">No certificates recorded yet.</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 7. PUBLICATIONS & RESEARCH */}
      {activeTab === 'publications' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          <div className="lg:col-span-1">
            <Card title="Student Research Papers & Publications" subtitle="Log patents and conference papers tracking.">
              <form onSubmit={handleAddResearchPaper} className="space-y-3">
                <div>
                  <label className="block text-[10px] text-slate-455 font-bold uppercase mb-1">Paper / Patent Title</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Real-time Convolutional Neural Networks"
                    value={paperForm.title} 
                    onChange={e => setPaperForm({...paperForm, title: e.target.value})}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-455 font-bold uppercase mb-1">Journal / Conference Name</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. IEEE / Springer Conference"
                    value={paperForm.journal} 
                    onChange={e => setPaperForm({...paperForm, journal: e.target.value})}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-455 font-bold uppercase mb-1">Publication Date</label>
                    <input 
                      type="date" 
                      value={paperForm.publication_date} 
                      onChange={e => setPaperForm({...paperForm, publication_date: e.target.value})}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-455 font-bold uppercase mb-1">Paper Link / URL</label>
                    <input 
                      type="url" 
                      placeholder="e.g. https://doi.org/..."
                      value={paperForm.paper_url} 
                      onChange={e => setPaperForm({...paperForm, paper_url: e.target.value})}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-455 font-bold uppercase mb-1">Authors</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Alice Smith, Dr. Alan Turing"
                    value={paperForm.authors} 
                    onChange={e => setPaperForm({...paperForm, authors: e.target.value})}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
                <button type="submit" className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-500/10">
                  Record Publication
                </button>
              </form>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card title="Publications & Patents Index" subtitle="All logged papers.">
              <div className="space-y-4">
                {portfolioData?.research_papers && portfolioData.research_papers.map((p, idx) => (
                  <div key={idx} className="p-4 border rounded-xl bg-white dark:bg-slate-900/50 flex justify-between items-center text-xs">
                    <div>
                      <h6 className="font-bold text-slate-800 dark:text-slate-100">{p.title}</h6>
                      <p className="text-[10px] text-slate-500 mt-1">{p.journal} • {p.authors || 'Main Student Authors'}</p>
                    </div>
                    {p.paper_url && (
                      <a href={p.paper_url} target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline font-bold">
                        Link
                      </a>
                    )}
                  </div>
                ))}
                {(!portfolioData?.research_papers || portfolioData.research_papers.length === 0) && (
                  <p className="text-xs text-slate-455 italic text-center py-6">No publications logged yet.</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 8. AI CO-PILOT WORKSPACE */}
      {activeTab === 'ai_copilot' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          <div className="space-y-8">
            {/* AI Weekly Report Writer */}
            <Card title="AI Weekly Report Writer" subtitle="Draft formal weekly summaries using generative AI.">
              <div className="space-y-3">
                <textarea
                  placeholder="e.g. Worked on database model normalizations, wrote code review endpoints, updated seed data scripts."
                  value={aiWeeklyInput}
                  onChange={e => setAiWeeklyInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  rows={4}
                />
                <button
                  onClick={handleAIWeeklyGenerate}
                  disabled={!aiWeeklyInput.trim()}
                  className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-500/10 flex items-center justify-center space-x-1.5"
                >
                  <Sparkles size={14} className="animate-pulse" />
                  <span>Generate Weekly Report</span>
                </button>
              </div>
            </Card>

            {/* AI Code Reviewer */}
            <Card title="AI Code Review Assistant" subtitle="Check complexity and code standard warnings.">
              <div className="space-y-3">
                <textarea
                  placeholder="Paste python code block or SQL statements..."
                  value={aiCodeInput}
                  onChange={e => setAiCodeInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  rows={5}
                />
                <button
                  onClick={handleAICodeReview}
                  disabled={!aiCodeInput.trim()}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5"
                >
                  <FileCode size={14} />
                  <span>Analyze Source Code</span>
                </button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-8">
            {/* AI Project health check card */}
            <Card 
              title="AI Project Health Monitor"
              headerAction={
                <button
                  onClick={handleAICheckHealth}
                  className="text-xs text-sky-500 hover:underline font-bold flex items-center space-x-1"
                >
                  <RefreshCw size={12} />
                  <span>Check Health Diagnostic</span>
                </button>
              }
            >
              {aiHealth ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-center border">
                      <span className="text-[10px] text-slate-400 block">Progress</span>
                      <span className="text-base font-extrabold text-slate-855 dark:text-slate-100">{aiHealth.progress}%</span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-center border">
                      <span className="text-[10px] text-slate-400 block">Expected</span>
                      <span className="text-base font-extrabold text-slate-855 dark:text-slate-100">{aiHealth.expected}%</span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-center border">
                      <span className="text-[10px] text-slate-400 block">Delay</span>
                      <span className="text-base font-extrabold text-rose-500">{aiHealth.delay}%</span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-center border">
                      <span className="text-[10px] text-slate-400 block">Risk Level</span>
                      <span className={`text-base font-extrabold uppercase ${
                        aiHealth.risk_level === 'High' ? 'text-rose-500' :
                        aiHealth.risk_level === 'Medium' ? 'text-amber-500' : 'text-emerald-500'
                      }`}>{aiHealth.risk_level}</span>
                    </div>
                  </div>
                  <div className="p-4 bg-sky-500/5 border border-sky-500/10 rounded-2xl text-xs leading-normal">
                    <span className="font-bold text-sky-500 block">AI Recommendation</span>
                    <p className="text-slate-655 dark:text-slate-355 mt-1">{aiHealth.recommendation}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-slate-500 italic">Click diagnostic check to analyze current timeline health.</p>
                </div>
              )}
            </Card>

            {/* AI Results */}
            {aiWeeklyResult && (
              <Card title="Generated Weekly Report Accomplishment">
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border rounded-2xl text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  {aiWeeklyResult}
                </div>
              </Card>
            )}

            {aiCodeResult && (
              <Card title="AI Source Code Review Feedback">
                <pre className="bg-slate-50 dark:bg-slate-900 border p-4 rounded-2xl text-xs overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed text-slate-750 dark:text-slate-350">
                  {aiCodeResult}
                </pre>
              </Card>
            )}

            {/* AI Report outline */}
            <Card title="AI Outline Document Generator">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <select
                    value={aiReportType}
                    onChange={e => setAiReportType(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                  >
                    <option value="synopsis">Academic Synopsis Outline</option>
                    <option value="weekly report">Weekly Progress Outline</option>
                    <option value="final report">Final Project Report Chapter</option>
                    <option value="ppt outline">Presentation PPT Slides Outlines</option>
                  </select>
                  <button
                    onClick={handleAIReportGenerate}
                    className="py-1.5 px-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold"
                  >
                    Generate Document Outline
                  </button>
                </div>
                {aiReportResult && (
                  <pre className="p-4 bg-slate-50 dark:bg-slate-900 border rounded-2xl text-xs whitespace-pre-wrap font-mono leading-normal text-slate-750 dark:text-slate-355">
                    {aiReportResult}
                  </pre>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 9. PERFORMANCE ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-8 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card title="Project Cumulative Progress Timeline">
              <div className="h-[250px] flex items-center justify-center">
                {activeProject?.progress_updates && activeProject.progress_updates.length > 0 ? (
                  <Line 
                    data={getWeeklyProgressChartData()} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: { y: { min: 0, max: 100 } }
                    }}
                  />
                ) : (
                  <span className="text-xs text-slate-450 italic">No progress logs to graph.</span>
                )}
              </div>
            </Card>

            <Card title="Milestones Evaluation Scores">
              <div className="h-[250px] flex items-center justify-center">
                {milestones.length > 0 ? (
                  <Bar 
                    data={getMilestoneChartData()} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: { y: { min: 0, max: 20 } }
                    }}
                  />
                ) : (
                  <span className="text-xs text-slate-455 italic">No milestones logs to graph.</span>
                )}
              </div>
            </Card>

            <Card title="Weekly Hours Contributed">
              <div className="h-[250px] flex items-center justify-center">
                {activeProject?.progress_updates && activeProject.progress_updates.length > 0 ? (
                  <Doughnut 
                    data={getHoursWorkedChartData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false
                    }}
                  />
                ) : (
                  <span className="text-xs text-slate-455 italic">No progress logs to graph.</span>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* New Project Proposal Modal */}
      {showAddProjectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl w-full max-w-xl max-h-[85vh] overflow-y-auto p-8 shadow-2xl relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl">Propose Academic Project</h3>
              <button 
                onClick={() => setShowAddProjectModal(false)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 font-bold text-sm shrink-0"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Project Title</label>
                <input
                  type="text"
                  required
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  placeholder="AI-Based Face Attendance System"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Abstract</label>
                <textarea
                  value={newProject.abstract}
                  onChange={(e) => setNewProject({ ...newProject, abstract: e.target.value })}
                  placeholder="Enter a brief, one-sentence abstract..."
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Detailed project requirements, architecture..."
                  rows={4}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Domain</label>
                  <input
                    type="text"
                    value={newProject.domain}
                    onChange={(e) => setNewProject({ ...newProject, domain: e.target.value })}
                    placeholder="Machine Learning"
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
                  <input
                    type="text"
                    value={newProject.category}
                    onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                    placeholder="Web Application"
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Technologies Used</label>
                <input
                  type="text"
                  value={newProject.technologies}
                  onChange={(e) => setNewProject({ ...newProject, technologies: e.target.value })}
                  placeholder="React, FastAPI, PyTorch (comma separated)"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-sky-500/10"
              >
                Submit Proposal
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
