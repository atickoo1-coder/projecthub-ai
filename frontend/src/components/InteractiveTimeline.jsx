import React, { useState, useEffect } from 'react';
import { Check, Info, AlertCircle, Award, CheckCircle2, Circle, Settings, Activity, Code, CloudLightning, FileText, ClipboardList } from 'lucide-react';
import Card from './Card';

const STAGES = [
  {
    id: 'prop',
    label: 'Proposal',
    pct: 20,
    icon: FileText,
    color: 'emerald',
    description: 'Define project scope, goals, technology stack, and draft the initial abstract.',
    subtasks: [
      { id: 'prop_1', text: 'Draft abstract and project goals' },
      { id: 'prop_2', text: 'Identify technology stack & architecture' },
      { id: 'prop_3', text: 'Submit project proposal for guide approval' }
    ]
  },
  {
    id: 'req',
    label: 'Requirements',
    pct: 40,
    icon: ClipboardList,
    color: 'teal',
    description: 'Conduct analysis of requirements, draft the SRS document, and map use-cases.',
    subtasks: [
      { id: 'req_1', text: 'Define functional and non-functional requirements' },
      { id: 'req_2', text: 'Create system use-case diagrams and flowcharts' },
      { id: 'req_3', text: 'Draft and upload Software Requirement Specification (SRS)' }
    ]
  },
  {
    id: 'design',
    label: 'Design',
    pct: 60,
    icon: Settings,
    color: 'violet',
    description: 'Design database schema, write API contracts, and create UI wireframes.',
    subtasks: [
      { id: 'design_1', text: 'Create entity-relationship (ER) and database schemas' },
      { id: 'design_2', text: 'Design UI mockups or wireframes for dashboards' },
      { id: 'design_3', text: 'Draft API contracts and endpoints documentation' }
    ]
  },
  {
    id: 'dev',
    label: 'Development',
    pct: 80,
    icon: Code,
    color: 'indigo',
    description: 'Implement backend APIs, build the frontend UI, integrate services, and test.',
    subtasks: [
      { id: 'dev_1', text: 'Initialize repository and setup database connections' },
      { id: 'dev_2', text: 'Develop backend REST APIs with authentication' },
      { id: 'dev_3', text: 'Build responsive frontend views and integrate APIs' },
      { id: 'dev_4', text: 'Conduct unit testing and resolve bugs' }
    ]
  },
  {
    id: 'deploy',
    label: 'Deployment',
    pct: 100,
    icon: CloudLightning,
    color: 'amber',
    description: 'Configure production environment, build assets, deploy live app, and present.',
    subtasks: [
      { id: 'deploy_1', text: 'Configure environment variables & production database' },
      { id: 'deploy_2', text: 'Build production bundles and deploy on host' },
      { id: 'deploy_3', text: 'Conduct final User Acceptance Testing (UAT)' },
      { id: 'deploy_4', text: 'Prepare presentation slides and project demo video' }
    ]
  }
];

