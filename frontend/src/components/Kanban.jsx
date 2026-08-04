import React, { useState } from 'react';
import { Plus, Trash2, ArrowRight } from 'lucide-react';

const Kanban = () => {
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Database schema configuration', desc: 'Define MySQL model keys and relationships.', status: 'todo' },
    { id: 2, title: 'Write FastAPI Auth routes', desc: 'Secure register/login endpoints via Bcrypt.', status: 'in-progress' },
    { id: 3, title: 'Integrate Framer Motion transitions', desc: 'Add animations for visual feedback.', status: 'review' },
    { id: 4, title: 'Create initial Figma mockup', desc: 'College tracking panel wireframes.', status: 'completed' },
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [activeCol, setActiveCol] = useState('todo');
  const [showAddForm, setShowAddForm] = useState(false);

  const columns = [
    { id: 'todo', title: 'To Do', color: 'bg-slate-500/10 text-slate-500 border-slate-200 dark:border-slate-800' },
    { id: 'in-progress', title: 'In Progress', color: 'bg-sky-500/10 text-sky-500 border-sky-500/20' },
    { id: 'review', title: 'Under Review', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
    { id: 'completed', title: 'Completed', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' }
  ];

  const handleMove = (id, currentStatus) => {
    const statusOrder = ['todo', 'in-progress', 'review', 'completed'];
    const nextIndex = (statusOrder.indexOf(currentStatus) + 1) % statusOrder.length;
    const nextStatus = statusOrder[nextIndex];
    
    setTasks(tasks.map(t => t.id === id ? { ...t, status: nextStatus } : t));
  };

  const handleDelete = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    const newTask = {
      id: Date.now(),
      title: newTaskTitle,
      desc: 'Add descriptive tasks here.',
      status: activeCol
    };
    
    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
    setShowAddForm(false);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-bold text-lg text-slate-850 dark:text-slate-100">Project Taskboard</h3>
          <p className="text-xs text-slate-500 mt-1">Manage project milestones and daily tasks.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-1.5 py-2 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all"
        >
          <Plus size={16} />
          <span>Add Task</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddTask} className="mb-6 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center space-x-3">
          <input
            type="text"
            placeholder="What needs to be done?"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
          <select
            value={activeCol}
            onChange={(e) => setActiveCol(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
          >
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="review">Review</option>
            <option value="completed">Completed</option>
          </select>
          <button
            type="submit"
            className="py-2 px-4 bg-slate-800 hover:bg-slate-700 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white font-bold rounded-xl text-xs transition-all"
          >
            Create
          </button>
        </form>
      )}

      {/* Grid columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <div key={col.id} className="bg-slate-50 dark:bg-slate-900/40 border border-slate-250/60 dark:border-slate-850 rounded-2xl p-4 flex flex-col min-h-[300px]">
              <div className={`p-2.5 rounded-xl border flex items-center justify-between mb-4 font-semibold text-xs ${col.color}`}>
                <span>{col.title}</span>
                <span className="bg-white/80 dark:bg-slate-950/60 px-2 py-0.5 rounded-md text-[10px]">{colTasks.length}</span>
              </div>
              
              <div className="flex-1 space-y-3 overflow-y-auto">
                {colTasks.map(task => (
                  <div key={task.id} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4 rounded-xl shadow-sm hover:shadow transition-shadow group relative">
                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">{task.title}</h4>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{task.desc}</p>
                    
                    <div className="flex items-center justify-end mt-4 pt-2 border-t border-slate-100 dark:border-slate-800/60 space-x-2">
                      <button 
                        onClick={() => handleDelete(task.id)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                        title="Delete task"
                      >
                        <Trash2 size={12} />
                      </button>
                      <button 
                        onClick={() => handleMove(task.id, task.status)}
                        className="text-slate-400 hover:text-sky-500 transition-colors p-1 flex items-center space-x-1"
                        title="Move to next stage"
                      >
                        <span className="text-[9px]">Move</span>
                        <ArrowRight size={10} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Kanban;
