import React, { useState, useEffect } from 'react';
import { meetingAPI, teacherAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Calendar from '../components/Calendar';
import { CalendarDays, AlertCircle, Plus, Clock, CheckCircle } from 'lucide-react';

const Meetings = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Student Form states
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    scheduled_at: '',
    duration_minutes: 30
  });
  
  // Teacher Form states
  const [mentees, setMentees] = useState([]);
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    description: '',
    scheduled_at: '',
    duration_minutes: 30,
    student_id: '',
    join_url: ''
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const fetchMeetings = async () => {
    try {
      const data = await meetingAPI.getAll();
      setMeetings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMentees = async () => {
    try {
      const data = await teacherAPI.getAssignedStudents();
      setMentees(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMeetings();
    if (user?.role === 'teacher') {
      fetchMentees();
    }
  }, [user]);

  const handleRequestMeeting = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!user?.student_profile?.id) {
      setError('Student profile not found.');
      return;
    }

    if (!user?.student_profile?.guide_user_id) {
      setError('You cannot request a meeting because no advisor guide has been allocated to you yet.');
      return;
    }

    try {
      const payload = {
        title: form.title,
        description: form.description,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        duration_minutes: parseInt(form.duration_minutes),
        student_id: user.student_profile.id,
        join_url: ''
      };

      await meetingAPI.schedule(payload);
      setSuccess(true);
      setShowRequestForm(false);
      setForm({ title: '', description: '', scheduled_at: '', duration_minutes: 30 });
      fetchMeetings();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to request meeting with advisor.');
    }
  };

  const handleTeacherScheduleMeeting = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!newMeeting.student_id) {
      setError('Please select a student.');
      return;
    }

    try {
      const payload = {
        title: newMeeting.title,
        description: newMeeting.description,
        scheduled_at: new Date(newMeeting.scheduled_at).toISOString(),
        duration_minutes: parseInt(newMeeting.duration_minutes),
        student_id: parseInt(newMeeting.student_id),
        join_url: newMeeting.join_url || ''
      };

      await meetingAPI.schedule(payload);
      setSuccess(true);
      setShowRequestForm(false);
      setNewMeeting({ title: '', description: '', scheduled_at: '', duration_minutes: 30, student_id: '', join_url: '' });
      fetchMeetings();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to schedule meeting.');
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-850 dark:text-slate-100">Academic Advisor Schedule</h2>
          <p className="text-sm text-slate-500 mt-1">Review upcoming calendar syncs, download reports, or enter video conferences.</p>
        </div>
        {user?.role === 'student' && (
          <button
            onClick={() => setShowRequestForm(!showRequestForm)}
            className="flex items-center space-x-1.5 py-2.5 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-500/10"
          >
            <Plus size={16} />
            <span>Request Meeting</span>
          </button>
        )}
        {user?.role === 'teacher' && (
          <button
            onClick={() => setShowRequestForm(!showRequestForm)}
            className="flex items-center space-x-1.5 py-2.5 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-500/10"
          >
            <Plus size={16} />
            <span>Schedule Meeting</span>
          </button>
        )}
      </div>

      {showRequestForm && user?.role === 'student' && (
        <form onSubmit={handleRequestMeeting} className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <CalendarDays size={18} className="text-sky-500" />
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
              Request Meeting with Guide ({user?.student_profile?.guide_name || 'Unallocated'})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase text-slate-450 font-bold mb-1">Meeting Title</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Project Progress Sync / Review Request"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] uppercase text-slate-450 font-bold mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={form.scheduled_at}
                  onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-slate-450 font-bold mb-1">Duration</label>
                <select
                  value={form.duration_minutes}
                  onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value={15}>15 Mins</option>
                  <option value={30}>30 Mins</option>
                  <option value={45}>45 Mins</option>
                  <option value={60}>1 Hour</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase text-slate-450 font-bold mb-1">Discussion Agenda / Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Outline what you want to discuss with your guide..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="py-2.5 px-6 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-500/10"
          >
            Submit Request
          </button>
        </form>
      )}

      {showRequestForm && user?.role === 'teacher' && (
        <form onSubmit={handleTeacherScheduleMeeting} className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <CalendarDays size={18} className="text-sky-500" />
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
              Schedule New Meeting with Mentee
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] uppercase text-slate-450 font-bold mb-1 font-semibold">Select Mentee (Student)</label>
              <select
                required
                value={newMeeting.student_id}
                onChange={(e) => setNewMeeting({ ...newMeeting, student_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="">Select Mentee...</option>
                {mentees.map(m => (
                  <option key={m.id} value={m.id}>{m.user?.name || m.name} ({m.roll_number})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase text-slate-450 font-bold mb-1">Meeting Title</label>
              <input
                type="text"
                required
                value={newMeeting.title}
                onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                placeholder="Weekly Sync / Project Review"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] uppercase text-slate-450 font-bold mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={newMeeting.scheduled_at}
                  onChange={(e) => setNewMeeting({ ...newMeeting, scheduled_at: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-slate-450 font-bold mb-1">Duration</label>
                <select
                  value={newMeeting.duration_minutes}
                  onChange={(e) => setNewMeeting({ ...newMeeting, duration_minutes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value={15}>15 Mins</option>
                  <option value={30}>30 Mins</option>
                  <option value={45}>45 Mins</option>
                  <option value={60}>1 Hour</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase text-slate-450 font-bold mb-1">Join Video Meeting URL (Optional)</label>
              <input
                type="text"
                value={newMeeting.join_url}
                onChange={(e) => setNewMeeting({ ...newMeeting, join_url: e.target.value })}
                placeholder="https://meet.google.com/abc-defg-hij"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-slate-450 font-bold mb-1">Agenda / Description</label>
              <input
                type="text"
                value={newMeeting.description}
                onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
                placeholder="Topics to discuss..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="py-2.5 px-6 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-500/10"
          >
            Schedule Meeting
          </button>
        </form>
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
          <span>Meeting requested successfully! Your guide has been notified.</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[250px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-sky-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          <Card title="Advisor Sessions Registry">
            <Calendar meetings={meetings} />
          </Card>
        </div>
      )}
    </div>
  );
};

export default Meetings;
