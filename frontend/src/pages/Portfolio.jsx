import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { projectAPI } from '../services/api';
import Card from '../components/Card';
import { 
  Github, 
  Linkedin, 
  Globe, 
  FileText, 
  Award, 
  BookOpen, 
  Briefcase, 
  Trophy,
  ExternalLink,
  Code,
  QrCode,
  Printer
} from 'lucide-react';

const Portfolio = () => {
  const { rollOrId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const portData = await projectAPI.getPortfolio(rollOrId);
        setData(portData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, [rollOrId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-sky-500"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500 font-semibold">Academic portfolio not found.</p>
      </div>
    );
  }

  const { student, projects, certificates, achievements, research_papers, internships, patents, hackathons } = data;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto print:p-0 print:max-w-full">
      {/* Portfolio Controls */}
      <div className="flex justify-end space-x-3 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center space-x-1.5 py-2 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-all text-slate-700 dark:text-slate-200"
        >
          <Printer size={14} />
          <span>Print Portfolio / Save PDF</span>
        </button>
      </div>

      {/* Header Profile Section */}
      <div className="relative bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-500/10 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 overflow-hidden flex flex-col md:flex-row md:items-center justify-between space-y-6 md:space-y-0">
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 rounded-2xl bg-sky-500 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-sky-500/10">
            {student.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">{student.name}</h2>
            <p className="text-xs text-sky-500 font-bold uppercase tracking-wider mt-1">
              {student.department} • Roll: {student.roll_number}
            </p>
            <p className="text-xs text-slate-550 dark:text-slate-400 mt-0.5">
              Year {student.year} • Section {student.section} • Batch {student.batch || 'N/A'}
            </p>
            
            {/* Social Links */}
            <div className="flex items-center space-x-3 mt-4 print:hidden">
              {student.github && (
                <a href={student.github} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <Github size={16} />
                </a>
              )}
              {student.linkedin && (
                <a href={student.linkedin} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-sky-500 transition-colors">
                  <Linkedin size={16} />
                </a>
              )}
              {student.resume_url && (
                <a href={student.resume_url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-rose-500 transition-colors">
                  <FileText size={16} />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* QR Code and sharing details */}
        <div className="flex items-center space-x-4 bg-white/60 dark:bg-slate-950/40 p-4 border border-slate-200 dark:border-slate-800/80 rounded-2xl shrink-0">
          <div>
            <h5 className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Public Portfolio</h5>
            <p className="text-[10px] text-slate-500 leading-normal mt-0.5">Scan to verify student details.</p>
          </div>
          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(window.location.href)}`}
            alt="Portfolio QR" 
            className="w-12 h-12 rounded border border-slate-100 bg-white"
          />
        </div>
      </div>

      {/* Skills */}
      {student.skills && (
        <Card title="Skills Matrix">
          <div className="flex flex-wrap gap-2">
            {student.skills.map((skill, idx) => (
              <span key={idx} className="bg-sky-500/5 text-sky-500 dark:bg-sky-500/10 px-3 py-1.5 rounded-xl text-xs font-bold border border-sky-500/10">
                {skill}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Projects */}
      <div className="space-y-6">
        <h3 className="text-lg font-extrabold border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center space-x-2">
          <Code size={18} className="text-sky-500" />
          <span>Academic Projects</span>
        </h3>
        
        {projects.length === 0 ? (
          <p className="text-xs text-slate-500">No project submissions logged in portfolio.</p>
        ) : (
          projects.map(proj => (
            <Card key={proj.id} title={proj.title} subtitle={`Category: ${proj.category || 'N/A'} • Domain: ${proj.domain || 'N/A'}`}>
              <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">{proj.description}</p>
              
              {proj.technologies && proj.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {proj.technologies.map((t, idx) => (
                    <span key={idx} className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-[10px] font-semibold">
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* Links */}
              <div className="flex items-center space-x-4 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 print:hidden">
                {proj.github_repo && (
                  <a href={proj.github_repo} target="_blank" rel="noreferrer" className="flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-850 dark:hover:text-white transition-colors">
                    <Github size={14} />
                    <span>Repository</span>
                  </a>
                )}
                {proj.live_url && (
                  <a href={proj.live_url} target="_blank" rel="noreferrer" className="flex items-center space-x-1 text-xs text-slate-500 hover:text-sky-500 transition-colors">
                    <Globe size={14} />
                    <span>Live Demo</span>
                  </a>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Internships & Work Exp */}
      {internships && internships.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-lg font-extrabold border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center space-x-2">
            <Briefcase size={18} className="text-indigo-500" />
            <span>Internships & Industry Track</span>
          </h3>
          {internships.map(i => (
            <Card key={i.id} title={i.role} subtitle={`${i.company} • ${i.start_date} to ${i.end_date || 'Present'}`}>
              <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">{i.description}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Certifications and achievements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {certificates && certificates.length > 0 && (
          <Card title="Certificates" subtitle="Professional and learning credentials.">
            <div className="space-y-4">
              {certificates.map(c => (
                <div key={c.id} className="p-4 border border-slate-150 dark:border-slate-800 rounded-xl flex items-start space-x-3">
                  <Award size={18} className="text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <h5 className="font-bold text-xs text-slate-800 dark:text-slate-100">{c.title}</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">{c.issuing_organization}</p>
                    {c.credential_url && (
                      <a href={c.credential_url} target="_blank" rel="noreferrer" className="text-[10px] text-sky-500 font-semibold flex items-center space-x-0.5 mt-2 print:hidden">
                        <span>Verify Credential</span>
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {achievements && achievements.length > 0 && (
          <Card title="Achievements & Honors" subtitle="Awards, hacking accomplishments, and ranks.">
            <div className="space-y-4">
              {achievements.map(a => (
                <div key={a.id} className="p-4 border border-slate-150 dark:border-slate-800 rounded-xl flex items-start space-x-3">
                  <Trophy size={18} className="text-purple-500 mt-0.5 shrink-0" />
                  <div>
                    <h5 className="font-bold text-xs text-slate-800 dark:text-slate-100">{a.title}</h5>
                    <p className="text-[11px] text-slate-500 leading-normal mt-0.5">{a.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Research and Patents */}
      {research_papers && research_papers.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-lg font-extrabold border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center space-x-2">
            <BookOpen size={18} className="text-emerald-500" />
            <span>Research Publications & Patents</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {research_papers.map(r => (
              <Card key={r.id} title={r.title} subtitle={`${r.journal} • Published: ${r.publication_date}`}>
                <p className="text-[10px] text-slate-500">Authors: {r.authors || 'Student'}</p>
                {r.paper_url && (
                  <a href={r.paper_url} target="_blank" rel="noreferrer" className="text-[10px] text-sky-500 font-bold inline-flex items-center space-x-0.5 mt-4 print:hidden">
                    <span>Read Publication</span>
                    <ExternalLink size={10} />
                  </a>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
