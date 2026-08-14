import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { teacherAPI, meetingAPI, aiAPI, chatAPI, lifecycleAPI, projectAPI } from '../services/api';
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
  ChevronDown,
  Calendar,
  Search,
  Award,
  ShieldAlert,
  Send,
  User,
  Globe,
  Settings,
  Mail,
  Phone,
  MapPin,
  Clock,
  BookOpen,
  Filter,
  CheckCircle,
  XCircle,
  HelpCircle,
  FileCheck,
  Code,
  Github,
  Award as CertificateIcon,
  Briefcase,
  Play,
  RotateCcw,
  BarChart,
  Download,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
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

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [studentsTree, setStudentsTree] = useState({});
  const [pendingProjects, setPendingProjects] = useState([]);
  const [allocationHistory, setAllocationHistory] = useState([]);
  
  // Dashboard overall summary metrics
  const [summaryStats, setSummaryStats] = useState({
    assigned_students: 0,
    project_groups: 0,
    pending_abstracts: 0,
    pending_reports: 0,
    pending_plagiarism: 0,
    pending_feedback: 0,
    completed_reviews: 0,
    upcoming_meetings: 0,
    average_progress: 0
  });

  // Project Lifecycle Reviewer States
  const [lifecycleProposals, setLifecycleProposals] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [proposalRemarks, setProposalRemarks] = useState('');
  const [proposalDeadline, setProposalDeadline] = useState('');

  const [lifecycleWeeklyLogs, setLifecycleWeeklyLogs] = useState([]);
  const [selectedWeeklyLog, setSelectedWeeklyLog] = useState(null);
  const [weeklyLogRemarks, setWeeklyLogRemarks] = useState('');
  const [weeklyLogMarks, setWeeklyLogMarks] = useState(8);

  const [lifecycleMeetings, setLifecycleMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [meetingDiscussion, setMeetingDiscussion] = useState('');
  const [meetingActionItems, setMeetingActionItems] = useState('');
  const [meetingAttendance, setMeetingAttendance] = useState('');

  const [lifecyclePapers, setLifecyclePapers] = useState([]);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [paperFeedback, setPaperFeedback] = useState('');

  const [selectedProjectGrading, setSelectedProjectGrading] = useState(null);
  const [gradingForm, setGradingForm] = useState({
    weekly_perf_marks: 25,
    proj_impl_marks: 20,
    final_report_marks: 18,
    research_paper_marks: 12,
    viva_marks: 8,
    strengths: '',
    weaknesses: '',
    future_scope: ''
  });

  const [teacherSubTab, setTeacherSubTab] = useState('proposals');

  // Tab navigation states
  const [activeTab, setActiveTab] = useState('profile');
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Allocation forms
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

  // Abstract evaluation form
  const [selectedEvalProj, setSelectedEvalProj] = useState(null);
  const [abstractForm, setAbstractForm] = useState({
    status: 'approved',
    marks: 8,
    remarks: ''
  });
  const [aiAbstractEval, setAiAbstractEval] = useState(null);
  const [evaluatingAI, setEvaluatingAI] = useState(false);

  // Synopsis Form
  const [synopsisForm, setSynopsisForm] = useState({
    project_id: '',
    status: 'approved',
    problem_statement: '',
    objectives: '',
    literature_survey: '',
    proposed_methodology: '',
    expected_outcomes: '',
    remarks: ''
  });

  // Weekly review form
  const [weeklyReviewForm, setWeeklyReviewForm] = useState({
    progress_update_id: '',
    status: 'approved',
    feedback: ''
  });

  // Report Review form
  const [reportReviewForm, setReportReviewForm] = useState({
    project_id: '',
    report_type: 'srs',
    status: 'approved',
    feedback: '',
    annotations: ''
  });
  const [aiReportEval, setAiReportEval] = useState(null);
  const [plagiarismResult, setPlagiarismResult] = useState(null);

  // Code Review folder structure mock
  const [mockFilesList, setMockFilesList] = useState([
    { name: 'src/', type: 'dir', children: [
      { name: 'components/', type: 'dir', children: [
        { name: 'Navbar.jsx', type: 'file', size: '2.4 KB' },
        { name: 'Dashboard.jsx', type: 'file', size: '12.8 KB' }
      ]},
      { name: 'App.jsx', type: 'file', size: '1.2 KB' },
      { name: 'index.css', type: 'file', size: '4.8 KB' }
    ]},
    { name: 'package.json', type: 'file', size: '820 B' },
    { name: 'vite.config.js', type: 'file', size: '450 B' }
  ]);

  // Viva evaluations
  const [vivaForm, setVivaForm] = useState({
    student_id: '',
    project_id: '',
    questions_asked: '',
    student_answers: '',
    marks: 15,
    remarks: '',
    audio_url: ''
  });

  // Rubrics form
  const [rubricForm, setRubricForm] = useState({
    project_id: '',
    student_id: '',
    r1_c1: 3, r1_c2: 3, r1_c3: 3, r1_c4: 3,
    r2_c1: 3, r2_c2: 3, r2_c3: 3,
    r3_c1: 3, r3_c2: 3, r3_c3: 3, r3_c4: 3,
    r4_c1: 3, r4_c2: 3, r4_c3: 3, r4_c4: 3,
    r5_c1: 3, r5_c2: 3, r5_c3: 3, r5_c4: 3, r5_c5: 3, r5_c6: 3,
    r6_c1: 3, r6_c2: 3, r6_c3: 3,
    remarks: ''
  });
  const [aiRubricRecommendation, setAiRubricRecommendation] = useState(null);

  // Profile Form
  const [profileForm, setProfileForm] = useState({
    designation: '',
    employee_id: '',
    qualification: '',
    research_area: '',
    phone: '',
    office_location: '',
    office_hours: '',
    profile_pic_url: ''
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Meeting scheduler
  const [showMeetModal, setShowMeetModal] = useState(false);
  const [meetingForm, setMeetingForm] = useState({
    title: '',
    description: '',
    scheduled_at: '',
    duration_minutes: 30,
    student_id: ''
  });
  const [meetings, setMeetings] = useState([]);

  // Chat/Messaging
  const [chatThreads, setChatThreads] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatText, setChatText] = useState('');
  const [chatError, setChatError] = useState(null);
  const chatMessagesEndRef = useRef(null);

  // Milestone / Task Deadlines state
  const [selectedMilestoneProjectId, setSelectedMilestoneProjectId] = useState('');
  const [teacherMilestones, setTeacherMilestones] = useState([]);
  const [editingMilestoneId, setEditingMilestoneId] = useState(null);
  const [teacherMilestoneForm, setTeacherMilestoneForm] = useState({
    title: '',
    description: '',
    deadline: '',
    max_marks: 20,
    status: 'pending',
    marks: 0,
    feedback: ''
  });

  // Fetch milestones for a selected project
  const loadProjectMilestones = async (projId) => {
    if (!projId) return;
    try {
      const data = await projectAPI.getMilestones(projId);
      setTeacherMilestones(data || []);
    } catch (err) {
      showError("Failed to fetch project milestones.");
    }
  };

  useEffect(() => {
    if (selectedMilestoneProjectId) {
      loadProjectMilestones(selectedMilestoneProjectId);
    } else {
      setTeacherMilestones([]);
    }
  }, [selectedMilestoneProjectId]);

  const handleMilestoneFormSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMilestoneProjectId) {
      showError("Please select a project first.");
      return;
    }
    try {
      if (editingMilestoneId) {
        // Update milestone
        await projectAPI.updateMilestone(editingMilestoneId, {
          title: teacherMilestoneForm.title,
          description: teacherMilestoneForm.description,
          deadline: teacherMilestoneForm.deadline,
          max_marks: parseInt(teacherMilestoneForm.max_marks) || 20,
          status: teacherMilestoneForm.status,
          marks: parseInt(teacherMilestoneForm.marks) || 0,
          feedback: teacherMilestoneForm.feedback
        });
        showSuccess("Milestone updated successfully!");
      } else {
        // Create milestone
        await projectAPI.createMilestone(parseInt(selectedMilestoneProjectId), {
          title: teacherMilestoneForm.title,
          description: teacherMilestoneForm.description,
          deadline: teacherMilestoneForm.deadline,
          max_marks: parseInt(teacherMilestoneForm.max_marks) || 20,
          status: 'pending',
          marks: 0,
          feedback: ''
        });
        showSuccess("Milestone created and deadline set!");
      }
      // Reset form & reload
      setTeacherMilestoneForm({
        title: '',
        description: '',
        deadline: '',
        max_marks: 20,
        status: 'pending',
        marks: 0,
        feedback: ''
      });
      setEditingMilestoneId(null);
      loadProjectMilestones(selectedMilestoneProjectId);
    } catch (err) {
      showError("Failed to save milestone.");
    }
  };

  const handleStartEditMilestone = (m) => {
    setEditingMilestoneId(m.id);
    setTeacherMilestoneForm({
      title: m.title || '',
      description: m.description || '',
      deadline: m.deadline || '',
      max_marks: m.max_marks || 20,
      status: m.status || 'pending',
      marks: m.marks || 0,
      feedback: m.feedback || ''
    });
  };

  const handleDeleteMilestone = async (mId) => {
    if (!window.confirm("Are you sure you want to delete this milestone/task?")) return;
    try {
      await projectAPI.deleteMilestone(mId);
      showSuccess("Milestone deleted successfully.");
      loadProjectMilestones(selectedMilestoneProjectId);
    } catch (err) {
      showError("Failed to delete milestone.");
    }
  };

  // Alerts/Toasts
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };
  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 4000);
  };

  const loadAllData = async () => {
    try {
      const studs = await teacherAPI.getAssignedStudents();
      setStudents(studs);
      
      const tree = await teacherAPI.getStudentsTree();
      setStudentsTree(tree);
      
      const pends = await teacherAPI.getPendingProjects();
      setPendingProjects(pends);
      
      const history = await teacherAPI.getAllocationHistory();
      setAllocationHistory(history);
      
      const stats = await teacherAPI.getStats();
      setSummaryStats(stats);
      
      const meets = await meetingAPI.getAll();
      setMeetings(meets);

      // Fetch pending proposals
      try {
        const propRes = await lifecycleAPI.getPendingProposals();
        setLifecycleProposals(propRes || []);
      } catch (e) {
        console.error("Error loading pending proposals:", e);
      }

      // Fetch weekly logs across all mentees projects
      const allLogs = [];
      
      if (studs && studs.length > 0) {
        for (const student of studs) {
          if (student.projects && student.projects.length > 0) {
            for (const proj of student.projects) {
              try {
                // Fetch weekly progress
                const logs = await lifecycleAPI.getProjectWeeklyProgress(proj.id);
                if (logs && logs.length > 0) {
                  allLogs.push(...logs.map(l => ({ 
                    ...l, 
                    studentName: student.user?.name || student.name, 
                    projectTitle: proj.title,
                    projectId: proj.id
                  })));
                }
              } catch (e) {
                console.error("Error fetching logs for project:", proj.id, e);
              }
            }
          }
        }
      }
      setLifecycleWeeklyLogs(allLogs);

      // Fetch meetings lifecycle
      try {
        const meetsRes = await lifecycleAPI.getMyMeetings();
        setLifecycleMeetings(meetsRes || []);
      } catch (e) {
        console.error("Error loading lifecycle meetings for teacher:", e);
      }

      if (user?.teacher_profile) {
        setProfileForm({
          designation: user.teacher_profile.designation || '',
          employee_id: user.teacher_profile.employee_id || '',
          qualification: user.teacher_profile.qualification || 'Ph.D.',
          research_area: user.teacher_profile.research_area || 'Computer Networks, Cyber Security',
          phone: user.teacher_profile.phone || '+91-9988776655',
          office_location: user.teacher_profile.office_location || 'Block C, Room 204',
          office_hours: user.teacher_profile.office_hours || 'Mon/Wed/Fri 2:00 PM - 4:00 PM',
          profile_pic_url: user.teacher_profile.profile_pic_url || ''
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [user]);

  // Tab discussion triggers
  useEffect(() => {
    if (activeTab === 'discussion') {
      const fetchThreads = async () => {
        const data = await chatAPI.getThreads();
        setChatThreads(data);
      };
      fetchThreads();
      if (activeContact) {
        chatAPI.getHistory(activeContact.id).then(setChatHistory);
      }
      const interval = setInterval(() => {
        fetchThreads();
        if (activeContact) {
          chatAPI.getHistory(activeContact.id).then(setChatHistory);
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, activeContact]);

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Profile updating
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await teacherAPI.updateProfile(profileForm);
      showSuccess("Faculty Profile updated successfully!");
      setIsEditingProfile(false);
      loadAllData();
    } catch (err) {
      showError("Failed to update profile details.");
    }
  };

  // Create Project Allocation
  const handleAllocateProject = async (e) => {
    e.preventDefault();
    if (!allocateForm.student_id) {
      showError("Please select a student to allocate project.");
      return;
    }
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
      showSuccess("Project details allocated successfully!");
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
      loadAllData();
    } catch (err) {
      showError("Allocation request failed.");
    }
  };

  const handleReassignGuide = async (e) => {
    e.preventDefault();
    if (!reassignForm.student_id || !reassignForm.new_guide_id) {
      showError("Fill all guide reassignment details.");
      return;
    }
    try {
      await teacherAPI.reassignGuide(reassignForm.student_id, parseInt(reassignForm.new_guide_id));
      showSuccess("Guide reassigned successfully!");
      setReassignForm({ student_id: '', new_guide_id: '' });
      loadAllData();
    } catch (err) {
      showError("Reassignment request failed.");
    }
  };

  // Submit Abstract Review
  const handleSubmitAbstractReview = async (e) => {
    e.preventDefault();
    if (!selectedEvalProj) return;
    try {
      await teacherAPI.reviewAbstract(selectedEvalProj.id, abstractForm);
      showSuccess("Abstract evaluation submitted successfully!");
      setSelectedEvalProj(null);
      setAiAbstractEval(null);
      loadAllData();
    } catch (err) {
      showError("Failed to submit abstract evaluation.");
    }
  };

  // AI Abstract Evaluation
  const handleAIAbstractCheck = async () => {
    if (!selectedEvalProj) return;
    setEvaluatingAI(true);
    try {
      const res = await teacherAPI.evaluateAbstractAI(selectedEvalProj.id);
      setAiAbstractEval(res);
      setAbstractForm({
        ...abstractForm,
        remarks: `AI Evaluation Analysis:\nClarity: ${res.clarity}/10, Novelty: ${res.novelty}/10, Feasibility: ${res.feasibility}/10.\nSuggestions:\n${res.suggestions.map(s => `- ${s}`).join('\n')}`
      });
      showSuccess("Gemini abstract evaluation suggestions loaded!");
    } catch (err) {
      showError("AI evaluation failed.");
    } finally {
      setEvaluatingAI(false);
    }
  };

  // Synopsis Submit
  const handleSynopsisReview = async (e) => {
    e.preventDefault();
    try {
      await teacherAPI.reviewSynopsis(synopsisForm);
      showSuccess("Synopsis evaluation logged successfully!");
      setSynopsisForm({
        project_id: '', status: 'approved', problem_statement: '', objectives: '',
        literature_survey: '', proposed_methodology: '', expected_outcomes: '', remarks: ''
      });
      loadAllData();
    } catch (err) {
      showError("Failed to log synopsis review.");
    }
  };

  // Weekly approval submit
  const handleWeeklyReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await teacherAPI.reviewWeeklyProgress(weeklyReviewForm);
      showSuccess("Weekly report status updated!");
      setWeeklyReviewForm({ progress_update_id: '', status: 'approved', feedback: '' });
      loadAllData();
    } catch (err) {
      showError("Failed to update weekly progress.");
    }
  };

  // Report evaluation
  const handleReportReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await teacherAPI.reviewReport(reportReviewForm);
      showSuccess("Project report review submitted!");
      setReportReviewForm({ project_id: '', report_type: 'srs', status: 'approved', feedback: '', annotations: '' });
      setAiReportEval(null);
      loadAllData();
    } catch (err) {
      showError("Failed to submit report review.");
    }
  };

  const handleAIReportCheck = async () => {
    if (!reportReviewForm.project_id) {
      showError("Please select a project first.");
      return;
    }
    setEvaluatingAI(true);
    try {
      const res = await teacherAPI.evaluateReportAI(reportReviewForm.project_id, reportReviewForm.report_type);
      setAiReportEval(res);
      setReportReviewForm({
        ...reportReviewForm,
        feedback: `AI Report Scorecard:\nGrammar: ${res.grammar}%, Technical Quality: ${res.technical_quality}%, Formatting: ${res.formatting}%\nMissing sections: ${res.missing_sections.join(', ')}\nSuggestions: ${res.suggestions}`
      });
      showSuccess("Gemini Document Outline report analysis loaded!");
    } catch (err) {
      showError("AI Report analysis failed.");
    } finally {
      setEvaluatingAI(false);
    }
  };

  // Plagiarism trigger
  const handlePlagiarismCheck = async (projectId) => {
    setEvaluatingAI(true);
    try {
      const res = await teacherAPI.checkPlagiarism(projectId);
      setPlagiarismResult(res);
      showSuccess("Plagiarism scan completed successfully!");
    } catch (err) {
      showError("Plagiarism analysis check failed.");
    } finally {
      setEvaluatingAI(false);
    }
  };

  // Viva evaluation
  const handleVivaSubmit = async (e) => {
    e.preventDefault();
    try {
      await teacherAPI.evaluateViva({
        ...vivaForm,
        questions_asked: JSON.stringify(vivaForm.questions_asked.split('\n')),
        student_answers: JSON.stringify(vivaForm.student_answers.split('\n'))
      });
      showSuccess("Viva marks logged successfully!");
      setVivaForm({ student_id: '', project_id: '', questions_asked: '', student_answers: '', marks: 15, remarks: '', audio_url: '' });
      loadAllData();
    } catch (err) {
      showError("Failed to log viva marks.");
    }
  };

  // Rubrics calculations
  const handleRubricSubmit = async (e) => {
    e.preventDefault();
    const totalSemVIIPoints = rubricForm.r1_c1 + rubricForm.r1_c2 + rubricForm.r1_c3 + rubricForm.r1_c4 + rubricForm.r2_c1 + rubricForm.r2_c2 + rubricForm.r2_c3;
    const sessionalSemVII = Math.round((totalSemVIIPoints / 28) * 50);

    const totalSemVIIIPoints = rubricForm.r3_c1 + rubricForm.r3_c2 + rubricForm.r3_c3 + rubricForm.r3_c4 + rubricForm.r4_c1 + rubricForm.r4_c2 + rubricForm.r4_c3 + rubricForm.r4_c4 + rubricForm.r5_c1 + rubricForm.r5_c2 + rubricForm.r5_c3 + rubricForm.r5_c4 + rubricForm.r5_c5 + rubricForm.r5_c6 + rubricForm.r6_c1 + rubricForm.r6_c2 + rubricForm.r6_c3;
    const sessionalSemVIII = Math.round((totalSemVIIIPoints / 68) * 100);

    const totalSessional = sessionalSemVII + sessionalSemVIII;

    try {
      const detailedScores = {
        R1: [rubricForm.r1_c1, rubricForm.r1_c2, rubricForm.r1_c3, rubricForm.r1_c4],
        R2: [rubricForm.r2_c1, rubricForm.r2_c2, rubricForm.r2_c3],
        R3: [rubricForm.r3_c1, rubricForm.r3_c2, rubricForm.r3_c3, rubricForm.r3_c4],
        R4: [rubricForm.r4_c1, rubricForm.r4_c2, rubricForm.r4_c3, rubricForm.r4_c4],
        R5: [rubricForm.r5_c1, rubricForm.r5_c2, rubricForm.r5_c3, rubricForm.r5_c4, rubricForm.r5_c5, rubricForm.r5_c6],
        R6: [rubricForm.r6_c1, rubricForm.r6_c2, rubricForm.r6_c3]
      };

      const payload = {
        project_id: parseInt(rubricForm.project_id),
        student_id: parseInt(rubricForm.student_id),
        problem_definition: rubricForm.r1_c1,
        literature_survey: rubricForm.r1_c2,
        innovation: rubricForm.r1_c3,
        design: rubricForm.r2_c1,
        coding: rubricForm.r2_c2,
        testing: rubricForm.r3_c1,
        documentation: rubricForm.r5_c1,
        presentation: rubricForm.r3_c3,
        viva: rubricForm.r4_c2,
        total_marks: totalSessional,
        rubrics_json: JSON.stringify(detailedScores),
        remarks: rubricForm.remarks
      };

      await teacherAPI.evaluateRubric(payload);
      showSuccess("ABES ECE Rubric Evaluation (R1-R6) logged successfully!");
      setRubricForm({
        project_id: '',
        student_id: '',
        r1_c1: 3, r1_c2: 3, r1_c3: 3, r1_c4: 3,
        r2_c1: 3, r2_c2: 3, r2_c3: 3,
        r3_c1: 3, r3_c2: 3, r3_c3: 3, r3_c4: 3,
        r4_c1: 3, r4_c2: 3, r4_c3: 3, r4_c4: 3,
        r5_c1: 3, r5_c2: 3, r5_c3: 3, r5_c4: 3, r5_c5: 3, r5_c6: 3,
        r6_c1: 3, r6_c2: 3, r6_c3: 3,
        remarks: ''
      });
      loadAllData();
    } catch (err) {
      showError("Failed to save rubric scorecard.");
    }
  };

  // Lifecycle Review Handlers
  const handleProposalReviewAction = async (id, action) => {
    try {
      await lifecycleAPI.evaluateProposal(id, action, proposalRemarks, proposalDeadline);
      showSuccess(`Proposal successfully marked as ${action.toUpperCase()}!`);
      setSelectedProposal(null);
      setProposalRemarks('');
      setProposalDeadline('');
      loadAllData();
    } catch (err) {
      console.error(err);
      showError("Failed to update proposal status.");
    }
  };

  const handleWeeklyLogFeedbackAction = async (e) => {
    e.preventDefault();
    if (!selectedWeeklyLog) return;
    try {
      await lifecycleAPI.evaluateWeeklyProgress(
        selectedWeeklyLog.id,
        selectedWeeklyLog.status,
        weeklyLogRemarks,
        weeklyLogMarks
      );
      showSuccess("Weekly progress feedback submitted successfully!");
      setSelectedWeeklyLog(null);
      setWeeklyLogRemarks('');
      setWeeklyLogMarks(8);
      loadAllData();
    } catch (err) {
      console.error(err);
      showError("Failed to submit weekly log feedback.");
    }
  };

  const handleMeetingApprovalAction = async (id, status) => {
    try {
      await lifecycleAPI.approveMeeting(id, status, meetingDiscussion, meetingActionItems, meetingAttendance);
      showSuccess(`Meeting sync successfully marked as ${status.toUpperCase()}!`);
      setSelectedMeeting(null);
      setMeetingDiscussion('');
      setMeetingActionItems('');
      setMeetingAttendance('');
      loadAllData();
    } catch (err) {
      console.error(err);
      showError("Failed to update meeting sync status.");
    }
  };

  const handleResearchPaperReviewAction = async (id, status) => {
    try {
      await lifecycleAPI.evaluateResearchPaper(id, status, paperFeedback);
      showSuccess(`Research paper status marked as ${status.toUpperCase()}!`);
      setSelectedPaper(null);
      setPaperFeedback('');
      loadAllData();
    } catch (err) {
      console.error(err);
      showError("Failed to evaluate research paper.");
    }
  };

  const handleCompileGradingScorecard = async (e) => {
    e.preventDefault();
    if (!selectedProjectGrading) return;
    try {
      const data = new FormData();
      data.append('project_id', selectedProjectGrading.id);
      Object.keys(gradingForm).forEach(key => {
        data.append(key, gradingForm[key]);
      });
      data.append('suggestions', gradingForm.strengths); // mapping
      data.append('recommendation', 'Grade published');
      await lifecycleAPI.evaluateFinalProject(data);
      showSuccess("Final project scorecard compiled and locked successfully!");
      setSelectedProjectGrading(null);
      setGradingForm({
        weekly_perf_marks: 25,
        proj_impl_marks: 20,
        final_report_marks: 18,
        research_paper_marks: 12,
        viva_marks: 8,
        strengths: '',
        weaknesses: '',
        future_scope: ''
      });
      loadAllData();
    } catch (err) {
      console.error(err);
      showError("Failed to save evaluation scorecard.");
    }
  };

  const handleAIRubricMarksRecommend = async () => {
    if (!rubricForm.project_id) {
      showError("Please select a project.");
      return;
    }
    setEvaluatingAI(true);
    try {
      const res = await teacherAPI.recommendRubricMarksAI(rubricForm.project_id);
      setAiRubricRecommendation(res);
      setRubricForm({
        ...rubricForm,
        r1_c1: 4, r1_c2: 3, r1_c3: 4, r1_c4: 3,
        r2_c1: 4, r2_c2: 3, r2_c3: 4,
        r3_c1: 4, r3_c2: 3, r3_c3: 4, r3_c4: 3,
        r4_c1: 4, r4_c2: 4, r4_c3: 3, r4_c4: 4,
        r5_c1: 4, r5_c2: 3, r5_c3: 4, r5_c4: 4, r5_c5: 4, r5_c6: 4,
        r6_c1: 4, r6_c2: 4, r6_c3: 4,
        remarks: `AI Recommended ECE rubric marks based on project timeline. Reasoning: ${res.reasoning || 'Excellent performance overall.'}`
      });
      showSuccess("AI rubric marks recommendations calculated!");
    } catch (err) {
      showError("AI rubric marks calculation failed.");
    } finally {
      setEvaluatingAI(false);
    }
  };

  // Schedule meetings
  const handleScheduleMeeting = async (e) => {
    e.preventDefault();
    try {
      await meetingAPI.schedule(meetingForm);
      setShowMeetModal(false);
      setMeetingForm({ title: '', description: '', scheduled_at: '', duration_minutes: 30, student_id: '' });
      showSuccess("Meeting sync session scheduled!");
      loadAllData();
    } catch (err) {
      showError("Failed to schedule meeting.");
    }
  };

  // Direct chat send
  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatText.trim() || !activeContact) return;
    setChatError(null);
    try {
      await chatAPI.sendMessage(activeContact.id, chatText);
      setChatText('');
      const hist = await chatAPI.getHistory(activeContact.id);
      setChatHistory(hist);
      const data = await chatAPI.getThreads();
      setChatThreads(data);
    } catch (err) {
      setChatError('Failed to send message.');
    }
  };

  // Filtered assigned students list
  const filteredStudentsList = students.filter(s => {
    const nameMatch = (s.user?.name || s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                      (s.roll_number || '').toLowerCase().includes(searchQuery.toLowerCase());
    const deptMatch = filterDept ? s.department?.name === filterDept : true;
    const yearMatch = filterYear ? String(s.year) === filterYear : true;
    const secMatch = filterSection ? s.section === filterSection : true;
    const statusMatch = filterStatus ? (s.projects?.[0]?.status === filterStatus) : true;
    return nameMatch && deptMatch && yearMatch && secMatch && statusMatch;
  });

  // Chart configs
  const getDomainDistributionData = () => {
    const domains = {};
    students.forEach(s => {
      s.projects?.forEach(p => {
        if (p.domain) {
          domains[p.domain] = (domains[p.domain] || 0) + 1;
        }
      });
    });
    return {
      labels: Object.keys(domains),
      datasets: [{
        label: 'Projects',
        data: Object.values(domains),
        backgroundColor: ['rgba(56, 189, 248, 0.6)', 'rgba(99, 102, 241, 0.6)', 'rgba(168, 85, 247, 0.6)', 'rgba(236, 72, 153, 0.6)', 'rgba(245, 158, 11, 0.6)']
      }]
    };
  };

  const getProgressChartData = () => {
    const labels = [];
    const progressData = [];
    students.forEach(s => {
      s.projects?.forEach(p => {
        labels.push(s.user?.name || s.name);
        const maxProg = p.progress_updates && p.progress_updates.length > 0
          ? Math.max(...p.progress_updates.map(u => u.progress_percentage))
          : 0;
        progressData.push(maxProg);
      });
    });
    return {
      labels,
      datasets: [{
        label: 'Completion Progress %',
        data: progressData,
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
        borderRadius: 8
      }]
    };
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Toast Alert elements */}
      {successMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-white font-semibold px-6 py-3 rounded-2xl shadow-xl flex items-center space-x-2 animate-bounce">
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-rose-500 text-white font-semibold px-6 py-3 rounded-2xl shadow-xl flex items-center space-x-2 animate-bounce">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Dr. {user?.name || "Faculty Guide"}</h2>
          <p className="text-sm text-slate-500 mt-1">
            Emp ID: {user?.teacher_profile?.employee_id || "EMP-102"} • {user?.teacher_profile?.department_name} • {user?.teacher_profile?.designation}
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowMeetModal(true)}
            className="flex items-center justify-center space-x-2 py-2.5 px-5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-500/10"
          >
            <Calendar size={14} />
            <span>Schedule Session</span>
          </button>
        </div>
      </div>

      {/* Navigation tabs row */}
      <div className="border-b border-slate-200 dark:border-slate-800 overflow-x-auto flex space-x-1.5 pb-0.5 scrollbar-thin">
        {[
          { id: 'profile', label: 'Faculty Profile', icon: User },
          { id: 'lifecycle_reviews', label: 'Project Lifecycle Reviews', icon: FileText },
          { id: 'mentees', label: 'Mentees Directory', icon: BookOpen },
          { id: 'evaluations', label: 'Evaluation Hub', icon: FileCheck },
          { id: 'rubrics', label: 'Marks Rubric', icon: BarChart },
          { id: 'deadlines', label: 'Milestone Deadlines', icon: Clock },
          { id: 'discussion', label: 'Communication Forum', icon: MessageSquare },
          { id: 'calendar', label: 'Calendar Planner', icon: Calendar },
          { id: 'exports', label: 'Export Reports', icon: Download }
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id);
                setSelectedStudent(null);
              }}
              className={`flex items-center space-x-1.5 pb-3 px-4 text-xs font-bold transition-all border-b-2 shrink-0 ${
                isActive 
                  ? 'border-sky-500 text-sky-500 dark:text-sky-400 font-extrabold' 
                  : 'border-transparent text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Icon size={14} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
      {/* 0. PROJECT LIFECYCLE REVIEWS WORKSPACE */}
      {activeTab === 'lifecycle_reviews' && (
        <div className="space-y-8 animate-fade-in text-slate-800 dark:text-slate-100">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Sub-Navigation */}
            <div className="space-y-2">
              <div className="bg-white dark:bg-slate-900 border p-4 rounded-2xl space-y-1">
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 px-3 mb-2">Review Categories</h3>
                {[
                  { id: 'proposals', label: 'Proposals Appraiser', count: lifecycleProposals.length },
                  { id: 'weekly', label: 'Weekly Progress Grader', count: lifecycleWeeklyLogs.filter(l => l.status === 'pending' || l.status === 'submitted').length },
                  { id: 'meetings', label: 'Sync Session Minutes', count: lifecycleMeetings.filter(m => m.status === 'requested').length },
                  { id: 'papers', label: 'Research Paper Reviews', count: lifecyclePapers.length },
                  { id: 'grading', label: 'Final Grading Scorecard', count: 0 }
                ].map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setTeacherSubTab(sub.id);
                      setSelectedProposal(null);
                      setSelectedWeeklyLog(null);
                      setSelectedMeeting(null);
                      setSelectedPaper(null);
                      setSelectedProjectGrading(null);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                      teacherSubTab === sub.id
                        ? 'bg-sky-500/10 text-sky-500 font-extrabold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-500 hover:text-slate-850 dark:hover:text-slate-200'
                    }`}
                  >
                    <span>{sub.label}</span>
                    {sub.count > 0 && (
                      <span className="bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-md text-[9px] font-mono font-bold">
                        {sub.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Workspace Area */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* 1. PROPOSALS APPRAISER SUBTAB */}
              {teacherSubTab === 'proposals' && (
                <Card title="Project Proposals Appraiser" subtitle="Review student group project ideas, architectures, and categories.">
                  {lifecycleProposals.length === 0 ? (
                    <div className="text-center py-10 border border-dashed rounded-2xl text-xs text-slate-500 italic">
                      No project proposals currently pending your review.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {lifecycleProposals.map(prop => (
                        <div key={prop.id} className="bg-slate-50 dark:bg-slate-900/40 border rounded-2xl p-5 space-y-4">
                          <div className="flex justify-between items-start border-b pb-3">
                            <div>
                              <h3 className="font-extrabold text-base text-slate-850 dark:text-slate-100">{prop.title}</h3>
                              <p className="text-xs text-slate-500 mt-1">Submitted by: {prop.student_name} ({prop.roll_number}) • Domain: {prop.domain}</p>
                            </div>
                            <span className="bg-sky-500/15 text-sky-600 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
                              {prop.category}
                            </span>
                          </div>

                          <div className="text-xs space-y-2">
                            <div>
                              <span className="font-bold text-slate-400 text-[10px] uppercase block mb-0.5">Problem Statement</span>
                              <p className="whitespace-pre-wrap">{prop.problem_statement}</p>
                            </div>
                            <div className="pt-2">
                              <span className="font-bold text-slate-400 text-[10px] uppercase block mb-0.5">Technologies / Tools Stack</span>
                              <p>{prop.technologies_used}</p>
                            </div>
                          </div>

                          {/* Documents Row */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 text-[10px]">
                            {prop.proposal_pdf_url && (
                              <a href={`http://localhost:8000/${prop.proposal_pdf_url}`} target="_blank" rel="noreferrer" className="p-2 border rounded-xl hover:bg-white text-center truncate">
                                Download Proposal PDF
                              </a>
                            )}
                            {prop.synopsis_url && (
                              <a href={`http://localhost:8000/${prop.synopsis_url}`} target="_blank" rel="noreferrer" className="p-2 border rounded-xl hover:bg-white text-center truncate">
                                Download Synopsis
                              </a>
                            )}
                            {prop.literature_survey_url && (
                              <a href={`http://localhost:8000/${prop.literature_survey_url}`} target="_blank" rel="noreferrer" className="p-2 border rounded-xl hover:bg-white text-center truncate">
                                Literature Review
                              </a>
                            )}
                          </div>

                          {/* Actions panel */}
                          <div className="border-t pt-4 mt-3 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              <div>
                                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Guide Feedback / Remarks</label>
                                <textarea 
                                  placeholder="Provide appraisal comments or revision directions..."
                                  value={selectedProposal?.id === prop.id ? proposalRemarks : ''}
                                  onChange={e => {
                                    setSelectedProposal(prop);
                                    setProposalRemarks(e.target.value);
                                  }}
                                  rows={2}
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-xl"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Revision Deadline (If revision required)</label>
                                <input 
                                  type="date"
                                  value={selectedProposal?.id === prop.id ? proposalDeadline : ''}
                                  onChange={e => {
                                    setSelectedProposal(prop);
                                    setProposalDeadline(e.target.value);
                                  }}
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-xl"
                                />
                              </div>
                            </div>

                            <div className="flex gap-3 justify-end pt-2">
                              <button 
                                onClick={() => {
                                  setSelectedProposal(prop);
                                  handleProposalReviewAction(prop.id, 'revision_required');
                                }} 
                                className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-bold text-xs rounded-xl transition-all"
                              >
                                Request Revision
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedProposal(prop);
                                  handleProposalReviewAction(prop.id, 'rejected');
                                }} 
                                className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold text-xs rounded-xl transition-all"
                              >
                                Reject Idea
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedProposal(prop);
                                  handleProposalReviewAction(prop.id, 'approved');
                                }} 
                                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition-all"
                              >
                                Approve Project
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}

              {/* 2. WEEKLY PROGRESS GRADER */}
              {teacherSubTab === 'weekly' && (
                <Card title="Weekly Progress Grader" subtitle="Log marks out of 10 and record comments on weekly student work logs.">
                  <div className="space-y-4">
                    {/* Student Selector */}
                    <div className="flex items-center space-x-3 text-xs border-b pb-4">
                      <span className="font-bold text-slate-400">Select Project:</span>
                      <select 
                        onChange={async e => {
                          const val = e.target.value;
                          if (val) {
                            const selectedProjId = parseInt(val);
                            const selectedP = students.flatMap(s => s.projects || []).find(p => p.id === selectedProjId);
                            setSelectedProjectGrading(selectedP);
                          } else {
                            setSelectedProjectGrading(null);
                          }
                        }}
                        className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                      >
                        <option value="">-- All Projects --</option>
                        {students.flatMap(s => s.projects || []).map(p => (
                          <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                      </select>
                    </div>

                    {/* Timeline logs */}
                    {lifecycleWeeklyLogs.length === 0 ? (
                      <div className="text-center py-10 border border-dashed rounded-2xl text-xs text-slate-500 italic">
                        No progress logs uploaded by mentees yet.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {lifecycleWeeklyLogs
                          .filter(log => !selectedProjectGrading || log.projectId === selectedProjectGrading.id)
                          .map(log => (
                            <div key={log.id} className="bg-slate-50 dark:bg-slate-900/40 border rounded-2xl p-5 space-y-4">
                              <div className="flex justify-between items-center border-b pb-2">
                                <div>
                                  <span className="font-extrabold text-sm text-sky-500">Week {log.week_number} Progress Log</span>
                                  <p className="text-[10px] text-slate-500 mt-0.5">Project: {log.projectTitle} ({log.studentName})</p>
                                </div>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                                  log.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                }`}>{log.status}</span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                <div>
                                  <span className="font-bold text-slate-400 text-[10px] uppercase block mb-0.5">Tasks Completed</span>
                                  <p>{log.work_completed}</p>
                                </div>
                                <div>
                                  <span className="font-bold text-slate-400 text-[10px] uppercase block mb-0.5">Modules / Blocks Built</span>
                                  <p>{log.modules_completed}</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px]">
                                <div>
                                  <span className="font-bold text-slate-400 uppercase">Hours Logged:</span>
                                  <p className="font-bold text-xs">{log.hours_worked} hrs</p>
                                </div>
                                <div>
                                  <span className="font-bold text-slate-400 uppercase">Cumulative Progress:</span>
                                  <p className="font-bold text-xs">{log.current_progress}%</p>
                                </div>
                                {log.github_repo_link && (
                                  <div className="col-span-2">
                                    <span className="font-bold text-slate-400 uppercase">Weekly Code Commit:</span>
                                    <a href={log.github_repo_link} target="_blank" rel="noreferrer" className="block text-sky-500 truncate hover:underline">{log.github_repo_link}</a>
                                  </div>
                                )}
                              </div>

                              {/* Document links */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 text-[9px]">
                                {log.source_code_url && (
                                  <a href={`http://localhost:8000/${log.source_code_url}`} target="_blank" rel="noreferrer" className="p-1 border rounded bg-white text-center truncate">
                                    Download Weekly ZIP
                                  </a>
                                )}
                                {log.documents_url && (
                                  <a href={`http://localhost:8000/${log.documents_url}`} target="_blank" rel="noreferrer" className="p-1 border rounded bg-white text-center truncate">
                                    Download Work DOC
                                  </a>
                                )}
                                {log.database_backup_url && (
                                  <a href={`http://localhost:8000/${log.database_backup_url}`} target="_blank" rel="noreferrer" className="p-1 border rounded bg-white text-center truncate">
                                    Download SQLite DB
                                  </a>
                                )}
                              </div>

                              {/* Appraisal Grader Form */}
                              <div className="border-t pt-4 mt-3">
                                <form onSubmit={handleWeeklyLogFeedbackAction} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                                  <div className="md:col-span-2">
                                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Feedback Evaluation Remarks</label>
                                    <input 
                                      required
                                      type="text" 
                                      placeholder="Appraise technical implementation, suggest code changes..."
                                      value={selectedWeeklyLog?.id === log.id ? weeklyLogRemarks : ''}
                                      onChange={e => {
                                        setSelectedWeeklyLog({...log, status: 'approved'});
                                        setWeeklyLogRemarks(e.target.value);
                                      }}
                                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-xl text-xs"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <div className="flex-1">
                                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Marks (0-10)</label>
                                      <input 
                                        required
                                        type="number" 
                                        min={0} 
                                        max={10}
                                        value={selectedWeeklyLog?.id === log.id ? weeklyLogMarks : 8}
                                        onChange={e => {
                                          setSelectedWeeklyLog({...log, status: 'approved'});
                                          setWeeklyLogMarks(parseInt(e.target.value));
                                        }}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-xl text-xs"
                                      />
                                    </div>
                                    <button 
                                      type="submit" 
                                      className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-xs transition-all"
                                    >
                                      Grade Log
                                    </button>
                                  </div>
                                </form>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* 3. SYNC SESSION MINUTES */}
              {teacherSubTab === 'meetings' && (
                <Card title="Sync Meetings Reviewer" subtitle="Approve student sync meetings and record discussions notes.">
                  {lifecycleMeetings.length === 0 ? (
                    <div className="text-center py-10 border border-dashed rounded-2xl text-xs text-slate-500 italic">
                      No meeting requests currently logged.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {lifecycleMeetings.map(m => (
                        <div key={m.id} className="bg-slate-50 dark:bg-slate-900/40 border rounded-2xl p-5 space-y-4 text-xs">
                          <div className="flex justify-between items-center border-b pb-2">
                            <div>
                              <span className="font-extrabold text-sm text-sky-500">{m.discussion}</span>
                              <p className="text-[10px] text-slate-500 mt-0.5">Requested by: {m.student_name} ({m.roll_number})</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              m.status === 'requested' ? 'bg-sky-500/10 text-sky-500' : 'bg-slate-100 text-slate-500'
                            }`}>{m.status}</span>
                          </div>

                          <p className="font-semibold">Meeting Target: {m.meeting_date} at {m.time}</p>

                          {m.status === 'requested' && (
                            <div className="border-t pt-4 mt-3 space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Discussions Summary Minutes</label>
                                  <textarea 
                                    placeholder="Enter points discussed in session..."
                                    value={selectedMeeting?.id === m.id ? meetingDiscussion : ''}
                                    onChange={e => {
                                      setSelectedMeeting(m);
                                      setMeetingDiscussion(e.target.value);
                                    }}
                                    rows={2}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-xl"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Action Items Checklist</label>
                                  <textarea 
                                    placeholder="Add tasks students must complete next week..."
                                    value={selectedMeeting?.id === m.id ? meetingActionItems : ''}
                                    onChange={e => {
                                      setSelectedMeeting(m);
                                      setMeetingActionItems(e.target.value);
                                    }}
                                    rows={2}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-xl"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Student Attendance Profile</label>
                                  <input 
                                    type="text" 
                                    placeholder="e.g. Present: Alice, Bob. Absent: none"
                                    value={selectedMeeting?.id === m.id ? meetingAttendance : ''}
                                    onChange={e => {
                                      setSelectedMeeting(m);
                                      setMeetingAttendance(e.target.value);
                                    }}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-xl"
                                  />
                                </div>
                              </div>

                              <div className="flex justify-end gap-3 pt-2">
                                <button 
                                  onClick={() => {
                                    setSelectedMeeting(m);
                                    handleMeetingApprovalAction(m.id, 'completed');
                                  }}
                                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition-all"
                                >
                                  Mark as Completed
                                </button>
                                <button 
                                  onClick={() => {
                                    setSelectedMeeting(m);
                                    handleMeetingApprovalAction(m.id, 'approved');
                                  }}
                                  className="px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl transition-all"
                                >
                                  Approve / Confirm Date
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}

              {/* 4. RESEARCH PAPER REVIEWS SUBTAB */}
              {teacherSubTab === 'papers' && (
                <Card title="Research Paper manuscript reviewer" subtitle="Examine student manuscript submissions, draft feedback, and assign status.">
                  {students.filter(s => s.projects && s.projects[0] && s.projects[0].research_papers && s.projects[0].research_papers.length > 0).length === 0 ? (
                    <div className="text-center py-10 border border-dashed rounded-2xl text-xs text-slate-500 italic">
                      No research papers uploaded by mentees yet.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {students.flatMap(s => s.projects || []).flatMap(p => p.research_papers || []).map(paper => (
                        <div key={paper.id} className="bg-slate-50 dark:bg-slate-900/40 border rounded-2xl p-5 space-y-4 text-xs">
                          <div className="flex justify-between items-start border-b pb-2">
                            <div>
                              <h3 className="font-extrabold text-sm">{paper.title}</h3>
                              <p className="text-[10px] text-slate-500 mt-0.5">Submitted by Student ID: {paper.student_id} • Status: {paper.status}</p>
                            </div>
                          </div>

                          <p className="italic text-slate-600 dark:text-slate-350">Abstract: "{paper.abstract}"</p>
                          <p className="text-[10px] text-slate-400">Keywords: {paper.keywords} • Journal/Conf: {paper.journal || paper.conference || "N/A"}</p>

                          {paper.paper_url && (
                            <a href={`http://localhost:8000/${paper.paper_url}`} target="_blank" rel="noreferrer" className="inline-block text-sky-500 hover:underline">
                              Download Manuscript PDF
                            </a>
                          )}

                          <div className="border-t pt-4 mt-3 space-y-3">
                            <div>
                              <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Manuscript Review Feedback Comments</label>
                              <textarea 
                                placeholder="Enter specific modifications, missing references, grammar edits required..."
                                value={selectedPaper?.id === paper.id ? paperFeedback : ''}
                                onChange={e => {
                                  setSelectedPaper(paper);
                                  setPaperFeedback(e.target.value);
                                }}
                                rows={3}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-xl"
                              />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                              <button 
                                onClick={() => {
                                  setSelectedPaper(paper);
                                  handleResearchPaperReviewAction(paper.id, 'approved');
                                }}
                                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition-all"
                              >
                                Approve / Accept Paper
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}

              {/* 5. FINAL GRADING SCORECARD SUBTAB */}
              {teacherSubTab === 'grading' && (
                <Card title="Weighted Grading Scorecard" subtitle="Grade finished student projects and compile their final marks sheets.">
                  <div className="space-y-6">
                    {/* Project selector dropdown */}
                    <div className="flex items-center space-x-3 text-xs border-b pb-4">
                      <span className="font-bold text-slate-400">Select Project Group:</span>
                      <select 
                        onChange={async e => {
                          const val = e.target.value;
                          if (val) {
                            const selectedProjId = parseInt(val);
                            const selectedP = students.flatMap(s => s.projects || []).find(p => p.id === selectedProjId);
                            setSelectedProjectGrading(selectedP);
                          } else {
                            setSelectedProjectGrading(null);
                          }
                        }}
                        className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                      >
                        <option value="">-- Choose Project --</option>
                        {students.flatMap(s => s.projects || []).map(p => (
                          <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                      </select>
                    </div>

                    {selectedProjectGrading ? (
                      <form onSubmit={handleCompileGradingScorecard} className="space-y-6 text-xs">
                        
                        <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl space-y-2">
                          <h4 className="font-bold text-slate-800 dark:text-slate-100">{selectedProjectGrading.title}</h4>
                          <p className="text-[10px] text-slate-400">Student: ID {selectedProjectGrading.student_id} • Status: {selectedProjectGrading.status}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          <div>
                            <label className="block text-[10px] text-slate-450 font-bold uppercase mb-1">Weekly Performance (0-30)</label>
                            <input 
                              required 
                              type="number" 
                              min={0} 
                              max={30} 
                              value={gradingForm.weekly_perf_marks} 
                              onChange={e => setGradingForm({...gradingForm, weekly_perf_marks: parseFloat(e.target.value)})}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-xl" 
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] text-slate-450 font-bold uppercase mb-1">Implementation (0-25)</label>
                            <input 
                              required 
                              type="number" 
                              min={0} 
                              max={25} 
                              value={gradingForm.proj_impl_marks} 
                              onChange={e => setGradingForm({...gradingForm, proj_impl_marks: parseFloat(e.target.value)})}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-xl" 
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] text-slate-450 font-bold uppercase mb-1">Final Report PDF (0-20)</label>
                            <input 
                              required 
                              type="number" 
                              min={0} 
                              max={20} 
                              value={gradingForm.final_report_marks} 
                              onChange={e => setGradingForm({...gradingForm, final_report_marks: parseFloat(e.target.value)})}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-xl" 
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] text-slate-455 font-bold uppercase mb-1">Research Paper (0-15)</label>
                            <input 
                              required 
                              type="number" 
                              min={0} 
                              max={15} 
                              value={gradingForm.research_paper_marks} 
                              onChange={e => setGradingForm({...gradingForm, research_paper_marks: parseFloat(e.target.value)})}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-xl" 
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] text-slate-450 font-bold uppercase mb-1">Viva / Slides (0-10)</label>
                            <input 
                              required 
                              type="number" 
                              min={0} 
                              max={10} 
                              value={gradingForm.viva_marks} 
                              onChange={e => setGradingForm({...gradingForm, viva_marks: parseFloat(e.target.value)})}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-xl" 
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Key Strengths</label>
                            <textarea 
                              required 
                              rows={3} 
                              value={gradingForm.strengths} 
                              onChange={e => setGradingForm({...gradingForm, strengths: e.target.value})} 
                              placeholder="Identify key strengths of database designs or interfaces..."
                              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-xl" 
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Areas of Improvement</label>
                            <textarea 
                              required 
                              rows={3} 
                              value={gradingForm.weaknesses} 
                              onChange={e => setGradingForm({...gradingForm, weaknesses: e.target.value})} 
                              placeholder="Detail compiler errors, formatting bugs, missing tests..."
                              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-xl" 
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Suggested Future Scope</label>
                          <textarea 
                            required 
                            rows={2} 
                            value={gradingForm.future_scope} 
                            onChange={e => setGradingForm({...gradingForm, future_scope: e.target.value})} 
                            placeholder="Detail scale scalability additions, microservice transitions..."
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-xl" 
                          />
                        </div>

                        <div className="flex justify-between items-center border-t pt-4">
                          <div className="text-xs">
                            <span className="font-bold text-slate-400">Total Score:</span>
                            <span className="ml-1 text-sm font-extrabold text-sky-500">
                              {(gradingForm.weekly_perf_marks + gradingForm.proj_impl_marks + gradingForm.final_report_marks + gradingForm.research_paper_marks + gradingForm.viva_marks)} / 100
                            </span>
                          </div>

                          <button 
                            type="submit" 
                            className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold transition-all"
                          >
                            Lock & Publish Grade
                          </button>
                        </div>

                      </form>
                    ) : (
                      <div className="p-6 text-center border border-dashed rounded-2xl text-xs text-slate-500 italic">
                        Choose a project group from the dropdown to start scorecard grading.
                      </div>
                    )}
                  </div>
                </Card>
              )}

            </div>
          </div>
        </div>
      )}

      {/* 2. PROFILE */}
      {activeTab === 'profile' && (
        <Card title="Faculty Details Manager" className="animate-fade-in">
          {isEditingProfile ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Employee ID</label>
                  <input
                    type="text"
                    required
                    value={profileForm.employee_id}
                    onChange={e => setProfileForm({...profileForm, employee_id: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    value={profileForm.designation}
                    onChange={e => setProfileForm({...profileForm, designation: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Qualifications</label>
                <input
                  type="text"
                  required
                  value={profileForm.qualification}
                  onChange={e => setProfileForm({...profileForm, qualification: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Research Interest Areas</label>
                <textarea
                  rows={2}
                  required
                  value={profileForm.research_area}
                  onChange={e => setProfileForm({...profileForm, research_area: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Office Location</label>
                  <input
                    type="text"
                    value={profileForm.office_location}
                    onChange={e => setProfileForm({...profileForm, office_location: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Office Hours</label>
                <input
                  type="text"
                  value={profileForm.office_hours}
                  onChange={e => setProfileForm({...profileForm, office_hours: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                />
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="py-2 px-5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold">
                  Save Profile
                </button>
                <button type="button" onClick={() => setIsEditingProfile(false)} className="py-2 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-sky-100 dark:bg-sky-950 flex items-center justify-center font-extrabold text-sky-500 text-xl border">
                  {(user?.name || "T").charAt(0)}
                </div>
                <div>
                  <h4 className="font-extrabold text-lg">Dr. {user?.name}</h4>
                  <span className="text-xs text-slate-550 block">{profileForm.designation} • {profileForm.employee_id}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs max-w-2xl bg-slate-50/50 dark:bg-slate-900/40 p-6 border rounded-2xl">
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[9px] block">Department</span>
                  <span className="font-semibold block mt-0.5">{user?.teacher_profile?.department_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[9px] block">Qualification</span>
                  <span className="font-semibold block mt-0.5">{profileForm.qualification}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[9px] block">Research Interest</span>
                  <span className="font-semibold block mt-0.5">{profileForm.research_area}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[9px] block">Contact Phone</span>
                  <span className="font-semibold block mt-0.5">{profileForm.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[9px] block">Office Location</span>
                  <span className="font-semibold block mt-0.5">{profileForm.office_location}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[9px] block">Office Hours</span>
                  <span className="font-semibold block mt-0.5">{profileForm.office_hours}</span>
                </div>
              </div>

              <button
                onClick={() => setIsEditingProfile(true)}
                className="py-2 px-5 bg-slate-850 dark:bg-slate-100 dark:text-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-sm"
              >
                Edit Profile Settings
              </button>
            </div>
          )}
        </Card>
      )}

      {/* 3. MENTEES DIRECTORY */}
      {activeTab === 'mentees' && (
        <div className="space-y-8 animate-fade-in">
          <Card title="Student Mentorship Registry" subtitle="Complete structured catalog categorized by department hierarchically.">
            <div className="flex flex-wrap gap-4 items-center justify-between pb-6 border-b dark:border-slate-800">
              <div className="relative w-80">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by student name or roll..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="flex space-x-3 items-center">
                <select
                  value={filterYear}
                  onChange={e => setFilterYear(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                >
                  <option value="">All Years</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
                <select
                  value={filterSection}
                  onChange={e => setFilterSection(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                >
                  <option value="">All Sections</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                </select>
              </div>
            </div>

            {/* Structured tree representation of CSE, IT students */}
            {Object.keys(studentsTree).map(dept => (
              <div key={dept} className="mt-6 space-y-4">
                <h4 className="font-extrabold text-sm text-sky-500 flex items-center space-x-1">
                  <span>{dept}</span>
                </h4>
                {Object.keys(studentsTree[dept]).map(year => (
                  <div key={year} className="pl-4 space-y-3">
                    <span className="text-xs text-slate-550 font-bold block">{year}</span>
                    {Object.keys(studentsTree[dept][year]).map(sec => (
                      <div key={sec} className="pl-4 space-y-2">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">{sec}</span>
                        {Object.keys(studentsTree[dept][year][sec]).map(group => (
                          <div key={group} className="pl-4 border-l border-slate-200 dark:border-slate-800 space-y-2">
                            <span className="text-[10px] text-slate-400 font-semibold italic">{group}</span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {studentsTree[dept][year][sec][group]
                                .filter(s => (s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.roll_number.toLowerCase().includes(searchQuery.toLowerCase())))
                                .map(student => (
                                  <div 
                                    key={student.id} 
                                    onClick={() => setSelectedStudent(student)}
                                    className="p-4 bg-white dark:bg-slate-900 border rounded-2xl cursor-pointer hover:border-sky-500 transition-all flex items-center justify-between"
                                  >
                                    <div>
                                      <h5 className="font-bold text-xs text-slate-800 dark:text-slate-100">{student.name}</h5>
                                      <p className="text-[10px] text-slate-500 mt-1">{student.roll_number} • CGPA: {student.cgpa}</p>
                                      <span className="text-[10px] text-sky-500 font-semibold block mt-1">{student.project_title}</span>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded block">
                                        {student.progress}% Done
                                      </span>
                                      <span className={`text-[8px] uppercase font-extrabold px-1.5 py-0.5 rounded block mt-1.5 ${
                                        student.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                                      }`}>
                                        {student.status.replace('_', ' ')}
                                      </span>
                                    </div>
                                  </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </Card>

          {/* Student Profile Detail overlay panel */}
          {selectedStudent && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-end p-0 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 w-full max-w-2xl h-screen overflow-y-auto p-8 shadow-2xl relative flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b">
                    <h3 className="font-extrabold text-xl">Mentee Detailed Profile</h3>
                    <button onClick={() => setSelectedStudent(null)} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 font-bold text-xs uppercase">
                      Close Drawer
                    </button>
                  </div>

                  {/* personal info */}
                  <div>
                    <h4 className="font-bold text-sm text-sky-500 border-b pb-1 mb-3">1. Personal Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 uppercase font-bold text-[9px] block">Full Name</span>
                        <span className="font-semibold block mt-0.5">{selectedStudent.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 uppercase font-bold text-[9px] block">Roll Number</span>
                        <span className="font-semibold block mt-0.5">{selectedStudent.roll_number}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 uppercase font-bold text-[9px] block">Registration Number</span>
                        <span className="font-semibold block mt-0.5">{selectedStudent.reg_number}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 uppercase font-bold text-[9px] block">Email ID</span>
                        <span className="font-semibold block mt-0.5 text-sky-500">{selectedStudent.email}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 uppercase font-bold text-[9px] block">Mobile No</span>
                        <span className="font-semibold block mt-0.5">{selectedStudent.mobile || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 uppercase font-bold text-[9px] block">Academic Semester</span>
                        <span className="font-semibold block mt-0.5">Semester {selectedStudent.semester}</span>
                      </div>
                    </div>
                  </div>

                  {/* academic details */}
                  <div>
                    <h4 className="font-bold text-sm text-sky-500 border-b pb-1 mb-3">2. Academic Portfolio</h4>
                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-slate-400 uppercase font-bold text-[9px] block">CGPA Index</span>
                        <span className="font-semibold block mt-0.5 text-indigo-500">{selectedStudent.cgpa} / 10.0</span>
                      </div>
                      <div>
                        <span className="text-slate-400 uppercase font-bold text-[9px] block">Skills Stack</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {selectedStudent.skills.map((s, i) => (
                            <span key={i} className="bg-sky-500/10 text-sky-500 text-[10px] px-2 py-0.5 rounded-lg font-semibold">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-slate-400 uppercase font-bold text-[9px] block">GitHub Repository link</span>
                          <a href={selectedStudent.github} target="_blank" rel="noreferrer" className="text-sky-500 hover:underline block mt-0.5 truncate">{selectedStudent.github || 'N/A'}</a>
                        </div>
                        <div>
                          <span className="text-slate-400 uppercase font-bold text-[9px] block">LinkedIn URL</span>
                          <a href={selectedStudent.linkedin} target="_blank" rel="noreferrer" className="text-sky-500 hover:underline block mt-0.5 truncate">{selectedStudent.linkedin || 'N/A'}</a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* project details */}
                  <div>
                    <h4 className="font-bold text-sm text-sky-500 border-b pb-1 mb-3">3. Allocated Project Information</h4>
                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-slate-400 uppercase font-bold text-[9px] block">Allocated Project Title</span>
                        <span className="font-semibold block mt-0.5 text-indigo-500">{selectedStudent.project_title}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-slate-400 uppercase font-bold text-[9px] block">Domain Area</span>
                          <span className="font-semibold block mt-0.5">{selectedStudent.domain || 'Blockchain'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 uppercase font-bold text-[9px] block">Project Progress</span>
                          <span className="font-semibold block mt-0.5 text-emerald-500">{selectedStudent.progress}% Completed</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t mt-6 flex justify-end space-x-3">
                  <button onClick={() => setSelectedStudent(null)} className="py-2 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350">
                    Close Drawer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. EVALUATION HUB */}
      {activeTab === 'evaluations' && (
        <div className="space-y-8 animate-fade-in">
          {/* Abstract Evaluator SubSection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card title="Abstract reviews Evaluation Panel">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Select Project Abstract</label>
                  <select
                    value={selectedEvalProj ? selectedEvalProj.id : ''}
                    onChange={e => {
                      const proj = pendingProjects.find(p => p.id === parseInt(e.target.value));
                      setSelectedEvalProj(proj || null);
                      setAbstractForm({ status: 'approved', marks: proj?.marks || 8, remarks: '' });
                      setAiAbstractEval(null);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                  >
                    <option value="">Select proposed abstract...</option>
                    {pendingProjects.map(p => (
                      <option key={p.id} value={p.id}>{p.title} (Student: {p.student?.user?.name})</option>
                    ))}
                  </select>
                </div>

                {selectedEvalProj && (
                  <div className="space-y-4 pt-3 border-t">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs leading-relaxed">
                      <span className="font-extrabold uppercase text-[9px] text-slate-400 block mb-1">Student abstract text:</span>
                      {selectedEvalProj.abstract}
                    </div>

                    <div className="flex space-x-3 items-center">
                      <button 
                        type="button" 
                        onClick={handleAIAbstractCheck}
                        disabled={evaluatingAI}
                        className="py-2 px-4 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-xl text-[10px] font-extrabold flex items-center space-x-1.5 shadow-sm"
                      >
                        <Sparkles size={12} className={evaluatingAI ? "animate-spin" : ""} />
                        <span>AI Suggest Abstract Grading</span>
                      </button>
                    </div>

                    {aiAbstractEval && (
                      <div className="p-4 bg-sky-500/5 border border-sky-500/10 rounded-2xl text-xs space-y-2">
                        <span className="font-bold text-sky-500 block">AI Quality metrics scorecard:</span>
                        <div className="grid grid-cols-5 gap-2 text-center font-bold">
                          <div className="p-2 bg-white dark:bg-slate-900 border rounded-xl">
                            <span className="text-[8px] text-slate-400 block">Clarity</span>
                            {aiAbstractEval.clarity}/10
                          </div>
                          <div className="p-2 bg-white dark:bg-slate-900 border rounded-xl">
                            <span className="text-[8px] text-slate-400 block">Novelty</span>
                            {aiAbstractEval.novelty}/10
                          </div>
                          <div className="p-2 bg-white dark:bg-slate-900 border rounded-xl">
                            <span className="text-[8px] text-slate-400 block">Scope</span>
                            {aiAbstractEval.scope}/10
                          </div>
                          <div className="p-2 bg-white dark:bg-slate-900 border rounded-xl">
                            <span className="text-[8px] text-slate-400 block">Feasibility</span>
                            {aiAbstractEval.feasibility}/10
                          </div>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleSubmitAbstractReview} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Marks (0-10)</label>
                          <input
                            type="number"
                            min={0}
                            max={10}
                            required
                            value={abstractForm.marks}
                            onChange={e => setAbstractForm({...abstractForm, marks: parseInt(e.target.value) || 0})}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Status</label>
                          <select
                            value={abstractForm.status}
                            onChange={e => setAbstractForm({...abstractForm, status: e.target.value})}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                          >
                            <option value="approved">Approve Abstract</option>
                            <option value="revision_requested">Request Revision</option>
                            <option value="rejected">Reject Proposal</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Reviewer Remarks</label>
                        <textarea
                          rows={3}
                          required
                          value={abstractForm.remarks}
                          onChange={e => setAbstractForm({...abstractForm, remarks: e.target.value})}
                          placeholder="Provide objectives details recommendations..."
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                        />
                      </div>
                      <button type="submit" className="py-2 px-5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold">
                        Save Evaluation
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </Card>

            {/* Synopsis Review */}
            <Card title="Detailed Synopsis Review Portal" subtitle="Problem statement, Methodology, and Literature survey evaluation.">
              <form onSubmit={handleSynopsisReview} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Select Project</label>
                  <select
                    required
                    value={synopsisForm.project_id}
                    onChange={e => setSynopsisForm({...synopsisForm, project_id: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                  >
                    <option value="">Select project...</option>
                    {students.map(s => s.projects?.[0] && (
                      <option key={s.projects[0].id} value={s.projects[0].id}>{s.projects[0].title}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Problem Definition Statement</label>
                    <textarea rows={2} value={synopsisForm.problem_statement} onChange={e => setSynopsisForm({...synopsisForm, problem_statement: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Literature Survey Coverage</label>
                    <textarea rows={2} value={synopsisForm.literature_survey} onChange={e => setSynopsisForm({...synopsisForm, literature_survey: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Proposed Methodology</label>
                    <textarea rows={2} value={synopsisForm.proposed_methodology} onChange={e => setSynopsisForm({...synopsisForm, proposed_methodology: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Expected Outcomes</label>
                    <textarea rows={2} value={synopsisForm.expected_outcomes} onChange={e => setSynopsisForm({...synopsisForm, expected_outcomes: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Status</label>
                    <select value={synopsisForm.status} onChange={e => setSynopsisForm({...synopsisForm, status: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs">
                      <option value="approved">Approve Synopsis</option>
                      <option value="revision_requested">Revision required</option>
                      <option value="rejected">Reject Synopsis</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Remarks</label>
                    <textarea rows={2} value={synopsisForm.remarks} onChange={e => setSynopsisForm({...synopsisForm, remarks: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs" />
                  </div>
                </div>
                <button type="submit" className="py-2 px-5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold">
                  Submit Synopsis Review
                </button>
              </form>
            </Card>
          </div>

          {/* Weekly logs evaluator */}
          <Card title="Weekly Progress Logs Verification" subtitle="Approve weekly work done percentage and hours logged.">
            <div className="space-y-6">
              {students.some(s => s.projects?.[0]?.progress_updates?.length > 0) ? (
                students.map(s => s.projects?.[0]?.progress_updates?.map(up => (
                  <div key={up.id} className="p-4 border rounded-xl flex items-center justify-between bg-slate-50/20 dark:bg-slate-900/10">
                    <div className="space-y-1">
                      <span className="font-extrabold text-xs text-sky-500">Student: {s.user.name} • Week {up.week_number}</span>
                      <p className="text-xs">{up.work_done}</p>
                      <span className="text-[10px] text-slate-400 block">
                        Hours Logged: {up.hours_worked} hrs • Progress Increment: {up.progress_percentage}% • Challenges: {up.challenges || 'None'}
                      </span>
                    </div>

                    <form onSubmit={handleWeeklyReviewSubmit} className="flex items-center space-x-2">
                      <input type="hidden" value={up.id} />
                      <select
                        required
                        value={weeklyReviewForm.progress_update_id === String(up.id) ? weeklyReviewForm.status : 'approved'}
                        onChange={e => setWeeklyReviewForm({
                          progress_update_id: String(up.id),
                          status: e.target.value,
                          feedback: weeklyReviewForm.feedback
                        })}
                        className="px-2 py-1.5 bg-white dark:bg-slate-800 border rounded-lg text-xs"
                      >
                        <option value="approved">Approve Log</option>
                        <option value="rejected">Reject Log</option>
                        <option value="revision_requested">Revision Request</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Feedback note..."
                        value={weeklyReviewForm.progress_update_id === String(up.id) ? weeklyReviewForm.feedback : ''}
                        onChange={e => setWeeklyReviewForm({
                          progress_update_id: String(up.id),
                          status: weeklyReviewForm.status || 'approved',
                          feedback: e.target.value
                        })}
                        className="px-2 py-1.5 bg-white dark:bg-slate-800 border rounded-lg text-xs w-48 focus:outline-none"
                      />
                      <button type="submit" onClick={() => setWeeklyReviewForm({...weeklyReviewForm, progress_update_id: String(up.id)})} className="py-1.5 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-[10px] font-bold">
                        Verify
                      </button>
                    </form>
                  </div>
                )))
              ) : (
                <p className="text-xs text-slate-500 italic text-center py-6">No weekly logs submitted by mentees yet.</p>
              )}
            </div>
          </Card>

          {/* Project Report reviews & Plagiarism checks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Project reports review */}
            <Card title="Project Documents & Reports Review Board" subtitle="SRS, Design docs, Final reviews, PPTs and Poster check.">
              <form onSubmit={handleReportReviewSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Select Project</label>
                    <select
                      required
                      value={reportReviewForm.project_id}
                      onChange={e => setReportReviewForm({...reportReviewForm, project_id: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                    >
                      <option value="">Select project...</option>
                      {students.map(s => s.projects?.[0] && (
                        <option key={s.projects[0].id} value={s.projects[0].id}>{s.projects[0].title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Document Type</label>
                    <select
                      value={reportReviewForm.report_type}
                      onChange={e => setReportReviewForm({...reportReviewForm, report_type: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                    >
                      <option value="srs">SRS Report</option>
                      <option value="design_document">Design Document</option>
                      <option value="mid_review">Mid Review Report</option>
                      <option value="final_report">Final Report</option>
                      <option value="ppt">PPT Presentation</option>
                      <option value="poster">Project Poster</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-3 items-center">
                  <button
                    type="button"
                    onClick={handleAIReportCheck}
                    className="py-2 px-4 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-xl text-[10px] font-extrabold flex items-center space-x-1.5"
                  >
                    <Sparkles size={12} />
                    <span>Run AI Structural Check</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Status</label>
                    <select
                      value={reportReviewForm.status}
                      onChange={e => setReportReviewForm({...reportReviewForm, status: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                    >
                      <option value="approved">Approve Document</option>
                      <option value="revision_requested">Revision Required</option>
                      <option value="rejected">Reject</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Add PDF annotations / markup notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Page 4 header format typo"
                      value={reportReviewForm.annotations}
                      onChange={e => setReportReviewForm({...reportReviewForm, annotations: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Review Feedback comments</label>
                  <textarea
                    rows={4}
                    value={reportReviewForm.feedback}
                    onChange={e => setReportReviewForm({...reportReviewForm, feedback: e.target.value})}
                    placeholder="Enter manual remarks..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                  />
                </div>

                <button type="submit" className="py-2 px-5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold">
                  Submit Document Grade
                </button>
              </form>
            </Card>

            {/* Plagiarism and code checks */}
            <Card title="Plagiarism Scan & Code Check Portal" subtitle="Scans deliverable reports similarity index using algorithms.">
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Run Plagiarism Check</label>
                  <div className="flex space-x-3 items-center">
                    <select
                      id="plag_select"
                      className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs flex-1"
                    >
                      <option value="">Select project...</option>
                      {students.map(s => s.projects?.[0] && (
                        <option key={s.projects[0].id} value={s.projects[0].id}>{s.projects[0].title}</option>
                      ))}
                    </select>
                    <button 
                      onClick={() => {
                        const el = document.getElementById("plag_select");
                        if (el && el.value) {
                          handlePlagiarismCheck(el.value);
                        } else {
                          showError("Please select a project first.");
                        }
                      }}
                      className="py-2 px-4 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl text-[10px]"
                    >
                      Scan Similarity
                    </button>
                  </div>
                </div>

                {plagiarismResult && (
                  <div className="p-5 border rounded-2xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 space-y-3 leading-relaxed">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-xs">Similarity Score:</span>
                      <span className={`text-sm ${plagiarismResult.similarity_percentage > 20.0 ? 'text-rose-500':'text-emerald-500'}`}>{plagiarismResult.similarity_percentage}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">AI-Generated Content Detection:</span>
                      <span className="font-semibold">{plagiarismResult.ai_content_percentage}% content detected as AI written</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase font-semibold">Matched Sources:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {plagiarismResult.sources.map((s,i) => (
                          <span key={i} className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px]">{s}</span>
                        ))}
                      </div>
                    </div>
                    <div className="p-3.5 bg-sky-500/5 border border-sky-500/10 rounded-xl">
                      <span className="font-bold text-sky-500 text-[10px] uppercase block mb-1">AI Explanation & Suggestions:</span>
                      <p className="text-[11px] text-slate-655 dark:text-slate-355">{plagiarismResult.ai_summary}</p>
                    </div>
                    <div className="flex space-x-2 pt-2">
                      <button onClick={() => showSuccess("Similarity approved.")} className="py-2 px-3 bg-emerald-500 text-white rounded-lg text-[9px] font-bold">
                        Approve Similarity
                      </button>
                      <button onClick={() => showSuccess("Resubmission requested.")} className="py-2 px-3 bg-rose-500 text-white rounded-lg text-[9px] font-bold">
                        Request Resubmission
                      </button>
                    </div>
                  </div>
                )}

                {/* Git metrics and Code explorer */}
                <div className="pt-4 border-t space-y-4">
                  <h5 className="font-bold text-xs text-slate-700 dark:text-slate-350">GitHub Repository & Code explorer</h5>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold block">anshultickoo/smart-attendance-ai</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Commits: 65 • Issues: 3 • Active branch: main</span>
                      </div>
                      <a href="https://github.com" target="_blank" rel="noreferrer" className="py-1 px-3 bg-slate-800 dark:bg-slate-200 dark:text-slate-900 text-white rounded-lg font-bold text-[9px]">
                        Open Repo
                      </a>
                    </div>
                    
                    {/* Code explorer structure mock */}
                    <div className="bg-white dark:bg-slate-950 p-3 rounded-lg border font-mono text-[10px] space-y-1">
                      <span className="text-slate-400 font-bold block pb-1">Codebase file structure:</span>
                      <div className="pl-2">📂 src/</div>
                      <div className="pl-4">📂 components/</div>
                      <div className="pl-6 text-slate-500">📄 Navbar.jsx (2.4 KB)</div>
                      <div className="pl-6 text-slate-500">📄 Dashboard.jsx (12.8 KB)</div>
                      <div className="pl-4 text-slate-500">📄 App.jsx (1.2 KB)</div>
                      <div className="pl-2 text-slate-500">📄 package.json (820 B)</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 6. RUBRICS EVALUATION */}
      {activeTab === 'rubrics' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          <div className="lg:col-span-2 space-y-8">
            <Card title="Rubric Scorecard marks allocation (out of 90)" subtitle="Problem definition, literature survey, Innovation, Design, Coding, Testing, presentation, and viva.">
              <form onSubmit={handleRubricSubmit} className="space-y-5 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Select Student</label>
                    <select
                      required
                      value={rubricForm.student_id}
                      onChange={e => {
                        const s = students.find(stud => stud.id === parseInt(e.target.value));
                        setRubricForm({
                          ...rubricForm,
                          student_id: e.target.value,
                          project_id: s?.projects?.[0]?.id || ''
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs"
                    >
                      <option value="">Select student...</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.roll_number})</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAIRubricMarksRecommend}
                      disabled={evaluatingAI}
                      className="w-full py-2 px-4 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-xl font-bold flex items-center justify-center space-x-1.5"
                    >
                      <Sparkles size={12} className={evaluatingAI ? "animate-spin":""} />
                      <span>AI Recommend Rubric Scores</span>
                    </button>
                  </div>
                </div>

                {/* 6 Rubrics Groups (R1 to R6) */}
                <div className="space-y-6">
                  {[
                    {
                      title: "Semester VII Rubrics (Sessional Max: 50 Marks)",
                      rubrics: [
                        {
                          id: "R1",
                          title: "R1 - Project Proposal Evaluation",
                          criteria: [
                            { key: "r1_c1", label: "C1: Proposal Relevance, Need and Purpose" },
                            { key: "r1_c2", label: "C2: Literature Review Quality" },
                            { key: "r1_c3", label: "C3: Specifications, Constraints & Feasibility" },
                            { key: "r1_c4", label: "C4: Cost Analysis (Estimated Cost)" }
                          ]
                        },
                        {
                          id: "R2",
                          title: "R2 - Project Design & Engineering Tools",
                          criteria: [
                            { key: "r2_c1", label: "C1: Proposed Methodology & Design Layout" },
                            { key: "r2_c2", label: "C2: Technical Knowledge & Project Awareness" },
                            { key: "r2_c3", label: "C3: Communication (Written/Oral/Presentation)" }
                          ]
                        }
                      ]
                    },
                    {
                      title: "Semester VIII Rubrics (Sessional Max: 100 Marks)",
                      rubrics: [
                        {
                          id: "R3",
                          title: "R3 - First Project Review",
                          criteria: [
                            { key: "r3_c1", label: "C1: Review of Design Methodology Used" },
                            { key: "r3_c2", label: "C2: Project Management & Planning Skills" },
                            { key: "r3_c3", label: "C3: Demonstration & Technical Presentation" },
                            { key: "r3_c4", label: "C4: Teamwork & Individual Contribution" }
                          ]
                        },
                        {
                          id: "R4",
                          title: "R4 - Final Project Review & Evaluation",
                          criteria: [
                            { key: "r4_c1", label: "C1: Incorporation of Suggestions" },
                            { key: "r4_c2", label: "C2: Project Implementation & Demonstration" },
                            { key: "r4_c3", label: "C3: Problem Analysis & Remedial Actions" },
                            { key: "r4_c4", label: "C4: Impact on Society & Environment" }
                          ]
                        },
                        {
                          id: "R5",
                          title: "R5 - Project Report Review",
                          criteria: [
                            { key: "r5_c1", label: "C1: Organization of Report" },
                            { key: "r5_c2", label: "C2: Figures, Formatting, Diagrams & Mathematics" },
                            { key: "r5_c3", label: "C3: Description of Concepts & Technical Details" },
                            { key: "r5_c4", label: "C4: Discussions and Conclusions" },
                            { key: "r5_c5", label: "C5: Bibliography & Reference List" },
                            { key: "r5_c6", label: "C6: Originality and Plagiarism Check" }
                          ]
                        },
                        {
                          id: "R6",
                          title: "R6 - Review by the Guide",
                          criteria: [
                            { key: "r6_c1", label: "C1: Positive Attitude, Commitment & Teamwork" },
                            { key: "r6_c2", label: "C2: Technical Knowledge & Awareness" },
                            { key: "r6_c3", label: "C3: Regularity and Attendance" }
                          ]
                        }
                      ]
                    }
                  ].map((group, gIdx) => (
                    <div key={gIdx} className="space-y-4 border-t pt-4">
                      <h4 className="font-extrabold text-sm text-sky-500 tracking-wide uppercase">{group.title}</h4>
                      <div className="space-y-4">
                        {group.rubrics.map((rubric) => (
                          <div key={rubric.id} className="bg-slate-50 dark:bg-slate-900/60 p-4 border rounded-2xl space-y-3">
                            <span className="font-bold text-xs text-slate-700 dark:text-slate-200 block">{rubric.title}</span>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {rubric.criteria.map((c) => (
                                <div key={c.key} className="space-y-1">
                                  <label className="block text-[10px] text-slate-500 font-bold uppercase">{c.label}</label>
                                  <select
                                    value={rubricForm[c.key]}
                                    onChange={e => setRubricForm({...rubricForm, [c.key]: parseInt(e.target.value) || 0})}
                                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500"
                                  >
                                    <option value="4">4 - Exceeds Expectations</option>
                                    <option value="3">3 - Adequately Meets Expectations</option>
                                    <option value="2">2 - Minimally Meets Expectations</option>
                                    <option value="1">1 - Fails to Meet Expectation</option>
                                  </select>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-sky-500/5 dark:bg-sky-500/10 p-5 rounded-3xl border border-sky-500/20 space-y-2">
                  <span className="font-extrabold text-xs text-sky-500 uppercase tracking-wider block">Evaluation Sessional Marks Scorecard</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold leading-normal">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase">Sem VII points</span>
                      <span>{rubricForm.r1_c1 + rubricForm.r1_c2 + rubricForm.r1_c3 + rubricForm.r1_c4 + rubricForm.r2_c1 + rubricForm.r2_c2 + rubricForm.r2_c3} / 28 pts</span>
                      <span className="text-sky-500 block text-[10px] mt-0.5">Sessional: {Math.round(((rubricForm.r1_c1 + rubricForm.r1_c2 + rubricForm.r1_c3 + rubricForm.r1_c4 + rubricForm.r2_c1 + rubricForm.r2_c2 + rubricForm.r2_c3) / 28) * 50)} / 50 M</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase">Sem VIII points</span>
                      <span>{rubricForm.r3_c1 + rubricForm.r3_c2 + rubricForm.r3_c3 + rubricForm.r3_c4 + rubricForm.r4_c1 + rubricForm.r4_c2 + rubricForm.r4_c3 + rubricForm.r4_c4 + rubricForm.r5_c1 + rubricForm.r5_c2 + rubricForm.r5_c3 + rubricForm.r5_c4 + rubricForm.r5_c5 + rubricForm.r5_c6 + rubricForm.r6_c1 + rubricForm.r6_c2 + rubricForm.r6_c3} / 68 pts</span>
                      <span className="text-sky-500 block text-[10px] mt-0.5">Sessional: {Math.round(((rubricForm.r3_c1 + rubricForm.r3_c2 + rubricForm.r3_c3 + rubricForm.r3_c4 + rubricForm.r4_c1 + rubricForm.r4_c2 + rubricForm.r4_c3 + rubricForm.r4_c4 + rubricForm.r5_c1 + rubricForm.r5_c2 + rubricForm.r5_c3 + rubricForm.r5_c4 + rubricForm.r5_c5 + rubricForm.r5_c6 + rubricForm.r6_c1 + rubricForm.r6_c2 + rubricForm.r6_c3) / 68) * 100)} / 100 M</span>
                    </div>
                    <div className="border-l pl-4 border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block text-[9px] uppercase">Total Sessional Marks</span>
                      <span className="text-sm font-extrabold text-indigo-500 block mt-0.5">
                        {Math.round(((rubricForm.r1_c1 + rubricForm.r1_c2 + rubricForm.r1_c3 + rubricForm.r1_c4 + rubricForm.r2_c1 + rubricForm.r2_c2 + rubricForm.r2_c3) / 28) * 50) + Math.round(((rubricForm.r3_c1 + rubricForm.r3_c2 + rubricForm.r3_c3 + rubricForm.r3_c4 + rubricForm.r4_c1 + rubricForm.r4_c2 + rubricForm.r4_c3 + rubricForm.r4_c4 + rubricForm.r5_c1 + rubricForm.r5_c2 + rubricForm.r5_c3 + rubricForm.r5_c4 + rubricForm.r5_c5 + rubricForm.r5_c6 + rubricForm.r6_c1 + rubricForm.r6_c2 + rubricForm.r6_c3) / 68) * 100)} / 150 Marks
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Evaluator Remarks</label>
                  <input
                    type="text"
                    required
                    value={rubricForm.remarks}
                    onChange={e => setRubricForm({...rubricForm, remarks: e.target.value})}
                    placeholder="Enter manual evaluator notes..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <button type="submit" className="py-2.5 px-6 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-sm transition-colors">
                  Log Rubric Marks Scorecard (out of 150)
                </button>
              </form>
            </Card>
          </div>

          <div>
            <Card title="Class Marks spread distribution">
              <div className="h-[250px] flex items-center justify-center">
                {students.some(s => s.projects?.[0]?.marks) ? (
                  <Doughnut
                    data={{
                      labels: ['Excellent (>=8)', 'Satisfactory (6-7)', 'Needs Work (<6)'],
                      datasets: [{
                        data: [
                          students.filter(s => s.projects?.[0]?.marks >= 8).length,
                          students.filter(s => s.projects?.[0]?.marks >= 6 && s.projects?.[0]?.marks < 8).length,
                          students.filter(s => s.projects?.[0]?.marks < 6).length
                        ],
                        backgroundColor: ['rgba(16, 185, 129, 0.6)', 'rgba(245, 158, 11, 0.6)', 'rgba(239, 68, 68, 0.6)']
                      }]
                    }}
                  />
                ) : (
                  <span className="text-xs text-slate-450 italic">No marks logged to chart yet.</span>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 6. MILESTONE DEADLINES & TASK MANAGEMENT */}
      {activeTab === 'deadlines' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in text-slate-800 dark:text-slate-100">
          {/* Left panel: Add/Edit Milestone Form */}
          <div className="lg:col-span-1">
            <Card 
              title={editingMilestoneId ? "Edit Milestone / Deadline" : "Define New Milestone / Task"} 
              subtitle="Establish deadlines and expectations for mentees."
            >
              <form onSubmit={handleMilestoneFormSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">Select Student Project *</label>
                  <select
                    required
                    value={selectedMilestoneProjectId}
                    onChange={e => {
                      setSelectedMilestoneProjectId(e.target.value);
                      setEditingMilestoneId(null);
                      setTeacherMilestoneForm({
                        title: '',
                        description: '',
                        deadline: '',
                        max_marks: 20,
                        status: 'pending',
                        marks: 0,
                        feedback: ''
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
                  >
                    <option value="">Select a student project...</option>
                    {students.map(s => {
                      const proj = s.projects?.[0];
                      if (!proj) return null;
                      return (
                        <option key={proj.id} value={proj.id}>
                          {s.name} - {proj.title}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">Milestone Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Database normalizations SRS"
                    value={teacherMilestoneForm.title}
                    onChange={e => setTeacherMilestoneForm({...teacherMilestoneForm, title: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">Task Description</label>
                  <textarea
                    rows={3}
                    placeholder="Details about expected deliverables, architectures..."
                    value={teacherMilestoneForm.description}
                    onChange={e => setTeacherMilestoneForm({...teacherMilestoneForm, description: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">Target Deadline *</label>
                    <input
                      type="date"
                      required
                      value={teacherMilestoneForm.deadline}
                      onChange={e => setTeacherMilestoneForm({...teacherMilestoneForm, deadline: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">Max Marks *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={teacherMilestoneForm.max_marks}
                      onChange={e => setTeacherMilestoneForm({...teacherMilestoneForm, max_marks: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                {editingMilestoneId && (
                  <div className="border-t pt-4 space-y-4">
                    <span className="text-[10px] font-bold text-sky-500 uppercase block tracking-wider">Evaluation & Sign-off</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">Status</label>
                        <select
                          value={teacherMilestoneForm.status}
                          onChange={e => setTeacherMilestoneForm({...teacherMilestoneForm, status: e.target.value})}
                          className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed / Approved</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">Marks Awarded</label>
                        <input
                          type="number"
                          min={0}
                          max={teacherMilestoneForm.max_marks}
                          value={teacherMilestoneForm.marks}
                          onChange={e => setTeacherMilestoneForm({...teacherMilestoneForm, marks: parseInt(e.target.value) || 0})}
                          className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">Feedback Remarks</label>
                      <input
                        type="text"
                        placeholder="Great implementation..."
                        value={teacherMilestoneForm.feedback}
                        onChange={e => setTeacherMilestoneForm({...teacherMilestoneForm, feedback: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>
                )}

                <div className="flex space-x-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
                  >
                    {editingMilestoneId ? "Update Milestone" : "Define Milestone"}
                  </button>
                  {editingMilestoneId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMilestoneId(null);
                        setTeacherMilestoneForm({
                          title: '',
                          description: '',
                          deadline: '',
                          max_marks: 20,
                          status: 'pending',
                          marks: 0,
                          feedback: ''
                        });
                      }}
                      className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-205 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </Card>
          </div>

          {/* Right panel: Active Milestones list */}
          <div className="lg:col-span-2 space-y-6">
            <Card 
              title="Active Mentees Project Milestones & Tasks" 
              subtitle="Current logged milestones checklist and deadline schedule."
            >
              {!selectedMilestoneProjectId ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500 italic text-xs">
                  Please select a student project from the left form to view or configure milestones.
                </div>
              ) : teacherMilestones.length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500 italic text-xs">
                  No milestones defined for this project yet. Use the left form to add one.
                </div>
              ) : (
                <div className="overflow-x-auto text-xs leading-normal">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b bg-slate-50 dark:bg-slate-800/40 text-[9px] uppercase tracking-wider font-extrabold text-slate-400">
                        <th className="py-2 px-3">Milestone Title & Description</th>
                        <th className="py-2 px-3 text-center">Deadline</th>
                        <th className="py-2 px-3 text-center">Status</th>
                        <th className="py-2 px-3 text-center">Evaluation Score</th>
                        <th className="py-2 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {teacherMilestones.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">{m.title}</span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">{m.description || "No description provided."}</span>
                            {m.feedback && (
                              <span className="text-[10px] italic text-sky-500 block mt-1">Feedback: "{m.feedback}"</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-slate-650 dark:text-slate-300">
                            {m.deadline || "No Deadline"}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                              m.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                              m.status === 'in_progress' ? 'bg-sky-500/10 text-sky-500' : 'bg-amber-500/10 text-amber-500'
                            }`}>
                              {m.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-bold">
                            {m.status === 'completed' ? (
                              <span className="text-emerald-500">{m.marks} / {m.max_marks}</span>
                            ) : (
                              <span className="text-slate-400">Pending / {m.max_marks}</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right space-x-2">
                            <button
                              onClick={() => handleStartEditMilestone(m)}
                              className="text-sky-500 hover:text-sky-600 font-bold"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteMilestone(m.id)}
                              className="text-rose-500 hover:text-rose-600 font-bold"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* 7. CHAT & MESSAGE FORUM */}
      {activeTab === 'discussion' && (
        <Card title="Mentorship direct communication panel" subtitle="Communicate and reply to your assigned project groups." className="animate-fade-in">
          <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden h-[500px]">
            {/* Left Contact List */}
            <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
              <div className="p-4 border-b bg-slate-50/40 dark:bg-slate-800/20 space-y-1">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-400 block">Your Mentees</span>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {students.length === 0 ? (
                  <p className="p-6 text-center text-xs text-slate-500">No mentees found.</p>
                ) : (
                  students.map(s => {
                    const thread = chatThreads.find(t => t.id === s.user?.id);
                    const isActive = activeContact?.id === s.user?.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => {
                          const contact = { id: s.user?.id, name: s.user?.name || s.name, role: 'student' };
                          setActiveContact(contact);
                          chatAPI.getHistory(contact.id).then(setChatHistory);
                        }}
                        className={`w-full p-4 flex items-center space-x-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30 ${
                          isActive ? 'bg-sky-500/5 dark:bg-sky-500/10 border-l-4 border-sky-500' : ''
                        }`}
                      >
                        <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-sky-500 text-xs shrink-0 border">
                          {(s.user?.name || s.name || 'S').charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-xs text-slate-850 dark:text-slate-100 truncate">{s.user?.name || s.name}</span>
                          </div>
                          <p className="text-[10px] text-slate-550 truncate mt-0.5">
                            {thread ? thread.last_message : 'Start discussion sync...'}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right message log */}
            <div className="flex-1 flex flex-col bg-slate-50/20 dark:bg-slate-950/10">
              {activeContact ? (
                <>
                  <div className="p-4 border-b flex items-center space-x-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-850">
                    <div className="w-8 h-8 rounded-full bg-sky-500 text-white font-bold flex items-center justify-center text-xs">
                      {activeContact.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-855 dark:text-slate-100">{activeContact.name}</h4>
                      <span className="text-[9px] text-slate-400 font-semibold uppercase block">Mentee chat Sync</span>
                    </div>
                  </div>

                  <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    {chatHistory.map(msg => {
                      const isOwn = msg.sender_id === user.id;
                      return (
                        <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] p-3 rounded-2xl text-xs leading-normal shadow-sm ${
                            isOwn 
                              ? 'bg-sky-500 text-white rounded-tr-none' 
                              : 'bg-white dark:bg-slate-900 border rounded-tl-none text-slate-800 dark:text-slate-200'
                          }`}>
                            <p>{msg.message}</p>
                            <span className={`text-[8px] block text-right mt-1 ${isOwn ? 'text-white/60':'text-slate-400'}`}>
                              {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatMessagesEndRef} />
                  </div>

                  <form onSubmit={handleSendChatMessage} className="p-3 border-t bg-white dark:bg-slate-900 flex items-center space-x-2 border-slate-200 dark:border-slate-800">
                    <input
                      type="text"
                      value={chatText}
                      onChange={(e) => setChatText(e.target.value)}
                      placeholder="Send message to mentee..."
                      className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs focus:outline-none"
                    />
                    <button type="submit" className="p-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl transition-all">
                      <Send size={14} />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
                  <MessageSquare size={32} className="mb-2 text-slate-400" />
                  <p className="text-xs font-semibold">Select a student contact from the list to start sync.</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* 8. CALENDAR */}
      {activeTab === 'calendar' && (
        <Card title="Faculty Academic Calendar Scheduler" subtitle="Track upcoming reviews deadlines and student meetings." className="animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-slate-50/50 dark:bg-slate-900/40 p-6 border rounded-2xl">
              <span className="font-bold text-xs uppercase text-slate-400 block mb-4">Sync Planner Calendar</span>
              {/* Render interactive simple calendar list */}
              <div className="grid grid-cols-7 gap-2 text-center text-xs border-b pb-2 font-bold mb-2">
                <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
              </div>
              <div className="grid grid-cols-7 gap-2 text-center text-xs h-60">
                {Array.from({ length: 30 }).map((_, idx) => {
                  const day = idx + 1;
                  const hasMeeting = meetings.some(m => new Date(m.scheduled_at).getDate() === day);
                  return (
                    <div key={idx} className={`p-2 border rounded-xl flex flex-col justify-between items-center ${hasMeeting ? 'bg-sky-500/10 text-sky-500 border-sky-500/20 font-bold':''}`}>
                      <span>{day}</span>
                      {hasMeeting && <span className="w-1.5 h-1.5 bg-sky-500 rounded-full"></span>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="font-bold text-xs uppercase text-slate-400 block mb-4">Meetings Sync List</span>
              <div className="space-y-3">
                {meetings.map(meet => (
                  <div key={meet.id} className="p-3 bg-white dark:bg-slate-900 border rounded-xl text-xs space-y-1.5">
                    <div className="flex justify-between items-start font-bold">
                      <span>{meet.title}</span>
                      <span className="bg-sky-500/10 text-sky-500 px-1.5 py-0.5 rounded text-[8px] uppercase">{meet.status}</span>
                    </div>
                    <p className="text-slate-500">{meet.description}</p>
                    <span className="text-[10px] text-slate-400 block">
                      {new Date(meet.scheduled_at).toLocaleString()} ({meet.duration_minutes} mins)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 9. EXPORTS */}
      {activeTab === 'exports' && (
        <Card title="Faculty Excel / CSV Reports Generator" subtitle="Export student progress evaluations or rubrics checklist." className="animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { type: 'marks', title: 'Rubric Scorecard CSV Report', desc: 'Grade spreads, innovative metrics, design presentation, and total viva marks.' },
              { type: 'students', title: 'Assigned Mentees CSV Registry', desc: 'Student academic cgpa, email credentials, roll codes, and skills stack details.' },
              { type: 'progress', title: 'Milestones Progress completion logs', desc: 'Weekly hour logs worked, status updates, completion rate, and latest logs.' }
            ].map((exp, i) => (
              <div key={i} className="p-6 bg-slate-50/50 dark:bg-slate-900/40 border rounded-2xl flex flex-col justify-between items-start space-y-4">
                <div>
                  <h5 className="font-bold text-sm">{exp.title}</h5>
                  <p className="text-xs text-slate-550 mt-1 leading-normal">{exp.desc}</p>
                </div>
                <a
                  href={teacherAPI.getExportUrl(exp.type)}
                  download
                  className="w-full text-center py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center space-x-1.5"
                >
                  <Download size={12} />
                  <span>Download CSV File</span>
                </a>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Schedule Session Modal */}
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

            <form onSubmit={handleScheduleMeeting} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Student Mentee</label>
                <select
                  required
                  value={meetingForm.student_id}
                  onChange={(e) => setMeetingForm({ ...meetingForm, student_id: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-55 dark:bg-slate-800 border rounded-xl text-xs"
                >
                  <option value="">Select a student...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.roll_number})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Session Title</label>
                <input
                  type="text"
                  required
                  value={meetingForm.title}
                  onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                  placeholder="UI Sync / Code evaluation"
                  className="w-full px-4 py-2 bg-slate-55 dark:bg-slate-805 border rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Description</label>
                <textarea
                  value={meetingForm.description}
                  onChange={(e) => setMeetingForm({ ...meetingForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-55 dark:bg-slate-805 border rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={meetingForm.scheduled_at}
                    onChange={(e) => setMeetingForm({ ...meetingForm, scheduled_at: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-55 dark:bg-slate-805 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    min={10}
                    required
                    value={meetingForm.duration_minutes}
                    onChange={(e) => setMeetingForm({ ...meetingForm, duration_minutes: parseInt(e.target.value) || 30 })}
                    className="w-full px-4 py-2 bg-slate-55 dark:bg-slate-805 border rounded-xl text-xs"
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
