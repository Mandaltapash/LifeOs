import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, isToday, subDays } from 'date-fns';
import {
  CheckCircle2,
  Target,
  Timer,
  BookOpen,
  Edit3,
  Save,
  ChevronDown,
  ChevronUp,
  Star,
  TrendingUp,
  X,
} from 'lucide-react';

import { useReviewStore } from '../store/useReviewStore';
import { useHabitStore } from '../store/useHabitStore';
import { useTodoStore } from '../store/useTodoStore';
import { usePomodoroStore } from '../store/usePomodoroStore';
import { useGateStore } from '../store/useGateStore';

/* ─── Constants ─────────────────────────────────────────────────── */
const MOODS = [
  { value: 1, emoji: '😞', label: 'Rough' },
  { value: 2, emoji: '😕', label: 'Meh' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
];

const MOOD_COLORS = {
  1: 'from-red-600/30 to-red-800/20 border-red-500/30',
  2: 'from-orange-600/30 to-orange-800/20 border-orange-500/30',
  3: 'from-yellow-600/30 to-yellow-800/20 border-yellow-500/30',
  4: 'from-blue-600/30 to-blue-800/20 border-blue-500/30',
  5: 'from-emerald-600/30 to-emerald-800/20 border-emerald-500/30',
};

const EMPTY_FORM = {
  completed: '',
  missed: '',
  improvements: '',
  priorities: ['', '', ''],
  mood: 3,
};

/* ─── Framer variants ────────────────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const successVariants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 20 } },
  exit: { opacity: 0, scale: 0.85, transition: { duration: 0.2 } },
};

/* ─── Sub-components ─────────────────────────────────────────────── */

/** Gradient header banner */
function HeroHeader({ todayStr }) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-6 mb-6"
      style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(16,185,129,0.15) 60%, rgba(139,92,246,0.15) 100%)',
        border: '1px solid rgba(99,102,241,0.25)',
      }}
    >
      {/* Decorative blobs */}
      <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
      <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, #10b981, transparent)' }} />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-5 h-5 text-yellow-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-fg-3">Daily Review</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-fg">
            How was your{' '}
            <span className="gradient-text">day?</span>
          </h1>
          <p className="page-subtitle mt-1">{todayStr}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <TrendingUp className="w-4 h-4 text-primary-400" />
          <span className="text-sm font-medium text-fg-2">Reflect &amp; Grow</span>
        </div>
      </div>
    </div>
  );
}

/** Today's stats card */
function StatPill({ icon: Icon, label, value, color, subtitle }) {
  return (
    <motion.div variants={itemVariants}
      className="stat-card flex-1 min-w-[140px] flex flex-col gap-1"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${color}22` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-value text-2xl">{value}</div>
      {subtitle && <p className="text-xs text-fg-3">{subtitle}</p>}
    </motion.div>
  );
}

/** Mood button */
function MoodButton({ mood, selected, onClick }) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.18 }}
      whileTap={{ scale: 0.92 }}
      onClick={() => onClick(mood.value)}
      className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-2xl transition-all duration-200 cursor-pointer border ${
        selected
          ? 'border-primary-500 bg-primary-500/15 shadow-glow-primary'
          : 'border-surface bg-surface hover:border-primary-500/40'
      }`}
      aria-label={mood.label}
    >
      <span className="text-3xl leading-none select-none">{mood.emoji}</span>
      <span className={`text-xs font-medium ${selected ? 'text-primary-400' : 'text-fg-3'}`}>
        {mood.label}
      </span>
    </motion.button>
  );
}

