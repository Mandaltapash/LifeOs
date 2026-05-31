import { useGoalsStore } from '../store/useGoalsStore';
import { useState } from 'react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Star, Target, Plus, Check, Trash2, Calendar, X, Flag, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';

import React from 'react';

function GoalsInner() {
  const { goals, addGoal, deleteGoal, addMilestone, toggleMilestone, editMilestone, deleteMilestone, updateProgress } = useGoalsStore();

  const [activeTab, setActiveTab] = useState('long'); // 'long' | 'short'
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedGoalId, setExpandedGoalId] = useState(null);

  // New Goal Form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newCategory, setNewCategory] = useState('academic');
  const [newColor, setNewColor] = useState('#6366f1');

  // Milestone input form state per goal
  const [milestoneInputs, setMilestoneInputs] = useState({});
  const [editingMilestoneId, setEditingMilestoneId] = useState(null);
  const [editingMilestoneTitle, setEditingMilestoneTitle] = useState('');

  const filteredGoals = goals.filter(g => g.type === activeTab);

  const handleAddGoalSubmit = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addGoal({
      title: newTitle,
      type: activeTab,
      description: newDesc,
      deadline: newDeadline,
      category: newCategory,
      color: newColor
    });

    setNewTitle('');
    setNewDesc('');
    setNewDeadline('');
    setShowAddModal(false);
  };

  const handleAddMilestone = (goalId) => {
    const text = milestoneInputs[goalId] || '';
    if (!text.trim()) return;

    addMilestone(goalId, text);

    // Clear input
    setMilestoneInputs(prev => ({ ...prev, [goalId]: '' }));

    // Recompute goal completion score based on milestones done
    setTimeout(() => {
      updateGoalCompletion(goalId);
    }, 50);
  };

  const handleToggleMilestone = (goalId, milestoneId) => {
    toggleMilestone(goalId, milestoneId);
    setTimeout(() => {
      updateGoalCompletion(goalId);
    }, 50);
  };

  const handleSaveEditMilestone = (goalId, milestoneId) => {
    if (!editingMilestoneTitle.trim()) return;
    editMilestone(goalId, milestoneId, editingMilestoneTitle);
    setEditingMilestoneId(null);
    setEditingMilestoneTitle('');
  };

  const handleDeleteMilestone = (goalId, milestoneId) => {
    if (confirm('Delete this milestone?')) {
      deleteMilestone(goalId, milestoneId);
      setTimeout(() => {
        updateGoalCompletion(goalId);
      }, 50);
    }
  };

  const updateGoalCompletion = (goalId) => {
    const goal = useGoalsStore.getState().goals.find(g => g.id === goalId);
    if (!goal || !goal.milestones.length) return;
    const completed = goal.milestones.filter(m => m.done).length;
    const progressPct = Math.round((completed / goal.milestones.length) * 100);
    updateProgress(goalId, progressPct);
  };

  // Goals progress chart data
  const chartData = goals.map(g => ({
    name: g.title,
    progress: g.progress || 0,
    color: g.color
  }));

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Star className="text-primary-500" /> Goal Planner
          </h1>
          <p className="page-subtitle">Track long-term visions and short-term execution targets with milestones.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus size={16} /> Add New Goal
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-surface-secondary rounded-xl border border-surface-border w-max">
        <button
          onClick={() => setActiveTab('long')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'long'
              ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30 shadow-glow-primary'
              : 'text-fg-3 hover:text-fg'
          }`}
        >
          Long-Term Goals
        </button>
        <button
          onClick={() => setActiveTab('short')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'short'
              ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30 shadow-glow-primary'
              : 'text-fg-3 hover:text-fg'
          }`}
        >
          Short-Term Goals
        </button>
      </div>

      {/* Grid: Goal Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {filteredGoals.length === 0 ? (
            <div className="text-center py-20 card border-surface text-fg-3">
              <p>No goals logged. Click "Add New Goal" to start.</p>
            </div>
          ) : (
            filteredGoals.map(goal => {
              const daysLeft = goal.deadline ? differenceInDays(parseISO(goal.deadline), new Date()) : null;
              const isOverdue = daysLeft !== null && daysLeft < 0;
              const isExpanded = expandedGoalId === goal.id;

              return (
                <div
                  key={goal.id}
                  className="card p-5 border-surface hover-lift flex flex-col justify-between"
                  style={{ borderLeft: `4px solid ${goal.color}` }}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="badge text-[10px] uppercase font-bold" style={{ color: goal.color, backgroundColor: `${goal.color}15` }}>
                          {goal.category}
                        </span>
                        <h3 className="text-base font-extrabold text-fg mt-1">{goal.title}</h3>
                        <p className="text-xs text-fg-3 mt-0.5">{goal.description}</p>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm('Delete goal?')) deleteGoal(goal.id);
                        }}
                        className="text-fg-3 hover:text-red-400 btn-icon"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-fg-2">Progress</span>
                        <span style={{ color: goal.color }}>{goal.progress}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${goal.progress}%`, background: goal.color }} />
                      </div>
                    </div>

                    {/* Deadline details */}
                    <div className="flex justify-between items-center text-xs text-fg-3 pt-2">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        Deadline: {(() => {
                          try {
                            return goal.deadline ? format(parseISO(goal.deadline), 'dd MMM yyyy') : 'No target';
                          } catch(e) {
                            return 'Invalid Date';
                          }
                        })()}
                      </span>
                      {daysLeft !== null && (
                        <span className={`badge ${isOverdue ? 'badge-danger' : 'badge-primary'}`}>
                          {isOverdue ? 'Overdue' : `${daysLeft} days left`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expand Milestones */}
                  <div className="mt-4 pt-3 border-t border-surface-border">
                    <button
                      onClick={() => setExpandedGoalId(isExpanded ? null : goal.id)}
                      className="flex items-center justify-between w-full text-xs font-semibold text-fg-2 hover:text-fg"
                    >
                      <span className="flex items-center gap-1.5"><Flag size={12} /> Milestones ({goal.milestones?.length || 0})</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden mt-3 space-y-2 pl-2"
                        >
                          {/* List milestones */}
                          {(goal.milestones || []).map(milestone => (
                            <div key={milestone.id} className="flex items-center gap-2 group">
                              <button
                                onClick={() => handleToggleMilestone(goal.id, milestone.id)}
                                className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                                  milestone.done ? 'bg-accent-500 border-accent-600 text-white' : 'border-surface-border'
                                }`}
                              >
                                {milestone.done && <Check size={10} />}
                              </button>
                              
                              {editingMilestoneId === milestone.id ? (
                                <div className="flex-1 flex items-center gap-2">
                                  <input 
                                    autoFocus
                                    value={editingMilestoneTitle}
                                    onChange={e => setEditingMilestoneTitle(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSaveEditMilestone(goal.id, milestone.id)}
                                    className="input py-0.5 px-2 text-xs flex-1"
                                  />
                                  <button onClick={() => handleSaveEditMilestone(goal.id, milestone.id)} className="btn-icon text-accent-500">
                                    <Check size={14} />
                                  </button>
                                  <button onClick={() => setEditingMilestoneId(null)} className="btn-icon text-fg-3">
                                    <X size={14} />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span className={`text-xs flex-1 ${milestone.done ? 'line-through text-fg-3' : 'text-fg-2'}`}>
                                    {milestone.title}
                                  </span>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                      onClick={() => {
                                        setEditingMilestoneId(milestone.id);
                                        setEditingMilestoneTitle(milestone.title);
                                      }} 
                                      className="btn-icon text-fg-3 hover:text-primary-400 p-0.5"
                                    >
                                      <Edit2 size={12} />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteMilestone(goal.id, milestone.id)} 
                                      className="btn-icon text-fg-3 hover:text-red-400 p-0.5"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}

                          {/* Add milestone inline */}
                          <div className="flex gap-2 pt-2">
                            <input
                              value={milestoneInputs[goal.id] || ''}
                              onChange={e => setMilestoneInputs(prev => ({ ...prev, [goal.id]: e.target.value }))}
                              placeholder="New milestone..."
                              className="input py-1 text-xs"
                              onKeyDown={e => e.key === 'Enter' && handleAddMilestone(goal.id)}
                            />
                            <button onClick={() => handleAddMilestone(goal.id)} className="btn-primary py-1 px-3 text-xs">
                              Add
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Goals Progress Summary Chart */}
        <div className="card p-6 border-surface space-y-4">
          <h3 className="font-semibold text-fg flex items-center gap-2">
            <Target size={20} className="text-primary-500" /> Goal Progress Index
          </h3>
          {goals.length === 0 ? (
            <p className="text-xs text-fg-3 py-10 text-center">Add goals to visualize progress chart.</p>
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" stroke="var(--text-muted)" fontSize={10} domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={10} width={80} />
                  <Tooltip />
                  <Bar dataKey="progress" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Add Goal Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="modal-content"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-fg">Add New {activeTab === 'long' ? 'Long-Term' : 'Short-Term'} Goal</h3>
                <button onClick={() => setShowAddModal(false)} className="btn-icon text-fg-3 hover:text-fg">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddGoalSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">Goal Title</label>
                  <input
                    autoFocus
                    required
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="E.g. Crack GATE Rank < 100"
                    className="input"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">Description</label>
                  <textarea
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    placeholder="Describe your vision and roadmap..."
                    className="input h-20 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">Target Date</label>
                    <input
                      type="date"
                      required
                      value={newDeadline}
                      onChange={e => setNewDeadline(e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">Category</label>
                    <select
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value)}
                      className="input"
                    >
                      <option value="academic">Academic / Study</option>
                      <option value="coding">Coding Skill</option>
                      <option value="project">Project Launch</option>
                      <option value="career">Career / Freelance</option>
                      <option value="fitness">Fitness / Health</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">Card Accent Color</label>
                  <input
                    type="color"
                    value={newColor}
                    onChange={e => setNewColor(e.target.value)}
                    className="input p-1 h-10 cursor-pointer"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn-ghost">Cancel</button>
                  <button type="submit" className="btn-primary">Save Goal</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

class GoalsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Goals Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-950/20 border border-red-500/30 rounded-2xl text-red-200 space-y-4 m-6">
          <h2 className="text-lg font-bold flex items-center gap-2">Something went wrong in Goals:</h2>
          <pre className="text-xs p-4 bg-black/40 rounded-xl overflow-auto max-w-full font-mono">
            {this.state.error?.stack || this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => {
              if(confirm("This will reset your goals data to fix the crash. Continue?")) {
                localStorage.removeItem('lifeos-goals');
                window.location.reload();
              }
            }}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg text-sm font-bold transition-all mt-4 block"
          >
            Clear Data & Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Goals() {
  return (
    <GoalsErrorBoundary>
      <GoalsInner />
    </GoalsErrorBoundary>
  );
}
