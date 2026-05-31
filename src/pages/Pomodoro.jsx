import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
} from 'recharts';
import {
  Play, Pause, RotateCcw, Timer, Zap, Coffee, Volume2, VolumeX, Settings,
  CheckCircle2, Clock, Flame, Wind,
} from 'lucide-react';
import { format } from 'date-fns';
import { usePomodoroStore } from '../store/usePomodoroStore';

// ─── constants ───────────────────────────────────────────────────────────────
const RADIUS = 90;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ≈ 565.49

const AMBIANCE_OPTIONS = [
  { id: 'none',        label: 'None',        icon: VolumeX },
  { id: 'rain',        label: 'Rain',        icon: Wind     },
  { id: 'forest',      label: 'Forest',      icon: Flame    },
  { id: 'white-noise', label: 'White Noise', icon: Volume2  },
];

const MODE_OPTIONS = [
  { id: '25/5',   label: '25 / 5'  },
  { id: '50/10',  label: '50 / 10' },
  { id: 'custom', label: 'Custom'  },
];

// ─── Web Audio API beep helper ────────────────────────────────────────────────
function playBeep(type = 'focus') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode   = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type      = 'sine';
    oscillator.frequency.value = type === 'focus' ? 880 : 440; // high for focus-done, low for break-done
    gainNode.gain.setValueAtTime(0.6, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.8);

    // second chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'sine';
    osc2.frequency.value = type === 'focus' ? 1100 : 550;
    gain2.gain.setValueAtTime(0, ctx.currentTime + 0.2);
    gain2.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.35);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.1);
    osc2.start(ctx.currentTime + 0.2);
    osc2.stop(ctx.currentTime + 1.1);
  } catch (_) {
    // audio not available – silently ignore
  }
}

// ─── Custom recharts tooltip ─────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-xs shadow-xl">
      <p className="text-fg-3 mb-1 font-medium">{label}</p>
      <p className="text-indigo-400 font-semibold">{payload[0].value} hrs</p>
    </div>
  );
}

