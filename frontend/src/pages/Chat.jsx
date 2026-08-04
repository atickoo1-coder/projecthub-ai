import React, { useState, useEffect, useRef } from 'react';
import { chatAPI, teacherAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import { Send, UserCircle, MessageSquare, AlertCircle } from 'lucide-react';

const Chat = () => {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [history, setHistory] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const fetchThreads = async () => {
    try {
      const data = await chatAPI.getThreads();
      setThreads(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStudents = async () => {
    try {
      const data = await teacherAPI.getAssignedStudents();
      setStudents(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearchStudents = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const data = await chatAPI.searchUsers(query, 'student');
      setSearchResults(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user && user.role === 'teacher') {
      fetchStudents();
    }
  }, [user]);

  const fetchHistory = async (otherId) => {
    try {
      const data = await chatAPI.getHistory(otherId);
      setHistory(data);
      scrollToBottom();
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchThreads();
    const interval = setInterval(() => {
      fetchThreads();
      if (activeContact) {
        fetchHistory(activeContact.id);
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [activeContact]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (history.length > 0) {
      scrollToBottom();
    }
  }, [history]);

  const handleSelectContact = (contact) => {
    setActiveContact(contact);
    fetchHistory(contact.id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeContact) return;
    setError(null);
    try {
      await chatAPI.sendMessage(activeContact.id, messageText);
      setMessageText('');
      fetchHistory(activeContact.id);
      fetchThreads();
    } catch (err) {
      setError('Failed to send message.');
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto h-[calc(100vh-64px)] flex flex-col">
      <div className="mb-6">
        <h2 className="text-3xl font-extrabold tracking-tight">Academic Chat Channels</h2>
        <p className="text-sm text-slate-500 mt-1">Direct communication lines between guide mentors and students.</p>
      </div>

      <div className="flex-1 flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {/* Left Side: Threads List */}
        <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 space-y-2">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-400 block">Discussion Channels</span>
            {user?.role === 'teacher' && (
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchStudents(e.target.value)}
                placeholder="Search students to start chat..."
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            )}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {searchQuery.trim() !== '' ? (
              searchResults.length === 0 ? (
                <p className="p-6 text-center text-xs text-slate-500">No students found matching "{searchQuery}"</p>
              ) : (
                searchResults.map(u => {
                  const thread = threads.find(t => t.id === u.id);
                  const isActive = activeContact?.id === u.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        handleSelectContact({
                          id: u.id,
                          name: u.name,
                          role: 'student'
                        });
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className={`w-full p-4 flex items-center space-x-3 text-left transition-colors hover:bg-slate-55 dark:hover:bg-slate-800/30 ${
                        isActive ? 'bg-sky-500/5 dark:bg-sky-500/10 border-l-4 border-sky-500 font-bold' : ''
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-sky-500 text-xs shrink-0">
                        {u.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-slate-850 dark:text-slate-100 truncate">{u.name}</div>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">{u.email}</p>
                      </div>
                    </button>
                  );
                })
              )
            ) : (
              <>
                {/* Guide Section (For Students) */}
                {user?.role === 'student' && user?.student_profile?.guide_user_id && (
                  <div className="p-2 bg-slate-50/30 dark:bg-slate-800/10">
                    <span className="px-2 font-bold text-[10px] uppercase tracking-wider text-slate-400">Assigned Guide</span>
                    {(() => {
                      const guideUserId = user.student_profile.guide_user_id;
                      const thread = threads.find(t => t.id === guideUserId);
                      const isActive = activeContact?.id === guideUserId;
                      return (
                        <button
                          onClick={() => handleSelectContact({
                            id: guideUserId,
                            name: user.student_profile.guide_name,
                            role: 'teacher'
                          })}
                          className={`w-full mt-1 p-3 flex items-center space-x-3 text-left rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50 ${
                            isActive ? 'bg-sky-500/5 dark:bg-sky-500/10 border-l-4 border-sky-500 font-bold' : ''
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-950/40 text-sky-500 font-bold flex items-center justify-center text-xs shrink-0">
                            {user.student_profile.guide_name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <span className="text-xs text-slate-850 dark:text-slate-100 truncate">{user.student_profile.guide_name}</span>
                              {thread && (
                                <span className="text-[9px] text-slate-400 shrink-0">
                                  {new Date(thread.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-550 truncate">
                              {thread ? thread.last_message : 'Start chat with your guide'}
                            </p>
                          </div>
                        </button>
                      );
                    })()}
                  </div>
                )}

                {/* Mentees Section (For Teachers) */}
                {user?.role === 'teacher' && (
                  <div className="p-2 bg-slate-50/30 dark:bg-slate-800/10">
                    <span className="px-2 font-bold text-[10px] uppercase tracking-wider text-slate-400">Assigned Mentees</span>
                    {students.length === 0 ? (
                      <p className="p-3 text-xs text-slate-400 italic">No assigned mentees found.</p>
                    ) : (
                      students.map(s => {
                        const thread = threads.find(t => t.id === s.user?.id);
                        const isActive = activeContact?.id === s.user?.id;
                        return (
                          <button
                            key={s.id}
                            onClick={() => handleSelectContact({
                              id: s.user?.id,
                              name: s.user?.name || s.name,
                              role: 'student'
                            })}
                            className={`w-full mt-1 p-3 flex items-center space-x-3 text-left rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50 ${
                              isActive ? 'bg-sky-500/5 dark:bg-sky-500/10 border-l-4 border-sky-500 font-bold' : ''
                            }`}
                          >
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-sky-500 text-xs shrink-0">
                              {(s.user?.name || s.name || 'S').charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <span className="text-xs text-slate-850 dark:text-slate-100 truncate">{s.user?.name || s.name}</span>
                                {thread && (
                                  <span className="text-[9px] text-slate-400 shrink-0">
                                    {new Date(thread.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 truncate">
                                {thread ? thread.last_message : 'Start chat with mentee'}
                              </p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Active Conversations Section */}
                <div className="p-2">
                  <span className="px-2 font-bold text-[10px] uppercase tracking-wider text-slate-400">All Discussions</span>
                  {threads.length === 0 ? (
                    <p className="p-3 text-xs text-slate-400 italic">No historical threads found.</p>
                  ) : (
                    threads.map((t) => {
                      if (user?.role === 'student' && t.id === user?.student_profile?.guide_user_id) return null;
                      if (user?.role === 'teacher' && students.some(s => s.user?.id === t.id)) return null;

                      return (
                        <button
                          key={t.id}
                          onClick={() => handleSelectContact(t)}
                          className={`w-full mt-1 p-3 flex items-center space-x-3 text-left rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50 ${
                            activeContact?.id === t.id ? 'bg-sky-500/5 dark:bg-sky-500/10 border-l-4 border-sky-500 font-bold' : ''
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-105 dark:bg-slate-800 flex items-center justify-center font-bold text-sky-500 text-xs shrink-0">
                            {t.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <span className="text-xs text-slate-850 dark:text-slate-100 truncate">{t.name}</span>
                              <span className="text-[9px] text-slate-400 shrink-0">
                                {new Date(t.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-550 truncate">{t.last_message}</p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Side: Message Window */}
        <div className="flex-1 flex flex-col bg-slate-50/20 dark:bg-slate-950/10">
          {activeContact ? (
            <>
              {/* Header Contact Name */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-850 flex items-center space-x-3 bg-white dark:bg-slate-900">
                <div className="w-9 h-9 rounded-full bg-sky-500 text-white font-bold flex items-center justify-center text-xs">
                  {activeContact.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-850 dark:text-slate-100">{activeContact.name}</h4>
                  <span className="text-[10px] text-slate-450 uppercase tracking-widest font-semibold">{activeContact.role}</span>
                </div>
              </div>

              {/* Message Flow */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {history.map((msg) => {
                  const isOwn = msg.sender_id === user.id;
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] p-3.5 rounded-2xl text-xs leading-normal shadow-sm ${
                        isOwn 
                          ? 'bg-sky-500 text-white rounded-tr-none' 
                          : 'bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-tl-none'
                      }`}>
                        <p>{msg.message}</p>
                        <span className={`text-[9px] block text-right mt-1.5 ${isOwn ? 'text-white/60' : 'text-slate-400'}`}>
                          {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 flex items-center space-x-3">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message here..."
                  className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="submit"
                  className="p-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl transition-colors"
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
              <MessageSquare size={36} className="mb-2.5 text-slate-400" />
              <p className="text-xs font-semibold">Select a discussion channel to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
