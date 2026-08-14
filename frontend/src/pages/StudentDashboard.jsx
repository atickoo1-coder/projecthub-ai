import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { projectAPI, authAPI, aiAPI, meetingAPI, lifecycleAPI } from '../services/api';
import ProjectProposal from './ProjectProposal';
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

  // Project Lifecycle states
  const [lifecycleProposal, setLifecycleProposal] = useState(null);
  const [weeklyLogs, setWeeklyLogs] = useState([]);
  const [finalSubmission, setFinalSubmission] = useState(null);
  const [researchPaper, setResearchPaper] = useState(null);
  const [finalEvaluation, setFinalEvaluation] = useState(null);
  const [meetingsLifecycle, setMeetingsLifecycle] = useState([]);
  const [showProposalView, setShowProposalView] = useState(false);
  const [lifecycleSubTab, setLifecycleSubTab] = useState('proposal');
  
  // Lifecycle Sub-Form States
  const [weeklyLogForm, setWeeklyLogForm] = useState({
    week_number: '',
    work_completed: '',
    objectives_achieved: '',
    modules_completed: '',
    hours_worked: '',
    current_progress: 50,
    challenges_faced: '',
    next_week_plan: '',
    github_repo_link: '',
    live_demo_link: ''
  });
  
  const [weeklyLogFiles, setWeeklyLogFiles] = useState({
    source_code: null,
    video_file: null,
    doc_file: null,
    db_backup: null,
    image_files: [],
    screenshot_files: []
  });

  const [lifecycleMeetForm, setLifecycleMeetForm] = useState({
    meeting_date: '',
    time: '',
    discussion: ''
  });

  const [lifecyclePaperFormState, setLifecyclePaperFormState] = useState({
    title: '',
    abstract: '',
    keywords: '',
    conference: '',
    journal: ''
  });
  const [lifecyclePaperFile, setLifecyclePaperFile] = useState(null);

  const [lifecycleFinalFormState, setLifecycleFinalFormState] = useState({
    github_repository: '',
    deployment_link: ''
  });
  const [lifecycleFinalFiles, setLifecycleFinalFiles] = useState({
    final_report: null,
    research_paper: null,
    ppt_file: null,
    source_code_zip: null,
    poster_file: null,
    demo_video: null,
    user_manual: null,
    db_backup: null
  });

  // AI & Plagiarism diagnostic states
  const [aiPaperReviewResult, setAiPaperReviewResult] = useState(null);
  const [aiReportReviewResult, setAiReportReviewResult] = useState(null);
  const [plagReportResult, setPlagReportResult] = useState(null);

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
          
          // Fetch final evaluation scorecard
          try {
            const evalRes = await lifecycleAPI.getProjectFinalEvaluation(currentProj.id);
            if (evalRes && evalRes.status !== 'pending_evaluation') {
              setFinalEvaluation(evalRes);
            } else {
              setFinalEvaluation(null);
            }
          } catch (e) {
            console.error("Error loading final evaluation:", e);
          }
        }

        // Fetch lifecycle proposal
        try {
          const propRes = await lifecycleAPI.getMyProposal();
          if (propRes && propRes.status !== 'none') {
            setLifecycleProposal(propRes);
          } else {
            setLifecycleProposal(null);
          }
        } catch (e) {
          console.error("Error loading lifecycle proposal:", e);
        }

        // Fetch weekly logs
        try {
          const logsRes = await lifecycleAPI.getMyWeeklyProgress();
          setWeeklyLogs(logsRes);
        } catch (e) {
          console.error("Error loading weekly logs:", e);
        }

        // Fetch final submission
        try {
          const finalRes = await lifecycleAPI.getMyFinalSubmission();
          if (finalRes && finalRes.status !== 'none') {
            setFinalSubmission(finalRes);
          } else {
            setFinalSubmission(null);
          }
        } catch (e) {
          console.error("Error loading final submission:", e);
        }

        // Fetch research paper lifecycle
        try {
          const paperRes = await lifecycleAPI.getMyResearchPaper();
          if (paperRes && paperRes.status !== 'none') {
            setResearchPaper(paperRes);
          } else {
            setResearchPaper(null);
          }
        } catch (e) {
          console.error("Error loading research paper lifecycle:", e);
        }

        // Fetch meetings lifecycle
        try {
          const meetsRes = await lifecycleAPI.getMyMeetings();
          setMeetingsLifecycle(meetsRes);
        } catch (e) {
          console.error("Error loading lifecycle meetings:", e);
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

  // Lifecycle Handlers
  const handleLifecycleWeeklyLogSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const data = new FormData();
      Object.keys(weeklyLogForm).forEach(key => {
        data.append(key, weeklyLogForm[key]);
      });
      // Append files
      Object.keys(weeklyLogFiles).forEach(key => {
        if (key === 'image_files' || key === 'screenshot_files') {
          weeklyLogFiles[key].forEach(f => {
            data.append(key, f);
          });
        } else if (weeklyLogFiles[key]) {
          data.append(key, weeklyLogFiles[key]);
        }
      });

      await lifecycleAPI.submitWeeklyProgress(data);
      setSuccess(`Weekly progress for Week ${weeklyLogForm.week_number} logged successfully!`);
      // Reset form
      setWeeklyLogForm({
        week_number: '',
        work_completed: '',
        objectives_achieved: '',
        modules_completed: '',
        hours_worked: '',
        current_progress: 50,
        challenges_faced: '',
        next_week_plan: '',
        github_repo_link: '',
        live_demo_link: ''
      });
      setWeeklyLogFiles({
        source_code: null,
        video_file: null,
        doc_file: null,
        db_backup: null,
        image_files: [],
        screenshot_files: []
      });
      fetchData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to submit weekly progress log.");
    } finally {
      setLoading(false);
    }
  };

  const handleLifecycleMeetingRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const data = new FormData();
      data.append('meeting_date', lifecycleMeetForm.meeting_date);
      data.append('time', lifecycleMeetForm.time);
      data.append('discussion', lifecycleMeetForm.discussion);
      await lifecycleAPI.requestMeeting(data);
      setSuccess("Meeting review request submitted to Guide!");
      setLifecycleMeetForm({ meeting_date: '', time: '', discussion: '' });
      fetchData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to request meeting.");
    } finally {
      setLoading(false);
    }
  };

  const handleLifecyclePaperUpload = async (e) => {
    e.preventDefault();
    if (!lifecyclePaperFile) {
      setError("Please select a research paper file to upload.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const data = new FormData();
      Object.keys(lifecyclePaperFormState).forEach(key => {
        data.append(key, lifecyclePaperFormState[key]);
      });
      data.append('paper', lifecyclePaperFile);
      await lifecycleAPI.uploadResearchPaper(data);
      setSuccess("Research paper draft uploaded successfully for Guide review!");
      setLifecyclePaperFormState({ title: '', abstract: '', keywords: '', conference: '', journal: '' });
      setLifecyclePaperFile(null);
      fetchData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to upload research paper.");
    } finally {
      setLoading(false);
    }
  };

  const handleLifecycleFinalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const data = new FormData();
      data.append('github_repository', lifecycleFinalFormState.github_repository);
      data.append('deployment_link', lifecycleFinalFormState.deployment_link);
      Object.keys(lifecycleFinalFiles).forEach(key => {
        if (lifecycleFinalFiles[key]) {
          data.append(key, lifecycleFinalFiles[key]);
        }
      });
      await lifecycleAPI.submitFinalReport(data);
      setSuccess("Final academic project deliverables submitted successfully!");
      fetchData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to submit final project report.");
    } finally {
      setLoading(false);
    }
  };

  const handleAIPaperDiagnostic = async () => {
    if (!researchPaper) return;
    setLoading(true);
    try {
      const data = new FormData();
      data.append('title', researchPaper.title);
      data.append('abstract', researchPaper.abstract);
      data.append('keywords', researchPaper.keywords);
      data.append('journal_or_conf', researchPaper.journal || researchPaper.conference || "Target Journal");
      const res = await lifecycleAPI.reviewResearchPaperAI(data);
      setAiPaperReviewResult(res);
    } catch (err) {
      console.error(err);
      setError("AI research paper check failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleAIReportDiagnostic = async () => {
    if (!activeProject || !lifecycleProposal) return;
    setLoading(true);
    try {
      const data = new FormData();
      data.append('title', activeProject.title);
      data.append('objectives', lifecycleProposal.objectives);
      data.append('methodology', lifecycleProposal.proposed_system);
      data.append('results', lifecycleProposal.expected_outcome);
      const res = await lifecycleAPI.reviewProjectReportAI(data);
      setAiReportReviewResult(res);
    } catch (err) {
      console.error(err);
      setError("AI report diagnostics failed.");
    } finally {
      setLoading(false);
    }
  };

  const handlePlagiarismScan = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const data = new FormData();
      data.append('project_id', activeProject.id);
      const res = await lifecycleAPI.runPlagiarismCheck(data);
      setPlagReportResult(res);
    } catch (err) {
      console.error(err);
      setError("Plagiarism scan failed.");
    } finally {
      setLoading(false);
    }
  };

  // Sync GitHub repository caches
  const handleSyncGithub = async () => {
    if (!activeProject) return;
    setSyncingGithub(true);
    try {
      const repoPath = githubStats?.repo_name || activeProject?.github_repo || "anshultickoo/attendance-cnn";
      let commitCount = githubStats?.commit_count || 48;
      let latestCommitMsg = githubStats?.latest_commit || "Updated repository files";
      let stars = githubStats?.stars || 11;
      let issues = githubStats?.issues || 1;
      let branch = githubStats?.branch || "main";

      // If the repoPath is a valid owner/repo format, fetch real data from public GitHub API
      if (repoPath && repoPath.includes('/') && !repoPath.startsWith('http')) {
        try {
          const metaRes = await fetch(`https://api.github.com/repos/${repoPath}`);
          if (metaRes.ok) {
            const meta = await metaRes.json();
            stars = meta.stargazers_count || 0;
            issues = meta.open_issues_count || 0;
            branch = meta.default_branch || "main";
          }
          const commitsRes = await fetch(`https://api.github.com/repos/${repoPath}/commits`);
          if (commitsRes.ok) {
            const commits = await commitsRes.json();
            if (Array.isArray(commits) && commits.length > 0) {
              commitCount = commits.length;
              latestCommitMsg = commits[0]?.commit?.message || "Updated repository files";
            }
          }
        } catch (gitErr) {
          console.warn("Public GitHub API limits exceeded or network offline. Falling back to local/cached data.", gitErr);
        }
      }

      const updatedStats = {
        repo_name: repoPath,
        branch: branch,
        commit_count: commitCount,
        stars: stars,
        issues: issues,
        latest_commit: latestCommitMsg
      };

      const response = await projectAPI.syncGithubStats(activeProject.id, updatedStats);
      setGithubStats(response);
      setSuccess("GitHub repository statistics synchronized!");
    } catch (err) {
      console.error(err);
    } finally {
      setSyncingGithub(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'integrations' && activeProject) {
      handleSyncGithub();
    }
  }, [activeTab, activeProject]);

  // Update GitHub repository details
  const handleUpdateGithub = async (e) => {
    e.preventDefault();
    if (!activeProject) return;
    try {
      const response = await projectAPI.syncGithubStats(activeProject.id, githubForm);
      setGithubStats(response);
      
      // Update project model github_repo link to keep in sync
      const updatedProj = await projectAPI.update(activeProject.id, {
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
      const updatedProj = await projectAPI.update(activeProject.id, {
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

  const handleStartEditGithub = () => {
    setGithubForm({
      repo_name: githubStats?.repo_name || activeProject?.github_repo || '',
      branch: githubStats?.branch || 'main',
      commit_count: githubStats?.commit_count || 0,
      stars: githubStats?.stars || 0,
      issues: githubStats?.issues || 0,
      latest_commit: githubStats?.latest_commit || ''
    });
    setEditingGithub(true);
  };

  const handleCancelEditGithub = () => {
    setGithubForm({
      repo_name: githubStats?.repo_name || activeProject?.github_repo || '',
      branch: githubStats?.branch || 'main',
      commit_count: githubStats?.commit_count || 0,
      stars: githubStats?.stars || 0,
      issues: githubStats?.issues || 0,
      latest_commit: githubStats?.latest_commit || ''
    });
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-l-4 border-sky-500 bg-white dark:bg-slate-900 p-4">
          <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Guide</span>
          <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 block mt-1.5 truncate">
            {user?.student_profile?.guide_name || 'Unallocated'}
          </span>
          <span className="text-[9px] text-slate-400 block mt-1">Assigned Academic Mentor</span>
        </Card>

        <Card className="border-l-4 border-purple-500 bg-white dark:bg-slate-900 p-4">
          <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Upcoming Deadline</span>
          <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 block mt-1.5">
            {nextMilestone ? nextMilestone.deadline : 'No tasks pending'}
          </span>
          <span className="text-[9px] text-slate-400 block mt-1">Submission Target Date</span>
        </Card>
      </div>

      {/* Main navigation row tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 overflow-x-auto flex space-x-1.5 pb-0.5 scrollbar-thin">
        {[
          { id: 'profile', label: 'Profile & Skills', icon: User },
          { id: 'lifecycle', label: 'Project Lifecycle', icon: FileText },
          { id: 'overview', label: 'Overview', icon: Folder },
          { id: 'files', label: 'File Locker', icon: UploadCloud },
          { id: 'integrations', label: 'GitHub Integration Dashboard', icon: Github }
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

      {/* 0. PROJECT LIFECYCLE WORKSPACE */}
      {activeTab === 'lifecycle' && (
        <div className="space-y-8 animate-fade-in text-slate-800 dark:text-slate-100">
          {showProposalView ? (
            <ProjectProposal onBack={() => { setShowProposalView(false); fetchData(); }} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              
              {/* Lifecycle Sub-Navigation Sidebar */}
              <div className="space-y-2">
                <div className="bg-white dark:bg-slate-900 border p-4 rounded-2xl space-y-1">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 px-3 mb-2">Lifecycle Stages</h3>
                  {[
                    { id: 'proposal', label: '1. Project Proposal', count: lifecycleProposal ? 1 : 0 },
                    { id: 'weekly', label: '2. Weekly Progress Logs', count: weeklyLogs.length },
                    { id: 'research_paper', label: '3. Research Paper Draft', count: researchPaper ? 1 : 0 },
                    { id: 'ai_plagiarism', label: '4. AI & Plagiarism Diagnostic', count: plagReportResult ? 1 : 0 },
                    { id: 'final_submission', label: '5. Final Deliverables', count: finalSubmission ? 1 : 0 },
                    { id: 'final_grade', label: '6. Academic Scorecard', count: finalEvaluation ? 1 : 0 }
                  ].map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => setLifecycleSubTab(sub.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                        lifecycleSubTab === sub.id
                          ? 'bg-sky-500/10 text-sky-500 font-extrabold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-500 hover:text-slate-850 dark:hover:text-slate-200'
                      }`}
                    >
                      <span>{sub.label}</span>
                      {sub.count > 0 && (
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[9px] font-mono text-slate-500">
                          {sub.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Progress helper card */}
                <div className="bg-gradient-to-r from-sky-500/5 to-indigo-500/5 border p-4 rounded-2xl text-xs space-y-3">
                  <h4 className="font-bold">Lifecycle Progression</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span>Stage Checklist</span>
                      <span className="font-bold">
                        {((lifecycleProposal ? 1 : 0) + (weeklyLogs.length > 0 ? 1 : 0) + (researchPaper ? 1 : 0) + (finalSubmission ? 1 : 0) + (finalEvaluation ? 1 : 0))} / 5 Completed
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-sky-500 h-full transition-all duration-500" 
                        style={{ width: `${(((lifecycleProposal ? 1 : 0) + (weeklyLogs.length > 0 ? 1 : 0) + (researchPaper ? 1 : 0) + (finalSubmission ? 1 : 0) + (finalEvaluation ? 1 : 0)) / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lifecycle Stage Sub-Workspace */}
              <div className="lg:col-span-3 space-y-6">
                
                {/* 1. PROJECT PROPOSAL SECTION */}
                {lifecycleSubTab === 'proposal' && (
                  <Card title="Academic Project Proposal" subtitle="Establish project title, objectives, and domain categories.">
                    {lifecycleProposal ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-start border-b pb-4">
                          <div>
                            <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 border rounded-full ${
                              lifecycleProposal.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                              lifecycleProposal.status === 'revision_required' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                              lifecycleProposal.status === 'rejected' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                              'bg-sky-500/10 text-sky-500 border-sky-500/20'
                            }`}>
                              Proposal Status: {lifecycleProposal.status.replace('_', ' ').toUpperCase()}
                            </span>
                            <h4 className="font-extrabold text-base text-slate-855 dark:text-slate-100 mt-3">{lifecycleProposal.title}</h4>
                            <p className="text-xs text-slate-400 mt-1">Domain: {lifecycleProposal.domain} • Category: {lifecycleProposal.category}</p>
                          </div>
                        </div>

                        {lifecycleProposal.remarks && (
                          <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-xs">
                            <span className="font-bold text-amber-600 dark:text-amber-500 block mb-0.5">Guide Feedback Remarks:</span>
                            <p className="italic text-slate-600 dark:text-slate-300">"{lifecycleProposal.remarks}"</p>
                            {lifecycleProposal.deadline && <span className="block mt-2 font-bold">Revision Deadline: {lifecycleProposal.deadline}</span>}
                          </div>
                        )}

                        <div className="flex gap-4">
                          <button
                            onClick={() => setShowProposalView(true)}
                            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold flex items-center transition-all"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View / Edit Full Proposal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
                        <FileText className="w-10 h-10 text-slate-400 mx-auto" />
                        <div>
                          <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wide">No Proposal Submitted</h4>
                          <p className="text-xs text-slate-500 mt-1">Before starting weekly worklogs, you must submit a project proposal for guide appraisal.</p>
                        </div>
                        <button
                          onClick={() => setShowProposalView(true)}
                          className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all inline-block"
                        >
                          Create Project Proposal
                        </button>
                      </div>
                    )}
                  </Card>
                )}

                {/* 2. WEEKLY PROGRESS LOGS SECTION */}
                {lifecycleSubTab === 'weekly' && (
                  <div className="space-y-6">
                    {/* Proposal Locked Protection */}
                    {(!lifecycleProposal || lifecycleProposal.status !== 'approved') ? (
                      <div className="text-center py-12 bg-amber-500/5 border border-amber-500/10 rounded-3xl space-y-4 p-8">
                        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
                        <h3 className="font-bold text-sm text-amber-600">Access Locked: Weekly Progress Update</h3>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          You cannot start weekly progress update logs or track milestones until your advisor guide reviews and **APPROVES** your initial Project Proposal.
                        </p>
                        <button onClick={() => setLifecycleSubTab('proposal')} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all">
                          Check Proposal Status
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Add weekly update log form */}
                        <Card title="Log Weekly Work Updates" subtitle="Track progress percentages, tasks completed, and upload source code backups.">
                          <form onSubmit={handleLifecycleWeeklyLogSubmit} className="space-y-4 text-xs">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div>
                                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Week Number *</label>
                                <input required type="number" min={1} max={16} placeholder="e.g. 1" value={weeklyLogForm.week_number} onChange={e => setWeeklyLogForm({...weeklyLogForm, week_number: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                              </div>
                              
                              <div>
                                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Hours Worked *</label>
                                <input required type="number" min={0} placeholder="e.g. 15" value={weeklyLogForm.hours_worked} onChange={e => setWeeklyLogForm({...weeklyLogForm, hours_worked: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                              </div>

                              <div className="md:col-span-2">
                                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Current Project Progress ({weeklyLogForm.current_progress}%) *</label>
                                <div className="flex items-center space-x-3 mt-1">
                                  <input type="range" min={0} max={100} step={5} value={weeklyLogForm.current_progress} onChange={e => setWeeklyLogForm({...weeklyLogForm, current_progress: parseInt(e.target.value)})} className="flex-1 accent-sky-500" />
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Work Completed (Detailed description) *</label>
                                <textarea required rows={3} placeholder="Explain specific details of logic built..." value={weeklyLogForm.work_completed} onChange={e => setWeeklyLogForm({...weeklyLogForm, work_completed: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Objectives Achieved *</label>
                                <textarea required rows={3} placeholder="Which targets from proposal were addressed?" value={weeklyLogForm.objectives_achieved} onChange={e => setWeeklyLogForm({...weeklyLogForm, objectives_achieved: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Modules Completed *</label>
                                <input required type="text" placeholder="e.g. Login system, Router validations" value={weeklyLogForm.modules_completed} onChange={e => setWeeklyLogForm({...weeklyLogForm, modules_completed: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Challenges Faced</label>
                                <input type="text" placeholder="Explain compiler blockers or integration errors..." value={weeklyLogForm.challenges_faced} onChange={e => setWeeklyLogForm({...weeklyLogForm, challenges_faced: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="md:col-span-2">
                                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Next Week's Work Plan *</label>
                                <input required type="text" placeholder="What parts are planned for implementation next?" value={weeklyLogForm.next_week_plan} onChange={e => setWeeklyLogForm({...weeklyLogForm, next_week_plan: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">GitHub Repo Link</label>
                                <input type="url" placeholder="https://github.com/..." value={weeklyLogForm.github_repo_link} onChange={e => setWeeklyLogForm({...weeklyLogForm, github_repo_link: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                              </div>
                            </div>

                            <div className="border-t pt-3 mt-3">
                              <label className="block text-[10px] text-slate-400 font-bold uppercase mb-2">Upload Files & Deliverables</label>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px]">
                                <div className="border p-2 rounded-xl flex flex-col justify-between">
                                  <span className="font-semibold truncate">Source Code ZIP</span>
                                  <input type="file" accept=".zip,.rar,.tar" onChange={e => setWeeklyLogFiles({...weeklyLogFiles, source_code: e.target.files[0]})} className="mt-1 w-full" />
                                </div>
                                <div className="border p-2 rounded-xl flex flex-col justify-between">
                                  <span className="font-semibold truncate">Screenshots (Multi)</span>
                                  <input type="file" multiple accept="image/*" onChange={e => setWeeklyLogFiles({...weeklyLogFiles, screenshot_files: Array.from(e.target.files)})} className="mt-1 w-full" />
                                </div>
                                <div className="border p-2 rounded-xl flex flex-col justify-between">
                                  <span className="font-semibold truncate">Document / Report</span>
                                  <input type="file" accept=".pdf,.doc,.docx" onChange={e => setWeeklyLogFiles({...weeklyLogFiles, doc_file: e.target.files[0]})} className="mt-1 w-full" />
                                </div>
                                <div className="border p-2 rounded-xl flex flex-col justify-between">
                                  <span className="font-semibold truncate">Database Backup</span>
                                  <input type="file" accept=".sql,.db,.sqlite" onChange={e => setWeeklyLogFiles({...weeklyLogFiles, db_backup: e.target.files[0]})} className="mt-1 w-full" />
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-end pt-2">
                              <button
                                type="submit"
                                className="px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold transition-all"
                              >
                                Submit Log Entry
                              </button>
                            </div>
                          </form>
                        </Card>

                        {/* Weekly progression timeline listing */}
                        <div className="space-y-4">
                          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Weekly Progress Timeline</h3>
                          
                          {weeklyLogs.length === 0 ? (
                            <div className="p-6 text-center border border-dashed rounded-2xl text-xs text-slate-500 italic">
                              No weekly progress log updates submitted yet.
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {weeklyLogs.map(log => (
                                <div key={log.id} className="bg-white dark:bg-slate-900 border rounded-2xl p-5 space-y-3 relative overflow-hidden transition-all hover:shadow-md">
                                  {/* Week label */}
                                  <div className="flex justify-between items-center border-b pb-2">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-extrabold text-sm text-sky-500">Week {log.week_number}</span>
                                      <span className="text-[10px] text-slate-400">({log.hours_worked} hours worked)</span>
                                    </div>
                                    <span className={`text-[9px] uppercase font-bold px-2 py-0.5 border rounded-full ${
                                      log.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                      log.status === 'revision_required' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                      log.status === 'submitted' ? 'bg-sky-500/10 text-sky-500 border-sky-500/20' :
                                      'bg-slate-500/10 text-slate-500 border-slate-500/20'
                                    }`}>
                                      {log.status}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                    <div>
                                      <span className="font-bold text-slate-400 text-[10px] uppercase block mb-0.5">Tasks Completed</span>
                                      <p className="text-slate-700 dark:text-slate-300">{log.work_completed}</p>
                                    </div>
                                    <div>
                                      <span className="font-bold text-slate-400 text-[10px] uppercase block mb-0.5">Modules Completed</span>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {log.modules_completed.map((m, i) => (
                                          <span key={i} className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px]">{m}</span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Slider display */}
                                  <div className="space-y-1 pt-2">
                                    <div className="flex justify-between items-center text-[10px]">
                                      <span>Cumulative Project Progress</span>
                                      <span className="font-bold">{log.current_progress}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                      <div className="bg-sky-500 h-full" style={{ width: `${log.current_progress}%` }}></div>
                                    </div>
                                  </div>

                                  {/* Links */}
                                  {(log.github_repo_link || log.live_demo_link) && (
                                    <div className="flex space-x-3 pt-2 text-[10px]">
                                      {log.github_repo_link && (
                                        <a href={log.github_repo_link} target="_blank" rel="noreferrer" className="flex items-center text-sky-500 font-bold hover:underline">
                                          <Github size={12} className="mr-1" /> Repo Link
                                        </a>
                                      )}
                                      {log.live_demo_link && (
                                        <a href={log.live_demo_link} target="_blank" rel="noreferrer" className="flex items-center text-emerald-500 font-bold hover:underline">
                                          <Link2 size={12} className="mr-1" /> Live Demo
                                        </a>
                                      )}
                                    </div>
                                  )}

                                  {/* Guide feedback section */}
                                  {log.feedback && (
                                    <div className="p-3 bg-slate-50 dark:bg-slate-850/50 rounded-xl text-xs mt-3 border border-slate-100 dark:border-slate-800 space-y-1">
                                      <div className="flex justify-between font-bold">
                                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">Guide Assessment Comments</span>
                                        <span className="text-sky-500">Marks: {log.feedback.weekly_marks}/10</span>
                                      </div>
                                      <p className="italic text-slate-600 dark:text-slate-350">"{log.feedback.comments || 'No remarks recorded.'}"</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}


                {/* 4. RESEARCH PAPER DRAFT SECTION */}
                {lifecycleSubTab === 'research_paper' && (
                  <div className="grid grid-cols-1 gap-6">
                    <Card title="Upload Research Paper Draft" subtitle="Submit your academic paper draft directly linked to this project scope.">
                      <form onSubmit={handleLifecyclePaperUpload} className="space-y-4 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Paper Title *</label>
                            <input required type="text" placeholder="e.g. Facial Recognition Attendance via Deep Networks" value={lifecyclePaperFormState.title} onChange={e => setLifecyclePaperFormState({...lifecyclePaperFormState, title: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Keywords *</label>
                            <input required type="text" placeholder="e.g. CNN, Deep Learning, OpenCV" value={lifecyclePaperFormState.keywords} onChange={e => setLifecyclePaperFormState({...lifecyclePaperFormState, keywords: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Abstract Summary *</label>
                          <textarea required rows={4} placeholder="Copy research paper abstract summary..." value={lifecyclePaperFormState.abstract} onChange={e => setLifecyclePaperFormState({...lifecyclePaperFormState, abstract: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Target Journal</label>
                            <input type="text" placeholder="e.g. IEEE Access" value={lifecyclePaperFormState.journal} onChange={e => setLifecyclePaperFormState({...lifecyclePaperFormState, journal: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Target Conference</label>
                            <input type="text" placeholder="e.g. ICML 2026" value={lifecyclePaperFormState.conference} onChange={e => setLifecyclePaperFormState({...lifecyclePaperFormState, conference: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                          </div>
                        </div>

                        <div className="p-3 border border-dashed rounded-xl bg-slate-50 dark:bg-slate-800 flex flex-col items-center justify-center text-center">
                          <UploadCloud className="w-6 h-6 text-sky-500 mb-1" />
                          <span className="font-bold text-[10px]">Select Paper Manuscript (PDF/DOCX) *</span>
                          <input required type="file" accept=".pdf,.doc,.docx" onChange={e => setLifecyclePaperFile(e.target.files[0])} className="mt-1 text-[9px]" />
                        </div>

                        <div className="flex justify-end pt-2">
                          <button type="submit" className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold transition-all">
                            Submit Manuscript
                          </button>
                        </div>
                      </form>
                    </Card>

                    {/* Paper status card */}
                    {researchPaper && (
                      <div className="bg-white dark:bg-slate-900 border p-5 rounded-2xl space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="font-extrabold text-sm text-sky-500">Research Paper Manuscript</h4>
                          <span className={`px-2 py-0.5 rounded-md text-[9px] uppercase font-bold ${
                            researchPaper.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-sky-500/10 text-sky-500'
                          }`}>{researchPaper.status}</span>
                        </div>
                        <h3 className="font-bold text-base mt-2">{researchPaper.title}</h3>
                        <p className="text-xs text-slate-500 italic mt-1">Abstract: "{researchPaper.abstract}"</p>
                        <p className="text-[10px] text-slate-400 mt-2">Keywords: {researchPaper.keywords} • Target: {researchPaper.journal || researchPaper.conference || "Unspecified"}</p>
                        
                        {researchPaper.paper_url && (
                          <a href={`http://localhost:8000/${researchPaper.paper_url}`} target="_blank" rel="noreferrer" className="inline-block mt-3 text-xs text-sky-500 hover:underline">
                            Download Uploaded Manuscript PDF
                          </a>
                        )}

                        {researchPaper.review_feedback && (
                          <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl text-xs border mt-3">
                            <span className="font-bold text-slate-400 block mb-0.5">Guide Manuscript Review Comments:</span>
                            <p className="italic">"{researchPaper.review_feedback}"</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 5. AI DIAGNOSTIC & PLAGIARISM CHECK SECTION */}
                {lifecycleSubTab === 'ai_plagiarism' && (
                  <div className="space-y-6">
                    {/* Grid of review helpers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* AI Paper diagnostic */}
                      <div className="bg-white dark:bg-slate-900 border p-5 rounded-2xl space-y-3">
                        <h4 className="font-extrabold text-sm text-indigo-500">AI Research Paper Advisor</h4>
                        <p className="text-xs text-slate-500">Examines formatting styles, citation indexes, grammar profiles, and plag risks via Gemini API.</p>
                        <button 
                          onClick={handleAIPaperDiagnostic} 
                          disabled={!researchPaper}
                          className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white rounded-xl text-xs font-bold transition-all"
                        >
                          {!researchPaper ? "Upload Paper Draft to Enable" : "Analyze Manuscript with AI"}
                        </button>

                        {aiPaperReviewResult && (
                          <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-xs space-y-3 mt-3">
                            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                              <div className="border p-1.5 rounded-lg">
                                <span className="block text-slate-400">Grammar</span>
                                <span className="font-extrabold text-sm">{aiPaperReviewResult.grammar}/100</span>
                              </div>
                              <div className="border p-1.5 rounded-lg">
                                <span className="block text-slate-400">Format</span>
                                <span className="font-extrabold text-sm">{aiPaperReviewResult.formatting}/100</span>
                              </div>
                              <div className="border p-1.5 rounded-lg">
                                <span className="block text-slate-400">Citations</span>
                                <span className="font-extrabold text-sm">{aiPaperReviewResult.citation_consistency}/100</span>
                              </div>
                            </div>
                            <div>
                              <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Missing Layout Chapters</span>
                              <div className="flex flex-wrap gap-1">
                                {aiPaperReviewResult.missing_sections.map((s, i) => (
                                  <span key={i} className="bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-md text-[9px] font-semibold">{s}</span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block mb-1">AI Improvement Suggestions</span>
                              <ul className="list-disc list-inside space-y-1">
                                {aiPaperReviewResult.suggestions.map((s, i) => (
                                  <li key={i}>{s}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* AI Report reviewer */}
                      <div className="bg-white dark:bg-slate-900 border p-5 rounded-2xl space-y-3">
                        <h4 className="font-extrabold text-sm text-purple-500">AI Report Outline Auditor</h4>
                        <p className="text-xs text-slate-500">Verifies methodology scopes, problem statement definitions, and expected outcomes summaries.</p>
                        <button 
                          onClick={handleAIReportDiagnostic} 
                          disabled={!lifecycleProposal}
                          className="w-full py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white rounded-xl text-xs font-bold transition-all"
                        >
                          {!lifecycleProposal ? "Submit Proposal to Enable" : "Analyze Report with AI"}
                        </button>

                        {aiReportReviewResult && (
                          <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-xl text-xs space-y-3 mt-3">
                            <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                              <div className="border p-1.5 rounded-lg">
                                <span className="block text-slate-400">Objectives Clarity</span>
                                <span className="font-extrabold text-sm">{aiReportReviewResult.objectives_clarity}/100</span>
                              </div>
                              <div className="border p-1.5 rounded-lg">
                                <span className="block text-slate-400">Methodology Depth</span>
                                <span className="font-extrabold text-sm">{aiReportReviewResult.methodology_depth}/100</span>
                              </div>
                            </div>
                            <div>
                              <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Missing Outline Chapters</span>
                              <div className="flex flex-wrap gap-1">
                                {aiReportReviewResult.missing_chapters.map((c, i) => (
                                  <span key={i} className="bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-md text-[9px] font-semibold">{c}</span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">Recommendations</span>
                              <p className="italic">"{aiReportReviewResult.improvement_recommendations}"</p>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Plagiarism check card */}
                    <div className="bg-white dark:bg-slate-900 border p-5 rounded-2xl space-y-4">
                      <h4 className="font-extrabold text-sm text-emerald-500">Plagiarism Scan and AI Content Checker</h4>
                      <p className="text-xs text-slate-500">Verifies manuscript originality by scanning matched sources, AI generated structures, and copying risk levels.</p>
                      
                      <button
                        onClick={handlePlagiarismScan}
                        disabled={!activeProject}
                        className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 text-white rounded-xl text-xs font-bold transition-all"
                      >
                        Run Originality Scanner
                      </button>

                      {plagReportResult && (
                        <div className="border-t pt-4 space-y-4 text-xs">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div className="p-3 border rounded-xl">
                              <span className="block text-slate-400 text-[10px] uppercase">Similarity Index</span>
                              <span className={`font-extrabold text-base ${plagReportResult.similarity_percentage > 20 ? "text-rose-500" : "text-emerald-500"}`}>
                                {plagReportResult.similarity_percentage}%
                              </span>
                            </div>
                            <div className="p-3 border rounded-xl">
                              <span className="block text-slate-400 text-[10px] uppercase">AI Content</span>
                              <span className="font-extrabold text-base">{plagReportResult.ai_content_percentage}%</span>
                            </div>
                            <div className="p-3 border rounded-xl">
                              <span className="block text-slate-400 text-[10px] uppercase">Risk Level</span>
                              <span className="font-extrabold text-base capitalize">{plagReportResult.risk_level}</span>
                            </div>
                            <div className="p-3 border rounded-xl">
                              <span className="block text-slate-400 text-[10px] uppercase">Review Status</span>
                              <span className="font-extrabold text-base capitalize">{plagReportResult.status}</span>
                            </div>
                          </div>

                          <div>
                            <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Top Matched Sources</span>
                            <div className="space-y-1 text-[11px]">
                              {JSON.parse(plagReportResult.sources_json).map((s, idx) => (
                                <div key={idx} className="flex justify-between p-2 bg-slate-50 dark:bg-slate-850 rounded-lg">
                                  <span>{s.source}</span>
                                  <span className="font-bold text-rose-500">{s.similarity}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Copied / Overlapping Paragraphs</span>
                            <div className="space-y-2">
                              {JSON.parse(plagReportResult.matched_paragraphs_json).map((p, idx) => (
                                <p key={idx} className="p-2 border-l-4 border-rose-500 bg-rose-500/5 text-slate-600 dark:text-slate-350 italic">
                                  "{p}"
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 6. FINAL DELIVERABLES SUBMISSION SECTION */}
                {lifecycleSubTab === 'final_submission' && (
                  <div className="space-y-6">
                    {/* Locking protection if weekly progress logs not done */}
                    {(weeklyLogs.length === 0 || milestones.filter(m => m.status === 'pending' && m.name !== 'Documentation' && m.name !== 'Deployment' && m.name !== 'Final Submission').length > 0) ? (
                      <div className="text-center py-12 bg-amber-500/5 border border-amber-500/10 rounded-3xl p-8 space-y-4">
                        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
                        <h3 className="font-bold text-sm text-amber-600">Access Locked: Final Submission Workspace</h3>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          You must log all weekly progress reports and satisfy academic milestones (Requirements, Design, and Implementation) before submitting final project deliverables.
                        </p>
                        <button onClick={() => setLifecycleSubTab('weekly')} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all">
                          Log Weekly Logs
                        </button>
                      </div>
                    ) : (
                      <>
                        <Card title="Submit Final Deliverables" subtitle="Upload project reports, PPTs, code archives, manuals, and database backups.">
                          <form onSubmit={handleLifecycleFinalSubmit} className="space-y-4 text-xs">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">GitHub Code Repository *</label>
                                <input required type="url" placeholder="https://github.com/..." value={lifecycleFinalFormState.github_repository} onChange={e => setLifecycleFinalFormState({...lifecycleFinalFormState, github_repository: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Production Deployment Link *</label>
                                <input required type="url" placeholder="https://..." value={lifecycleFinalFormState.deployment_link} onChange={e => setLifecycleFinalFormState({...lifecycleFinalFormState, deployment_link: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px]">
                              <div className="border p-2 rounded-xl flex flex-col justify-between">
                                <span className="font-semibold truncate">Final Report (PDF/DOCX) *</span>
                                <input type="file" accept=".pdf,.doc,.docx" onChange={e => setLifecycleFinalFiles({...lifecycleFinalFiles, final_report: e.target.files[0]})} className="mt-1 w-full" />
                              </div>
                              <div className="border p-2 rounded-xl flex flex-col justify-between">
                                <span className="font-semibold truncate">Research Paper *</span>
                                <input type="file" accept=".pdf,.doc,.docx" onChange={e => setLifecycleFinalFiles({...lifecycleFinalFiles, research_paper: e.target.files[0]})} className="mt-1 w-full" />
                              </div>
                              <div className="border p-2 rounded-xl flex flex-col justify-between">
                                <span className="font-semibold truncate">Presentation PPT *</span>
                                <input type="file" accept=".ppt,.pptx,.pdf" onChange={e => setLifecycleFinalFiles({...lifecycleFinalFiles, ppt_file: e.target.files[0]})} className="mt-1 w-full" />
                              </div>
                              <div className="border p-2 rounded-xl flex flex-col justify-between">
                                <span className="font-semibold truncate">Full Code ZIP *</span>
                                <input type="file" accept=".zip,.rar" onChange={e => setLifecycleFinalFiles({...lifecycleFinalFiles, source_code_zip: e.target.files[0]})} className="mt-1 w-full" />
                              </div>
                              <div className="border p-2 rounded-xl flex flex-col justify-between">
                                <span className="font-semibold truncate">Project Poster PDF</span>
                                <input type="file" accept=".pdf,image/*" onChange={e => setLifecycleFinalFiles({...lifecycleFinalFiles, poster_file: e.target.files[0]})} className="mt-1 w-full" />
                              </div>
                              <div className="border p-2 rounded-xl flex flex-col justify-between">
                                <span className="font-semibold truncate">Demo Video File</span>
                                <input type="file" accept="video/*" onChange={e => setLifecycleFinalFiles({...lifecycleFinalFiles, demo_video: e.target.files[0]})} className="mt-1 w-full" />
                              </div>
                              <div className="border p-2 rounded-xl flex flex-col justify-between">
                                <span className="font-semibold truncate">User Manual PDF</span>
                                <input type="file" accept=".pdf" onChange={e => setLifecycleFinalFiles({...lifecycleFinalFiles, user_manual: e.target.files[0]})} className="mt-1 w-full" />
                              </div>
                              <div className="border p-2 rounded-xl flex flex-col justify-between">
                                <span className="font-semibold truncate">Database Schema</span>
                                <input type="file" accept=".sql,.db" onChange={e => setLifecycleFinalFiles({...lifecycleFinalFiles, db_backup: e.target.files[0]})} className="mt-1 w-full" />
                              </div>
                            </div>

                            <div className="flex justify-end pt-2">
                              <button type="submit" className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold transition-all">
                                Submit Deliverables
                              </button>
                            </div>
                          </form>
                        </Card>

                        {/* Submission status and download links */}
                        {finalSubmission && (
                          <div className="bg-white dark:bg-slate-900 border p-5 rounded-2xl space-y-3 text-xs">
                            <div className="flex justify-between items-center">
                              <h4 className="font-extrabold text-sm text-sky-500">Deliverables Version logs</h4>
                              <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
                                Version {finalSubmission.version} Submitted
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400">Logged on {finalSubmission.submission_date}</p>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-3">
                              {finalSubmission.final_report_url && (
                                <a href={`http://localhost:8000/${finalSubmission.final_report_url}`} target="_blank" rel="noreferrer" className="p-2 border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 block text-center truncate">
                                  Download Final Report
                                </a>
                              )}
                              {finalSubmission.research_paper_url && (
                                <a href={`http://localhost:8000/${finalSubmission.research_paper_url}`} target="_blank" rel="noreferrer" className="p-2 border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 block text-center truncate">
                                  Download Research Paper
                                </a>
                              )}
                              {finalSubmission.ppt_url && (
                                <a href={`http://localhost:8000/${finalSubmission.ppt_url}`} target="_blank" rel="noreferrer" className="p-2 border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 block text-center truncate">
                                  Download PPT Slides
                                </a>
                              )}
                              {finalSubmission.source_code_zip_url && (
                                <a href={`http://localhost:8000/${finalSubmission.source_code_zip_url}`} target="_blank" rel="noreferrer" className="p-2 border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 block text-center truncate">
                                  Download Code ZIP
                                </a>
                              )}
                              {finalSubmission.user_manual_url && (
                                <a href={`http://localhost:8000/${finalSubmission.user_manual_url}`} target="_blank" rel="noreferrer" className="p-2 border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 block text-center truncate">
                                  Download User Manual
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* 7. ACADEMIC SCORECARD SECTION */}
                {lifecycleSubTab === 'final_grade' && (
                  <div className="space-y-6">
                    {!finalEvaluation ? (
                      <div className="p-8 text-center border border-dashed rounded-3xl text-xs text-slate-500 italic">
                        Final marks and grade scorecard are pending advisor guides review.
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 space-y-6">
                        <div className="flex justify-between items-center border-b pb-4">
                          <div>
                            <h2 className="text-lg font-bold">Academic Assessment Scorecard</h2>
                            <p className="text-xs text-slate-450 mt-1">Weighted final grading breakdown approved by Mentor HOD.</p>
                          </div>
                          <div className="text-right">
                            <span className="block text-[10px] text-slate-450 uppercase font-bold">Overall Grade</span>
                            <span className="text-3xl font-black text-sky-500">{finalEvaluation.grade}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                          {/* Marks Table */}
                          <div className="space-y-3">
                            <span className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider block">Marks Breakdown</span>
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="border-b text-slate-400 font-bold uppercase text-[9px]">
                                  <th className="py-2">Evaluation Criteria</th>
                                  <th className="py-2 text-right">Marks Awarded</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                                <tr>
                                  <td className="py-2">Weekly Performance (30%)</td>
                                  <td className="py-2 text-right font-bold">{finalEvaluation.weekly_perf_marks} / 30</td>
                                </tr>
                                <tr>
                                  <td className="py-2">Project Implementation (25%)</td>
                                  <td className="py-2 text-right font-bold">{finalEvaluation.proj_impl_marks} / 25</td>
                                </tr>
                                <tr>
                                  <td className="py-2">Final Report PDF (20%)</td>
                                  <td className="py-2 text-right font-bold">{finalEvaluation.final_report_marks} / 20</td>
                                </tr>
                                <tr>
                                  <td className="py-2">Research Paper (15%)</td>
                                  <td className="py-2 text-right font-bold">{finalEvaluation.research_paper_marks} / 15</td>
                                </tr>
                                <tr>
                                  <td className="py-2">Viva Presentation (10%)</td>
                                  <td className="py-2 text-right font-bold">{finalEvaluation.viva_marks} / 10</td>
                                </tr>
                                <tr className="font-extrabold text-sm border-t-2">
                                  <td className="py-3 text-sky-500">Total Marks Score</td>
                                  <td className="py-3 text-right text-sky-500">{finalEvaluation.total_marks} / 100</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          {/* Advisor Remarks */}
                          <div className="space-y-3 bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border">
                            <span className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider block">Advisor Guide Evaluation Remarks</span>
                            
                            <div className="space-y-3 text-xs">
                              {finalEvaluation.strengths && (
                                <div>
                                  <span className="font-bold text-slate-400 block text-[9px] uppercase">Core Strengths:</span>
                                  <p className="text-slate-700 dark:text-slate-350">{finalEvaluation.strengths}</p>
                                </div>
                              )}
                              {finalEvaluation.weaknesses && (
                                <div>
                                  <span className="font-bold text-slate-400 block text-[9px] uppercase">Areas of Improvement:</span>
                                  <p className="text-slate-700 dark:text-slate-350">{finalEvaluation.weaknesses}</p>
                                </div>
                              )}
                              {finalEvaluation.future_scope && (
                                <div>
                                  <span className="font-bold text-slate-400 block text-[9px] uppercase">Suggested Future Scope:</span>
                                  <p className="text-slate-700 dark:text-slate-350">{finalEvaluation.future_scope}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          )}
        </div>
      )}

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

            {activeProject && (
              <Card title="General Information" subtitle="Project metadata and group members roster (PDF Page 6).">
                <div className="space-y-6 text-xs leading-normal">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-4 border-b">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">Project Title</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 block mt-0.5">{activeProject.title}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">Name of Guide</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 block mt-0.5">{user?.student_profile?.guide_name || 'Unallocated'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">Name of Co-Guide</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 block mt-0.5">Dr. Richard Feynman (Fermionics Lab)</span>
                    </div>
                  </div>

                  <div className="pb-4 border-b">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">Department</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200 block mt-0.5">Department of Electronics & Communication Engineering</span>
                  </div>

                  <div className="pb-4 border-b">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">Project Abstract</span>
                    <p className="text-slate-650 dark:text-slate-300 mt-1 italic">"{activeProject.abstract || 'No abstract provided yet.'}"</p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">Group Members Details</span>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px] text-left border-collapse">
                        <thead>
                          <tr className="border-b bg-slate-50 dark:bg-slate-800/40 text-[9px] uppercase tracking-wider font-extrabold text-slate-400">
                            <th className="py-2 px-3">Name</th>
                            <th className="py-2 px-3">Roll No</th>
                            <th className="py-2 px-3">Contact No</th>
                            <th className="py-2 px-3">E-mail ID</th>
                            <th className="py-2 px-3">Hostler / Dayscholar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">{user.name}</td>
                            <td className="py-2.5 px-3">{user.student_profile?.roll_number}</td>
                            <td className="py-2.5 px-3">{user.student_profile?.mobile || '9876543210'}</td>
                            <td className="py-2.5 px-3">{user.email}</td>
                            <td className="py-2.5 px-3 text-sky-500 font-bold">{user.student_profile?.residence || 'Day Scholar'}</td>
                          </tr>
                          {activeProject.group_members && (
                            (() => {
                              try {
                                const members = JSON.parse(activeProject.group_members);
                                if (Array.isArray(members)) {
                                  return members.map((m, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50">
                                      <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">{m.name}</td>
                                      <td className="py-2.5 px-3">{m.roll_no || m.roll}</td>
                                      <td className="py-2.5 px-3">{m.contact_no || m.contact || 'N/A'}</td>
                                      <td className="py-2.5 px-3">{m.email_id || m.email || 'N/A'}</td>
                                      <td className="py-2.5 px-3 text-sky-500 font-bold">{m.residence || 'Hostler'}</td>
                                    </tr>
                                  ));
                                }
                              } catch (e) {
                                return null;
                              }
                            })()
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {finalEvaluation && (
                    <div className="p-4 bg-sky-500/5 dark:bg-sky-500/10 border border-sky-500/10 rounded-2xl">
                      <span className="text-[10px] text-sky-500 font-bold uppercase block">Conclusions / Recommendations by Guide (At the time of submission)</span>
                      <p className="mt-1 font-semibold text-slate-700 dark:text-slate-300">"{finalEvaluation.strengths || finalEvaluation.remarks || 'No submission recommendations logged yet.'}"</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {activeProject && (
              <Card title="Project Status Report" subtitle="Guide-Student Meeting Scheduler log records (PDF Page 7).">
                <div className="space-y-6 text-xs leading-normal">
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px] text-left border-collapse">
                      <thead>
                        <tr className="border-b bg-slate-50 dark:bg-slate-800/40 text-[9px] uppercase tracking-wider font-extrabold text-slate-400">
                          <th className="py-2 px-3 text-center w-12">Sl No</th>
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3 text-center">% Work Done</th>
                          <th className="py-2 px-3">Next Due Date</th>
                          <th className="py-2 px-3">Comments</th>
                          <th className="py-2 px-3 text-center">Guide Signature</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {weeklyLogs.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-6 text-slate-400 italic">No progress log records recorded in scheduler table.</td>
                          </tr>
                        ) : (
                          weeklyLogs.map((log, idx) => (
                            <tr key={log.id} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-3 text-center text-slate-500 font-bold">{idx + 1}.</td>
                              <td className="py-2.5 px-3 font-semibold">{new Date(log.created_at || Date.now()).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                              <td className="py-2.5 px-3 text-center font-bold text-emerald-500">{log.current_progress}%</td>
                              <td className="py-2.5 px-3 text-slate-500">{log.next_week_plan || 'N/A'}</td>
                              <td className="py-2.5 px-3 italic text-slate-600 dark:text-slate-350">"{log.feedback?.comments || 'Awaiting supervisor sign-off.'}"</td>
                              <td className="py-2.5 px-3 text-center">
                                {log.feedback ? (
                                  <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                    Signed: {user?.student_profile?.guide_name?.split(' ')?.[0] || 'Guide'}
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                    Pending Sign
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {finalEvaluation && (
                    <div className="p-4 bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10 rounded-2xl">
                      <span className="text-[10px] text-indigo-500 font-bold uppercase block">Conclusions / Recommendations at the time of submission</span>
                      <p className="mt-1 font-semibold text-slate-700 dark:text-slate-300">"{finalEvaluation.future_scope || 'Final submission verified and signed by Guide.'}"</p>
                    </div>
                  )}
                </div>
              </Card>
            )}
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
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">College</span>
                      <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{user?.student_profile?.college || 'U.C.E'}</span>
                    </div>
                    <ChevronRight className="text-slate-300 hidden md:block" />
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Program</span>
                      <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{user?.student_profile?.program || 'B.Tech'}</span>
                    </div>
                    <ChevronRight className="text-slate-300 hidden md:block" />
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Department</span>
                      <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{user?.student_profile?.department_name || 'CSE'}</span>
                    </div>
                    <ChevronRight className="text-slate-300 hidden md:block" />
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Section</span>
                      <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">Section {user?.student_profile?.section || 'A'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs leading-normal">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 font-bold block">Roll Number</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{user?.student_profile?.roll_number}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 font-bold block">Registration Number</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{user?.student_profile?.reg_number}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 font-bold block">University Roll</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{user?.student_profile?.univ_roll_number}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 font-bold block">CGPA</span>
                      <span className="font-extrabold text-sky-500">{user?.student_profile?.cgpa || '8.25'} / 10</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs border-t pt-4">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 font-bold block">Mobile</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{user?.student_profile?.mobile || '9876543210'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 font-bold block">Gender</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{user?.student_profile?.gender || 'Female'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 font-bold block">Date of Birth</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{user?.student_profile?.date_of_birth || '2003-04-12'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 font-bold block">Admission Year</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{user?.student_profile?.admission_year || '2023'}</span>
                    </div>
                  </div>

                  <div className="border-t pt-4 text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-bold block">Campus Residence / Address</span>
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
              activeProject && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => editingGithub ? handleCancelEditGithub() : handleStartEditGithub()}
                    className="flex items-center space-x-1.5 py-1.5 px-3 bg-slate-100 hover:bg-slate-205 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
                  >
                    <Edit2 size={12} />
                    <span>{editingGithub ? "Cancel" : "Edit Settings"}</span>
                  </button>
                  {!editingGithub && (
                    <button
                      onClick={handleSyncGithub}
                      disabled={syncingGithub}
                      className="flex items-center space-x-1.5 py-1.5 px-3 bg-slate-100 hover:bg-slate-205 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
                    >
                      <RefreshCw className={syncingGithub ? "animate-spin" : ""} size={12} />
                      <span>Refresh Repo</span>
                    </button>
                  )}
                </div>
              )
            }
          >
            {!activeProject ? (
              <div className="text-center py-10">
                <p className="text-xs text-slate-500">No project has been allocated or approved yet. Please submit your project proposal and get it approved to set up GitHub Integration.</p>
              </div>
            ) : editingGithub ? (
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
              <div className="text-center py-10 space-y-4">
                <p className="text-xs text-slate-500">No GitHub repository configured yet.</p>
                <button
                  type="button"
                  onClick={handleStartEditGithub}
                  className="py-2 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-500/10 inline-flex items-center space-x-1.5"
                >
                  <Plus size={12} />
                  <span>Configure GitHub Repository</span>
                </button>
              </div>
            )}
          </Card>

          {/* Live Demo Credentials */}
          <Card 
            title="Live Project Deploy Credentials"
            headerAction={
              activeProject && (
                <button
                  onClick={() => editingLive ? handleCancelEditLive() : setEditingLive(true)}
                  className="flex items-center space-x-1.5 py-1.5 px-3 bg-slate-100 hover:bg-slate-205 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
                >
                  <Edit2 size={12} />
                  <span>{editingLive ? "Cancel" : "Edit Credentials"}</span>
                </button>
              )
            }
          >
            {!activeProject ? (
              <div className="text-center py-10">
                <p className="text-xs text-slate-500">No project has been allocated or approved yet. Please submit your project proposal and get it approved to set up deployment credentials.</p>
              </div>
            ) : editingLive ? (
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
                  <span className="font-mono text-xs text-slate-700 dark:text-slate-200 block bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl">
                    https://api.projecthub.edu/projects/{activeProject?.id || 1}/live
                  </span>
                </div>

                <div className="flex items-center space-x-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  {/* Dynamically generated mock QR Code */}
                  <div className="w-24 h-24 bg-white border border-slate-200 p-1.5 rounded-xl shrink-0 flex items-center justify-center">
                    <QrCode size={80} className="text-slate-850" />
                  </div>
                  <div className="text-xs leading-normal">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Mobile Web QR Code</span>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-1">Scan this code to instantly open the compiled prototype on any smartphone device.</p>
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