const InteractiveTimeline = ({ projectId, milestones = [], userRole = 'student', onUpdateMilestones }) => {
  const [activeStageId, setActiveStageId] = useState('prop');
  const [completedSubtasks, setCompletedSubtasks] = useState({});

  // Load completed subtasks from localStorage
  useEffect(() => {
    if (projectId) {
      const stored = localStorage.getItem(`project_${projectId}_subtasks`);
      if (stored) {
        try {
          setCompletedSubtasks(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse stored subtasks", e);
        }
      } else {
        setCompletedSubtasks({});
      }
    }
  }, [projectId]);

  // Save completed subtasks to localStorage
  const saveSubtasks = (updated) => {
    setCompletedSubtasks(updated);
    localStorage.setItem(`project_${projectId}_subtasks`, JSON.stringify(updated));
  };

  const toggleSubtask = (subtaskId) => {
    if (userRole !== 'student') return; // Only students can check/uncheck tasks
    const updated = {
      ...completedSubtasks,
      [subtaskId]: !completedSubtasks[subtaskId]
    };
    saveSubtasks(updated);
  };

  // Match real milestones from database to their respective stages based on keywords
  const getStageMilestones = (stageId) => {
    return milestones.filter(m => {
      const title = m.title.toLowerCase();
      const desc = (m.description || '').toLowerCase();
      if (stageId === 'prop') {
        return title.includes('prop') || title.includes('abstract') || title.includes('scope') || title.includes('synopsis') || desc.includes('prop');
      }
      if (stageId === 'req') {
        return title.includes('req') || title.includes('srs') || title.includes('spec') || title.includes('analys');
      }
      if (stageId === 'design') {
        return title.includes('design') || title.includes('wire') || title.includes('mock') || title.includes('schema') || title.includes('db') || title.includes('architect') || title.includes('model');
      }
      if (stageId === 'dev') {
        return title.includes('dev') || title.includes('code') || title.includes('impl') || title.includes('build') || title.includes('test') || title.includes('backend') || title.includes('frontend') || title.includes('api');
      }
      if (stageId === 'deploy') {
        return title.includes('deploy') || title.includes('launch') || title.includes('final') || title.includes('prod') || title.includes('presentation') || title.includes('demo');
      }
      return false;
    });
  };

  // Find active stage based on overall subtask & milestone progress
  const activeStage = STAGES.find(s => s.id === activeStageId) || STAGES[0];
  const activeStageMilestones = getStageMilestones(activeStage.id);

  // Calculate progress percent of current stage subtasks
  const activeStageSubtasks = activeStage.subtasks;
  const completedCount = activeStageSubtasks.filter(t => completedSubtasks[t.id]).length;
  const stageProgressPercent = activeStageSubtasks.length > 0 
    ? Math.round((completedCount / activeStageSubtasks.length) * 100) 
    : 0;

  // Calculate total progress across all stages
  const totalSubtasksCount = STAGES.reduce((acc, s) => acc + s.subtasks.length, 0);
  const totalCompletedCount = STAGES.reduce((acc, s) => {
    return acc + s.subtasks.filter(t => completedSubtasks[t.id]).length;
  }, 0);
  
  const overallProgressPercent = totalSubtasksCount > 0
    ? Math.round((totalCompletedCount / totalSubtasksCount) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Progress Bar & Stage Nodes */}
      <div className="relative pt-4 pb-2">
        {/* Background Line */}
        <div className="absolute top-[28px] left-0 right-0 h-1 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0 rounded-full"></div>
        
        {/* Progress Fill Line */}
        <div 
          className="absolute top-[28px] left-0 h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-amber-500 -translate-y-1/2 z-0 transition-all duration-500 rounded-full"
          style={{ width: `${overallProgressPercent}%` }}
        ></div>

        {/* Nodes */}
        <div className="relative flex justify-between items-center w-full z-10">
          {STAGES.map((stage, idx) => {
            const StageIcon = stage.icon;
            const isSelected = activeStageId === stage.id;
            
            // Calculate if the stage is fully completed
            const stageSubtasks = stage.subtasks;
            const stageCompletedCount = stageSubtasks.filter(t => completedSubtasks[t.id]).length;
            const isStageDone = stageCompletedCount === stageSubtasks.length && stageSubtasks.length > 0;
            const isStageInProgress = stageCompletedCount > 0 && stageCompletedCount < stageSubtasks.length;

            let ringColor = 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900';
            let iconColor = 'text-slate-400 dark:text-slate-650';

            if (isStageDone) {
              ringColor = 'border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20';
              iconColor = 'text-white';
            } else if (isStageInProgress || isSelected) {
              ringColor = 'border-indigo-500 bg-white dark:bg-slate-900 text-indigo-500 shadow-md shadow-indigo-500/10 scale-110';
              iconColor = 'text-indigo-500';
            }

            return (
              <button 
                key={stage.id} 
                onClick={() => setActiveStageId(stage.id)}
                className="flex flex-col items-center focus:outline-none group transition-all"
              >
                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-all duration-300 ${ringColor} group-hover:scale-105`}>
                  {isStageDone ? (
                    <Check size={16} strokeWidth={3} />
                  ) : (
                    <StageIcon size={16} className={iconColor} />
                  )}
                </div>
                <span className={`text-[10px] font-bold mt-2.5 transition-colors ${
                  isSelected 
                    ? 'text-indigo-500 dark:text-indigo-400' 
                    : 'text-slate-500 dark:text-slate-450 group-hover:text-slate-700'
                }`}>
                  {stage.label}
                </span>
                <span className="text-[9px] text-slate-400">
                  {stageCompletedCount}/{stageSubtasks.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detailed Pane for Selected Stage */}
      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-5 shadow-inner transition-all duration-300">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-850 gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-indigo-500/10 text-indigo-500 rounded-lg">
                {React.createElement(activeStage.icon, { size: 18 })}
              </span>
              <h3 className="text-base font-bold text-slate-850 dark:text-slate-100">{activeStage.label} Stage</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">{activeStage.description}</p>
          </div>
          <div className="flex items-center space-x-4 self-start lg:self-center">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Stage Progress</div>
              <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{stageProgressPercent}%</div>
            </div>
            <div className="w-16 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition-all duration-500" 
                style={{ width: `${stageProgressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-5">
          {/* Checklist Section */}
          <div>
            <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <span>Task Checklist</span>
              <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-500 px-1.5 py-0.2 rounded-full font-normal">
                {userRole === 'student' ? 'Interactive' : 'Read-only'}
              </span>
            </h5>
            <div className="space-y-2">
              {activeStage.subtasks.map((task) => {
                const isChecked = !!completedSubtasks[task.id];
                return (
                  <div 
                    key={task.id}
                    onClick={() => toggleSubtask(task.id)}
                    className={`flex items-center space-x-3 p-3 bg-white dark:bg-slate-900 border rounded-xl shadow-sm transition-all ${
                      userRole === 'student' ? 'cursor-pointer hover:border-indigo-400/50' : ''
                    } ${
                      isChecked 
                        ? 'border-emerald-500/20 bg-emerald-500/[0.01]' 
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                      isChecked 
                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                        : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950'
                      }`}>
                      {isChecked && <Check size={10} strokeWidth={4} />}
                    </div>
                    <span className={`text-xs select-none transition-colors ${
                      isChecked 
                        ? 'text-slate-400 line-through' 
                        : 'text-slate-700 dark:text-slate-300 font-medium'
                    }`}>
                      {task.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Related Database Milestones */}
          <div>
            <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">Associated Academic Milestones</h5>
            {activeStageMilestones.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-center h-[142px]">
                <AlertCircle size={20} className="text-slate-400 mb-1.5" />
                <p className="text-xs text-slate-450 font-medium">No formal milestones mapped to this stage.</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Add a milestone containing "{activeStage.label.toLowerCase()}" in the title.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                {activeStageMilestones.map((m) => (
                  <div key={m.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm space-y-1.5">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{m.title}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                        m.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                        m.status === 'in_progress' ? 'bg-sky-500/10 text-sky-500' :
                        'bg-slate-200 text-slate-500 dark:bg-slate-800'
                      }`}>
                        {m.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span>Due: {m.deadline}</span>
                      <span className="font-extrabold text-indigo-500 bg-indigo-500/5 px-1.5 py-0.5 rounded">
                        {m.marks !== null ? `${m.marks}/${m.max_marks}` : `Max: ${m.max_marks}`}
                      </span>
                    </div>
                    {m.feedback && (
                      <p className="text-[10px] text-slate-550 dark:text-slate-450 italic border-l-2 border-indigo-500/30 pl-2 mt-1">
                        "{m.feedback}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveTimeline;
