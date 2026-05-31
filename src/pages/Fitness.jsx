import { useState, useEffect, useMemo, useCallback } from 'react';
import { useFitnessStore } from '../store/useFitnessStore';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDate, subDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  ResponsiveContainer, Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts';
import {
  Dumbbell, Droplets, Moon, Scale, Plus, Minus,
  Target, TrendingUp, Flame, Save, ChevronDown, ChevronUp, Check,
  Calendar, Activity,
} from 'lucide-react';

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
  const { log, goals, logDay, updateGoals, getTodayLog, getWeeklyData, getGymStreak } = useFitnessStore();

  /* ── today form state ── */
  const todayLog = getTodayLog();
  const [gym, setGym] = useState(todayLog.gym ?? false);
  const [water, setWater] = useState(todayLog.waterGlasses ?? 0);
  const [sleep, setSleep] = useState(todayLog.sleepHours ?? 0);
  const [weight, setWeight] = useState(todayLog.weight ?? '');
  const [saved, setSaved] = useState(false);

  /* ── goals edit state ── */
  const [editGoals, setEditGoals] = useState(false);
  const [goalWater, setGoalWater] = useState(goals.waterTarget);
  const [goalSleep, setGoalSleep] = useState(goals.sleepTarget);
  const [goalWeight, setGoalWeight] = useState(goals.weightTarget);

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

  const handleSaveGoals = useCallback(() => {
    updateGoals({ waterTarget: Number(goalWater), sleepTarget: Number(goalSleep), weightTarget: Number(goalWeight) });
    setEditGoals(false);
  }, [goalWater, goalSleep, goalWeight, updateGoals]);

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
          <motion.div variants={itemVariants} className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-amber-400" />
                <h3 className="font-semibold text-fg text-sm uppercase tracking-wider">Goals</h3>
              </div>
              <button
                onClick={() => setEditGoals(e => !e)}
                className="btn-ghost text-xs py-1 px-2"
              >
                {editGoals ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {editGoals ? 'Close' : 'Edit'}
              </button>
            </div>

            <AnimatePresence>
              {editGoals ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  {[
                    { label: 'Water Target (glasses)', value: goalWater, set: setGoalWater, icon: <Droplets size={13} className="text-sky-400" />, min: 1, max: 20 },
                    { label: 'Sleep Target (hours)', value: goalSleep, set: setGoalSleep, icon: <Moon size={13} className="text-violet-400" />, min: 1, max: 12 },
                    { label: 'Weight Target (kg)', value: goalWeight, set: setGoalWeight, icon: <Scale size={13} className="text-amber-400" />, min: 1, max: 300 },
                  ].map(({ label, value, set, icon, min, max }) => (
                    <div key={label}>
                      <label className="flex items-center gap-1 text-xs text-fg-2 mb-1.5">
                        {icon} {label}
                      </label>
                      <input
                        type="number"
                        min={min}
                        max={max}
                        value={value}
                        onChange={e => set(e.target.value)}
                        className="input text-sm"
                      />
                    </div>
                  ))}
                  <button onClick={handleSaveGoals} className="btn-primary w-full justify-center text-sm py-2.5">
                    <Check size={14} /> Save Goals
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  {[
                    { icon: <Droplets size={14} className="text-sky-400" />, label: 'Water', value: `${goals.waterTarget} glasses`, bg: 'bg-sky-500/10' },
                    { icon: <Moon size={14} className="text-violet-400" />, label: 'Sleep', value: `${goals.sleepTarget} hours`, bg: 'bg-violet-500/10' },
                    { icon: <Scale size={14} className="text-amber-400" />, label: 'Weight', value: `${goals.weightTarget} kg`, bg: 'bg-amber-500/10' },
                  ].map(({ icon, label, value, bg }) => (
                    <div key={label} className={`flex items-center justify-between ${bg} rounded-xl px-4 py-3`}>
                      <div className="flex items-center gap-2 text-sm text-fg-2">
                        {icon} {label}
                      </div>
                      <span className="text-sm font-semibold text-fg">{value}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
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
    </div>
  );
}
