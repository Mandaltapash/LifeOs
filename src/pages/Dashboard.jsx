import { useTodoStore } from '../store/useTodoStore';
import { useHabitStore } from '../store/useHabitStore';
import { usePlannerStore } from '../store/usePlannerStore';
import { usePomodoroStore } from '../store/usePomodoroStore';
import { useAppStore } from '../store/useAppStore';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays, differenceInHours, differenceInMinutes, parseISO } from 'date-fns';
import { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, Clock, Flame, Target, Zap, Plus, X, Calendar, BookOpen, AlertCircle } from 'lucide-react';

const MOTIVATIONAL_QUOTES = [
  { text: "Your limit is only your imagination.", author: "Unknown" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Dream it. Wish it. Do it.", author: "Unknown" },
  { text: "Success doesn’t just find you. You have to go out and get it.", author: "Unknown" },
  { text: "The key to success is to focus on goals, not obstacles.", author: "Unknown" },
  { text: "Dream bigger. Do bigger.", author: "Unknown" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "GATE prep is a marathon, not a sprint. Consistency is key.", author: "IITian advice" },
  { text: "Every line of code you write makes you a better developer.", author: "Tech Proverb" }
];

export default function Dashboard() {
  const { settings, gateExamDate } = useAppStore();
  const { tasks, getTodayTasks, getPendingCount, getCompletedTodayCount, addTask } = useTodoStore();
  const { habits, completions, toggleHabit, getTodayCompletedCount, getLongestStreak } = useHabitStore();
  const { blocks, getTodayBlocks } = usePlannerStore();
  const { getTodayFocusMinutes } = usePomodoroStore();

  const [quote, setQuote] = useState(MOTIVATIONAL_QUOTES[0]);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 });
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('personal');

  // Rotate quotes every day or on mount
  useEffect(() => {
    const idx = new Date().getDate() % MOTIVATIONAL_QUOTES.length;
    setQuote(MOTIVATIONAL_QUOTES[idx]);
  }, []);

  // Countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const target = parseISO(`${gateExamDate}T00:00:00`) || new Date('2027-02-01T00:00:00');
      const now = new Date();
      const diffMs = target - now;
      if (diffMs <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0 });
        return;
      }
      const days = differenceInDays(target, now);
      const hours = differenceInHours(target, now) % 24;
      const minutes = differenceInMinutes(target, now) % 60;
      setCountdown({ days, hours, minutes });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [gateExamDate]);

  // Today stats
  const totalTasksToday = getTodayTasks().length;
  const tasksCompletedToday = getCompletedTodayCount();
  const habitsCompletedToday = getTodayCompletedCount();
  const totalHabits = habits.length;
  
  const todayBlocks = getTodayBlocks();
  const totalBlocksToday = todayBlocks.length;
  const blocksCompletedToday = todayBlocks.filter(b => b.done).length;

  const productivityScore = useMemo(() => {
    let earned = 0;
    let totalPossible = 0;
    let sections = 0;
    
    if (totalHabits > 0) sections++;
    if (totalTasksToday > 0) sections++;
    if (totalBlocksToday > 0) sections++;
    
    const weight = sections > 0 ? 100 / sections : 0;
    
    if (totalHabits > 0) {
      earned += (habitsCompletedToday / totalHabits) * weight;
      totalPossible += weight;
    }
    
    if (totalTasksToday > 0) {
      earned += (Math.min(tasksCompletedToday, totalTasksToday) / totalTasksToday) * weight;
      totalPossible += weight;
    }

    if (totalBlocksToday > 0) {
      earned += (blocksCompletedToday / totalBlocksToday) * weight;
      totalPossible += weight;
    }
    
    if (totalPossible === 0) return 0; // Nothing tracked today = 0%
    
    return Math.round((earned / totalPossible) * 100);
  }, [habitsCompletedToday, totalHabits, tasksCompletedToday, totalTasksToday, blocksCompletedToday, totalBlocksToday]);

  const handleQuickAdd = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    addTask({
      title: newTaskTitle,
      category: newTaskCategory,
      dueDate: format(new Date(), 'yyyy-MM-dd'),
      priority: 'medium'
    });
    setNewTaskTitle('');
    setShowQuickAdd(false);
  };

  // Mock weekly activity for chart
  const weeklyActivityData = [
    { name: 'Mon', completed: 4 },
    { name: 'Tue', completed: 6 },
    { name: 'Wed', completed: 5 },
    { name: 'Thu', completed: 8 },
    { name: 'Fri', completed: 3 },
    { name: 'Sat', completed: 7 },
    { name: 'Sun', completed: tasksCompletedToday },
  ];

  return (
    <div className="space-y-6 page-enter">
      {/* Top Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-primary-900 to-slate-900 p-8 text-white border border-primary-800 shadow-glow-primary">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-accent-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="badge badge-accent animate-pulse-slow">PWA Live & Syncing</span>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              Hello, <span className="gradient-text">{settings.name || 'Tapash'}</span>
            </h1>
            <p className="text-slate-300 italic">
              "{quote.text}" — <span className="font-semibold text-accent-400">{quote.author}</span>
            </p>
          </div>

          {/* Productivity Score Indicator */}
          <div className="flex items-center gap-4 bg-black/30 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="40" cy="40" r="34" className="stroke-slate-800" strokeWidth="6" fill="transparent" />
                <circle
                  cx="40" cy="40" r="34"
                  className="stroke-accent-500 transition-all duration-1000 ease-out"
                  strokeWidth="6" fill="transparent"
                  strokeDasharray={213.6}
                  strokeDashoffset={213.6 - (213.6 * productivityScore) / 100}
                />
              </svg>
              <span className="absolute text-lg font-bold font-mono">{productivityScore}%</span>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Productivity Score</p>
              <h3 className="text-sm font-semibold">Today is a solid day!</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Countdown and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Countdown */}
        <div className="card p-6 border-surface flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-surface to-surface-secondary">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="text-primary-400" size={20} />
            <h3 className="font-semibold text-fg">GATE Exam Countdown</h3>
          </div>
          <div className="flex gap-4 justify-center py-4">
            <div className="flex flex-col items-center">
              <span className="text-4xl font-extrabold font-mono text-primary-400">{countdown.days}</span>
              <span className="text-[10px] uppercase text-fg-3 font-semibold mt-1">Days</span>
            </div>
            <span className="text-3xl font-extrabold text-fg-3">:</span>
            <div className="flex flex-col items-center">
              <span className="text-4xl font-extrabold font-mono text-primary-400">{countdown.hours}</span>
              <span className="text-[10px] uppercase text-fg-3 font-semibold mt-1">Hours</span>
            </div>
            <span className="text-3xl font-extrabold text-fg-3">:</span>
            <div className="flex flex-col items-center">
              <span className="text-4xl font-extrabold font-mono text-primary-400">{countdown.minutes}</span>
              <span className="text-[10px] uppercase text-fg-3 font-semibold mt-1">Minutes</span>
            </div>
          </div>
          <p className="text-center text-xs text-fg-3 mt-2">Target Date: {format(parseISO(`${gateExamDate}T00:00:00`), 'dd MMM yyyy')}</p>
        </div>

        {/* Quick Stats Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="flex justify-between items-start">
              <span className="stat-label">Pending Tasks</span>
              <div className="p-2 rounded-lg bg-red-500/10 text-red-400"><AlertCircle size={16} /></div>
            </div>
            <h3 className="stat-value">{getPendingCount()}</h3>
            <p className="text-xs text-fg-3 mt-1">In backlog</p>
          </div>

          <div className="stat-card">
            <div className="flex justify-between items-start">
              <span className="stat-label">Tasks Done Today</span>
              <div className="p-2 rounded-lg bg-accent-500/10 text-accent-400"><CheckCircle2 size={16} /></div>
            </div>
            <h3 className="stat-value">{tasksCompletedToday}</h3>
            <p className="text-xs text-fg-3 mt-1">Completed today</p>
          </div>

          <div className="stat-card">
            <div className="flex justify-between items-start">
              <span className="stat-label">Longest Streak</span>
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400"><Flame size={16} className="streak-fire" /></div>
            </div>
            <h3 className="stat-value">{getLongestStreak()} days</h3>
            <p className="text-xs text-fg-3 mt-1">Active streak</p>
          </div>

          <div className="stat-card">
            <div className="flex justify-between items-start">
              <span className="stat-label">Focus Time</span>
              <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400"><Clock size={16} /></div>
            </div>
            <h3 className="stat-value">{getTodayFocusMinutes()}m</h3>
            <p className="text-xs text-fg-3 mt-1">Spent today</p>
          </div>
        </div>
      </div>

      {/* Habits & Daily Planner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Habits Quick Check-in */}
        <div className="card p-6 border-surface space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Target className="text-accent-400" size={20} />
              <h3 className="font-semibold text-fg">Habits Quick Check-in</h3>
            </div>
            <span className="text-xs badge badge-accent">{habitsCompletedToday} / {totalHabits} Done</span>
          </div>

          <div className="space-y-2">
            {habits.map(habit => {
              const completionsData = completions[habit.id] || {};
              const todayKey = format(new Date(), 'yyyy-MM-dd');
              const isDone = (completionsData[todayKey] || 0) >= habit.target;
              return (
                <button
                  key={habit.id}
                  onClick={() => toggleHabit(habit.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                    isDone
                      ? 'border-accent-500/20 bg-accent-500/5 text-fg'
                      : 'border-surface bg-surface-secondary text-fg-2 hover:bg-surface-tertiary'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{habit.icon}</span>
                    <span className="text-sm font-medium">{habit.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flame size={14} className="text-orange-500" />
                    <span className="text-xs font-semibold">{useHabitStore.getState().getStreak(habit.id)}d</span>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                      isDone ? 'bg-accent-500 border-accent-600 text-white' : 'border-surface-border'
                    }`}>
                      {isDone && <CheckCircle2 size={12} fill="currentColor" className="text-slate-900" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Today's Planner Timeline Preview */}
        <div className="card p-6 border-surface space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Calendar className="text-primary-400" size={20} />
              <h3 className="font-semibold text-fg">Planner Preview</h3>
            </div>
            <span className="text-xs badge badge-primary">{getTodayBlocks().length} blocks</span>
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {getTodayBlocks().length === 0 ? (
              <div className="text-center py-10 text-fg-3">
                <p>No time blocks scheduled today.</p>
              </div>
            ) : (
              getTodayBlocks().map(block => (
                <div key={block.id} className="relative pl-4 border-l-2 border-primary-500/60 py-1 bg-surface-secondary/40 rounded-r-lg pr-2 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-semibold text-primary-400">{block.time} - {block.endTime}</span>
                    <p className="text-sm font-semibold text-fg">{block.title}</p>
                  </div>
                  <span className={`text-[10px] uppercase font-bold badge badge-${block.category === 'study' ? 'primary' : 'accent'}`}>
                    {block.category}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Weekly Progress Chart */}
        <div className="card p-6 border-surface space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="text-yellow-400" size={20} />
            <h3 className="font-semibold text-fg">Weekly Progress</h3>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyActivityData}>
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--surface-primary)', borderColor: 'var(--surface-border)' }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                />
                <Bar dataKey="completed" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Add Floating Button & Modal */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowQuickAdd(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={24} />
        </button>
      </div>

      <AnimatePresence>
        {showQuickAdd && (
          <div className="modal-overlay" onClick={() => setShowQuickAdd(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="modal-content"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-fg">Quick Add Today's Task</h3>
                <button onClick={() => setShowQuickAdd(false)} className="btn-icon text-fg-3 hover:text-fg">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleQuickAdd} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">Task Title</label>
                  <input
                    autoFocus
                    required
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    placeholder="E.g. Study compilers, gym workout"
                    className="input"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">Category</label>
                  <select
                    value={newTaskCategory}
                    onChange={e => setNewTaskCategory(e.target.value)}
                    className="input"
                  >
                    <option value="personal">Personal</option>
                    <option value="gate">GATE Study</option>
                    <option value="coding">Coding Practice</option>
                    <option value="fitness">Fitness</option>
                    <option value="college">College Work</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowQuickAdd(false)} className="btn-ghost">Cancel</button>
                  <button type="submit" className="btn-primary">Add Task</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
