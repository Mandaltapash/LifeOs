import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell, CartesianGrid, Legend,
} from 'recharts';
import {
  Code2, Plus, TrendingUp, Target, Clock,
  Trash2, Filter, X, Check, Star, Zap,
} from 'lucide-react';
import { useCodingStore } from '../store/useCodingStore';

/* ─────────────────────────────────────────────────────── constants */
const TOPICS = [
  'Arrays', 'Strings', 'Trees', 'Graphs', 'DP', 'Sorting',
  'Searching', 'Recursion', 'Hashing', 'Stack/Queue',
  'Two Pointers', 'Binary Search', 'Greedy', 'Math',
];

const PLATFORMS = [
  'LeetCode', 'HackerRank', 'CodeChef', 'GeeksForGeeks', 'Codeforces',
];

const DIFFICULTIES = ['easy', 'medium', 'hard'];

const DIFFICULTY_META = {
  easy:   { label: 'Easy',   color: '#10b981', badge: 'badge-accent' },
  medium: { label: 'Medium', color: '#f59e0b', badge: 'badge-warning' },
  hard:   { label: 'Hard',   color: '#ef4444', badge: 'badge-danger'  },
};

const TOPIC_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#14b8a6',
  '#a855f7', '#eab308', '#64748b', '#22c55e',
];

const PLATFORM_META = {
  LeetCode:     { color: '#f89f1b' },
  HackerRank:   { color: '#2ec866' },
  CodeChef:     { color: '#5b4638' },
  GeeksForGeeks:{ color: '#2f8d46' },
  Codeforces:   { color: '#1f8dd6' },
};

/* ─────────────────────────────────────────────────────── animations */
const fadeUp = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.07 } },
};

