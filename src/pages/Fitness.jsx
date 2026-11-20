import { useState, useEffect, useMemo, useCallback } from 'react';
import { useFitnessStore, DEFAULT_FITNESS_GOALS } from '../store/useFitnessStore';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDate, subDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  ResponsiveContainer, Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts';
import {
  Dumbbell, Droplets, Moon, Scale, Plus, Minus,
  Target, TrendingUp, Flame, Save, ChevronDown, ChevronUp, Check,
  Calendar, Activity, Edit3, Trash2, X, AlertTriangle, Sparkles,
} from 'lucide-react';

const PRESET_GOALS = [
  { title: 'Water Intake', target: 8, unit: 'glasses', color: '#38bdf8', category: 'water' },
  { title: 'Sleep Duration', target: 7, unit: 'hours', color: '#a78bfa', category: 'sleep' },
  { title: 'Body Weight', target: 70, unit: 'kg', color: '#f59e0b', category: 'weight' },
  { title: 'Daily Steps', target: 10000, unit: 'steps', color: '#10b981', category: 'custom' },
  { title: 'Protein Intake', target: 120, unit: 'g', color: '#ec4899', category: 'custom' },
  { title: 'Calories Burned', target: 500, unit: 'kcal', color: '#f97316', category: 'custom' },
  { title: 'Workout Time', target: 45, unit: 'mins', color: '#8b5cf6', category: 'custom' },
  { title: 'Daily Pushups', target: 50, unit: 'reps', color: '#06b6d4', category: 'custom' },
];

const PRESET_COLORS = ['#38bdf8', '#a78bfa', '#f59e0b', '#10b981', '#ec4899', '#f97316', '#8b5cf6', '#06b6d4', '#e11d48'];

/* ─── animation variants ─── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

/* ─── custom tooltip ─── */
const CustomTooltip = ({ active, payload, label, unit = '' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="card px-3 py-2 text-xs shadow-xl"
      style={{ border: '1px solid var(--surface-border)' }}
    >
      <p className="font-semibold text-fg mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value}{unit}
        </p>
      ))}
    </div>
  );
};

/* ─── water glass icon ─── */
const GlassIcon = ({ filled }) => (
  <svg viewBox="0 0 24 28" className="w-5 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 2 L6 26 L18 26 L20 2 Z" stroke={filled ? '#38bdf8' : 'var(--surface-border)'} strokeWidth="1.5" fill={filled ? 'rgba(56,189,248,0.25)' : 'transparent'} />
    {filled && <path d="M6 18 L18 18 L18 26 L6 26 Z" fill="rgba(56,189,248,0.5)" />}
  </svg>
);

/* ─── moon icon row ─── */
const MoonRow = ({ count, max = 12 }) => (
  <div className="flex flex-wrap gap-1 mt-2">
    {Array.from({ length: max }).map((_, i) => (
      <Moon
        key={i}
        size={14}
        className={i < count ? 'text-violet-400 fill-violet-400' : 'text-gray-700'}
      />
    ))}
  </div>
);