// ─── Circular Timer SVG ───────────────────────────────────────────────────────
function CircularTimer({ progress, timeStr, sessionType, isRunning, isPulsing }) {
  const strokeOffset = CIRCUMFERENCE * (1 - Math.max(0, Math.min(1, progress)));
  const gradientId = 'timerGradient';

  return (
    <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
      {/* Glow behind ring */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: sessionType === 'focus'
            ? 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)',
          filter: 'blur(4px)',
        }}
      />

      <svg
        width="220"
        height="220"
        viewBox="0 0 220 220"
        className="circular-timer"
        aria-label={`Timer: ${timeStr}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>

        {/* Track circle */}
        <circle
          cx="110" cy="110" r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="10"
        />

        {/* Progress arc */}
        <circle
          cx="110" cy="110" r={RADIUS}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeOffset}
          className="timer-ring"
          style={{
            transition: isRunning ? 'stroke-dashoffset 1s linear' : 'stroke-dashoffset 0.4s ease',
            filter: `drop-shadow(0 0 6px ${sessionType === 'focus' ? '#6366f1' : '#10b981'})`,
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
        <motion.span
          key={timeStr}
          initial={{ scale: 0.95, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="font-mono text-4xl font-bold tracking-tighter"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.05em' }}
        >
          {timeStr}
        </motion.span>
        <span
          className="text-xs font-semibold uppercase tracking-widest mt-1"
          style={{ color: sessionType === 'focus' ? '#818cf8' : '#34d399' }}
        >
          {sessionType === 'focus' ? 'Focus' : 'Break'}
        </span>
      </div>

      {/* Pulse ring when running */}
      <AnimatePresence>
        {isRunning && (
          <motion.div
            key="pulse"
            className="absolute inset-0 rounded-full border-2 pointer-events-none"
            style={{ borderColor: sessionType === 'focus' ? 'rgba(99,102,241,0.3)' : 'rgba(16,185,129,0.3)' }}
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 1.12, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Session Log Item ─────────────────────────────────────────────────────────
function SessionLogItem({ session, index }) {
  const isFocus = session.type === 'focus';
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-3 py-2.5 border-b last:border-0"
      style={{ borderColor: 'var(--surface-border)' }}
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: isFocus ? 'rgba(99,102,241,0.15)' : 'rgba(16,185,129,0.15)',
        }}
      >
        {isFocus
          ? <Zap size={14} className="text-indigo-400" />
          : <Coffee size={14} className="text-emerald-400" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-fg">{isFocus ? 'Focus Session' : 'Break'}</p>
        <p className="text-xs text-fg-3 mt-0.5">
          {format(new Date(session.completedAt), 'h:mm a')}
        </p>
      </div>
      <span
        className="text-xs font-semibold px-2 py-1 rounded-lg"
        style={{
          background: isFocus ? 'rgba(99,102,241,0.12)' : 'rgba(16,185,129,0.12)',
          color: isFocus ? '#818cf8' : '#34d399',
        }}
      >
        {session.minutes} min
      </span>
    </motion.div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────
export default function Pomodoro() {
  // ── store ──────────────────────────────────────────────────────────────────
  const {
    sessions,
    settings,
    totalFocusMinutes,
    setMode,
    setCustomTime,
    completeSession,
    getTodaySessions,
    getTodayFocusMinutes,
    getWeeklyFocusData,
  } = usePomodoroStore();

  // ── local state ────────────────────────────────────────────────────────────
  const [sessionType, setSessionType]     = useState('focus'); // 'focus' | 'break'
  const [timeLeft, setTimeLeft]           = useState(settings.focusTime * 60);
  const [isRunning, setIsRunning]         = useState(false);
  const [sessionCount, setSessionCount]   = useState(0);
  const [ambiance, setAmbiance]           = useState('none');
  const [showCustom, setShowCustom]       = useState(settings.mode === 'custom');
  const [customFocus, setCustomFocus]     = useState(String(settings.focusTime));
  const [customBreak, setCustomBreak]     = useState(String(settings.breakTime));
  const [soundEnabled, setSoundEnabled]   = useState(true);
  const [justCompleted, setJustCompleted] = useState(false);

  const intervalRef = useRef(null);
  const sessionTypeRef = useRef(sessionType);
  sessionTypeRef.current = sessionType;

  // computed
  const totalSeconds  = (sessionType === 'focus' ? settings.focusTime : settings.breakTime) * 60;
  const progress      = totalSeconds > 0 ? timeLeft / totalSeconds : 0;
  const timeStr       = `${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(timeLeft % 60).padStart(2, '0')}`;
  const todaySessions = getTodaySessions();
  const todayFocusMins = getTodayFocusMinutes();
  const weeklyData    = getWeeklyFocusData();
  const allSessionsToday = sessions.filter(s => s.date === format(new Date(), 'yyyy-MM-dd'));

  // ── reset timer when settings change ──────────────────────────────────────
  const resetTimer = useCallback((type, newSettings) => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    const mins = type === 'focus'
      ? (newSettings || settings).focusTime
      : (newSettings || settings).breakTime;
    setTimeLeft(mins * 60);
  }, [settings]);

  // ── handle session completion ──────────────────────────────────────────────
  const handleSessionComplete = useCallback(() => {
    const type = sessionTypeRef.current;
    const mins = type === 'focus' ? settings.focusTime : settings.breakTime;

    if (soundEnabled) playBeep(type);

    setJustCompleted(true);
    setTimeout(() => setJustCompleted(false), 2000);

    completeSession(type, mins);

    if (type === 'focus') {
      setSessionCount(prev => prev + 1);
      setSessionType('break');
      setTimeLeft(settings.breakTime * 60);
    } else {
      setSessionType('focus');
      setTimeLeft(settings.focusTime * 60);
    }
    setIsRunning(false);
  }, [settings, soundEnabled, completeSession]);

  // ── tick ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, handleSessionComplete]);

  // ── mode switching ─────────────────────────────────────────────────────────
  const handleModeChange = (mode) => {
    setMode(mode);
    setShowCustom(mode === 'custom');
    setIsRunning(false);
    clearInterval(intervalRef.current);

    const modeMap = { '25/5': { focusTime: 25, breakTime: 5 }, '50/10': { focusTime: 50, breakTime: 10 } };
    if (modeMap[mode]) {
      setSessionType('focus');
      setTimeLeft(modeMap[mode].focusTime * 60);
    }
  };

  const handleCustomApply = () => {
    const f = Math.max(1, Math.min(120, parseInt(customFocus) || 25));
    const b = Math.max(1, Math.min(60,  parseInt(customBreak)  || 5));
    setCustomFocus(String(f));
    setCustomBreak(String(b));
    setCustomTime(f, b);
    setSessionType('focus');
    setTimeLeft(f * 60);
    setIsRunning(false);
    clearInterval(intervalRef.current);
  };

  const handleReset = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setSessionType('focus');
    setTimeLeft(settings.focusTime * 60);
  };

  // ── chart bar colors ───────────────────────────────────────────────────────
  const barColors = weeklyData.map((_, i) =>
    i === weeklyData.length - 1 ? '#6366f1' : 'rgba(99,102,241,0.4)'
  );

  return (
    <div className="page-enter min-h-screen p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

      {/* ── Page Header ── */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Timer size={26} className="text-indigo-400" />
            <span className="gradient-text">Pomodoro</span>
          </h1>
          <p className="page-subtitle">Deep work, one session at a time.</p>
        </div>

        {/* Sound toggle */}
        <button
          onClick={() => setSoundEnabled(v => !v)}
          className="btn-ghost rounded-xl p-2.5"
          title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
        >
          {soundEnabled
            ? <Volume2 size={18} className="text-indigo-400" />
            : <VolumeX  size={18} className="text-fg-3" />
          }
        </button>
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left col: Timer + controls ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Timer Card */}
          <div
            className="card p-6 sm:p-8 flex flex-col items-center gap-6 relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, rgba(26,26,46,0.95) 0%, rgba(10,10,20,0.98) 100%)',
              border: '1px solid rgba(99,102,241,0.15)',
            }}
          >
            {/* Decorative blobs */}
            <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
            <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)' }} />

            {/* Session type pill */}
            <motion.div
              key={sessionType}
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0,  opacity: 1 }}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest"
              style={{
                background: sessionType === 'focus'
                  ? 'rgba(99,102,241,0.15)' : 'rgba(16,185,129,0.15)',
                color: sessionType === 'focus' ? '#818cf8' : '#34d399',
                border: `1px solid ${sessionType === 'focus' ? 'rgba(99,102,241,0.3)' : 'rgba(16,185,129,0.3)'}`,
              }}
            >
              {sessionType === 'focus'
                ? <><Zap size={12} /> Focus Session</>
                : <><Coffee size={12} /> Break Time</>
              }
              <span className="opacity-60">· #{sessionCount + (sessionType === 'break' ? 0 : 1)}</span>
            </motion.div>

            {/* Circular Timer */}
            <CircularTimer
              progress={progress}
              timeStr={timeStr}
              sessionType={sessionType}
              isRunning={isRunning}
              isPulsing={justCompleted}
            />

            {/* Completed flash */}
            <AnimatePresence>
              {justCompleted && (
                <motion.div
                  key="done"
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1,   opacity: 1 }}
                  exit={{ scale: 1.1, opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 pointer-events-none"
                >
                  <CheckCircle2 size={56} className="text-emerald-400 drop-shadow-xl" />
                  <span className="text-emerald-300 font-bold text-lg">Done!</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress bar (linear secondary) */}
            <div className="w-full max-w-xs progress-bar">
              <motion.div
                className="progress-fill"
                style={{ width: `${(1 - progress) * 100}%` }}
                transition={{ duration: 1, ease: 'linear' }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReset}
                className="btn btn-ghost rounded-xl px-4 py-2.5 gap-2"
                title="Reset"
              >
                <RotateCcw size={15} />
                Reset
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => setIsRunning(v => !v)}
                className="btn rounded-2xl px-8 py-3 text-base font-bold shadow-lg gap-3"
                style={{
                  background: isRunning
                    ? 'linear-gradient(135deg, rgba(239,68,68,0.8), rgba(220,38,38,0.9))'
                    : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  color: '#fff',
                  boxShadow: isRunning
                    ? '0 0 20px rgba(239,68,68,0.3)'
                    : '0 0 20px rgba(99,102,241,0.35)',
                }}
              >
                {isRunning ? <Pause size={18} /> : <Play size={18} />}
                {isRunning ? 'Pause' : 'Start'}
              </motion.button>
            </div>
          </div>

          {/* ── Mode Selector + Custom Inputs ── */}
          <div className="card p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1">
              <Settings size={15} className="text-fg-3" />
              <span className="text-sm font-semibold text-fg-2">Timer Mode</span>
            </div>

            {/* Mode pills */}
            <div className="flex gap-2 flex-wrap">
              {MODE_OPTIONS.map(opt => (
                <motion.button
                  key={opt.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleModeChange(opt.id)}
                  className="btn text-sm px-5 py-2 rounded-xl"
                  style={
                    settings.mode === opt.id
                      ? {
                          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                          color: '#fff',
                          boxShadow: '0 0 12px rgba(99,102,241,0.3)',
                        }
                      : {
                          background: 'var(--surface-border)',
                          color: 'var(--text-secondary)',
                        }
                  }
                >
                  {opt.label}
                </motion.button>
              ))}
            </div>

            {/* Custom inputs */}
            <AnimatePresence>
              {showCustom && (
                <motion.div
                  key="custom-inputs"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <div className="flex-1">
                      <label className="text-xs text-fg-3 mb-1 block font-medium">Focus (min)</label>
                      <input
                        type="number"
                        min="1" max="120"
                        value={customFocus}
                        onChange={e => setCustomFocus(e.target.value)}
                        className="input"
                        placeholder="25"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-fg-3 mb-1 block font-medium">Break (min)</label>
                      <input
                        type="number"
                        min="1" max="60"
                        value={customBreak}
                        onChange={e => setCustomBreak(e.target.value)}
                        className="input"
                        placeholder="5"
                      />
                    </div>
                    <div className="flex items-end">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCustomApply}
                        className="btn-primary w-full sm:w-auto"
                      >
                        Apply
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Ambiance selector */}
            <div>
              <p className="text-xs text-fg-3 mb-2 font-medium uppercase tracking-wider">Background Ambiance</p>
              <div className="flex gap-2 flex-wrap">
                {AMBIANCE_OPTIONS.map(opt => {
                  const Icon = opt.icon;
                  const active = ambiance === opt.id;
                  return (
                    <motion.button
                      key={opt.id}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => setAmbiance(opt.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150"
                      style={
                        active
                          ? { background: 'rgba(99,102,241,0.2)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.35)' }
                          : { background: 'var(--surface-border)', color: 'var(--text-secondary)', border: '1px solid transparent' }
                      }
                    >
                      <Icon size={12} />
                      {opt.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Weekly Focus Chart ── */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-fg flex items-center gap-2">
                <Flame size={16} className="text-amber-400" />
                Weekly Focus
              </h3>
              <span className="badge badge-primary">7 days</span>
            </div>
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} barSize={20} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                    unit="h"
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)', radius: 6 }} />
                  <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                    {weeklyData.map((_, idx) => (
                      <Cell key={`cell-${idx}`} fill={barColors[idx]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── Right col: Stats + Session Log ── */}
        <div className="flex flex-col gap-6">

          {/* Stats grid */}
          <div className="grid grid-cols-1 gap-4">
            {/* Today sessions */}
            <motion.div
              className="stat-card gradient-border"
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <span className="stat-label">Today's Sessions</span>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(99,102,241,0.15)' }}>
                  <Zap size={14} className="text-indigo-400" />
                </div>
              </div>
              <p className="stat-value">{todaySessions.length}</p>
              <p className="text-xs text-fg-3 mt-1">
                {sessionCount > 0 ? `${sessionCount} completed this session` : 'Start your first session!'}
              </p>
            </motion.div>

            {/* Today focus minutes */}
            <motion.div
              className="stat-card"
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <span className="stat-label">Today's Focus</span>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(16,185,129,0.15)' }}>
                  <Clock size={14} className="text-emerald-400" />
                </div>
              </div>
              <p className="stat-value gradient-text">{todayFocusMins}</p>
              <p className="text-xs text-fg-3 mt-1">minutes focused</p>

              {/* mini progress: target 120 min */}
              <div className="progress-bar mt-3">
                <div
                  className="progress-fill"
                  style={{ width: `${Math.min(100, (todayFocusMins / 120) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-fg-3 mt-1">
                {Math.round(Math.min(100, (todayFocusMins / 120) * 100))}% of 2-hr daily goal
              </p>
            </motion.div>

            {/* Total all-time */}
            <motion.div
              className="stat-card"
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <span className="stat-label">All-Time Focus</span>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(168,85,247,0.15)' }}>
                  <Flame size={14} className="text-purple-400" />
                </div>
              </div>
              <p className="stat-value">{totalFocusMinutes}</p>
              <p className="text-xs text-fg-3 mt-1">
                ≈ {(totalFocusMinutes / 60).toFixed(1)} hours total
              </p>
            </motion.div>
          </div>

          {/* ── Session Log ── */}
          <div className="card p-5 flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-fg flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                Today's Log
              </h3>
              {allSessionsToday.length > 0 && (
                <span className="badge badge-accent">{allSessionsToday.length}</span>
              )}
            </div>

            <div className="flex flex-col max-h-80 overflow-y-auto scrollbar-none">
              <AnimatePresence initial={false}>
                {allSessionsToday.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-8 gap-3 text-center"
                  >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{ background: 'var(--surface-border)' }}>
                      <Timer size={22} className="text-fg-3" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-fg-2">No sessions yet</p>
                      <p className="text-xs text-fg-3 mt-1">Start the timer to log your first session</p>
                    </div>
                  </motion.div>
                ) : (
                  [...allSessionsToday].reverse().map((session, i) => (
                    <SessionLogItem key={session.id} session={session} index={i} />
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