/* ─────────────────────────────────────────────────────── custom tooltip */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-4 py-3 text-sm shadow-xl">
      <p className="font-semibold text-fg mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.fill || p.color }} className="text-xs">
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────────────── stat card */
const StatCard = ({ icon: Icon, label, value, gradient, field, onIncrement, onDecrement }) => (
  <motion.div variants={fadeUp} className="stat-card flex flex-col gap-3 relative overflow-hidden group">
    <div
      className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl"
      style={{ background: gradient }}
    />
    <div className="flex items-center justify-between relative z-10">
      <div className="p-2.5 rounded-xl" style={{ background: `${gradient}22` }}>
        <Icon size={18} style={{ color: gradient.split(',')[1]?.trim().replace(')', '') || '#6366f1' }} />
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onDecrement(field)}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-fg-3 hover:text-fg hover:bg-white/10 transition-all text-base font-bold leading-none"
          title="Decrement"
        >−</button>
        <button
          onClick={() => onIncrement(field)}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-fg-3 hover:text-fg hover:bg-white/10 transition-all text-base font-bold leading-none"
          title="Increment"
        >+</button>
      </div>
    </div>
    <div className="relative z-10">
      <p className="stat-label">{label}</p>
      <p className="stat-value" style={{ background: gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        {value}
      </p>
    </div>
  </motion.div>
);

/* ─────────────────────────────────────────────────────── main page */
export default function Coding() {
  const {
    stats, problems, dailyLog,
    updateStats, addProblem, removeProblem, logDay,
    getWeeklyActivity, getProblemsByTopic,
  } = useCodingStore();

  /* ── modal states */
  const [showLogModal,     setShowLogModal]     = useState(false);
  const [showProblemModal, setShowProblemModal] = useState(false);

  /* ── filter states */
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterTopic,      setFilterTopic]      = useState('all');

  /* ── log form */
  const [logForm, setLogForm] = useState({ dsaSolved: '', pythonProblems: '', hours: '', notes: '' });

  /* ── problem form */
  const [probForm, setProbForm] = useState({
    title: '', difficulty: 'medium', topic: 'Arrays',
    platform: 'LeetCode', notes: '', url: '',
  });

  /* ── computed */
  const weeklyData  = useMemo(() => getWeeklyActivity(), [dailyLog]);
  const topicData   = useMemo(() => getProblemsByTopic(), [problems]);

  const difficultyData = useMemo(() => {
    const map = { easy: 0, medium: 0, hard: 0 };
    problems.forEach(p => { map[p.difficulty] = (map[p.difficulty] || 0) + 1; });
    return DIFFICULTIES.map(d => ({ name: DIFFICULTY_META[d].label, value: map[d], color: DIFFICULTY_META[d].color }));
  }, [problems]);

  const filteredProblems = useMemo(() => {
    return problems
      .filter(p => filterDifficulty === 'all' || p.difficulty === filterDifficulty)
      .filter(p => filterTopic      === 'all' || p.topic.toLowerCase() === filterTopic.toLowerCase())
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [problems, filterDifficulty, filterTopic]);

  /* ── handlers: stats */
  const handleIncrement = (field) => updateStats(field, (stats[field] || 0) + 1);
  const handleDecrement = (field) => updateStats(field, Math.max(0, (stats[field] || 0) - 1));

  /* ── handlers: log today */
  const handleLogSubmit = () => {
    const entry = {
      dsaSolved:      Number(logForm.dsaSolved)      || 0,
      pythonProblems: Number(logForm.pythonProblems) || 0,
      hours:          Number(logForm.hours)          || 0,
      notes:          logForm.notes,
    };
    logDay(entry);
    setLogForm({ dsaSolved: '', pythonProblems: '', hours: '', notes: '' });
    setShowLogModal(false);
  };

  /* ── handlers: add problem */
  const handleProblemSubmit = () => {
    if (!probForm.title.trim()) return;
    addProblem({ ...probForm });
    setProbForm({ title: '', difficulty: 'medium', topic: 'Arrays', platform: 'LeetCode', notes: '', url: '' });
    setShowProblemModal(false);
  };

  /* ── topic colors map */
  const topicColorMap = useMemo(() => {
    const map = {};
    TOPICS.forEach((t, i) => { map[t.toLowerCase()] = TOPIC_COLORS[i % TOPIC_COLORS.length]; });
    return map;
  }, []);

  /* ── stat card definitions */
  const statCards = [
    { icon: Target,       label: 'DSA Solved',         field: 'dsaSolved',          value: stats.dsaSolved,          gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
    { icon: Code2,        label: 'Python Problems',     field: 'pythonProblems',     value: stats.pythonProblems,     gradient: 'linear-gradient(135deg, #10b981, #06b6d4)' },
    { icon: Star,         label: 'Projects Built',      field: 'projects',           value: stats.projects,           gradient: 'linear-gradient(135deg, #f59e0b, #f97316)' },
    { icon: Code2,        label: 'GitHub Contributions',field: 'githubContributions',value: stats.githubContributions,gradient: 'linear-gradient(135deg, #ec4899, #8b5cf6)' },
    { icon: Clock,        label: 'Total Coding Hours',  field: 'totalHours',         value: stats.totalHours,         gradient: 'linear-gradient(135deg, #14b8a6, #6366f1)' },
  ];

  return (
    <div className="page-enter min-h-screen p-6 pb-16 max-w-7xl mx-auto space-y-8">

      {/* ── Header */}
      <motion.div
        className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h1 className="page-title flex items-center gap-3">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Code2 size={24} />
            </span>
            <span className="gradient-text">Coding Tracker</span>
          </h1>
          <p className="page-subtitle">Track problems, hours, and your coding journey</p>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="btn-secondary"
            onClick={() => setShowLogModal(true)}
          >
            <Zap size={15} />
            Log Today
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="btn-primary"
            onClick={() => setShowProblemModal(true)}
          >
            <Plus size={15} />
            Add Problem
          </motion.button>
        </div>
      </motion.div>

      {/* ── Stats Cards */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
      >
        {statCards.map((card) => (
          <StatCard
            key={card.field}
            {...card}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
          />
        ))}
      </motion.div>

      {/* ── Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Weekly Activity Bar Chart */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="card p-6 lg:col-span-2"
        >
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={16} className="text-indigo-400" />
            <h2 className="font-semibold text-fg">Weekly Activity</h2>
            <span className="text-xs text-fg-3 ml-auto">Last 7 days</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
              <Bar dataKey="problems" name="Problems" fill="#6366f1" radius={[5, 5, 0, 0]} maxBarSize={32} />
              <Bar dataKey="hours"    name="Hours"    fill="#10b981" radius={[5, 5, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Difficulty Donut */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="card p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <Target size={16} className="text-amber-400" />
            <h2 className="font-semibold text-fg">Difficulty Split</h2>
          </div>
          {difficultyData.every(d => d.value === 0) ? (
            <div className="flex flex-col items-center justify-center h-40 text-fg-3 text-sm">
              <Code2 size={28} className="mb-2 opacity-40" />
              No problems yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={difficultyData.filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {difficultyData.filter(d => d.value > 0).map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* ── Topic Distribution */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="card p-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <Filter size={16} className="text-purple-400" />
          <h2 className="font-semibold text-fg">Topic Distribution</h2>
          <span className="text-xs text-fg-3 ml-auto">{problems.length} total problems</span>
        </div>
        {topicData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-fg-3 text-sm">
            <Code2 size={28} className="mb-2 opacity-40" />
            No problems logged yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topicData} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} width={96} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
              <Bar dataKey="value" name="Problems" radius={[0, 6, 6, 0]} maxBarSize={20}>
                {topicData.map((entry, index) => (
                  <Cell key={entry.name} fill={TOPIC_COLORS[index % TOPIC_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* ── Problem Log */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="card p-6"
      >
        {/* Header + Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-indigo-400" />
            <h2 className="font-semibold text-fg">Problem Log</h2>
            <span className="badge badge-primary ml-1">{filteredProblems.length}</span>
          </div>
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            {/* Difficulty filter */}
            <div className="flex gap-1.5">
              {['all', ...DIFFICULTIES].map((d) => (
                <button
                  key={d}
                  onClick={() => setFilterDifficulty(d)}
                  className={`tag text-xs capitalize ${filterDifficulty === d ? 'active' : ''}`}
                  style={
                    filterDifficulty === d && d !== 'all'
                      ? { background: `${DIFFICULTY_META[d].color}22`, color: DIFFICULTY_META[d].color, border: `1px solid ${DIFFICULTY_META[d].color}44` }
                      : {}
                  }
                >
                  {d === 'all' ? 'All' : DIFFICULTY_META[d].label}
                </button>
              ))}
            </div>

            {/* Topic filter */}
            <select
              value={filterTopic}
              onChange={(e) => setFilterTopic(e.target.value)}
              className="input py-1 px-3 text-xs w-auto"
              style={{ minWidth: 120 }}
            >
              <option value="all">All Topics</option>
              {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Problem list */}
        {filteredProblems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-fg-3">
            <Code2 size={40} className="mb-3 opacity-30" />
            <p className="font-medium">No problems found</p>
            <p className="text-xs mt-1 opacity-70">Add your first problem to get started</p>
            <button className="btn-primary mt-5" onClick={() => setShowProblemModal(true)}>
              <Plus size={14} /> Add Problem
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {filteredProblems.map((p) => {
                const dm = DIFFICULTY_META[p.difficulty] || DIFFICULTY_META.medium;
                const topicColor = topicColorMap[p.topic?.toLowerCase()] || '#6366f1';
                const platColor = PLATFORM_META[p.platform]?.color || '#6366f1';
                return (
                  <motion.div
                    key={p.id}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-surface hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all group"
                  >
                    {/* Status dot */}
                    <div className="flex-shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full block" style={{ background: dm.color, boxShadow: `0 0 8px ${dm.color}66` }} />
                    </div>

                    {/* Title + meta */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-fg text-sm truncate">{p.title}</p>
                      {p.notes && <p className="text-xs text-fg-3 mt-0.5 truncate">{p.notes}</p>}
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className={`badge ${dm.badge}`}>{dm.label}</span>
                      <span
                        className="badge"
                        style={{ background: `${topicColor}22`, color: topicColor }}
                      >
                        {p.topic}
                      </span>
                      <span
                        className="badge"
                        style={{ background: `${platColor}22`, color: platColor }}
                      >
                        {p.platform}
                      </span>
                      <span className="text-fg-3">
                        {p.date ? format(new Date(p.date), 'MMM d') : ''}
                      </span>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => removeProblem(p.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-400 hover:bg-red-500/15 transition-all flex-shrink-0"
                      title="Remove problem"
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* ══════════════════════════════ LOG TODAY MODAL */}
      <AnimatePresence>
        {showLogModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setShowLogModal(false)}
          >
            <motion.div
              className="modal-content max-w-md"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                    <Zap size={18} />
                  </span>
                  <div>
                    <h2 className="font-bold text-fg">Log Today's Session</h2>
                    <p className="text-xs text-fg-3">{format(new Date(), 'EEEE, MMM d')}</p>
                  </div>
                </div>
                <button onClick={() => setShowLogModal(false)} className="btn-ghost p-1.5 rounded-xl">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-fg-2 mb-1.5">DSA Solved</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      className="input"
                      value={logForm.dsaSolved}
                      onChange={(e) => setLogForm(f => ({ ...f, dsaSolved: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-fg-2 mb-1.5">Python Problems</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      className="input"
                      value={logForm.pythonProblems}
                      onChange={(e) => setLogForm(f => ({ ...f, pythonProblems: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-fg-2 mb-1.5">Coding Hours</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="0.0"
                    className="input"
                    value={logForm.hours}
                    onChange={(e) => setLogForm(f => ({ ...f, hours: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-fg-2 mb-1.5">Notes</label>
                  <textarea
                    rows={3}
                    placeholder="What did you work on today?"
                    className="input resize-none"
                    value={logForm.notes}
                    onChange={(e) => setLogForm(f => ({ ...f, notes: e.target.value }))}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowLogModal(false)} className="btn-ghost flex-1 justify-center">Cancel</button>
                  <button onClick={handleLogSubmit} className="btn-primary flex-1 justify-center">
                    <Check size={15} /> Save Log
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════ ADD PROBLEM MODAL */}
      <AnimatePresence>
        {showProblemModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setShowProblemModal(false)}
          >
            <motion.div
              className="modal-content max-w-lg"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                    <Plus size={18} />
                  </span>
                  <div>
                    <h2 className="font-bold text-fg">Add Problem</h2>
                    <p className="text-xs text-fg-3">Log a solved or attempted problem</p>
                  </div>
                </div>
                <button onClick={() => setShowProblemModal(false)} className="btn-ghost p-1.5 rounded-xl">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-medium text-fg-2 mb-1.5">Problem Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Two Sum, Longest Palindrome…"
                    className="input"
                    value={probForm.title}
                    onChange={(e) => setProbForm(f => ({ ...f, title: e.target.value }))}
                    autoFocus
                  />
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-xs font-medium text-fg-2 mb-2">Difficulty</label>
                  <div className="flex gap-2">
                    {DIFFICULTIES.map((d) => {
                      const dm = DIFFICULTY_META[d];
                      const isActive = probForm.difficulty === d;
                      return (
                        <button
                          key={d}
                          onClick={() => setProbForm(f => ({ ...f, difficulty: d }))}
                          className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all border"
                          style={
                            isActive
                              ? { background: `${dm.color}22`, color: dm.color, borderColor: `${dm.color}55` }
                              : { background: 'transparent', color: 'var(--text-muted)', borderColor: 'var(--surface-border)' }
                          }
                        >
                          {dm.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Topic + Platform */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-fg-2 mb-1.5">Topic</label>
                    <select
                      className="input"
                      value={probForm.topic}
                      onChange={(e) => setProbForm(f => ({ ...f, topic: e.target.value }))}
                    >
                      {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-fg-2 mb-1.5">Platform</label>
                    <select
                      className="input"
                      value={probForm.platform}
                      onChange={(e) => setProbForm(f => ({ ...f, platform: e.target.value }))}
                    >
                      {PLATFORMS.map(pl => <option key={pl} value={pl}>{pl}</option>)}
                    </select>
                  </div>
                </div>

                {/* URL */}
                <div>
                  <label className="block text-xs font-medium text-fg-2 mb-1.5">Problem URL (optional)</label>
                  <input
                    type="url"
                    placeholder="https://leetcode.com/problems/…"
                    className="input"
                    value={probForm.url}
                    onChange={(e) => setProbForm(f => ({ ...f, url: e.target.value }))}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-medium text-fg-2 mb-1.5">Notes (optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Approach used, time complexity…"
                    className="input resize-none"
                    value={probForm.notes}
                    onChange={(e) => setProbForm(f => ({ ...f, notes: e.target.value }))}
                  />
                </div>

                {/* Preview badge row */}
                {probForm.title && (
                  <div className="flex flex-wrap gap-2 py-2 px-3 rounded-xl border border-surface bg-bg items-center">
                    <span className="text-xs text-fg-3">Preview:</span>
                    <span className={`badge ${DIFFICULTY_META[probForm.difficulty].badge}`}>
                      {DIFFICULTY_META[probForm.difficulty].label}
                    </span>
                    <span
                      className="badge"
                      style={{
                        background: `${topicColorMap[probForm.topic?.toLowerCase()]}22`,
                        color: topicColorMap[probForm.topic?.toLowerCase()],
                      }}
                    >
                      {probForm.topic}
                    </span>
                    <span
                      className="badge"
                      style={{
                        background: `${PLATFORM_META[probForm.platform]?.color}22`,
                        color: PLATFORM_META[probForm.platform]?.color,
                      }}
                    >
                      {probForm.platform}
                    </span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowProblemModal(false)} className="btn-ghost flex-1 justify-center">Cancel</button>
                  <button
                    onClick={handleProblemSubmit}
                    className="btn-primary flex-1 justify-center"
                    disabled={!probForm.title.trim()}
                  >
                    <Check size={15} /> Add Problem
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
