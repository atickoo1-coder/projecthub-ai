import React from 'react';
import { Calendar, CheckCircle2, Circle } from 'lucide-react';

const Timeline = ({ updates = [] }) => {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-bold text-lg text-slate-850 dark:text-slate-100">Project Progress Timeline</h3>
          <p className="text-xs text-slate-500 mt-1">Academic weekly reports tracking timeline.</p>
        </div>
      </div>

      {updates.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-slate-50/50 dark:bg-slate-900/10">
          <Calendar className="text-slate-400 mx-auto mb-2" size={24} />
          <p className="text-xs text-slate-500 font-medium">No progress updates submitted yet.</p>
        </div>
      ) : (
        <div className="relative border-l border-slate-200 dark:border-slate-850 ml-4 pl-6 space-y-6">
          {updates.map((update, idx) => (
            <div key={update.id || idx} className="relative">
              {/* Timeline dot */}
              <span className="absolute -left-10 top-0.5 bg-white dark:bg-slate-950 p-1 rounded-full border-2 border-sky-500 text-sky-500 shadow-sm">
                <CheckCircle2 size={12} />
              </span>
              
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">Week {update.week_number} Update</h4>
                  <span className="bg-sky-500/10 text-sky-500 dark:bg-sky-500/20 px-2.5 py-1 rounded-lg text-xs font-bold">
                    {update.progress_percentage}% Completed
                  </span>
                </div>
                
                <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed mt-1">{update.work_done}</p>
                
                <div className="text-[10px] text-slate-400 mt-3.5 flex items-center space-x-1">
                  <span>Updated at:</span>
                  <span>{new Date(update.updated_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Timeline;
