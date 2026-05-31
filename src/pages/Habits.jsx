import { useHabitStore } from '../store/useHabitStore';
import { useState, useMemo, Component } from 'react';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, Cell, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Target, Flame, Check, Plus, X, Trash2, TrendingUp, AlertTriangle } from 'lucide-react';

class HabitsErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Habits Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-950/20 border border-red-500/30 rounded-2xl text-red-200 space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2"><AlertTriangle /> Something went wrong in Habits:</h2>
          <pre className="text-xs p-4 bg-black/40 rounded-xl overflow-auto max-w-full font-mono">
            {this.state.error?.stack || this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => {
              if(confirm("This will reset your habits data to fix the crash. Continue?")) {
                localStorage.removeItem('lifeos-habits');
                window.location.reload();
              }
            }}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg text-sm font-bold transition-all"
          >
            Clear Data & Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function HabitsInner() {
  const { habits = [], completions = {}, toggleHabit, addHabit, removeHabit, getStreak } = useHabitStore();

  const safeHabits = Array.isArray(habits) ? habits : [];
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState(safeHabits[0]?.id || '');
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitIcon, setNewHabitIcon] = useState('💻');
  const [newHabitColor, setNewHabitColor] = useState('#6366f1');
  const [newHabitTarget, setNewHabitTarget] = useState(1);

  const selectedHabit = useMemo(() => {
    return safeHabits.find(h => h?.id === selectedHabitId) || safeHabits[0] || null;
  }, [safeHabits, selectedHabitId]);

  const handleAddHabitSubmit = (e) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    addHabit({
      name: newHabitName,
      icon: newHabitIcon,
      color: newHabitColor,
      target: Number(newHabitTarget) || 1,
    });
    setNewHabitName('');
    setShowAddModal(false);
  };

  const monthDays = useMemo(() => {
    try {
      const start = subDays(new Date(), 29);
      const end = new Date();
      return eachDayOfInterval({ start, end });
    } catch(e) {
      console.error(e);
      return [];
    }
  }, []);

  const habitsChartData = useMemo(() => {
    return safeHabits.map(habit => {
      const data = completions?.[habit?.id] || {};
      const completedDays = Object.values(data).filter(val => val >= (habit?.target || 1)).length;
      return {
        name: habit?.name || 'Unknown',
        completed: completedDays,
        color: habit?.color || '#10b981',
      };
    });
  }, [safeHabits, completions]);

  return (
    <div className="space-y-6 page-enter">
      <div className="page-header flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Target className="text-accent-500" /> Habit Tracker
          </h1>
          <p className="page-subtitle">Form good routines, build daily streaks, and stay disciplined.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus size={16} /> Add Custom Habit
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-semibold text-fg text-lg">Today's Routine</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {safeHabits.length === 0 ? (
              <div className="text-fg-3 text-sm p-4 border border-surface-border border-dashed rounded-xl col-span-2 text-center">
                No habits found. Create one!
              </div>
            ) : safeHabits.map(habit => {
              if (!habit) return null;
              const completionsData = completions?.[habit.id] || {};
              let todayKey = '';
              try { todayKey = format(new Date(), 'yyyy-MM-dd'); } catch(e) { todayKey = '2025-01-01'; }
              const current = completionsData[todayKey] || 0;
              const target = habit.target || 1;
              const isDone = current >= target;
              let streak = 0;
              try { streak = getStreak ? getStreak(habit.id) : 0; } catch(e){}

              return (
                <div
                  key={habit.id || Math.random()}
                  onClick={() => toggleHabit(habit.id)}
                  className={`card p-5 cursor-pointer select-none transition-all duration-200 ${
                    isDone
                      ? 'border-accent-500/30 bg-accent-500/5 shadow-glow-accent'
                      : 'border-surface bg-surface-secondary/40 hover:bg-surface-secondary'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl p-3 bg-surface rounded-xl border border-surface-border">{habit.icon || '✅'}</span>
                      <div>
                        <h4 className="font-bold text-fg text-base">{habit.name || 'Unnamed'}</h4>
                        <p className="text-xs text-fg-3">Target: {target} / day</p>
                      </div>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                      isDone ? 'bg-accent-500 border-accent-600 text-white' : 'border-surface-border'
                    }`}>
                      {isDone ? <Check size={16} /> : <span className="text-xs text-fg-3 font-semibold">{current}</span>}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-surface-border flex justify-between items-center text-xs text-fg-2">
                    <span className="flex items-center gap-1">
                      <Flame size={14} className="text-orange-500 streak-fire" />
                      Streak: <span className="font-bold text-fg">{streak} days</span>
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this habit?')) removeHabit(habit.id);
                      }}
                      className="text-fg-3 hover:text-red-400 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-6 border-surface space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-fg">Calendar Heatmap</h3>
            <select
              value={selectedHabitId}
              onChange={e => setSelectedHabitId(e.target.value)}
              className="input py-1 text-xs max-w-[150px]"
            >
              {safeHabits.map(h => h && (
                <option key={h.id} value={h.id}>{h.name || 'Unnamed'}</option>
              ))}
            </select>
          </div>

          {selectedHabit && monthDays.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedHabit.icon || '✅'}</span>
                <div>
                  <h4 className="font-bold text-sm text-fg">{selectedHabit.name || 'Unnamed'}</h4>
                  <p className="text-xs text-fg-3">Last 30 Days Check-in</p>
                </div>
              </div>

              <div className="grid grid-cols-6 gap-2">
                {monthDays.map(date => {
                  let key = '';
                  let dStr = '';
                  try {
                    key = format(date, 'yyyy-MM-dd');
                    dStr = format(date, 'd');
                  } catch(e) {
                    return <div key={Math.random()} />;
                  }
                  const count = (completions?.[selectedHabit.id] || {})[key] || 0;
                  const isDone = count >= (selectedHabit.target || 1);
                  return (
                    <div
                      key={key}
                      title={`${key}: ${isDone ? 'Completed' : 'Missed'}`}
                      className={`h-10 rounded-lg flex flex-col justify-between p-1.5 transition-all ${
                        isDone
                          ? 'bg-accent-500/20 border border-accent-500/40 text-accent-400'
                          : 'bg-surface-secondary border border-surface-border text-fg-3'
                      }`}
                    >
                      <span className="text-[9px] font-mono font-bold leading-none">{dStr}</span>
                      {isDone && <Check size={8} className="self-end" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card p-6 border-surface space-y-4">
        <h3 className="font-semibold text-fg flex items-center gap-2">
          <TrendingUp size={20} className="text-primary-500" /> Completion Summary (Last 30 Days)
        </h3>
        <div className="h-60 w-full">
          {habitsChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={habitsChartData}>
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip />
                <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]}>
                  {habitsChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-fg-3 text-sm">
              No data to display
            </div>
          )}
        </div>
      </div>

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
                <h3 className="text-lg font-bold text-fg">Add Custom Habit</h3>
                <button onClick={() => setShowAddModal(false)} className="btn-icon text-fg-3 hover:text-fg">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddHabitSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">Habit Name</label>
                  <input
                    autoFocus
                    required
                    value={newHabitName}
                    onChange={e => setNewHabitName(e.target.value)}
                    placeholder="E.g. LeetCode Practice, Meditate"
                    className="input"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">Icon (Emoji)</label>
                    <input
                      required
                      value={newHabitIcon}
                      onChange={e => setNewHabitIcon(e.target.value)}
                      placeholder="💻"
                      className="input text-center text-lg"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">Target Count</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={newHabitTarget}
                      onChange={e => setNewHabitTarget(e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">Theme Color</label>
                    <input
                      type="color"
                      value={newHabitColor}
                      onChange={e => setNewHabitColor(e.target.value)}
                      className="input p-1 h-10 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn-ghost">Cancel</button>
                  <button type="submit" className="btn-primary">Create Habit</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Habits() {
  return (
    <HabitsErrorBoundary>
      <HabitsInner />
    </HabitsErrorBoundary>
  );
}