/** Expandable history card */
function ReviewHistoryCard({ review, index }) {
  const [expanded, setExpanded] = useState(false);
  const mood = MOODS.find(m => m.value === review.mood) || MOODS[2];
  const colorClass = MOOD_COLORS[review.mood] || MOOD_COLORS[3];

  let dateLabel = '';
  try {
    const d = parseISO(review.date);
    dateLabel = isToday(d) ? 'Today' : format(d, 'EEEE, MMM d');
  } catch {
    dateLabel = review.date;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3, ease: 'easeOut' }}
      className="relative"
    >
      {/* Timeline line */}
      <div className="absolute left-5 top-14 bottom-0 w-px"
        style={{ background: 'var(--surface-border)' }} />

      <div className={`card overflow-hidden transition-all duration-300`}>
        {/* Header */}
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className={`w-full flex items-center gap-4 p-4 bg-gradient-to-r ${colorClass} cursor-pointer text-left`}
        >
          {/* Mood dot */}
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            {mood.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-fg">{dateLabel}</p>
            <p className="text-xs text-fg-3 mt-0.5 truncate">
              {review.completed
                ? review.completed.slice(0, 60) + (review.completed.length > 60 ? '…' : '')
                : 'No completion noted'}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="badge badge-gray text-xs">{mood.label}</span>
            {expanded
              ? <ChevronUp className="w-4 h-4 text-fg-3" />
              : <ChevronDown className="w-4 h-4 text-fg-3" />
            }
          </div>
        </button>

        {/* Expandable body */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-surface">
                {review.completed && (
                  <ReviewSection
                    title="✅ Completed"
                    content={review.completed}
                    color="#10b981"
                  />
                )}
                {review.missed && (
                  <ReviewSection
                    title="❌ Missed"
                    content={review.missed}
                    color="#ef4444"
                  />
                )}
                {review.improvements && (
                  <ReviewSection
                    title="🔧 Improvements"
                    content={review.improvements}
                    color="#f59e0b"
                  />
                )}
                {review.priorities && review.priorities.some(Boolean) && (
                  <div className="rounded-xl p-3" style={{ background: 'var(--bg-secondary)' }}>
                    <p className="text-xs font-semibold text-fg-3 uppercase tracking-wide mb-2">
                      🎯 Tomorrow's Priorities
                    </p>
                    <ul className="space-y-1">
                      {review.priorities.filter(Boolean).map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-fg-2">
                          <span className="w-5 h-5 rounded-full bg-primary-500/20 text-primary-400 text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                            {i + 1}
                          </span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function ReviewSection({ title, content, color }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--bg-secondary)', borderLeft: `3px solid ${color}` }}>
      <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color }}>
        {title}
      </p>
      <p className="text-sm text-fg-2 leading-relaxed whitespace-pre-wrap">{content}</p>
    </div>
  );
}

/** Textarea field */
function FormTextarea({ label, value, onChange, placeholder, icon: Icon, accentColor = '#6366f1' }) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-semibold text-fg-2 mb-2">
        {Icon && (
          <span className="w-5 h-5 rounded-lg flex items-center justify-center"
            style={{ background: `${accentColor}22` }}>
            <Icon className="w-3 h-3" style={{ color: accentColor }} />
          </span>
        )}
        {label}
      </label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="input resize-none leading-relaxed"
        style={{ fontFamily: 'inherit' }}
      />
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────── */
export default function DailyReview() {
  /* Stores */
  const { saveReview, getTodayReview, getRecentReviews } = useReviewStore();
  const { habits, completions } = useHabitStore();
  const { getCompletedTodayCount } = useTodoStore();
  const { getTodaySessions, getTodayFocusMinutes } = usePomodoroStore();
  const { studyLog } = useGateStore();

  /* Local state */
  const [form, setForm] = useState(EMPTY_FORM);
  const [saved, setSaved] = useState(false);
  const [editMode, setEditMode] = useState(false);

  /* Load today's review into form if exists */
  useEffect(() => {
    const existing = getTodayReview();
    if (existing) {
      setForm({
        completed: existing.completed || '',
        missed: existing.missed || '',
        improvements: existing.improvements || '',
        priorities: existing.priorities?.length === 3 ? existing.priorities : ['', '', ''],
        mood: existing.mood || 3,
      });
    }
  }, []);

  /* Stats calculations */
  const todayStr = format(new Date(), 'EEEE, MMMM d, yyyy');
  const todayKey = format(new Date(), 'yyyy-MM-dd');

  const habitsCompletedToday = useMemo(() => {
    return habits.filter(h => {
      const count = (completions[h.id] || {})[todayKey] || 0;
      return count >= h.target;
    }).length;
  }, [habits, completions, todayKey]);

  const tasksCompletedToday = useMemo(() => getCompletedTodayCount(), []);

  const focusSessionsToday = useMemo(() => getTodaySessions().length, []);
  const focusMinutesToday = useMemo(() => getTodayFocusMinutes(), []);

  const studyHoursToday = useMemo(() => {
    return studyLog
      .filter(l => l.date === todayKey)
      .reduce((sum, l) => sum + (l.hours || 0), 0);
  }, [studyLog, todayKey]);

  /* History */
  const recentReviews = useMemo(() => getRecentReviews(7), [saved]);

  /* Handlers */
  const handlePriorityChange = (idx, val) => {
    setForm(f => {
      const priorities = [...f.priorities];
      priorities[idx] = val;
      return { ...f, priorities };
    });
  };

  const handleSave = () => {
    if (!form.completed && !form.missed && !form.improvements && !form.priorities.some(Boolean)) return;
    saveReview(form);
    setSaved(true);
    setEditMode(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const todayReview = getTodayReview();
  const hasSubmitted = !!todayReview && !editMode;

  /* ── Render ── */
  return (
    <div className="page-enter min-h-screen" style={{ color: 'var(--text-primary)' }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto space-y-6"
      >
        {/* Hero */}
        <motion.div variants={itemVariants}>
          <HeroHeader todayStr={todayStr} />
        </motion.div>

        {/* ── Today's Summary Stats ── */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary-400" />
            <h2 className="text-base font-semibold text-fg">Today's Summary</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <StatPill
              icon={CheckCircle2}
              label="Habits Done"
              value={`${habitsCompletedToday}/${habits.length}`}
              color="#6366f1"
              subtitle="habits completed"
            />
            <StatPill
              icon={Target}
              label="Tasks Done"
              value={tasksCompletedToday}
              color="#10b981"
              subtitle="tasks finished today"
            />
            <StatPill
              icon={Timer}
              label="Focus Sessions"
              value={focusSessionsToday}
              color="#f59e0b"
              subtitle={`${focusMinutesToday} min focused`}
            />
            <StatPill
              icon={BookOpen}
              label="Study Hours"
              value={studyHoursToday.toFixed(1)}
              color="#8b5cf6"
              subtitle="hours of GATE study"
            />
          </div>
        </motion.div>

        {/* ── Review Form or Submitted View ── */}
        <motion.div variants={itemVariants}>
          <AnimatePresence mode="wait">
            {/* Success State */}
            {saved && (
              <motion.div
                key="success"
                variants={successVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col items-center justify-center py-12 card"
              >
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                  style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(99,102,241,0.2))' }}
                >
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </motion.div>
                <h3 className="text-xl font-bold text-fg mb-1">Review Saved! 🎉</h3>
                <p className="text-sm text-fg-3">Great job reflecting on your day.</p>
              </motion.div>
            )}

            {/* Submitted (view mode) */}
            {!saved && hasSubmitted && (
              <motion.div
                key="submitted"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="card overflow-hidden"
              >
                {/* Banner */}
                <div className={`flex items-center justify-between gap-4 p-4 bg-gradient-to-r ${MOOD_COLORS[todayReview.mood] || MOOD_COLORS[3]}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">
                      {MOODS.find(m => m.value === todayReview.mood)?.emoji || '😐'}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-fg">Today's review is complete</p>
                      <p className="text-xs text-fg-3">
                        Mood: {MOODS.find(m => m.value === todayReview.mood)?.label || 'Okay'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditMode(true)}
                    className="btn-secondary text-xs px-3 py-1.5 gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit Review
                  </button>
                </div>

                {/* Preview */}
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {todayReview.completed && (
                    <ReviewSection title="✅ Completed" content={todayReview.completed} color="#10b981" />
                  )}
                  {todayReview.missed && (
                    <ReviewSection title="❌ Missed" content={todayReview.missed} color="#ef4444" />
                  )}
                  {todayReview.improvements && (
                    <ReviewSection title="🔧 Improvements" content={todayReview.improvements} color="#f59e0b" />
                  )}
                  {todayReview.priorities?.some(Boolean) && (
                    <div className="rounded-xl p-3" style={{ background: 'var(--bg-secondary)' }}>
                      <p className="text-xs font-semibold text-fg-3 uppercase tracking-wide mb-2">
                        🎯 Tomorrow's Priorities
                      </p>
                      <ul className="space-y-1">
                        {todayReview.priorities.filter(Boolean).map((p, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-fg-2">
                            <span className="w-5 h-5 rounded-full bg-primary-500/20 text-primary-400 text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                              {i + 1}
                            </span>
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Form (new or edit mode) */}
            {!saved && !hasSubmitted && (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="card p-6 space-y-6"
              >
                {/* Card header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-primary-400" />
                    <h2 className="text-lg font-semibold text-fg">
                      {editMode ? 'Edit Today\'s Review' : 'Write Today\'s Review'}
                    </h2>
                  </div>
                  {editMode && (
                    <button
                      type="button"
                      onClick={() => setEditMode(false)}
                      className="btn-ghost p-1.5 rounded-lg"
                      title="Cancel edit"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Mood selector */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-fg-2 mb-3">
                    <span className="w-5 h-5 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(99,102,241,0.2)' }}>
                      <Star className="w-3 h-3 text-primary-400" />
                    </span>
                    How are you feeling today?
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {MOODS.map(mood => (
                      <MoodButton
                        key={mood.value}
                        mood={mood}
                        selected={form.mood === mood.value}
                        onClick={v => setForm(f => ({ ...f, mood: v }))}
                      />
                    ))}
                  </div>
                </div>

                <hr className="border-surface" />

                {/* Textareas */}
                <div className="space-y-5">
                  <FormTextarea
                    label="What did you complete today?"
                    value={form.completed}
                    onChange={v => setForm(f => ({ ...f, completed: v }))}
                    placeholder="List your accomplishments, big or small…"
                    icon={CheckCircle2}
                    accentColor="#10b981"
                  />
                  <FormTextarea
                    label="What did you miss today?"
                    value={form.missed}
                    onChange={v => setForm(f => ({ ...f, missed: v }))}
                    placeholder="What slipped through the cracks today?"
                    icon={X}
                    accentColor="#ef4444"
                  />
                  <FormTextarea
                    label="What will you improve tomorrow?"
                    value={form.improvements}
                    onChange={v => setForm(f => ({ ...f, improvements: v }))}
                    placeholder="One change that will make tomorrow better…"
                    icon={TrendingUp}
                    accentColor="#f59e0b"
                  />
                </div>

                <hr className="border-surface" />

                {/* Tomorrow's priorities */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-fg-2 mb-3">
                    <span className="w-5 h-5 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(99,102,241,0.2)' }}>
                      <Target className="w-3 h-3 text-primary-400" />
                    </span>
                    Top 3 Priorities for Tomorrow
                  </label>
                  <div className="space-y-2">
                    {[0, 1, 2].map(idx => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary-500/20 text-primary-400 text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={form.priorities[idx]}
                          onChange={e => handlePriorityChange(idx, e.target.value)}
                          placeholder={
                            idx === 0
                              ? 'Most important task…'
                              : idx === 1
                              ? 'Second priority…'
                              : 'Third priority…'
                          }
                          className="input"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save button */}
                <div className="flex justify-end pt-2">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSave}
                    disabled={
                      !form.completed &&
                      !form.missed &&
                      !form.improvements &&
                      !form.priorities.some(Boolean)
                    }
                    className="btn-primary px-6 py-2.5 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    Save Review
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Review History ── */}
        {recentReviews.length > 0 && (
          <motion.div variants={itemVariants} className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-primary-400" />
              <h2 className="text-base font-semibold text-fg">Review History</h2>
              <span className="badge badge-gray ml-1">{recentReviews.length} days</span>
            </div>

            <div className="space-y-3 pl-4 relative">
              {/* Vertical timeline rail */}
              <div className="absolute left-0 top-2 bottom-2 w-px"
                style={{ background: 'linear-gradient(to bottom, #6366f1, #10b981)' }} />

              {recentReviews.map((review, i) => (
                <ReviewHistoryCard key={review.date} review={review} index={i} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty history placeholder */}
        {recentReviews.length === 0 && (
          <motion.div variants={itemVariants}
            className="card p-8 flex flex-col items-center text-center gap-3"
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: 'rgba(99,102,241,0.1)' }}>
              📓
            </div>
            <p className="text-sm font-medium text-fg-2">No review history yet</p>
            <p className="text-xs text-fg-3">Your past daily reviews will appear here.</p>
          </motion.div>
        )}

        {/* Bottom padding */}
        <div className="h-8" />
      </motion.div>
    </div>
  );
}
