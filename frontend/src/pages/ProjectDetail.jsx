import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectAPI, aiAPI } from '../services/api';
import Card from '../components/Card';
import Timeline from '../components/Timeline';
import FileUpload from '../components/FileUpload';
import InteractiveTimeline from '../components/InteractiveTimeline';
import { 
  Github, 
  Globe, 
  Sparkles, 
  Award, 
  Plus, 
  AlertCircle,
  FileCheck,
  Trash2
} from 'lucide-react';

const ProjectDetail = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Milestones State
  const [milestones, setMilestones] = useState([]);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    description: '',
    deadline: '',
    status: 'pending',
    max_marks: 20
  });
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [milestoneEvalForm, setMilestoneEvalForm] = useState({
    status: 'pending',
    marks: '',
    feedback: ''
  });

  // Weekly progress update form
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [progressForm, setProgressForm] = useState({
    week_number: 1,
    work_done: '',
    progress_percentage: 20
  });

  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const fetchProjectDetails = async () => {
    try {
      const data = await projectAPI.getById(projectId);
      setProject(data);
      // Fetch milestones
      try {
        const miles = await projectAPI.getMilestones(projectId);
        setMilestones(miles);
      } catch (e) {
        console.error("Error loading milestones:", e);
      }
      // Auto-set week number based on current count
      if (data.progress_updates) {
        setProgressForm(prev => ({
          ...prev,
          week_number: data.progress_updates.length + 1,
          progress_percentage: Math.min((data.progress_updates.length + 1) * 20, 100)
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    try {
      await projectAPI.createMilestone(projectId, {
        title: milestoneForm.title,
        description: milestoneForm.description,
        deadline: milestoneForm.deadline,
        status: milestoneForm.status,
        max_marks: parseInt(milestoneForm.max_marks) || 20
      });
      setMilestoneForm({ title: '', description: '', deadline: '', status: 'pending', max_marks: 20 });
      setShowMilestoneForm(false);
      // Reload milestones
      const miles = await projectAPI.getMilestones(projectId);
      setMilestones(miles);
    } catch (err) {
      console.error("Failed to add milestone:", err);
    }
  };

  const handleDeleteMilestone = async (milestoneId) => {
    if (!window.confirm("Are you sure you want to delete this milestone?")) return;
    try {
      await projectAPI.deleteMilestone(milestoneId);
      // Reload milestones
      const miles = await projectAPI.getMilestones(projectId);
      setMilestones(miles);
    } catch (err) {
      console.error("Failed to delete milestone:", err);
    }
  };

  useEffect(() => {
    if (editingMilestone) {
      setMilestoneEvalForm({
        status: editingMilestone.status || 'pending',
        marks: editingMilestone.marks !== null && editingMilestone.marks !== undefined ? editingMilestone.marks : '',
        feedback: editingMilestone.feedback || ''
      });
    }
  }, [editingMilestone]);

  const handleMilestoneEvalSubmit = async (e) => {
    e.preventDefault();
    if (!editingMilestone) return;
    try {
      await projectAPI.updateMilestone(editingMilestone.id, {
        title: editingMilestone.title,
        description: editingMilestone.description,
        deadline: editingMilestone.deadline,
        max_marks: editingMilestone.max_marks,
        status: milestoneEvalForm.status,
        marks: milestoneEvalForm.marks !== '' ? parseInt(milestoneEvalForm.marks) : null,
        feedback: milestoneEvalForm.feedback
      });
      setEditingMilestone(null);
      // Reload milestones
      const miles = await projectAPI.getMilestones(projectId);
      setMilestones(miles);
    } catch (err) {
      console.error("Failed to update milestone evaluation:", err);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  const handleProgressSubmit = async (e) => {
    e.preventDefault();
    try {
      await projectAPI.addProgress(projectId, progressForm);
      setShowProgressForm(false);
      setProgressForm(prev => ({
        ...prev,
        work_done: ''
      }));
      fetchProjectDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (file, fileType) => {
    try {
      await projectAPI.uploadFile(projectId, fileType, file);
      fetchProjectDetails();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const handleAIWeeklyGenerate = async () => {
    if (!progressForm.work_done.trim()) return;
    setAiGenerating(true);
    try {
      const response = await aiAPI.generateWeeklyReport(progressForm.work_done);
      setProgressForm(prev => ({ ...prev, work_done: response.summary }));
    } catch (err) {
      console.error(err);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleAISummarizeReport = async (file) => {
    setAiGenerating(true);
    try {
      const summary = await aiAPI.generateProjectSummary(project.title, file);
      setAiResult(summary);
      
      // Suggest updating project schema if desired
      await projectAPI.update(projectId, {
        abstract: summary.abstract,
        description: `Objectives:\n${summary.objectives.join('\n')}\n\nProblem Statement:\n${summary.problem_statement}\n\nFuture Scope:\n${summary.future_scope}`
      });
      fetchProjectDetails();
    } catch (err) {
      console.error(err);
    } finally {
      setAiGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-sky-500"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500">Project not found.</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      {/* Header Info */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between space-y-6 md:space-y-0">
        <div>
          <span className="text-[10px] bg-sky-500/10 text-sky-500 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
            {project.status.replace('_', ' ')}
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight mt-2">{project.title}</h2>
          <p className="text-xs text-slate-500 mt-1">Submitted by: {project.student.user.name} ({project.student.roll_number})</p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          {project.github_repo && (
            <a 
              href={project.github_repo} 
              target="_blank" 
              rel="noreferrer" 
              className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all"
            >
              <Github size={18} />
            </a>
          )}
          {project.live_url && (
            <a 
              href={project.live_url} 
              target="_blank" 
              rel="noreferrer" 
              className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all"
            >
              <Globe size={18} />
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Summary and Weekly Progress */}
        <div className="lg:col-span-2 space-y-8">
          <Card title="Project Abstract & Overview">
            <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed mb-6">
              {project.abstract || 'No abstract submission yet. Upload project report below to auto-generate abstract.'}
            </p>
            {project.technologies && (
              <div className="flex flex-wrap gap-1.5 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                {project.technologies.split(',').map((tech, idx) => (
                  <span key={idx} className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-[10px] font-semibold">
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </Card>

          {/* Interactive Project Timeline */}
          <InteractiveTimeline 
            projectId={projectId} 
            milestones={milestones} 
            userRole={user.role} 
            onUpdateMilestones={(miles) => setMilestones(miles)} 
          />

          {/* Project Milestones Lifecycle Card */}
          <Card 
            title="Project Milestones Lifecycle" 
            subtitle="Track deliverable schedules and evaluations."
            action={
              user.role === 'student' && (
                <button
                  onClick={() => setShowMilestoneForm(!showMilestoneForm)}
                  className="flex items-center space-x-1 py-1.5 px-3.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <Plus size={14} />
                  <span>Add Milestone</span>
                </button>
              )
            }
          >
            {showMilestoneForm && user.role === 'student' && (
              <form onSubmit={handleAddMilestone} className="mb-6 p-5 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Milestone Title</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Database Setup"
                      value={milestoneForm.title} 
                      onChange={e => setMilestoneForm({...milestoneForm, title: e.target.value})}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Description</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Deploy Postgres and configure schemas"
                      value={milestoneForm.description} 
                      onChange={e => setMilestoneForm({...milestoneForm, description: e.target.value})}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Target Date</label>
                    <input 
                      type="date" 
                      required
                      value={milestoneForm.deadline} 
                      onChange={e => setMilestoneForm({...milestoneForm, deadline: e.target.value})}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Max Marks</label>
                    <input 
                      type="number" 
                      required
                      value={milestoneForm.max_marks} 
                      onChange={e => setMilestoneForm({...milestoneForm, max_marks: e.target.value})}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Initial Status</label>
                    <select
                      value={milestoneForm.status}
                      onChange={e => setMilestoneForm({...milestoneForm, status: e.target.value})}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-2 bg-slate-900 hover:bg-slate-850 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  Create Milestone
                </button>
              </form>
            )}

            {editingMilestone && (
              <form onSubmit={handleMilestoneEvalSubmit} className="mb-6 p-5 border border-amber-500/20 bg-amber-550/5 dark:bg-amber-500/[0.02] rounded-2xl space-y-4 animate-fade-in">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">Evaluate Milestone: {editingMilestone.title}</h4>
                  <button type="button" onClick={() => setEditingMilestone(null)} className="text-xs text-slate-500 hover:underline">Cancel</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Status</label>
                    <select
                      value={milestoneEvalForm.status}
                      onChange={e => setMilestoneEvalForm({...milestoneEvalForm, status: e.target.value})}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Marks (Max: {editingMilestone.max_marks})</label>
                    <input 
                      type="number" 
                      min={0}
                      max={editingMilestone.max_marks}
                      placeholder="Enter marks"
                      value={milestoneEvalForm.marks} 
                      onChange={e => setMilestoneEvalForm({...milestoneEvalForm, marks: e.target.value})}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Feedback / Comments</label>
                  <textarea 
                    placeholder="Provide feedback..."
                    value={milestoneEvalForm.feedback} 
                    onChange={e => setMilestoneEvalForm({...milestoneEvalForm, feedback: e.target.value})}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                    rows={2}
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  Submit Milestone Evaluation
                </button>
              </form>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 uppercase font-semibold">
                    <th className="py-2 px-2">Milestone</th>
                    <th className="py-2 px-2">Description</th>
                    <th className="py-2 px-2">Target Date</th>
                    <th className="py-2 px-2">Status</th>
                    <th className="py-2 px-2">Score</th>
                    <th className="py-2 px-2">Comments</th>
                    {user.role === 'student' && <th className="py-2 px-2 text-right">Delete</th>}
                    {user.role === 'teacher' && <th className="py-2 px-2 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-850">
                  {milestones.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                      <td className="py-2.5 px-2 font-bold text-slate-800 dark:text-slate-100">{m.title}</td>
                      <td className="py-2.5 px-2 text-slate-550 dark:text-slate-400 max-w-[150px] truncate" title={m.description}>{m.description}</td>
                      <td className="py-2.5 px-2 text-slate-500 font-semibold">{m.deadline}</td>
                      <td className="py-2.5 px-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          m.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                          m.status === 'in_progress' ? 'bg-sky-500/10 text-sky-500' :
                          'bg-slate-200 text-slate-500 dark:bg-slate-800'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 font-extrabold text-indigo-500">{m.marks !== null ? `${m.marks} / ${m.max_marks}` : 'Awaiting'}</td>
                      <td className="py-2.5 px-2 text-slate-555 dark:text-slate-400 italic truncate max-w-[120px]" title={m.feedback || 'No comments'}>
                        "{m.feedback || 'No feedback yet'}"
                      </td>
                      {user.role === 'student' && (
                        <td className="py-2.5 px-2 text-right">
                          <button onClick={() => handleDeleteMilestone(m.id)} className="text-rose-500 hover:text-rose-600 transition-colors">
                            <Trash2 size={12} />
                          </button>
                        </td>
                      )}
                      {user.role === 'teacher' && (
                        <td className="py-2.5 px-2 text-right">
                          <button 
                            onClick={() => setEditingMilestone(m)} 
                            className="text-sky-500 hover:underline font-bold"
                          >
                            Evaluate
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {milestones.length === 0 && (
                    <tr>
                      <td colSpan={user.role === 'student' || user.role === 'teacher' ? 7 : 6} className="text-center py-4 text-slate-450 italic">
                        No milestones configured for this project.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Timeline & Progress submitting */}
          <Card 
            title="Weekly Progress Ledger"
            action={
              user.role === 'student' && (
                <button
                  onClick={() => setShowProgressForm(!showProgressForm)}
                  className="flex items-center space-x-1 py-1.5 px-3.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all"
                >
                  <Plus size={14} />
                  <span>Log Week</span>
                </button>
              )
            }
          >
            {showProgressForm && (
              <form onSubmit={handleProgressSubmit} className="mb-6 p-5 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase text-slate-450 font-bold mb-1">Week Number</label>
                    <input
                      type="number"
                      required
                      value={progressForm.week_number}
                      onChange={(e) => setProgressForm({ ...progressForm, week_number: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-slate-450 font-bold mb-1">Progress Percentage</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      required
                      value={progressForm.progress_percentage}
                      onChange={(e) => setProgressForm({ ...progressForm, progress_percentage: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] uppercase text-slate-450 font-bold">Tasks Accomplished</label>
                    <button
                      type="button"
                      onClick={handleAIWeeklyGenerate}
                      disabled={aiGenerating || !progressForm.work_done.trim()}
                      className="text-[9px] text-sky-500 hover:underline flex items-center space-x-0.5 font-bold disabled:opacity-50"
                    >
                      <Sparkles size={10} />
                      <span>{aiGenerating ? 'Refining...' : 'Refine with AI'}</span>
                    </button>
                  </div>
                  <textarea
                    required
                    value={progressForm.work_done}
                    onChange={(e) => setProgressForm({ ...progressForm, work_done: e.target.value })}
                    placeholder="Enter tasks completed (e.g. Added login route, tested database endpoints)..."
                    rows={3}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-slate-900 hover:bg-slate-850 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  Post Weekly Update
                </button>
              </form>
            )}

            <Timeline updates={project.progress_updates} />
          </Card>
        </div>

        {/* Right Side: Uploads & Marks */}
        <div className="space-y-8">
          {/* Group Members Card */}
          <Card title="Group Members" subtitle={`Team Size: ${project.team_size}`}>
            <div className="space-y-4">
              {(() => {
                try {
                  if (project.group_members) {
                    const members = JSON.parse(project.group_members);
                    if (members && members.length > 0) {
                      return members.map((m, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-850 rounded-xl space-y-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-800 dark:text-slate-100">{m.name || 'N/A'}</span>
                            <span className="text-[10px] text-sky-500 font-semibold bg-sky-500/10 px-1.5 py-0.5 rounded">Sec {m.section || 'N/A'}</span>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            <p>Roll: <span className="font-semibold">{m.univ_roll || 'N/A'}</span></p>
                            <p>Contact: <span className="font-semibold">{m.contact || 'N/A'}</span></p>
                          </div>
                        </div>
                      ));
                    }
                  }
                } catch (err) {
                  console.error("Failed to parse group members JSON:", err);
                }
                
                // Fallback if no JSON exists
                return (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-850 rounded-xl space-y-1 text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-100">{project.student.user.name}</span>
                    <div className="text-[10px] text-slate-500">
                      <p>Roll: <span className="font-semibold">{project.student.roll_number}</span></p>
                      <p>Section: <span className="font-semibold">{project.student.section}</span></p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </Card>

          {/* Marks display */}
          <Card title="Marks & Feedback">
            <div className="flex items-center space-x-4 mb-4">
              <div className="bg-sky-500/10 text-sky-500 p-3 rounded-2xl shrink-0">
                <Award size={24} />
              </div>
              <div>
                <h5 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{project.marks}/10</h5>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Project Rating Score</p>
              </div>
            </div>

            {project.feedbacks && project.feedbacks.length > 0 ? (
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                {project.feedbacks.map(f => (
                  <div key={f.id} className="space-y-2">
                    <p className="text-xs text-slate-650 dark:text-slate-450 italic leading-relaxed">"{f.comments}"</p>
                    {f.positive_points && (
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400">Positives:</span>
                        <p className="text-[10px] text-emerald-500 leading-normal mt-0.5">{f.positive_points}</p>
                      </div>
                    )}
                    {f.areas_of_improvement && (
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400">Improvements needed:</span>
                        <p className="text-[10px] text-amber-500 leading-normal mt-0.5">{f.areas_of_improvement}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No evaluations submitted by guide yet.</p>
            )}
          </Card>

          {/* File Uploads container */}
          {user.role === 'student' && (
            <Card title="Project Documents" subtitle="Upload deliverables for grading.">
              <div className="space-y-6">
                <FileUpload 
                  label="Project Synopsis (PDF/Doc)" 
                  accept=".pdf,.doc,.docx"
                  fileType="synopsis"
                  onUpload={(file) => handleFileUpload(file, 'synopsis')}
                />
                
                <FileUpload 
                  label="Project Report (PDF)" 
                  accept=".pdf"
                  fileType="report_pdf"
                  onUpload={(file) => handleFileUpload(file, 'report_pdf')}
                />
                
                <FileUpload 
                  label="Presentation PPT" 
                  accept=".ppt,.pptx"
                  fileType="ppt"
                  onUpload={(file) => handleFileUpload(file, 'ppt')}
                />
              </div>
            </Card>
          )}

          {/* Submitted Deliverables List */}
          <Card title="Submitted Deliverables" subtitle="Files available for grading.">
            {project.files && project.files.length > 0 ? (
              <div className="space-y-3">
                {project.files.map(f => (
                  <div key={f.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-850 rounded-xl flex items-center justify-between text-xs">
                    <div className="min-w-0">
                      <span className="font-bold text-sky-500 uppercase text-[9px] bg-sky-500/10 px-1.5 py-0.5 rounded mr-2 shrink-0">
                        {f.file_type.replace('_', ' ')}
                      </span>
                      <span className="text-slate-700 dark:text-slate-350 truncate">{f.file_name}</span>
                    </div>
                    <a 
                      href={`http://localhost:8000/${f.file_path.replace(/\\/g, '/')}`}
                      target="_blank" 
                      rel="noreferrer"
                      className="text-sky-500 hover:underline font-bold shrink-0 ml-4"
                    >
                      Download
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">No deliverables uploaded yet.</p>
            )}
          </Card>

          {/* Summarizer integration */}
          {aiResult && (
            <Card title="AI Summarized Artifact" className="border border-sky-500/20 bg-sky-500/[0.01]">
              <div className="space-y-3 text-xs leading-normal">
                <div>
                  <h5 className="font-bold text-sky-500">Suggested Keywords</h5>
                  <p className="text-slate-500 text-[10px] mt-0.5">{aiResult.keywords.join(', ')}</p>
                </div>
                <div>
                  <h5 className="font-bold text-sky-500">Objectives Draft</h5>
                  <ul className="list-disc pl-4 text-slate-650 dark:text-slate-350 text-[10px] space-y-0.5 mt-0.5">
                    {aiResult.objectives.map((o, idx) => <li key={idx}>{o}</li>)}
                  </ul>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
