import { useGateStore } from '../store/useGateStore';
import { useAppStore } from '../store/useAppStore';
import { useState, useMemo } from 'react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Clock, Target, Plus, Flame, Award, X, Video, FileText, Edit3, Trash2, AlertTriangle } from 'lucide-react';

const PRESET_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f43f5e',
  '#f97316',
  '#f59e0b',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
];

export default function Gate() {
  const { 
    subjects, 
    progress, 
    mockTests, 
    addStudySession, 
    addMockTest, 
    removeMockTest, 
    getWeeklyStudyHours, 
    updateProgress, 
    setSubjectProgress,
    addSubject,
    updateSubject,
    deleteSubject
  } = useGateStore();
  const { gateExamDate, examName } = useAppStore();

  const [showLogModal, setShowLogModal] = useState(false);
  const [showMockModal, setShowMockModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form states
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.id || '');
  const [sessionHours, setSessionHours] = useState(2);
  const [sessionPyqs, setSessionPyqs] = useState(10);
  const [sessionVideos, setSessionVideos] = useState(1);
  const [sessionNotes, setSessionNotes] = useState(true);

  const [mockName, setMockName] = useState('');
  const [mockScore, setMockScore] = useState(65);
  const [mockMax, setMockMax] = useState(100);

  // Add Subject states
  const [newSubName, setNewSubName] = useState('');
  const [newSubColor, setNewSubColor] = useState('#6366f1');
  const [newSubTargetHours, setNewSubTargetHours] = useState(60);
  const [newSubHours, setNewSubHours] = useState(0);
  const [newSubPyqs, setNewSubPyqs] = useState(0);
  const [newSubVideos, setNewSubVideos] = useState(0);
  const [newSubNotes, setNewSubNotes] = useState(0);
  const [newSubRevisions, setNewSubRevisions] = useState(0);

  // Edit Subject states
  const [editSubjectId, setEditSubjectId] = useState('');
  const [editSubjectName, setEditSubjectName] = useState('');
  const [editSubjectColor, setEditSubjectColor] = useState('#6366f1');
  const [editTargetHours, setEditTargetHours] = useState(60);
  const [editHours, setEditHours] = useState(0);
  const [editPyqs, setEditPyqs] = useState(0);
  const [editVideos, setEditVideos] = useState(0);
  const [editRevisions, setEditRevisions] = useState(0);
  const [editNotes, setEditNotes] = useState(0);

  // Exam Countdown
  const daysToGate = useMemo(() => {
    const target = parseISO(`${gateExamDate}T00:00:00`) || new Date('2027-02-01T00:00:00');
    return Math.max(0, differenceInDays(target, new Date()));
  }, [gateExamDate]);

  // Overall Stats
  const overallStats = useMemo(() => {
    let totalHours = 0;
    let totalPyqs = 0;
    let totalNotes = 0;
    let totalVideos = 0;

    subjects.forEach(sub => {
      const p = progress[sub.id] || { hours: 0, pyqs: 0, notes: 0, videos: 0 };
      totalHours += p.hours || 0;
      totalPyqs += p.pyqs || 0;
      totalNotes += p.notes || 0;
      totalVideos += p.videos || 0;
    });

    return { totalHours, totalPyqs, totalNotes, totalVideos };
  }, [progress, subjects]);

  const handleLogSubmit = (e) => {
    e.preventDefault();
    const targetSub = subjects.some(s => s.id === selectedSubject) ? selectedSubject : (subjects[0]?.id || '');
    if (!targetSub) return;

    // Log study session hours
    addStudySession(targetSub, Number(sessionHours));

    // Update cumulative counts for sub values
    const current = progress[targetSub] || { videos: 0, hours: 0, pyqs: 0, notes: 0, revisions: 0 };
    updateProgress(targetSub, 'pyqs', (current.pyqs || 0) + Number(sessionPyqs));
    updateProgress(targetSub, 'videos', (current.videos || 0) + Number(sessionVideos));
    updateProgress(targetSub, 'notes', (current.notes || 0) + (sessionNotes ? 1 : 0));
    updateProgress(targetSub, 'revisions', (current.revisions || 0) + 1);

    setShowLogModal(false);
  };

  const handleMockSubmit = (e) => {
    e.preventDefault();
    if (!mockName.trim()) return;
    addMockTest({
      name: mockName,
      score: Number(mockScore),
      maxScore: Number(mockMax),
      date: format(new Date(), 'yyyy-MM-dd')
    });
    setMockName('');
    setShowMockModal(false);
  };

  // Add Subject Handlers
  const openAddModal = () => {
    setNewSubName('');
    setNewSubColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    setNewSubTargetHours(60);
    setNewSubHours(0);
    setNewSubPyqs(0);
    setNewSubVideos(0);
    setNewSubNotes(0);
    setNewSubRevisions(0);
    setShowAddModal(true);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newSubName.trim()) return;

    addSubject(
      {
        name: newSubName.trim(),
        color: newSubColor,
        targetHours: Number(newSubTargetHours) || 60,
      },
      {
        hours: Number(newSubHours) || 0,
        pyqs: Number(newSubPyqs) || 0,
        videos: Number(newSubVideos) || 0,
        notes: Number(newSubNotes) || 0,
        revisions: Number(newSubRevisions) || 0,
      }
    );

    setShowAddModal(false);
  };

  // Edit Subject Handlers
  const openEditModal = (sub) => {
    const p = progress[sub.id] || { hours: 0, pyqs: 0, videos: 0, revisions: 0, notes: 0 };
    setEditSubjectId(sub.id);
    setEditSubjectName(sub.name);
    setEditSubjectColor(sub.color || '#6366f1');
    setEditTargetHours(sub.targetHours || 60);
    setEditHours(p.hours || 0);
    setEditPyqs(p.pyqs || 0);
    setEditVideos(p.videos || 0);
    setEditRevisions(p.revisions || 0);
    setEditNotes(p.notes || 0);
    setShowEditModal(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editSubjectId) return;
    
    updateSubject(
      editSubjectId,
      {
        name: editSubjectName.trim(),
        color: editSubjectColor,
        targetHours: Number(editTargetHours) || 60,
      },
      {
        hours: Number(editHours) || 0,
        pyqs: Number(editPyqs) || 0,
        videos: Number(editVideos) || 0,
        revisions: Number(editRevisions) || 0,
        notes: Number(editNotes) || 0,
      }
    );
    
    setShowEditModal(false);
  };

  // Delete Subject Handlers
  const openDeleteModal = (sub) => {
    setDeleteTarget(sub);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteSubject(deleteTarget.id);
    setDeleteTarget(null);
  };

  // Recharts Subject Comparison Data
  const subjectsData = useMemo(() => {
    return subjects.map(sub => {
      const p = progress[sub.id] || { hours: 0, pyqs: 0, notes: 0, revisions: 0 };
      return {
        name: sub.name,
        hours: p.hours || 0,
        pyqs: p.pyqs || 0,
        color: sub.color
      };
    });
  }, [progress, subjects]);

  // Donut chart of hours
  const pieData = useMemo(() => {
    return subjectsData.filter(d => d.hours > 0);
  }, [subjectsData]);

  const weeklyHours = getWeeklyStudyHours();

  return (
    <div className="space-y-6 page-enter">
      {/* Top Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-purple-900 to-indigo-900 p-8 text-white border border-indigo-800 shadow-glow-primary">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <span className="badge badge-purple">{examName || 'GATE'} preparation system</span>
            <h1 className="text-3xl font-extrabold tracking-tight">{examName || 'GATE'} Dashboard</h1>
            <p className="text-slate-300">Track subject syllabus, revisions, practice tests, and total study hours.</p>
          </div>
          <div className="flex items-center gap-6 bg-black/30 px-6 py-4 rounded-2xl border border-white/5 backdrop-blur-md">
            <div className="text-center border-r border-white/10 pr-6">
              <span className="text-xs uppercase text-slate-400">Countdown</span>
              <h2 className="text-2xl font-bold font-mono text-purple-300">{daysToGate} Days</h2>
            </div>
            <div className="text-center">
              <span className="text-xs uppercase text-slate-400">Study Hours</span>
              <h2 className="text-2xl font-bold font-mono text-emerald-400">{overallStats.totalHours} hrs</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <span className="stat-label">Total Study Time</span>
          <h3 className="stat-value">{overallStats.totalHours} <span className="text-sm font-medium text-fg-3">hrs</span></h3>
        </div>
        <div className="stat-card">
          <span className="stat-label">PYQs Solved</span>
          <h3 className="stat-value">{overallStats.totalPyqs} <span className="text-sm font-medium text-fg-3">questions</span></h3>
        </div>
        <div className="stat-card">
          <span className="stat-label">Videos Completed</span>
          <h3 className="stat-value">{overallStats.totalVideos} <span className="text-sm font-medium text-fg-3">lectures</span></h3>
        </div>
        <div className="stat-card">
          <span className="stat-label">Mock Tests Done</span>
          <h3 className="stat-value">{mockTests.length} <span className="text-sm font-medium text-fg-3">tests</span></h3>
        </div>
      </div>

      {/* Quick Action Bar */}
      <div className="flex gap-2">
        <button onClick={() => setShowLogModal(true)} className="btn-primary">
          <Plus size={16} /> Log Study Session
        </button>
        <button onClick={() => setShowMockModal(true)} className="btn-secondary">
          <Award size={16} /> Log Mock Test Score
        </button>
      </div>

      {/* Grid: Subjects Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6 border-surface space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <h3 className="font-semibold text-fg text-lg flex items-center gap-2">
              <BookOpen size={20} className="text-primary-500" /> Syllabus Tracker (Subject-Wise Progress)
            </h3>
            <button 
              onClick={openAddModal}
              className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus size={14} /> Add Subject
            </button>
          </div>

          {subjects.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-surface-border rounded-2xl bg-surface-secondary/20 space-y-3">
              <BookOpen size={36} className="mx-auto text-fg-3 opacity-40" />
              <div>
                <p className="text-sm font-semibold text-fg">No Subjects in Syllabus</p>
                <p className="text-xs text-fg-3 mt-1 max-w-xs mx-auto">Add your subjects to start tracking hours, PYQs, videos, and syllabus completion.</p>
              </div>
              <button onClick={openAddModal} className="btn-primary py-1.5 px-3 text-xs inline-flex items-center gap-1">
                <Plus size={14} /> Add First Subject
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjects.map(sub => {
                const p = progress[sub.id] || { hours: 0, pyqs: 0, notes: 0, revisions: 0, videos: 0 };
                const target = sub.targetHours || 60;
                const progressPct = Math.min(100, Math.round(((p.hours || 0) / target) * 100));
                return (
                  <div key={sub.id} className="p-4 rounded-xl border border-surface bg-surface-secondary/40 space-y-3 relative group transition-all hover:border-surface-border">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: sub.color || '#6366f1' }} />
                          <h4 className="font-semibold text-sm text-fg truncate" title={sub.name}>
                            {sub.name}
                          </h4>
                        </div>
                        <p className="text-xs text-fg-3 mt-1 truncate">
                          {p.hours || 0} hrs study · {p.pyqs || 0} PYQs · {p.videos || 0} vids
                        </p>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="badge text-[10px]" style={{ color: sub.color || '#6366f1', backgroundColor: `${sub.color || '#6366f1'}15` }}>
                          {p.revisions || 0} revs
                        </span>
                        <button 
                          onClick={() => openEditModal(sub)}
                          className="p-1 rounded text-fg-3 hover:text-primary-400 hover:bg-surface transition-colors"
                          title="Edit Subject & Progress"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button 
                          onClick={() => openDeleteModal(sub)}
                          className="p-1 rounded text-fg-3 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete Subject"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-fg-3">
                        <span>Progress ({p.hours || 0}/{target} hrs)</span>
                        <span>{progressPct}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progressPct}%`, background: sub.color || '#6366f1' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Charts & Analytics */}
        <div className="space-y-6">
          <div className="card p-6 border-surface space-y-4">
            <h3 className="font-semibold text-fg">Study Hours Distribution</h3>
            {pieData.length === 0 ? (
              <p className="text-xs text-fg-3 py-10 text-center">Log study sessions to view distribution chart.</p>
            ) : (
              <div style={{ width: '100%', height: 250, minHeight: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="hours"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="card p-6 border-surface space-y-4">
            <h3 className="font-semibold text-fg">Mock Test Scores Trend</h3>
            {mockTests.length === 0 ? (
              <p className="text-xs text-fg-3 py-10 text-center">Add mock tests to display performance trends.</p>
            ) : (
              <div style={{ width: '100%', height: 250, minHeight: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockTests}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" />
                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Log Study Session Modal */}
      <AnimatePresence>
        {showLogModal && (
          <div className="modal-overlay" onClick={() => setShowLogModal(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="modal-content"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-fg">Log Study Session</h3>
                <button onClick={() => setShowLogModal(false)} className="btn-icon text-fg-3 hover:text-fg">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleLogSubmit} className="space-y-4">
                {subjects.length === 0 ? (
                  <div className="p-4 rounded-xl bg-surface-secondary text-center space-y-2">
                    <p className="text-sm text-fg-2">No subjects available to log study session for.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowLogModal(false);
                        openAddModal();
                      }}
                      className="btn-primary py-1.5 px-3 text-xs inline-flex items-center gap-1"
                    >
                      <Plus size={14} /> Add a Subject First
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">Subject</label>
                    <select
                      value={subjects.some(s => s.id === selectedSubject) ? selectedSubject : (subjects[0]?.id || '')}
                      onChange={e => setSelectedSubject(e.target.value)}
                      className="input"
                    >
                      {subjects.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">Study Hours</label>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      required
                      value={sessionHours}
                      onChange={e => setSessionHours(e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">PYQs Solved</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={sessionPyqs}
                      onChange={e => setSessionPyqs(e.target.value)}
                      className="input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">Videos Watched</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={sessionVideos}
                      onChange={e => setSessionVideos(e.target.value)}
                      className="input"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="notes"
                      checked={sessionNotes}
                      onChange={e => setSessionNotes(e.target.checked)}
                      className="rounded bg-surface-secondary border-surface-border text-primary-500 focus:ring-primary-500"
                    />
                    <label htmlFor="notes" className="text-sm font-semibold text-fg-2">Created Notes</label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowLogModal(false)} className="btn-ghost">Cancel</button>
                  <button type="submit" disabled={subjects.length === 0} className="btn-primary disabled:opacity-50">Save Session</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Log Mock Test Modal */}
      <AnimatePresence>
        {showMockModal && (
          <div className="modal-overlay" onClick={() => setShowMockModal(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="modal-content"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-fg">Log Mock Test Score</h3>
                <button onClick={() => setShowMockModal(false)} className="btn-icon text-fg-3 hover:text-fg">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleMockSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">Test Name</label>
                  <input
                    autoFocus
                    required
                    value={mockName}
                    onChange={e => setMockName(e.target.value)}
                    placeholder="E.g. Full Length Mock 1"
                    className="input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">Score</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={mockScore}
                      onChange={e => setMockScore(e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">Max Score</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={mockMax}
                      onChange={e => setMockMax(e.target.value)}
                      className="input"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowMockModal(false)} className="btn-ghost">Cancel</button>
                  <button type="submit" className="btn-primary">Save Score</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Subject Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="modal-content max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-fg flex items-center gap-2">
                  <Plus size={18} className="text-primary-500" /> Add Subject to Syllabus
                </h3>
                <button onClick={() => setShowAddModal(false)} className="btn-icon text-fg-3 hover:text-fg">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">Subject Name *</label>
                  <input
                    autoFocus
                    required
                    value={newSubName}
                    onChange={e => setNewSubName(e.target.value)}
                    placeholder="E.g. Theory of Computation, DBMS"
                    className="input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">Target Study Hours</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={newSubTargetHours}
                      onChange={e => setNewSubTargetHours(e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">Theme Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newSubColor}
                        onChange={e => setNewSubColor(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-surface-border p-1"
                      />
                      <div className="flex flex-wrap gap-1">
                        {PRESET_COLORS.slice(0, 5).map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setNewSubColor(c)}
                            className="w-6 h-6 rounded-full border border-white/20 transition-transform hover:scale-110"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-surface-border">
                  <p className="text-xs font-semibold text-fg mb-3">Initial Progress (Optional)</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-fg-3 mb-1 block">Study Hours</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={newSubHours}
                        onChange={e => setNewSubHours(e.target.value)}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-fg-3 mb-1 block">PYQs Solved</label>
                      <input
                        type="number"
                        min="0"
                        value={newSubPyqs}
                        onChange={e => setNewSubPyqs(e.target.value)}
                        className="input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div>
                      <label className="text-xs text-fg-3 mb-1 block">Videos</label>
                      <input
                        type="number"
                        min="0"
                        value={newSubVideos}
                        onChange={e => setNewSubVideos(e.target.value)}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-fg-3 mb-1 block">Notes Units</label>
                      <input
                        type="number"
                        min="0"
                        value={newSubNotes}
                        onChange={e => setNewSubNotes(e.target.value)}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-fg-3 mb-1 block">Revisions</label>
                      <input
                        type="number"
                        min="0"
                        value={newSubRevisions}
                        onChange={e => setNewSubRevisions(e.target.value)}
                        className="input"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn-ghost">Cancel</button>
                  <button type="submit" className="btn-primary">Add Subject</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Subject & Progress Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="modal-content max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-fg flex items-center gap-2">
                  <Edit3 size={18} className="text-primary-500" /> Edit Subject & Progress
                </h3>
                <button onClick={() => setShowEditModal(false)} className="btn-icon text-fg-3 hover:text-fg">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">Subject Name *</label>
                  <input
                    required
                    value={editSubjectName}
                    onChange={e => setEditSubjectName(e.target.value)}
                    className="input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">Target Study Hours</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={editTargetHours}
                      onChange={e => setEditTargetHours(e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">Theme Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editSubjectColor}
                        onChange={e => setEditSubjectColor(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-surface-border p-1"
                      />
                      <div className="flex flex-wrap gap-1">
                        {PRESET_COLORS.slice(0, 5).map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setEditSubjectColor(c)}
                            className="w-6 h-6 rounded-full border border-white/20 transition-transform hover:scale-110"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-surface-border">
                  <p className="text-xs font-semibold text-fg mb-3">Progress Metrics</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">Study Hours</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        required
                        value={editHours}
                        onChange={e => setEditHours(e.target.value)}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">PYQs Solved</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={editPyqs}
                        onChange={e => setEditPyqs(e.target.value)}
                        className="input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">Videos Watched</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={editVideos}
                        onChange={e => setEditVideos(e.target.value)}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">Notes Created (Units)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={editNotes}
                        onChange={e => setEditNotes(e.target.value)}
                        className="input"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">Revisions Completed</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={editRevisions}
                      onChange={e => setEditRevisions(e.target.value)}
                      className="input"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button type="button" onClick={() => setShowEditModal(false)} className="btn-ghost">Cancel</button>
                  <button type="submit" className="btn-primary">Save Changes</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Subject Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card w-full max-w-sm p-6 shadow-2xl space-y-4"
              style={{ background: 'var(--surface-primary)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                  <Trash2 size={20} className="text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-fg">Delete Subject?</h3>
                  <p className="text-xs text-fg-3">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-sm text-fg-2 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-fg">"{deleteTarget.name}"</span>? All recorded study sessions, PYQs, and tracked progress for this subject will be removed.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="btn-ghost flex-1 justify-center border border-surface"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="btn-danger flex-1 justify-center"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
