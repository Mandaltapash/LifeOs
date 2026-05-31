import { useTodoStore } from '../store/useTodoStore';
import { useHabitStore } from '../store/useHabitStore';
import { usePomodoroStore } from '../store/usePomodoroStore';
import { useGateStore } from '../store/useGateStore';
import { useCodingStore } from '../store/useCodingStore';
import { useFitnessStore } from '../store/useFitnessStore';
import { useState, useMemo } from 'react';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, BarChart2, Clock, Dumbbell, BookOpen, Code2, Target } from 'lucide-react';

export default function Analytics() {
  const { tasks } = useTodoStore();
  const { habits, completions } = useHabitStore();
  const { getWeeklyFocusData, totalFocusMinutes } = usePomodoroStore();
  const { subjects, progress: gateProgress, mockTests } = useGateStore();
  const { stats: codingStats, problems: codingProblems } = useCodingStore();
  const { getWeeklyData: getFitnessWeeklyData } = useFitnessStore();

  const [timePeriod, setTimePeriod] = useState('7d'); // '7d' | '30d'

  // Past Days interval
  const dateInterval = useMemo(() => {
    const days = timePeriod === '7d' ? 6 : 29;
    const start = subDays(new Date(), days);
    return eachDayOfInterval({ start, end: new Date() });
  }, [timePeriod]);

  // Overall Productivity Score Trend (Area Chart)
  const productivityTrendData = useMemo(() => {
    return dateInterval.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Habits completed this day
      let habitsDone = 0;
      habits.forEach(h => {
        const counts = completions[h.id] || {};
        if ((counts[dateStr] || 0) >= h.target) habitsDone++;
      });
      const habitsScore = habits.length > 0 ? (habitsDone / habits.length) * 50 : 50;

      // Tasks completed this day
      const dayTasks = tasks.filter(t => t.dueDate === dateStr && !t.archived);
      const dayTasksDone = dayTasks.filter(t => t.status === 'done').length;
      const tasksScore = dayTasks.length > 0 ? (dayTasksDone / dayTasks.length) * 50 : 50;

      return {
        date: format(date, 'dd MMM'),
        Score: Math.round(habitsScore + tasksScore),
      };
    });
  }, [dateInterval, habits, completions, tasks]);

  // GATE Study Subject Distribution
  const gateChartData = useMemo(() => {
    return subjects.map(sub => {
      const data = gateProgress[sub.id] || { hours: 0 };
      return {
        name: sub.name,
        hours: data.hours || 0,
        color: sub.color,
      };
    }).filter(d => d.hours > 0);
  }, [gateProgress, subjects]);

  // Coding Topics Pie Data
  const codingPieData = useMemo(() => {
    const counts = {};
    codingProblems.forEach(p => {
      counts[p.topic] = (counts[p.topic] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [codingProblems]);

  // Fitness Weekly Data
  const fitnessWeeklyData = getFitnessWeeklyData();
  const pomodoroWeeklyData = getWeeklyFocusData();

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6', '#f97316', '#84cc16', '#06b6d4'];

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <TrendingUp className="text-primary-500" /> Personal Analytics
          </h1>
          <p className="page-subtitle">Track productivity growth, subject syllabus focus, fitness metrics, and coding speed.</p>
        </div>
        
        {/* Toggle Days */}
        <div className="flex gap-1 p-1 bg-surface-secondary rounded-xl border border-surface-border w-max">
          <button
            onClick={() => setTimePeriod('7d')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              timePeriod === '7d' ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'text-fg-3'
            }`}
          >
            Past 7 Days
          </button>
          <button
            onClick={() => setTimePeriod('30d')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              timePeriod === '30d' ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'text-fg-3'
            }`}
          >
            Past 30 Days
          </button>
        </div>
      </div>

      {/* Grid: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overall Productivity Index */}
        <div className="card p-6 border-surface space-y-4">
          <h3 className="font-semibold text-fg flex items-center gap-2">
            <BarChart2 size={18} className="text-primary-500" /> Daily Productivity Trend
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={productivityTrendData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" fontSize={10} domain={[0, 100]} />
                <Tooltip />
                <Area type="monotone" dataKey="Score" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Study subject distribution */}
        <div className="card p-6 border-surface space-y-4">
          <h3 className="font-semibold text-fg flex items-center gap-2">
            <BookOpen size={18} className="text-purple-500" /> GATE Study Hours (By Subject)
          </h3>
          {gateChartData.length === 0 ? (
            <p className="text-xs text-fg-3 py-20 text-center">Log study sessions in the GATE Prep tab to render metrics.</p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gateChartData}>
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} />
                  <YAxis stroke="var(--text-muted)" fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                    {gateChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Coding Practice Analytics */}
        <div className="card p-6 border-surface space-y-4">
          <h3 className="font-semibold text-fg flex items-center gap-2">
            <Code2 size={18} className="text-emerald-500" /> Coding Topic Distribution
          </h3>
          {codingPieData.length === 0 ? (
            <p className="text-xs text-fg-3 py-20 text-center">Add completed DSA problems in the Coding tab to show topic analytics.</p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={codingPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {codingPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Pomodoro Focus Hours */}
        <div className="card p-6 border-surface space-y-4">
          <h3 className="font-semibold text-fg flex items-center gap-2">
            <Clock size={18} className="text-orange-500" /> Focus Sessions Heatmap (Hours / Day)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pomodoroWeeklyData}>
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" fontSize={10} label={{ value: 'hrs', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="hours" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fitness Tracking Trend */}
        <div className="card p-6 border-surface space-y-4 lg:col-span-2">
          <h3 className="font-semibold text-fg flex items-center gap-2">
            <Dumbbell size={18} className="text-accent-500" /> Fitness Indicators (Water vs Sleep Progress)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fitnessWeeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" fontSize={10} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="water" name="Water (Glasses)" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="sleep" name="Sleep (Hours)" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
