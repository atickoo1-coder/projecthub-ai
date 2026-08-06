import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Trash2, 
  Save, 
  UploadCloud, 
  ArrowRight, 
  Briefcase,
  Layers,
  Database,
  Terminal,
  Clock3,
  Users,
  Edit3
} from 'lucide-react';
import { lifecycleAPI } from '../services/api';

const ProjectProposal = ({ onBack }) => {
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    domain: '',
    category: '',
    problem_statement: '',
    objectives: '',
    existing_system: '',
    proposed_system: '',
    scope: '',
    expected_outcome: '',
    technologies_used: '',
    programming_language: '',
    database: '',
    tools_used: '',
    project_duration: '4 months',
    team_members: ''
  });

  // File states
  const [files, setFiles] = useState({
    proposal_pdf: null,
    synopsis: null,
    literature_survey: null,
    initial_diagram: null
  });

  const [fileNames, setFileNames] = useState({
    proposal_pdf: '',
    synopsis: '',
    literature_survey: '',
    initial_diagram: ''
  });

  const fetchProposal = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await lifecycleAPI.getMyProposal();
      if (res && res.status !== 'none') {
        setProposal(res);
        setFormData({
          title: res.title,
          domain: res.domain,
          category: res.category,
          problem_statement: res.problem_statement,
          objectives: res.objectives,
          existing_system: res.existing_system,
          proposed_system: res.proposed_system,
          scope: res.scope,
          expected_outcome: res.expected_outcome,
          technologies_used: res.technologies_used,
          programming_language: res.programming_language,
          database: res.database,
          tools_used: res.tools_used,
          project_duration: res.project_duration,
          team_members: res.team_members
        });
        setIsEditing(false);
      } else {
        setProposal(null);
        setIsEditing(true);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch your project proposal.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposal();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e, key) => {
    const file = e.target.files[0];
    if (file) {
      setFiles({ ...files, [key]: file });
      setFileNames({ ...fileNames, [key]: file.name });
    }
  };

  const prepareFormData = () => {
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });
    Object.keys(files).forEach(key => {
      if (files[key]) {
        data.append(key, files[key]);
      }
    });
    return data;
  };

  const handleSaveDraft = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const data = prepareFormData();
      await lifecycleAPI.saveProposalDraft(data);
      setSuccess('Proposal draft saved successfully!');
      fetchProposal();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to save proposal draft.');
    }
  };

  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Quick validation
    const required = ['title', 'domain', 'category', 'problem_statement', 'objectives', 'proposed_system', 'technologies_used'];
    for (const field of required) {
      if (!formData[field]) {
        setError(`Please fill in the required field: ${field.replace('_', ' ').toUpperCase()}`);
        return;
      }
    }

    try {
      const data = prepareFormData();
      await lifecycleAPI.submitProposal(data);
      setSuccess('Project Proposal submitted successfully for Guide review!');
      fetchProposal();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to submit proposal.');
    }
  };

  const handleDeleteDraft = async () => {
    if (!proposal || !window.confirm('Are you sure you want to delete this draft proposal?')) return;
    setError(null);
    setSuccess(null);
    try {
      await lifecycleAPI.deleteProposalDraft(proposal.id);
      setSuccess('Proposal draft deleted successfully.');
      setFormData({
        title: '',
        domain: '',
        category: '',
        problem_statement: '',
        objectives: '',
        existing_system: '',
        proposed_system: '',
        scope: '',
        expected_outcome: '',
        technologies_used: '',
        programming_language: '',
        database: '',
        tools_used: '',
        project_duration: '4 months',
        team_members: ''
      });
      setProposal(null);
      setIsEditing(true);
    } catch (err) {
      console.error(err);
      setError('Failed to delete draft proposal.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-sky-500"></div>
      </div>
    );
  }

  // Helper to color codes statuses
  const getStatusStyle = (status) => {
    switch (status) {
      case 'approved':
        return {
          bg: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20',
          icon: <CheckCircle className="w-5 h-5 mr-2 text-emerald-500" />,
          label: 'Approved'
        };
      case 'rejected':
        return {
          bg: 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/20',
          icon: <AlertCircle className="w-5 h-5 mr-2 text-rose-500" />,
          label: 'Rejected'
        };
      case 'revision_required':
        return {
          bg: 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20',
          icon: <Clock className="w-5 h-5 mr-2 text-amber-500" />,
          label: 'Revision Required'
        };
      default:
        return {
          bg: 'bg-sky-500/10 text-sky-500 dark:text-sky-400 border-sky-500/20',
          icon: <Clock className="w-5 h-5 mr-2 text-sky-500" />,
          label: 'Pending Review'
        };
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-6">
      
      {/* Header card */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-xl font-bold flex items-center">
            <FileText className="w-6 h-6 mr-2 text-sky-500" />
            Academic Project Proposal
          </h1>
          <p className="text-xs text-slate-400 mt-1">Submit your project idea, architecture details, and initial documents for advisor review.</p>
        </div>
        {onBack && (
          <button onClick={onBack} className="text-xs px-3 py-1.5 border hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
            Back to Dashboard
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 text-rose-500 rounded-2xl text-xs flex items-center border border-rose-500/20">
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl text-xs flex items-center border border-emerald-500/20">
          <CheckCircle className="w-4 h-4 mr-2" />
          {success}
        </div>
      )}

      {proposal && !isEditing && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Sidebar */}
          <div className="space-y-6">
            <div className={`p-5 rounded-2xl border ${getStatusStyle(proposal.status).bg} flex flex-col space-y-3`}>
              <div className="flex items-center font-bold text-sm">
                {getStatusStyle(proposal.status).icon}
                Proposal Status: {getStatusStyle(proposal.status).label}
              </div>
              
              {proposal.remarks && (
                <div className="text-xs border-t pt-3 mt-2 border-current/20">
                  <span className="font-semibold block mb-1">Guide Feedback Remarks:</span>
                  <p className="italic">{proposal.remarks}</p>
                </div>
              )}

              {proposal.deadline && (
                <div className="text-xs flex items-center justify-between border-t pt-2 border-current/10">
                  <span>Revision Deadline:</span>
                  <span className="font-semibold">{proposal.deadline}</span>
                </div>
              )}
            </div>

            {/* Uploaded Files Info Card */}
            <div className="bg-white dark:bg-slate-900 border rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Attached Documents</h3>
              <div className="space-y-2 text-xs">
                {proposal.proposal_pdf_url ? (
                  <a href={`http://localhost:8000/${proposal.proposal_pdf_url}`} target="_blank" rel="noreferrer" className="flex items-center p-2 border hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all">
                    <FileText className="w-4 h-4 text-rose-500 mr-2" />
                    <span className="truncate">Proposal PDF Document</span>
                  </a>
                ) : <span className="text-slate-500 italic block">No Proposal PDF uploaded.</span>}

                {proposal.synopsis_url ? (
                  <a href={`http://localhost:8000/${proposal.synopsis_url}`} target="_blank" rel="noreferrer" className="flex items-center p-2 border hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all">
                    <FileText className="w-4 h-4 text-sky-500 mr-2" />
                    <span className="truncate">Synopsis Document</span>
                  </a>
                ) : null}

                {proposal.literature_survey_url ? (
                  <a href={`http://localhost:8000/${proposal.literature_survey_url}`} target="_blank" rel="noreferrer" className="flex items-center p-2 border hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all">
                    <FileText className="w-4 h-4 text-emerald-500 mr-2" />
                    <span className="truncate">Literature Survey Review</span>
                  </a>
                ) : null}

                {proposal.initial_diagram_url ? (
                  <a href={`http://localhost:8000/${proposal.initial_diagram_url}`} target="_blank" rel="noreferrer" className="flex items-center p-2 border hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all">
                    <FileText className="w-4 h-4 text-purple-500 mr-2" />
                    <span className="truncate">Initial Diagram Blueprint</span>
                  </a>
                ) : null}
              </div>
            </div>

            {/* Actions Card */}
            {proposal.status !== 'approved' && (
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="flex-1 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold flex items-center justify-center transition-all"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Proposal
                </button>
                {proposal.status === 'pending' && (
                  <button 
                    onClick={handleDeleteDraft} 
                    className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-xl text-xs font-bold transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Details View */}
          <div className="lg:col-span-2 space-y-6 bg-white dark:bg-slate-900 border p-6 rounded-2xl">
            <div>
              <span className="text-[10px] bg-sky-500/10 text-sky-500 font-bold uppercase px-2 py-0.5 rounded">
                {proposal.category}
              </span>
              <h2 className="text-lg font-bold mt-2">{proposal.title}</h2>
              <p className="text-xs text-slate-400 mt-1">Domain: {proposal.domain} • Duration: {proposal.project_duration}</p>
            </div>

            <div className="space-y-4 text-xs divide-y divide-slate-100 dark:divide-slate-800">
              <div className="pt-2">
                <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Problem Statement</h4>
                <p className="whitespace-pre-wrap">{proposal.problem_statement}</p>
              </div>

              <div className="pt-4">
                <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Objectives</h4>
                <p className="whitespace-pre-wrap">{proposal.objectives}</p>
              </div>

              <div className="pt-4">
                <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Existing System Challenges</h4>
                <p className="whitespace-pre-wrap">{proposal.existing_system}</p>
              </div>

              <div className="pt-4">
                <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Proposed System</h4>
                <p className="whitespace-pre-wrap">{proposal.proposed_system}</p>
              </div>

              <div className="pt-4">
                <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Scope of Work</h4>
                <p className="whitespace-pre-wrap">{proposal.scope}</p>
              </div>

              <div className="pt-4">
                <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Expected Outcome</h4>
                <p className="whitespace-pre-wrap">{proposal.expected_outcome}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                <div>
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-0.5">Technologies</h4>
                  <p>{proposal.technologies_used}</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-0.5">Language</h4>
                  <p>{proposal.programming_language}</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-0.5">Database</h4>
                  <p>{proposal.database}</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-0.5">Tools</h4>
                  <p>{proposal.tools_used}</p>
                </div>
              </div>

              <div className="pt-4">
                <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Team Members</h4>
                <p>{proposal.team_members}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEditing && (
        <form onSubmit={handleSubmitProposal} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border p-6 rounded-2xl space-y-6">
            <h2 className="text-sm font-bold flex items-center text-sky-500 border-b pb-2">
              <Briefcase className="w-4 h-4 mr-2" />
              1. Basic Project Specifications
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="md:col-span-3">
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Project Title *</label>
                <input required type="text" name="title" value={formData.title} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>
              
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Domain *</label>
                <input required type="text" placeholder="e.g. Computer Vision" name="domain" value={formData.domain} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>
              
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Category *</label>
                <input required type="text" placeholder="e.g. Web Application" name="category" value={formData.category} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>
              
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Project Duration *</label>
                <select name="project_duration" value={formData.project_duration} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl">
                  <option value="3 months">3 Months</option>
                  <option value="4 months">4 Months</option>
                  <option value="6 months">6 Months</option>
                  <option value="8 months">8 Months</option>
                </select>
              </div>
            </div>

            <h2 className="text-sm font-bold flex items-center text-sky-500 border-b pb-2 pt-4">
              <Layers className="w-4 h-4 mr-2" />
              2. Problem Description & Architecture
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Problem Statement *</label>
                <textarea required rows={4} name="problem_statement" value={formData.problem_statement} onChange={handleInputChange} placeholder="What issues does this project solve?" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Objectives *</label>
                <textarea required rows={3} name="objectives" value={formData.objectives} onChange={handleInputChange} placeholder="List out clear core goals..." className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Existing System Limitations</label>
                <textarea rows={3} name="existing_system" value={formData.existing_system} onChange={handleInputChange} placeholder="Brief details about current methods/limitations..." className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Proposed System *</label>
                <textarea required rows={4} name="proposed_system" value={formData.proposed_system} onChange={handleInputChange} placeholder="Explain your design / methodology..." className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Scope of Work</label>
                <textarea rows={2} name="scope" value={formData.scope} onChange={handleInputChange} placeholder="Boundaries and constraints of the code logic..." className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Expected Outcome</label>
                <textarea rows={2} name="expected_outcome" value={formData.expected_outcome} onChange={handleInputChange} placeholder="List measurable expected deliverables..." className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>
            </div>

            <h2 className="text-sm font-bold flex items-center text-sky-500 border-b pb-2 pt-4">
              <Database className="w-4 h-4 mr-2" />
              3. Technologies & Resources
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Technologies Used *</label>
                <input required type="text" placeholder="e.g. React, OpenCV" name="technologies_used" value={formData.technologies_used} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>
              
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Programming Languages</label>
                <input type="text" placeholder="e.g. JavaScript, Python" name="programming_language" value={formData.programming_language} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>
              
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Database</label>
                <input type="text" placeholder="e.g. SQLite, PostgreSQL" name="database" value={formData.database} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>
              
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Tools / IDEs</label>
                <input type="text" placeholder="e.g. VS Code, Git" name="tools_used" value={formData.tools_used} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>
            </div>

            <div className="pt-2 text-xs">
              <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Team Members (Include Name, Roll)</label>
              <textarea rows={2} placeholder="List out names and roll numbers of students involved..." name="team_members" value={formData.team_members} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
            </div>

            <h2 className="text-sm font-bold flex items-center text-sky-500 border-b pb-2 pt-4">
              <UploadCloud className="w-4 h-4 mr-2" />
              4. Document Deliverables (PDF, Synopsis)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="p-4 border border-dashed rounded-xl bg-slate-50/50 dark:bg-slate-900/30 flex flex-col items-center justify-center text-center">
                <FileText className="w-8 h-8 text-rose-500 mb-2" />
                <span className="font-semibold text-xs">Proposal PDF Document</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Upload initial draft summary report</span>
                <input type="file" accept=".pdf" onChange={e => handleFileChange(e, 'proposal_pdf')} className="mt-2 text-[10px]" />
                {fileNames.proposal_pdf && <span className="text-[10px] text-emerald-500 mt-2 font-bold">{fileNames.proposal_pdf}</span>}
              </div>

              <div className="p-4 border border-dashed rounded-xl bg-slate-50/50 dark:bg-slate-900/30 flex flex-col items-center justify-center text-center">
                <FileText className="w-8 h-8 text-sky-500 mb-2" />
                <span className="font-semibold text-xs">Project Synopsis</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Upload a short project overview abstract</span>
                <input type="file" accept=".pdf,.doc,.docx" onChange={e => handleFileChange(e, 'synopsis')} className="mt-2 text-[10px]" />
                {fileNames.synopsis && <span className="text-[10px] text-emerald-500 mt-2 font-bold">{fileNames.synopsis}</span>}
              </div>

              <div className="p-4 border border-dashed rounded-xl bg-slate-50/50 dark:bg-slate-900/30 flex flex-col items-center justify-center text-center">
                <FileText className="w-8 h-8 text-emerald-500 mb-2" />
                <span className="font-semibold text-xs">Literature Survey Details</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Upload reference logs and citations summary</span>
                <input type="file" accept=".pdf,.doc,.docx" onChange={e => handleFileChange(e, 'literature_survey')} className="mt-2 text-[10px]" />
                {fileNames.literature_survey && <span className="text-[10px] text-emerald-500 mt-2 font-bold">{fileNames.literature_survey}</span>}
              </div>

              <div className="p-4 border border-dashed rounded-xl bg-slate-50/50 dark:bg-slate-900/30 flex flex-col items-center justify-center text-center">
                <FileText className="w-8 h-8 text-purple-500 mb-2" />
                <span className="font-semibold text-xs">Initial Diagram Blueprint</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Architecture diagrams or block workflows</span>
                <input type="file" accept="image/*,.pdf" onChange={e => handleFileChange(e, 'initial_diagram')} className="mt-2 text-[10px]" />
                {fileNames.initial_diagram && <span className="text-[10px] text-emerald-500 mt-2 font-bold">{fileNames.initial_diagram}</span>}
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-end">
            {proposal && (
              <button 
                type="button" 
                onClick={() => setIsEditing(false)} 
                className="px-4 py-2 border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs transition-all"
              >
                Cancel Edit
              </button>
            )}
            <button 
              type="button" 
              onClick={handleSaveDraft} 
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 rounded-xl text-xs font-bold flex items-center transition-all"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </button>
            <button 
              type="submit" 
              className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold flex items-center transition-all"
            >
              Submit Proposal
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ProjectProposal;
