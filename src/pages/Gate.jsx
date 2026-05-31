import { useGateStore } from '../store/useGateStore';
import { useAppStore } from '../store/useAppStore';
import { useState, useMemo } from 'react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Clock, Target, Plus, Flame, Award, X, Video, FileText } from 'lucide-react';

export default function Gate() {
  const { subjects, progress, mockTests, addStudySession, addMockTest, removeMockTest, getWeeklyStudyHours, updateProgress } = useGateStore();
  const { gateExamDate } = useAppStore();

  const [showLogModal, setShowLogModal] = useState(false);
  const [showMockModal, setShowMockModal] = useState(false);

  // Form states
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.id || '');
  const [sessionHours, setSessionHours] = useState(2);
  const [sessionPyqs, setSessionPyqs] = useState(10);
  const [sessionVideos, setSessionVideos] = useState(1);
  const [sessionNotes, setSessionNotes] = useState(true);

  const [mockName, setMockName] = useState('');
  const [mockScore, setMockScore] = useState(65);
  const [mockMax, setMockMax] = useState(100);

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
    if (!selectedSubject) return;

    // Log study session hours
    addStudySession(selectedSubject, Number(sessionHours));

    // Update cumulative counts for sub values
    const current = progress[selectedSubject] || { videos: 0, hours: 0, pyqs: 0, notes: 0, revisions: 0 };
    updateProgress(selectedSubject, 'pyqs', (current.pyqs || 0) + Number(sessionPyqs));
    updateProgress(selectedSubject, 'videos', (current.videos || 0) + Number(sessionVideos));
    updateProgress(selectedSubject, 'notes', (current.notes || 0) + (sessionNotes ? 1 : 0));
    updateProgress(selectedSubject, 'revisions', (current.revisions || 0) + 1);

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
            <span className="badge badge-purple">GATE preparation system</span>
            <h1 className="text-3xl font-extrabold tracking-tight">GATE CS 2027 Dashboard</h1>
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
          <h3 className="font-semibold text-fg text-lg flex items-center gap-2">
            <BookOpen size={20} className="text-primary-500" /> Syllabus Tracker (Subject-Wise Progress)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjects.map(sub => {
              const p = progress[sub.id] || { hours: 0, pyqs: 0, notes: 0, revisions: 0, videos: 0 };
              // Cap progress visually at 100
              const progressPct = Math.min(100, Math.round((p.hours / 60) * 100)); // assume 60h per subject target
              return (
                <div key={sub.id} className="p-4 rounded-xl border border-surface bg-surface-secondary/40 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-sm text-fg">{sub.name}</h4>
                      <p className="text-xs text-fg-3">{p.hours || 0} hrs study · {p.pyqs || 0} PYQs</p>
                    </div>
                    <span className="badge text-[10px]" style={{ color: sub.color, backgroundColor: `${sub.color}15` }}>
                      {p.revisions || 0} revs
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-fg-3">
                      <span>Progress (est)</span>
                      <span>{progressPct}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progressPct}%`, background: sub.color }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Charts & Analytics */}
        <div className="space-y-6">
          <div className="card p-6 border-surface space-y-4">
            <h3 className="font-semibold text-fg">Study Hours Distribution</h3>
            {pieData.length === 0 ? (
              <p className="text-xs text-fg-3 py-10 text-center">Log study sessions to view distribution chart.</p>
            ) : (
              <div className="h-60 w-full">
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
              <div className="h-60 w-full">
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
                <div>
                  <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">Subject</label>
                  <select
                    value={selectedSubject}
                    onChange={e => setSelectedSubject(e.target.value)}
                    className="input"
                  >
                    {subjects.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>

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
                  <button type="submit" className="btn-primary">Save Session</button>
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
    </div>
  );
}
