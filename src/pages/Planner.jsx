import { useState, useCallback, useMemo } from 'react';
import { format, addDays, subDays, startOfWeek, isToday, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  GripVertical,
  Trash2,
  Edit3,
  Check,
  X,
  Clock,
  Flame,
  BookOpen,
  Code2,
  Dumbbell,
  GraduationCap,
  User,
} from 'lucide-react';
import { usePlannerStore } from '../store/usePlannerStore';

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    id: 'GATE Study',
    label: 'GATE Study',
    color: 'indigo',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500',
    dot: 'bg-indigo-500',
    icon: BookOpen,
  },
  {
    id: 'Coding',
    label: 'Coding',
    color: 'emerald',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500',
    dot: 'bg-emerald-500',
    icon: Code2,
  },
  {
    id: 'Fitness',
    label: 'Fitness',
    color: 'amber',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500',
    dot: 'bg-amber-500',
    icon: Dumbbell,
  },
  {
    id: 'College',
    label: 'College',
    color: 'pink',
    bg: 'bg-pink-500/10',
    text: 'text-pink-400',
    border: 'border-pink-500',
    dot: 'bg-pink-500',
    icon: GraduationCap,
  },
  {
    id: 'Personal',
    label: 'Personal',
    color: 'purple',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500',
    dot: 'bg-purple-500',
    icon: User,
  },
  {
    id: 'Reading',
    label: 'Reading',
    color: 'blue',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500',
    dot: 'bg-blue-500',
    icon: BookOpen,
  },
];

