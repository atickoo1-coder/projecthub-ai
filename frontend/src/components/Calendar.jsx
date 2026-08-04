import React from 'react';
import { Calendar as CalendarIcon, Video, CheckCircle, Clock } from 'lucide-react';

const Calendar = ({ meetings = [] }) => {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-bold text-lg text-slate-850 dark:text-slate-100">Advisor Sessions & Meetings</h3>
          <p className="text-xs text-slate-500 mt-1">Calendar logs of guide meetings.</p>
        </div>
      </div>

      {meetings.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-slate-50/50 dark:bg-slate-900/10">
          <CalendarIcon className="text-slate-400 mx-auto mb-2" size={24} />
          <p className="text-xs text-slate-500 font-medium">No sessions scheduled yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {meetings.map((meeting) => (
            <div 
              key={meeting.id} 
              className={`border p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between ${
                meeting.status === 'cancelled' 
                  ? 'border-rose-500/20 bg-rose-500/5' 
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">{meeting.title}</h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                    meeting.status === 'scheduled' 
                      ? 'bg-sky-500/10 text-sky-500' 
                      : meeting.status === 'completed'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-rose-500/10 text-rose-500'
                  }`}>
                    {meeting.status}
                  </span>
                </div>
                
                <p className="text-xs text-slate-500 leading-normal mt-1">{meeting.description || 'No description provided.'}</p>
                
                <div className="mt-4 flex items-center space-x-3 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center space-x-1 shrink-0">
                    <Clock size={14} className="text-sky-500" />
                    <span>{new Date(meeting.scheduled_at).toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-300 dark:bg-slate-700 w-1.5 h-1.5 rounded-full"></div>
                  <span>{meeting.duration_minutes} Mins</span>
                </div>
              </div>

              {meeting.status === 'scheduled' && meeting.join_url && (
                <a
                  href={meeting.join_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 w-full flex items-center justify-center space-x-2 py-2 px-4 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  <Video size={14} />
                  <span>Join Session</span>
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Calendar;