/* ─── Toggle Switch ─── */
const ToggleSwitch = ({ value, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!value)}
    className={`relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none ${value ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gray-700'}`}
  >
    <motion.span
      layout
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md ${value ? 'translate-x-7' : 'translate-x-0'}`}
      style={{ transform: value ? 'translateX(28px)' : 'translateX(0)' }}
    />
  </button>
);

/* ─── Gym Calendar ─── */
const GymCalendar = ({ log }) => {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const logMap = useMemo(() => {
    const m = {};
    log.forEach(l => { m[l.date] = l; });
    return m;
  }, [log]);

  const firstDayOfWeek = monthStart.getDay(); // 0 = Sunday

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} className="text-center text-xs text-fg-3 font-medium py-1">{d}</div>
        ))}
      </div>
      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map(day => {
          const key = format(day, 'yyyy-MM-dd');
          const entry = logMap[key];
          const isToday = key === format(today, 'yyyy-MM-dd');
          const gymDone = entry?.gym;
          const hasLog = !!entry;
          return (
            <motion.div
              key={key}
              whileHover={{ scale: 1.2 }}
              className={`relative flex items-center justify-center rounded-full aspect-square text-xs font-medium transition-all duration-200
                ${isToday ? 'ring-2 ring-indigo-400' : ''}
                ${gymDone ? 'bg-emerald-500/30 text-emerald-300' : hasLog ? 'bg-gray-700/50 text-fg-3' : 'text-fg-3'}`}
            >
              <span className="text-[10px]">{getDate(day)}</span>
              {gymDone && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Section Title ─── */
const SectionTitle = ({ icon: Icon, label, color = 'text-indigo-400' }) => (
  <div className="flex items-center gap-2 mb-4">
    <Icon size={16} className={color} />
    <h3 className="text-sm font-semibold text-fg-2 uppercase tracking-wider">{label}</h3>
  </div>
);

/* ═══════════════════════════════════════ MAIN PAGE ═══════════════════════════════════════ */
export default function Fitness() {
  const { 
    log, 
    goals, 
    fitnessGoals, 
    logDay, 
    updateGoals, 
    addFitnessGoal, 
    updateFitnessGoal, 
    deleteFitnessGoal, 
    updateFitnessGoalProgress,
    getTodayLog, 
    getWeeklyData, 
    getGymStreak 
  } = useFitnessStore();

  const activeGoals = fitnessGoals && fitnessGoals.length > 0 ? fitnessGoals : DEFAULT_FITNESS_GOALS;

  /* ── today form state ── */
  const todayLog = getTodayLog();
  const [gym, setGym] = useState(todayLog.gym ?? false);
  const [water, setWater] = useState(todayLog.waterGlasses ?? 0);
  const [sleep, setSleep] = useState(todayLog.sleepHours ?? 0);
  const [weight, setWeight] = useState(todayLog.weight ?? '');
  const [saved, setSaved] = useState(false);

  /* ── fitness goals modal states ── */
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [showEditGoalModal, setShowEditGoalModal] = useState(false);
  const [deleteGoalTarget, setDeleteGoalTarget] = useState(null);

  // Add Goal Form State
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState(10);
  const [newGoalCurrent, setNewGoalCurrent] = useState(0);
  const [newGoalUnit, setNewGoalUnit] = useState('');
  const [newGoalColor, setNewGoalColor] = useState('#10b981');
  const [newGoalCategory, setNewGoalCategory] = useState('custom');

  // Edit Goal Form State
  const [editGoalId, setEditGoalId] = useState('');
  const [editGoalTitle, setEditGoalTitle] = useState('');
  const [editGoalTarget, setEditGoalTarget] = useState(10);
  const [editGoalCurrent, setEditGoalCurrent] = useState(0);
  const [editGoalUnit, setEditGoalUnit] = useState('');
  const [editGoalColor, setEditGoalColor] = useState('#10b981');
  const [editGoalCategory, setEditGoalCategory] = useState('custom');

  const getGoalLiveValue = useCallback((g) => {
    if (g.id === 'water' || g.category === 'water') return Number(water) || 0;
    if (g.id === 'sleep' || g.category === 'sleep') return Number(sleep) || 0;
    if (g.id === 'weight' || g.category === 'weight') return weight !== '' && weight !== null ? Number(weight) : (g.current || 0);
    return Number(g.current) || 0;
  }, [water, sleep, weight]);

  const openAddGoalModal = () => {
    setNewGoalTitle('');
    setNewGoalTarget(10);
    setNewGoalCurrent(0);
    setNewGoalUnit('');
    setNewGoalColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    setNewGoalCategory('custom');
    setShowAddGoalModal(true);
  };

  const applyPreset = (preset) => {
    setNewGoalTitle(preset.title);
    setNewGoalTarget(preset.target);
    setNewGoalUnit(preset.unit);
    setNewGoalColor(preset.color);
    setNewGoalCategory(preset.category || 'custom');
  };

  const handleAddGoalSubmit = (e) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    addFitnessGoal({
      title: newGoalTitle.trim(),
      target: Number(newGoalTarget) || 1,
      current: Number(newGoalCurrent) || 0,
      unit: newGoalUnit.trim(),
      color: newGoalColor,
      category: newGoalCategory,
    });

    setShowAddGoalModal(false);
  };

  const openEditGoalModal = (g) => {
    setEditGoalId(g.id);
    setEditGoalTitle(g.title);
    setEditGoalTarget(g.target);
    setEditGoalCurrent(getGoalLiveValue(g));
    setEditGoalUnit(g.unit || '');
    setEditGoalColor(g.color || '#10b981');
    setEditGoalCategory(g.category || 'custom');
    setShowEditGoalModal(true);
  };

  const handleEditGoalSubmit = (e) => {
    e.preventDefault();
    if (!editGoalId || !editGoalTitle.trim()) return;

    updateFitnessGoal(editGoalId, {
      title: editGoalTitle.trim(),
      target: Number(editGoalTarget) || 1,
      current: Number(editGoalCurrent) || 0,
      unit: editGoalUnit.trim(),
      color: editGoalColor,
      category: editGoalCategory,
    });

    if (editGoalCategory === 'water' || editGoalId === 'water') {
      setWater(Number(editGoalCurrent) || 0);
    } else if (editGoalCategory === 'sleep' || editGoalId === 'sleep') {
      setSleep(Number(editGoalCurrent) || 0);
    } else if (editGoalCategory === 'weight' || editGoalId === 'weight') {
      setWeight(Number(editGoalCurrent) || '');
    }

    setShowEditGoalModal(false);
  };

  const openDeleteGoalModal = (g) => {
    setDeleteGoalTarget(g);
  };

  const handleDeleteGoalConfirm = () => {
    if (!deleteGoalTarget) return;
    deleteFitnessGoal(deleteGoalTarget.id);
    setDeleteGoalTarget(null);
  };

  /* ── sync if store changes ── */
  useEffect(() => {
    const t = getTodayLog();
    setGym(t.gym ?? false);
    setWater(t.waterGlasses ?? 0);
    setSleep(t.sleepHours ?? 0);
    setWeight(t.weight ?? '');
  }, []); // eslint-disable-line

  /* ── derived stats ── */
  const weeklyData = useMemo(() => getWeeklyData(), [log]); // eslint-disable-line

  const avgWater = useMemo(() => {
    const vals = weeklyData.map(d => d.water).filter(v => v > 0);
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—';
  }, [weeklyData]);

  const avgSleep = useMemo(() => {
    const vals = weeklyData.map(d => d.sleep).filter(v => v > 0);
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—';
  }, [weeklyData]);

  const latestWeight = useMemo(() => {
    const withWeight = [...log].reverse().find(l => l.weight != null && l.weight !== '');
    return withWeight ? withWeight.weight : '—';
  }, [log]);

  const gymStreak = useMemo(() => getGymStreak(), [log]); // eslint-disable-line

  /* ── handlers ── */
  const handleSave = useCallback(() => {
    logDay({
      gym,
      waterGlasses: water,
      sleepHours: sleep,
      weight: weight !== '' ? parseFloat(weight) : null,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [gym, water, sleep, weight, logDay]);

  /* ── weight chart data (filter nulls) ── */
  const weightChartData = useMemo(() =>
    weeklyData.filter(d => d.weight != null),
  [weeklyData]);

  return (
    <div className="page-enter min-h-screen p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mb-8"
      >
        <motion.div variants={itemVariants} className="page-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg">
              <Dumbbell size={20} className="text-white" />
            </div>
            <div>
              <h1 className="page-title gradient-text">Fitness & Health</h1>
              <p className="page-subtitle">Track your body, build lasting habits.</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 xl:grid-cols-3 gap-6"
      >
        {/* ══════════════════ LEFT COLUMN ══════════════════ */}
        <div className="xl:col-span-1 flex flex-col gap-6">

          {/* ── Today's Log Card ── */}
          <motion.div variants={itemVariants} className="card p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-indigo-400" />
                <h2 className="font-semibold text-fg text-sm uppercase tracking-wider">Today's Log</h2>
              </div>
              <span className="badge badge-gray">{format(new Date(), 'EEE, MMM d')}</span>
            </div>

            <div className="space-y-6">
              {/* ── Gym Toggle ── */}
              <div
                className={`rounded-xl p-4 border transition-all duration-300 cursor-pointer
                  ${gym
                    ? 'border-emerald-500/40 bg-gradient-to-r from-emerald-900/30 to-teal-900/20'
                    : 'border-surface bg-surface'}`}
                onClick={() => setGym(!gym)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${gym ? 'bg-emerald-500/20' : 'bg-gray-700/50'}`}>
                      <Dumbbell size={18} className={gym ? 'text-emerald-400' : 'text-gray-500'} />
                    </div>
                    <div>
                      <p className="font-semibold text-fg text-sm">Gym Today</p>
                      <p className="text-xs text-fg-3">{gym ? '💪 Crushed it!' : 'Not logged yet'}</p>
                    </div>
                  </div>
                  <ToggleSwitch value={gym} onChange={setGym} />
                </div>
                <AnimatePresence>
                  {gym && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 pt-3 border-t border-emerald-500/20 flex items-center gap-1"
                    >
                      {Array.from({ length: gymStreak }).slice(0, 10).map((_, i) => (
                        <Flame key={i} size={14} className="text-orange-400 fill-orange-400/50" />
                      ))}
                      {gymStreak > 0 && (
                        <span className="text-xs text-orange-400 font-semibold ml-1">{gymStreak} day streak!</span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Water Glasses ── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Droplets size={15} className="text-sky-400" />
                    <span className="text-sm font-semibold text-fg">Water Intake</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-bold text-sky-400">{water}</span>
                    <span className="text-xs text-fg-3">/ {goals.waterTarget} glasses</span>
                  </div>
                </div>
                {/* Glass grid */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <motion.button
                      key={i}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => setWater(i < water ? i : i + 1)}
                      title={`${i + 1} glass${i + 1 > 1 ? 'es' : ''}`}
                      className="focus:outline-none"
                    >
                      <GlassIcon filled={i < water} />
                    </motion.button>
                  ))}
                </div>
                {/* +/- buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setWater(w => Math.max(0, w - 1))}
                    className="btn-icon bg-surface border border-surface hover:bg-sky-500/10 hover:border-sky-500/30 text-fg-2"
                  >
                    <Minus size={14} />
                  </button>
                  <div className="flex-1 progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min(100, (water / goals.waterTarget) * 100)}%`,
                        background: 'linear-gradient(90deg,#0ea5e9,#38bdf8)',
                      }}
                    />
                  </div>
                  <button
                    onClick={() => setWater(w => Math.min(12, w + 1))}
                    className="btn-icon bg-surface border border-surface hover:bg-sky-500/10 hover:border-sky-500/30 text-fg-2"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                {water >= goals.waterTarget && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-sky-400 mt-1 flex items-center gap-1"
                  >
                    <Check size={12} /> Daily goal reached!
                  </motion.p>
                )}
              </div>

              {/* ── Sleep Hours ── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Moon size={15} className="text-violet-400" />
                    <span className="text-sm font-semibold text-fg">Sleep Hours</span>
                  </div>
                  <span className="text-lg font-bold text-violet-400">{sleep}h</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={12}
                  step={0.5}
                  value={sleep}
                  onChange={e => setSleep(parseFloat(e.target.value))}
                  className="w-full accent-violet-500 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-fg-3 mt-1">
                  <span>0h</span>
                  <span>6h</span>
                  <span>12h</span>
                </div>
                <MoonRow count={Math.round(sleep)} max={12} />
                {sleep >= goals.sleepTarget && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-violet-400 mt-1 flex items-center gap-1"
                  >
                    <Check size={12} /> Sleep goal met!
                  </motion.p>
                )}
              </div>

              {/* ── Weight ── */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Scale size={15} className="text-amber-400" />
                  <span className="text-sm font-semibold text-fg">Body Weight</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    placeholder="Enter weight"
                    className="input flex-1"
                    style={{ background: 'var(--bg-secondary)' }}
                  />
                  <span className="text-sm text-fg-3 font-medium">kg</span>
                </div>
              </div>

              {/* ── Save Button ── */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                className={`w-full btn justify-center py-3 text-sm font-semibold rounded-xl transition-all duration-300
                  ${saved
                    ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/30'
                    : 'btn-primary'}`}
              >
                <AnimatePresence mode="wait">
                  {saved ? (
                    <motion.span
                      key="saved"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Check size={16} /> Saved!
                    </motion.span>
                  ) : (
                    <motion.span
                      key="save"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Save size={16} /> Save Today's Log
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </motion.div>

          {/* ── Goals Card ── */}
          <motion.div variants={itemVariants} className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-amber-400" />
                <h3 className="font-semibold text-fg text-sm uppercase tracking-wider">Fitness Goals</h3>
              </div>
              <button
                onClick={openAddGoalModal}
                className="btn-primary py-1 px-2.5 text-xs flex items-center gap-1"
              >
                <Plus size={13} /> Add Goal
              </button>
            </div>

            {activeGoals.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-surface-border rounded-xl space-y-2">
                <Target size={30} className="mx-auto text-fg-3 opacity-40" />
                <div>
                  <p className="text-xs font-semibold text-fg">No Fitness Goals</p>
                  <p className="text-[11px] text-fg-3 mt-0.5">Add goals to track water, workouts, steps, or custom targets.</p>
                </div>
                <button onClick={openAddGoalModal} className="btn-primary py-1 px-3 text-xs inline-flex items-center gap-1">
                  <Plus size={13} /> Add First Goal
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeGoals.map(g => {
                  const currentVal = getGoalLiveValue(g);
                  const targetVal = g.target || 1;
                  const pct = Math.min(100, Math.round((currentVal / targetVal) * 100));

                  return (
                    <div 
                      key={g.id} 
                      className="p-3.5 rounded-xl border border-surface bg-surface-secondary/40 space-y-2 relative group transition-all hover:border-surface-border"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div 
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${g.color || '#10b981'}20`, color: g.color || '#10b981' }}
                          >
                            <Target size={14} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-xs text-fg truncate" title={g.title}>{g.title}</h4>
                            <p className="text-[11px] text-fg-3">
                              Target: {g.target} {g.unit}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button 
                            onClick={() => openEditGoalModal(g)}
                            className="p-1 rounded text-fg-3 hover:text-primary-400 hover:bg-surface transition-colors"
                            title="Edit Goal"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button 
                            onClick={() => openDeleteGoalModal(g)}
                            className="p-1 rounded text-fg-3 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete Goal"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Progress bar & current vs target */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-fg-2 font-medium">
                            {currentVal} / {g.target} {g.unit}
                          </span>
                          <span className="font-semibold" style={{ color: g.color || '#10b981' }}>
                            {pct}% {pct >= 100 && '🎉'}
                          </span>
                        </div>
                        <div className="progress-bar h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
                          <div 
                            className="progress-fill h-full rounded-full transition-all duration-300"
                            style={{ width: `${pct}%`, backgroundColor: g.color || '#10b981' }}
                          />
                        </div>
                      </div>

                      {/* Quick progress adjustments for custom goals */}
                      {g.category === 'custom' && (
                        <div className="flex items-center justify-end gap-1.5 pt-0.5">
                          <button
                            type="button"
                            onClick={() => updateFitnessGoalProgress(g.id, -1, true)}
                            className="p-1 rounded bg-surface hover:bg-surface-tertiary text-fg-3 hover:text-fg text-xs"
                            title="Decrease 1"
                          >
                            <Minus size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={() => updateFitnessGoalProgress(g.id, 1, true)}
                            className="p-1 rounded bg-surface hover:bg-surface-tertiary text-fg-3 hover:text-fg text-xs"
                            title="Increase 1"
                          >
                            <Plus size={11} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* ══════════════════ RIGHT COLUMN ══════════════════ */}
        <div className="xl:col-span-2 flex flex-col gap-6">

          {/* ── Stats Row ── */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                icon: <Flame size={18} className="text-orange-400" />,
                label: 'Gym Streak',
                value: `${gymStreak}d`,
                color: 'from-orange-500/20 to-red-500/20',
                border: 'border-orange-500/20',
                valueColor: 'text-orange-400',
              },
              {
                icon: <Droplets size={18} className="text-sky-400" />,
                label: 'Avg Water (7d)',
                value: `${avgWater}`,
                color: 'from-sky-500/20 to-blue-500/20',
                border: 'border-sky-500/20',
                valueColor: 'text-sky-400',
              },
              {
                icon: <Moon size={18} className="text-violet-400" />,
                label: 'Avg Sleep (7d)',
                value: `${avgSleep}h`,
                color: 'from-violet-500/20 to-purple-500/20',
                border: 'border-violet-500/20',
                valueColor: 'text-violet-400',
              },
              {
                icon: <Scale size={18} className="text-amber-400" />,
                label: 'Latest Weight',
                value: latestWeight !== '—' ? `${latestWeight}kg` : '—',
                color: 'from-amber-500/20 to-yellow-500/20',
                border: 'border-amber-500/20',
                valueColor: 'text-amber-400',
              },
            ].map(({ icon, label, value, color, border, valueColor }) => (
              <motion.div
                key={label}
                whileHover={{ y: -3 }}
                className={`card p-4 bg-gradient-to-br ${color} border ${border}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {icon}
                </div>
                <div className={`text-2xl font-bold ${valueColor}`}>{value}</div>
                <div className="stat-label mt-1">{label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* ── Weekly Charts ── */}
          <motion.div variants={itemVariants} className="card p-5">
            <SectionTitle icon={TrendingUp} label="Weekly Trends" color="text-indigo-400" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Water Chart */}
              <div>
                <p className="text-xs font-semibold text-sky-400 mb-3 flex items-center gap-1.5">
                  <Droplets size={12} /> Water (glasses)
                </p>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip unit=" gl" />} />
                    <ReferenceLine y={goals.waterTarget} stroke="#0ea5e9" strokeDasharray="4 4" strokeOpacity={0.7} label={{ value: 'Goal', fill: '#0ea5e9', fontSize: 9 }} />
                    <Bar dataKey="water" name="Water" fill="#38bdf8" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Sleep Chart */}
              <div>
                <p className="text-xs font-semibold text-violet-400 mb-3 flex items-center gap-1.5">
                  <Moon size={12} /> Sleep (hours)
                </p>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={weeklyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip unit="h" />} />
                    <ReferenceLine y={goals.sleepTarget} stroke="#a78bfa" strokeDasharray="4 4" strokeOpacity={0.7} />
                    <Line
                      type="monotone"
                      dataKey="sleep"
                      name="Sleep"
                      stroke="#a78bfa"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#a78bfa', strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Weight Chart */}
              <div>
                <p className="text-xs font-semibold text-amber-400 mb-3 flex items-center gap-1.5">
                  <Scale size={12} /> Weight (kg)
                </p>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart
                    data={weightChartData.length >= 2 ? weightChartData : weeklyData}
                    margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                    <Tooltip content={<CustomTooltip unit="kg" />} />
                    <ReferenceLine y={goals.weightTarget} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.6} />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      name="Weight"
                      stroke="#fbbf24"
                      strokeWidth={2}
                      connectNulls
                      dot={{ r: 3, fill: '#fbbf24', strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                {weightChartData.length < 2 && (
                  <p className="text-xs text-fg-3 text-center mt-1">Log weight on more days to see trend</p>
                )}
              </div>

              {/* Gym Attendance Chart */}
              <div>
                <p className="text-xs font-semibold text-emerald-400 mb-3 flex items-center gap-1.5">
                  <Dumbbell size={12} /> Gym Attendance
                </p>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} ticks={[0, 1]} />
                    <Tooltip content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="card px-3 py-2 text-xs shadow-xl" style={{ border: '1px solid var(--surface-border)' }}>
                          <p className="font-semibold text-fg mb-1">{label}</p>
                          <p className="text-emerald-400">{payload[0]?.value === 1 ? '✅ Gym done' : '❌ Rest day'}</p>
                        </div>
                      );
                    }} />
                    <Bar dataKey="gym" name="Gym" radius={[4, 4, 0, 0]}>
                      {weeklyData.map((entry, index) => (
                        <rect
                          key={`cell-${index}`}
                          fill={entry.gym ? '#10b981' : 'rgba(16,185,129,0.15)'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          {/* ── Monthly Gym Calendar ── */}
          <motion.div variants={itemVariants} className="card p-5">
            <div className="flex items-center justify-between mb-5">
              <SectionTitle icon={Calendar} label="Monthly Gym Calendar" color="text-emerald-400" />
              <div className="flex items-center gap-4 text-xs text-fg-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Gym done
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-600 inline-block" /> Rest
                </span>
              </div>
            </div>
            <p className="text-sm font-semibold text-fg-2 mb-4">{format(new Date(), 'MMMM yyyy')}</p>
            <GymCalendar log={log} />

            {/* Summary row */}
            <div className="mt-4 pt-4 border-t border-surface flex items-center gap-6">
              <div>
                <p className="text-xs text-fg-3">Gym days this month</p>
                <p className="text-lg font-bold text-emerald-400">
                  {log.filter(l => {
                    const d = new Date(l.date);
                    const now = new Date();
                    return l.gym && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <div>
                <p className="text-xs text-fg-3">Current streak</p>
                <p className="text-lg font-bold text-orange-400 flex items-center gap-1">
                  <Flame size={16} className="fill-orange-400/40" /> {gymStreak}d
                </p>
              </div>
              <div>
                <p className="text-xs text-fg-3">Consistency</p>
                <p className="text-lg font-bold text-indigo-400">
                  {(() => {
                    const now = new Date();
                    const dayOfMonth = now.getDate();
                    const gymDays = log.filter(l => {
                      const d = new Date(l.date);
                      return l.gym && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                    }).length;
                    return dayOfMonth > 0 ? `${Math.round((gymDays / dayOfMonth) * 100)}%` : '—';
                  })()}
                </p>
              </div>
            </div>
          </motion.div>

        </div>
      </motion.div>

      {/* ── Add Fitness Goal Modal ── */}
      <AnimatePresence>
        {showAddGoalModal && (
          <div className="modal-overlay" onClick={() => setShowAddGoalModal(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="modal-content max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-fg flex items-center gap-2">
                  <Target size={18} className="text-amber-400" /> Add Fitness Goal
                </h3>
                <button onClick={() => setShowAddGoalModal(false)} className="btn-icon text-fg-3 hover:text-fg">
                  <X size={18} />
                </button>
              </div>

              {/* Quick Presets */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-fg-3 uppercase tracking-wider block mb-2">
                  Quick Presets
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_GOALS.map(preset => (
                    <button
                      key={preset.title}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium border border-surface bg-surface-secondary hover:bg-surface-tertiary hover:border-surface-border text-fg-2 transition-all flex items-center gap-1.5"
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: preset.color }} />
                      {preset.title} ({preset.target} {preset.unit})
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleAddGoalSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">Goal Title *</label>
                  <input
                    autoFocus
                    required
                    value={newGoalTitle}
                    onChange={e => setNewGoalTitle(e.target.value)}
                    placeholder="E.g. Daily Steps, Protein Intake"
                    className="input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">Target Value *</label>
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      required
                      value={newGoalTarget}
                      onChange={e => setNewGoalTarget(e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">Unit</label>
                    <input
                      value={newGoalUnit}
                      onChange={e => setNewGoalUnit(e.target.value)}
                      placeholder="e.g. steps, glasses, g, kg"
                      className="input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">Initial Progress</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={newGoalCurrent}
                      onChange={e => setNewGoalCurrent(e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">Theme Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newGoalColor}
                        onChange={e => setNewGoalColor(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-surface-border p-1"
                      />
                      <div className="flex flex-wrap gap-1">
                        {PRESET_COLORS.slice(0, 5).map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setNewGoalColor(c)}
                            className="w-5 h-5 rounded-full border border-white/20 transition-transform hover:scale-110"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button type="button" onClick={() => setShowAddGoalModal(false)} className="btn-ghost">Cancel</button>
                  <button type="submit" className="btn-primary">Add Goal</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Edit Fitness Goal Modal ── */}
      <AnimatePresence>
        {showEditGoalModal && (
          <div className="modal-overlay" onClick={() => setShowEditGoalModal(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="modal-content max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-fg flex items-center gap-2">
                  <Edit3 size={18} className="text-primary-500" /> Edit Fitness Goal
                </h3>
                <button onClick={() => setShowEditGoalModal(false)} className="btn-icon text-fg-3 hover:text-fg">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleEditGoalSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">Goal Title *</label>
                  <input
                    required
                    value={editGoalTitle}
                    onChange={e => setEditGoalTitle(e.target.value)}
                    className="input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">Target Value *</label>
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      required
                      value={editGoalTarget}
                      onChange={e => setEditGoalTarget(e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">Unit</label>
                    <input
                      value={editGoalUnit}
                      onChange={e => setEditGoalUnit(e.target.value)}
                      placeholder="e.g. steps, glasses, g, kg"
                      className="input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">Current Progress</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={editGoalCurrent}
                      onChange={e => setEditGoalCurrent(e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">Theme Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editGoalColor}
                        onChange={e => setEditGoalColor(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-surface-border p-1"
                      />
                      <div className="flex flex-wrap gap-1">
                        {PRESET_COLORS.slice(0, 5).map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setEditGoalColor(c)}
                            className="w-5 h-5 rounded-full border border-white/20 transition-transform hover:scale-110"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button type="button" onClick={() => setShowEditGoalModal(false)} className="btn-ghost">Cancel</button>
                  <button type="submit" className="btn-primary">Save Changes</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete Fitness Goal Confirmation Modal ── */}
      <AnimatePresence>
        {deleteGoalTarget && (
          <div className="modal-overlay" onClick={() => setDeleteGoalTarget(null)}>
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
                  <h3 className="font-bold text-fg">Delete Fitness Goal?</h3>
                  <p className="text-xs text-fg-3">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-sm text-fg-2 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-fg">"{deleteGoalTarget.title}"</span>? This target will be removed from your fitness goals.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteGoalTarget(null)}
                  className="btn-ghost flex-1 justify-center border border-surface"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteGoalConfirm}
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
