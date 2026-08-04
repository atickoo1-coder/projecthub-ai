import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { aiAPI } from '../services/api';
import Card from '../components/Card';
import { 
  Sparkles, 
  BookOpen, 
  Lightbulb, 
  FileText, 
  AlertCircle, 
  GraduationCap, 
  Clock, 
  Bookmark,
  RefreshCw,
  Search,
  ExternalLink
} from 'lucide-react';

const AIHub = () => {
  const { user } = useAuth();
  
  // Recommendation state
  const [recSkills, setRecSkills] = useState('Python, MySQL');
  const [recDomain, setRecDomain] = useState('Healthcare');
  const [recDiff, setRecDiff] = useState('intermediate');
  const [recommendations, setRecommendations] = useState([]);
  
  // Resume state
  const [resumeMarkdown, setResumeMarkdown] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGetRecommendations = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const skillsArray = recSkills.split(',').map(s => s.trim());
      const response = await aiAPI.getRecommendations(skillsArray, recDomain, recDiff);
      setRecommendations(response.recommendations || []);
    } catch (err) {
      setError('Failed to fetch recommendations.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateResume = async () => {
    if (!user?.student_profile?.id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await aiAPI.getResume(user.student_profile.id);
      setResumeMarkdown(response.resume_markdown);
    } catch (err) {
      setError('Failed to auto-generate resume.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      {/* Banner */}
      <div className="relative bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-500/10 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 overflow-hidden flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center space-x-2">
            <Sparkles className="text-sky-500 animate-pulse" size={28} />
            <span>AI Workspace & Generator</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">Accelerate your academic journey with automated assistants and project recommendations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Parameters Form */}
        <div className="lg:col-span-1 space-y-8">
          <Card title="Recommendation Parameters">
            <form onSubmit={handleGetRecommendations} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase text-slate-450 font-bold mb-1.5">My Skillset</label>
                <input
                  type="text"
                  required
                  value={recSkills}
                  onChange={(e) => setRecSkills(e.target.value)}
                  placeholder="Python, React, MySQL"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-slate-450 font-bold mb-1.5">Target Domain</label>
                <input
                  type="text"
                  required
                  value={recDomain}
                  onChange={(e) => setRecDomain(e.target.value)}
                  placeholder="Healthcare / IoT / FinTech"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-slate-450 font-bold mb-1.5">Difficulty Target</label>
                <select
                  value={recDiff}
                  onChange={(e) => setRecDiff(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-sky-500/10 flex items-center justify-center space-x-1.5"
              >
                <Lightbulb size={14} />
                <span>Recommend Ideas</span>
              </button>
            </form>
          </Card>

          <Card title="Quick Actions">
            <button
              onClick={handleGenerateResume}
              disabled={loading}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center space-x-1.5 shadow-sm"
            >
              <FileText size={14} />
              <span>Draft Resume Profile</span>
            </button>
          </Card>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Project Ideas Display */}
          {recommendations.length > 0 && (
            <Card title="AI Recommended Project Ideas" subtitle="Tailored to your skills and preferences.">
              <div className="space-y-6">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/10 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-sm text-slate-850 dark:text-slate-100">{rec.title}</h4>
                        <div className="flex items-center space-x-1.5 text-xs text-sky-500 font-bold shrink-0">
                          <Clock size={12} />
                          <span>{rec.estimated_time}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed mt-1">{rec.description}</p>
                      
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {rec.technologies.map((t, index) => (
                          <span key={index} className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-[10px] font-semibold text-slate-550 dark:text-slate-400">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {rec.learning_resources && rec.learning_resources.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-slate-150 dark:border-slate-800/80">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Curated Resources:</span>
                        <div className="flex flex-wrap gap-3 mt-2">
                          {rec.learning_resources.map((link, index) => (
                            <span key={index} className="text-sky-500 text-[10px] font-semibold flex items-center space-x-0.5">
                              <Bookmark size={10} />
                              <span>{link}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Resume display */}
          {resumeMarkdown && (
            <Card title="Generated Resume Portfolio" subtitle="Generated automatically from your project history.">
              <pre className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl text-xs overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed text-slate-700 dark:text-slate-300">
                {resumeMarkdown}
              </pre>
            </Card>
          )}

          {!recommendations.length && !resumeMarkdown && (
            <div className="text-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/10">
              <Sparkles className="text-slate-400 mx-auto mb-2" size={32} />
              <p className="text-xs text-slate-500 font-semibold">Select recommendation inputs or draft resume above</p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="text-xs text-rose-400 flex items-center space-x-2 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex items-center space-x-3 shadow-xl">
            <RefreshCw className="animate-spin text-sky-500" size={20} />
            <span className="text-xs font-semibold">Generating AI Artifact...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIHub;