const PRIORITIES = [
  { id: 'high', label: 'High', color: 'text-red-400', dot: 'bg-red-500', bg: 'bg-red-500/10 border-red-500/30' },
  { id: 'medium', label: 'Medium', color: 'text-amber-400', dot: 'bg-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
  { id: 'low', label: 'Low', color: 'text-emerald-400', dot: 'bg-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/30' },
];

const getCategoryMeta = (cat) =>
  CATEGORIES.find((c) => c.id === cat) || CATEGORIES[0];

const getPriorityMeta = (p) =>
  PRIORITIES.find((pr) => pr.id === p) || PRIORITIES[1];

const formatDate = (date) => format(date, 'yyyy-MM-dd');

// Compute duration label
function duration(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const mins = eh * 60 + em - (sh * 60 + sm);
  if (mins <= 0) return '';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

// ─── Default form state ───────────────────────────────────────────────────────

const defaultForm = {
  title: '',
  time: '08:00',
  endTime: '09:00',
  category: 'GATE Study',
  priority: 'medium',
  description: '',
};

// ─── SortableBlock ─────────────────────────────────────────────────────────────

function SortableBlock({ block, dateKey, onEdit, onDelete, onToggle }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  const cat = getCategoryMeta(block.category);
  const pri = getPriorityMeta(block.priority);
  const CatIcon = cat.icon;

  return (
    <div ref={setNodeRef} style={style}>
      <motion.div
        layout
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 16, scale: 0.97 }}
        transition={{ duration: 0.2 }}
        className={`group relative flex items-stretch rounded-2xl border border-surface overflow-hidden transition-all duration-200 ${
          block.done ? 'opacity-60' : ''
        } ${isDragging ? 'shadow-2xl scale-[1.02] ring-2 ring-indigo-500/40' : 'hover:shadow-lg hover:-translate-y-0.5'}`}
        style={{ background: 'var(--surface-primary)' }}
      >
        {/* Colored left accent bar */}
        <div className={`w-1 shrink-0 ${cat.dot} rounded-l-2xl`} />

        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="flex items-center px-2 cursor-grab active:cursor-grabbing text-fg-3 hover:text-fg-2 transition-colors"
        >
          <GripVertical size={16} />
        </div>

        {/* Main content */}
        <div className="flex flex-1 items-start gap-3 py-3 pr-3 min-w-0">
          {/* Done toggle */}
          <button
            onClick={() => onToggle(dateKey, block.id)}
            className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
              block.done
                ? 'bg-emerald-500 border-emerald-500'
                : 'border-[var(--surface-border)] hover:border-emerald-400'
            }`}
          >
            {block.done && <Check size={11} strokeWidth={3} className="text-white" />}
          </button>

          {/* Body */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className={`text-sm font-semibold truncate ${
                  block.done ? 'line-through text-fg-3' : 'text-fg'
                }`}
              >
                {block.title}
              </span>

              {/* Priority dot */}
              <span className={`w-2 h-2 rounded-full shrink-0 ${pri.dot}`} title={pri.label} />

              {/* Category badge */}
              <span className={`badge ${cat.bg} ${cat.text} gap-1`}>
                <CatIcon size={10} />
                {cat.label}
              </span>
            </div>

            {/* Time row */}
            <div className="flex items-center gap-3 text-xs text-fg-3">
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {block.time} – {block.endTime}
              </span>
              {duration(block.time, block.endTime) && (
                <span className="px-1.5 py-0.5 rounded-md text-fg-3"
                  style={{ background: 'var(--surface-border)' }}>
                  {duration(block.time, block.endTime)}
                </span>
              )}
            </div>

            {block.description && (
              <p className="text-xs text-fg-3 mt-1 line-clamp-1">{block.description}</p>
            )}
          </div>
        </div>

        {/* Actions (visible on hover) */}
        <div className="flex items-center gap-1 pr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            onClick={() => onEdit(block)}
            className="btn-icon hover:bg-white/5 text-fg-3 hover:text-indigo-400"
            title="Edit"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={() => onDelete(dateKey, block.id)}
            className="btn-icon hover:bg-red-500/10 text-fg-3 hover:text-red-400"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── TimelineLabel ─────────────────────────────────────────────────────────────

function TimelineLabel({ time }) {
  return (
    <div className="flex items-center gap-2 py-2">
      <span className="text-xs font-mono text-fg-3 w-12 shrink-0 text-right">{time}</span>
      <div className="flex-1 border-t border-dashed" style={{ borderColor: 'var(--surface-border)' }} />
    </div>
  );
}

// ─── BlockModal ────────────────────────────────────────────────────────────────

function BlockModal({ isOpen, onClose, onSave, editingBlock }) {
  const isEdit = !!editingBlock;
  const [form, setForm] = useState(editingBlock ? {
    title: editingBlock.title,
    time: editingBlock.time,
    endTime: editingBlock.endTime,
    category: editingBlock.category,
    priority: editingBlock.priority,
    description: editingBlock.description || '',
  } : { ...defaultForm });

  const set = useCallback((k, v) => setForm((f) => ({ ...f, [k]: v })), []);

  const handleSave = () => {
    if (!form.title.trim()) return;
    onSave(form);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            className="modal-content"
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 24 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-fg">
                  {isEdit ? 'Edit Time Block' : 'Add Time Block'}
                </h2>
                <p className="text-xs text-fg-3 mt-0.5">
                  {isEdit ? 'Update the details of this block' : 'Plan a focused work session'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="btn-icon hover:bg-white/5 text-fg-3 hover:text-fg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-fg-2 mb-1.5">Title *</label>
                <input
                  className="input"
                  placeholder="e.g. DSA Practice, Morning Run…"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  autoFocus
                />
              </div>

              {/* Time range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-fg-2 mb-1.5">Start Time</label>
                  <input
                    type="time"
                    className="input"
                    value={form.time}
                    onChange={(e) => set('time', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-fg-2 mb-1.5">End Time</label>
                  <input
                    type="time"
                    className="input"
                    value={form.endTime}
                    onChange={(e) => set('endTime', e.target.value)}
                  />
                </div>
              </div>

              {/* Duration pill */}
              {duration(form.time, form.endTime) && (
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <Clock size={12} />
                  <span>Duration: <strong>{duration(form.time, form.endTime)}</strong></span>
                </div>
              )}

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-fg-2 mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => set('category', cat.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-150 ${
                          form.category === cat.id
                            ? `${cat.bg} ${cat.text} border-${cat.color}-500/50 ring-1 ring-${cat.color}-500/30`
                            : 'border-surface text-fg-3 hover:text-fg-2'
                        }`}
                        style={form.category === cat.id ? { borderColor: `var(--surface-border)` } : {}}
                      >
                        <Icon size={11} />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-medium text-fg-2 mb-2">Priority</label>
                <div className="flex gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => set('priority', p.id)}
                      className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all duration-150 ${
                        form.priority === p.id
                          ? `${p.bg} ${p.color}`
                          : 'border-surface text-fg-3 hover:text-fg-2'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${p.dot}`} />
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-fg-2 mb-1.5">Description</label>
                <textarea
                  className="input resize-none"
                  rows={3}
                  placeholder="Optional notes or goals for this session…"
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-surface">
              <button onClick={onClose} className="btn-ghost">Cancel</button>
              <button onClick={handleSave} className="btn-primary" disabled={!form.title.trim()}>
                {isEdit ? 'Save Changes' : 'Add Block'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── WeekDayColumn ─────────────────────────────────────────────────────────────

function WeekDayColumn({ date, blocks, onAddClick }) {
  const isCurrentDay = isToday(date);
  const dateKey = formatDate(date);

  return (
    <div
      className={`flex flex-col rounded-2xl border overflow-hidden transition-all duration-200 ${
        isCurrentDay ? 'ring-2 ring-indigo-500/40' : ''
      }`}
      style={{ background: 'var(--surface-primary)', borderColor: 'var(--surface-border)' }}
    >
      {/* Column header */}
      <div
        className={`px-3 py-2.5 text-center border-b ${isCurrentDay ? 'bg-indigo-600/10' : ''}`}
        style={{ borderColor: 'var(--surface-border)' }}
      >
        <p className={`text-[10px] font-semibold uppercase tracking-widest ${isCurrentDay ? 'text-indigo-400' : 'text-fg-3'}`}>
          {format(date, 'EEE')}
        </p>
        <p className={`text-lg font-bold ${isCurrentDay ? 'text-indigo-400' : 'text-fg'}`}>
          {format(date, 'd')}
        </p>
        {isCurrentDay && (
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 mx-auto mt-0.5" />
        )}
      </div>

      {/* Blocks */}
      <div className="flex-1 p-2 space-y-1.5 min-h-[120px]">
        {blocks.length === 0 ? (
          <button
            onClick={() => onAddClick(dateKey)}
            className="w-full h-16 rounded-xl border border-dashed border-surface text-fg-3 text-xs hover:border-indigo-500/40 hover:text-indigo-400 transition-all duration-150 flex items-center justify-center gap-1"
          >
            <Plus size={12} />
          </button>
        ) : (
          blocks.map((block) => {
            const cat = getCategoryMeta(block.category);
            return (
              <div
                key={block.id}
                className={`flex items-start gap-1.5 px-2 py-1.5 rounded-xl border-l-2 text-xs ${cat.bg} ${cat.border} ${block.done ? 'opacity-50' : ''}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${cat.dot} shrink-0 mt-0.5`} />
                <div className="min-w-0">
                  <p className={`font-medium truncate ${cat.text} ${block.done ? 'line-through' : ''}`}>
                    {block.title}
                  </p>
                  <p className="text-fg-3 text-[10px]">{block.time}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add button (if blocks exist) */}
      {blocks.length > 0 && (
        <div className="px-2 pb-2">
          <button
            onClick={() => onAddClick(dateKey)}
            className="w-full flex items-center justify-center gap-1 py-1 rounded-lg text-fg-3 hover:text-indigo-400 text-xs transition-colors"
          >
            <Plus size={11} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Planner Component ────────────────────────────────────────────────────

export default function Planner() {
  const { blocks, addBlock, updateBlock, deleteBlock, toggleBlock, reorderBlocks } =
    usePlannerStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('day'); // 'day' | 'week'
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [weekAddDate, setWeekAddDate] = useState(null); // for week-view add

  const dateKey = formatDate(currentDate);
  const dayBlocks = useMemo(() => blocks[dateKey] || [], [blocks, dateKey]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    ({ active, over }) => {
      if (!over || active.id === over.id) return;
      const oldIndex = dayBlocks.findIndex((b) => b.id === active.id);
      const newIndex = dayBlocks.findIndex((b) => b.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderBlocks(dateKey, arrayMove(dayBlocks, oldIndex, newIndex));
      }
    },
    [dayBlocks, dateKey, reorderBlocks]
  );

  const openAddModal = useCallback((targetDateKey) => {
    setEditingBlock(null);
    setWeekAddDate(targetDateKey || null);
    setModalOpen(true);
  }, []);

  const openEditModal = useCallback((block) => {
    setEditingBlock(block);
    setWeekAddDate(null);
    setModalOpen(true);
  }, []);

  const handleSave = useCallback(
    (form) => {
      if (editingBlock) {
        updateBlock(dateKey, editingBlock.id, form);
      } else {
        const targetDate = weekAddDate || dateKey;
        addBlock(targetDate, form);
      }
      setEditingBlock(null);
      setWeekAddDate(null);
    },
    [editingBlock, dateKey, weekAddDate, addBlock, updateBlock]
  );

  const handleDelete = useCallback(
    (dk, id) => deleteBlock(dk, id),
    [deleteBlock]
  );

  const handleToggle = useCallback(
    (dk, id) => toggleBlock(dk, id),
    [toggleBlock]
  );

  // Week view data
  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  // Stats
  const totalToday = dayBlocks.length;
  const doneToday = dayBlocks.filter((b) => b.done).length;
  const progressPct = totalToday ? Math.round((doneToday / totalToday) * 100) : 0;

  // Build time markers for timeline
  const timeMarkers = useMemo(() => {
    if (dayBlocks.length === 0) return [];
    const hours = new Set();
    dayBlocks.forEach((b) => {
      const h = parseInt(b.time.split(':')[0], 10);
      hours.add(h);
    });
    return [...hours].sort((a, b) => a - b).map((h) => `${String(h).padStart(2, '0')}:00`);
  }, [dayBlocks]);

  // Group blocks by hour for timeline visual
  const blocksGroupedByHour = useMemo(() => {
    const map = {};
    dayBlocks.forEach((b) => {
      const h = parseInt(b.time.split(':')[0], 10);
      if (!map[h]) map[h] = [];
      map[h].push(b);
    });
    return map;
  }, [dayBlocks]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="page-enter min-h-screen p-4 md:p-6 lg:p-8">
      {/* ── Page Header ─── */}
      <motion.div
        className="page-header flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h1 className="page-title flex items-center gap-2">
            <span className="gradient-text">Daily Planner</span>
            {isToday(currentDate) && (
              <span className="text-base">
                <Flame size={20} className="inline text-orange-400 streak-fire" />
              </span>
            )}
          </h1>
          <p className="page-subtitle">Time-block your day for deep, focused work</p>
        </div>

        <button
          onClick={() => openAddModal(null)}
          className="btn-primary self-start sm:self-auto"
        >
          <Plus size={16} />
          Add Block
        </button>
      </motion.div>

      {/* ── Controls Bar ─── */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        {/* Date Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate((d) => subDays(d, view === 'week' ? 7 : 1))}
            className="btn-icon btn-ghost"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="text-center px-1">
            {view === 'day' ? (
              <div>
                <p className="text-sm font-semibold text-fg">{format(currentDate, 'EEEE')}</p>
                <p className="text-xs text-fg-3">{format(currentDate, 'MMM d, yyyy')}</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-fg">Week of {format(weekStart, 'MMM d')}</p>
                <p className="text-xs text-fg-3">{format(weekStart, 'yyyy')}</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setCurrentDate((d) => addDays(d, view === 'week' ? 7 : 1))}
            className="btn-icon btn-ghost"
          >
            <ChevronRight size={18} />
          </button>

          {!isToday(currentDate) && (
            <button
              onClick={() => setCurrentDate(new Date())}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              <Calendar size={13} />
              Today
            </button>
          )}
        </div>

        {/* View toggle */}
        <div
          className="flex rounded-xl p-1 gap-1"
          style={{ background: 'var(--surface-primary)', border: '1px solid var(--surface-border)' }}
        >
          {['day', 'week'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 capitalize ${
                view === v
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-fg-3 hover:text-fg'
              }`}
            >
              {v === 'day' ? 'Day View' : 'Week View'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Day View ─── */}
      {view === 'day' && (
        <motion.div
          key="day-view"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6"
        >
          {/* Timeline column */}
          <motion.div variants={itemVariants}>
            <div
              className="card p-5"
              style={{ minHeight: '60vh' }}
            >
              {/* Day stats mini-bar */}
              {totalToday > 0 && (
                <div className="flex items-center justify-between mb-5">
                  <span className="text-xs text-fg-3">
                    {doneToday}/{totalToday} blocks completed
                  </span>
                  <div className="flex items-center gap-2 flex-1 mx-4">
                    <div className="progress-bar flex-1">
                      <motion.div
                        className="progress-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-fg-2">{progressPct}%</span>
                  </div>
                </div>
              )}

              {/* DnD context */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={dayBlocks.map((b) => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {dayBlocks.length === 0 ? (
                    /* Empty state */
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.35 }}
                      className="flex flex-col items-center justify-center py-20 text-center"
                    >
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                        style={{ background: 'var(--surface-border)' }}
                      >
                        <Clock size={28} className="text-fg-3" />
                      </div>
                      <h3 className="text-base font-semibold text-fg mb-1">No blocks yet</h3>
                      <p className="text-sm text-fg-3 mb-5 max-w-xs">
                        Add your first time block to start planning your{' '}
                        {isToday(currentDate) ? 'day' : format(currentDate, 'EEEE')}.
                      </p>
                      <button
                        onClick={() => openAddModal(null)}
                        className="btn-primary"
                      >
                        <Plus size={15} />
                        Add your first time block
                      </button>
                    </motion.div>
                  ) : (
                    <div className="space-y-0">
                      {/* Timeline with hour markers */}
                      {(() => {
                        const allHours = Object.keys(blocksGroupedByHour)
                          .map(Number)
                          .sort((a, b) => a - b);

                        return allHours.map((h, idx) => {
                          const timeLabel = `${String(h).padStart(2, '0')}:00`;
                          const hBlocks = blocksGroupedByHour[h];

                          return (
                            <div key={h}>
                              {idx > 0 && <TimelineLabel time={timeLabel} />}
                              {idx === 0 && (
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs font-mono text-fg-3 w-12 text-right">{timeLabel}</span>
                                  <div className="flex-1" />
                                </div>
                              )}
                              <div className="pl-16 space-y-2 mb-2">
                                {hBlocks.map((block) => (
                                  <SortableBlock
                                    key={block.id}
                                    block={block}
                                    dateKey={dateKey}
                                    onEdit={openEditModal}
                                    onDelete={handleDelete}
                                    onToggle={handleToggle}
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </SortableContext>
              </DndContext>

              {/* Bottom add-another row */}
              {dayBlocks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-4 pt-4 border-t border-surface"
                >
                  <button
                    onClick={() => openAddModal(null)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-surface text-fg-3 hover:border-indigo-500/40 hover:text-indigo-400 text-sm transition-all duration-150"
                  >
                    <Plus size={15} />
                    Add another block
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Sidebar: Category summary */}
          <motion.div variants={itemVariants} className="space-y-4">
            {/* Summary card */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-fg mb-4 flex items-center gap-2">
                <Calendar size={14} className="text-indigo-400" />
                Today's Summary
              </h3>

              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Total', value: totalToday, color: 'text-fg' },
                  { label: 'Done', value: doneToday, color: 'text-emerald-400' },
                  { label: 'Left', value: totalToday - doneToday, color: 'text-amber-400' },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="text-center p-2 rounded-xl"
                    style={{ background: 'var(--bg-secondary)' }}
                  >
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-fg-3 uppercase tracking-wide">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="progress-bar mb-1">
                <motion.div
                  className="progress-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                />
              </div>
              <p className="text-xs text-fg-3 text-right">{progressPct}% complete</p>
            </div>

            {/* Category breakdown */}
            {dayBlocks.length > 0 && (
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-fg mb-3">By Category</h3>
                <div className="space-y-2.5">
                  {CATEGORIES.map((cat) => {
                    const count = dayBlocks.filter((b) => b.category === cat.id).length;
                    if (!count) return null;
                    const done = dayBlocks.filter(
                      (b) => b.category === cat.id && b.done
                    ).length;
                    const pct = count ? Math.round((done / count) * 100) : 0;
                    const Icon = cat.icon;
                    return (
                      <div key={cat.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`flex items-center gap-1.5 text-xs font-medium ${cat.text}`}>
                            <Icon size={11} />
                            {cat.label}
                          </span>
                          <span className="text-xs text-fg-3">
                            {done}/{count}
                          </span>
                        </div>
                        <div
                          className="h-1.5 rounded-full overflow-hidden"
                          style={{ background: 'var(--surface-border)' }}
                        >
                          <motion.div
                            className={`h-full rounded-full ${cat.dot}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.7, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Priority breakdown */}
            {dayBlocks.length > 0 && (
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-fg mb-3">By Priority</h3>
                <div className="space-y-2">
                  {PRIORITIES.map((p) => {
                    const count = dayBlocks.filter((b) => b.priority === p.id).length;
                    if (!count) return null;
                    return (
                      <div key={p.id} className="flex items-center justify-between">
                        <span className={`flex items-center gap-2 text-xs ${p.color}`}>
                          <span className={`w-2 h-2 rounded-full ${p.dot}`} />
                          {p.label}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-lg font-medium border ${p.bg} ${p.color}`}
                        >
                          {count} block{count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* ── Week View ─── */}
      {view === 'week' && (
        <motion.div
          key="week-view"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Week summary strip */}
          <div className="flex items-center gap-4 mb-5 px-1">
            {(() => {
              const totalWeek = weekDays.reduce((acc, d) => {
                return acc + (blocks[formatDate(d)] || []).length;
              }, 0);
              const doneWeek = weekDays.reduce((acc, d) => {
                return acc + (blocks[formatDate(d)] || []).filter((b) => b.done).length;
              }, 0);
              const pct = totalWeek ? Math.round((doneWeek / totalWeek) * 100) : 0;
              return (
                <>
                  <span className="text-xs text-fg-3">
                    Week: <strong className="text-fg">{doneWeek}/{totalWeek}</strong> blocks done
                  </span>
                  <div className="flex-1 progress-bar max-w-xs">
                    <motion.div
                      className="progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-fg-2">{pct}%</span>
                </>
              );
            })()}
          </div>

          {/* 7-column grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {weekDays.map((d) => {
              const dk = formatDate(d);
              const dayB = blocks[dk] || [];
              return (
                <WeekDayColumn
                  key={dk}
                  date={d}
                  blocks={dayB}
                  onAddClick={(targetKey) => {
                    // Switch to day view for that date and open modal
                    setCurrentDate(parseISO(targetKey));
                    setView('day');
                    openAddModal(targetKey);
                  }}
                />
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Block Modal ─── */}
      <BlockModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingBlock(null);
          setWeekAddDate(null);
        }}
        onSave={handleSave}
        editingBlock={editingBlock}
      />
    </div>
  );
}
