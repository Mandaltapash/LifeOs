import { useState, useMemo, useCallback, useRef } from 'react';
import { useTodoStore } from '../store/useTodoStore';
import { format, isToday, isPast, parseISO, isValid } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Check, Trash2, Edit3, Archive, Tag,
  Calendar, Flag, X, ClipboardList, AlertTriangle,
  CheckCircle2, Clock, ArchiveRestore, ChevronDown,
  Sparkles, SortAsc, RotateCcw,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const FILTERS = [
  { key: 'all',       label: 'All' },
  { key: 'today',     label: 'Today' },
  { key: 'pending',   label: 'Pending' },
  { key: 'completed', label: 'Completed' },
  { key: 'archived',  label: 'Archived' },
];

const SORT_OPTIONS = [
  { key: 'dueDate',  label: 'Due Date' },
  { key: 'priority', label: 'Priority' },
  { key: 'created',  label: 'Created' },
  { key: 'title',    label: 'Title' },
];

const PRIORITIES = ['high', 'medium', 'low'];
const CATEGORIES = ['GATE', 'Coding', 'Fitness', 'College', 'Personal'];

const PRIORITY_CONFIG = {
  high:   { label: 'High',   color: 'text-red-400',   bg: 'bg-red-500/15 border border-red-500/30',   dot: 'bg-red-400',   icon: '🔴' },
  medium: { label: 'Medium', color: 'text-amber-400',  bg: 'bg-amber-500/15 border border-amber-500/30', dot: 'bg-amber-400', icon: '🟡' },
  low:    { label: 'Low',    color: 'text-emerald-400',bg: 'bg-emerald-500/15 border border-emerald-500/30', dot: 'bg-emerald-400', icon: '🟢' },
};

const CATEGORY_CONFIG = {
  GATE:     { color: 'text-indigo-400',  bg: 'bg-indigo-500/15 border border-indigo-500/30' },
  Coding:   { color: 'text-emerald-400', bg: 'bg-emerald-500/15 border border-emerald-500/30' },
  Fitness:  { color: 'text-amber-400',   bg: 'bg-amber-500/15 border border-amber-500/30' },
  College:  { color: 'text-pink-400',    bg: 'bg-pink-500/15 border border-pink-500/30' },
  Personal: { color: 'text-purple-400',  bg: 'bg-purple-500/15 border border-purple-500/30' },
};

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

const DEFAULT_FORM = {
  title: '',
  description: '',
  dueDate: format(new Date(), 'yyyy-MM-dd'),
  priority: 'medium',
  category: 'Personal',
  notes: '',
  tags: '',
};

// ─── Animation Variants ───────────────────────────────────────────────────────
const listVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.25, ease: 'easeOut' } },
  exit:   { opacity: 0, x: -20, scale: 0.97, transition: { duration: 0.2 } },
};

const modalVariants = {
  hidden:  { opacity: 0, scale: 0.94, y: 20 },
  visible: { opacity: 1, scale: 1,    y: 0,  transition: { duration: 0.22, ease: 'easeOut' } },
  exit:    { opacity: 0, scale: 0.94, y: 20, transition: { duration: 0.18 } },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isOverdue(task) {
  if (!task.dueDate || task.status === 'done' || task.archived) return false;
  try {
    const due = parseISO(task.dueDate);
    return isValid(due) && isPast(due) && !isToday(due);
  } catch {
    return false;
  }
}

function formatDueDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = parseISO(dateStr);
    if (!isValid(d)) return dateStr;
    if (isToday(d)) return 'Today';
    return format(d, 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, colorClass, glowClass }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="stat-card flex items-center gap-4 min-w-0"
    >
      <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${colorClass} ${glowClass}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="stat-label truncate">{label}</p>
        <p className="stat-value text-2xl">{value}</p>
      </div>
    </motion.div>
  );
}

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  return (
    <span className={`badge ${cfg.bg} ${cfg.color} gap-1.5`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} flex-shrink-0`} />
      {cfg.label}
    </span>
  );
}

function CategoryBadge({ category }) {
  const cfg = CATEGORY_CONFIG[category] || { color: 'text-gray-400', bg: 'bg-gray-500/15 border border-gray-500/30' };
  return (
    <span className={`badge ${cfg.bg} ${cfg.color}`}>
      {category}
    </span>
  );
}

function DueDateBadge({ task }) {
  const overdue = isOverdue(task);
  const today   = task.dueDate && (() => { try { return isToday(parseISO(task.dueDate)); } catch { return false; } })();
  const label   = formatDueDate(task.dueDate);

  if (!label) return null;

  const cls = overdue
    ? 'badge bg-red-500/20 text-red-400 border border-red-500/30'
    : today
    ? 'badge bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
    : 'badge bg-gray-500/15 text-gray-400 border border-gray-500/20';

  return (
    <span className={cls}>
      <Calendar size={11} className="flex-shrink-0" />
      {label}
    </span>
  );
}

// ─── Tag Input ─────────────────────────────────────────────────────────────────
function TagInput({ value, onChange }) {
  const [input, setInput] = useState('');
  const tags = value ? value.split(',').map(t => t.trim()).filter(Boolean) : [];

  const addTag = (raw) => {
    const tag = raw.trim();
    if (!tag || tags.includes(tag)) return;
    onChange([...tags, tag].join(', '));
    setInput('');
  };

  const removeTag = (t) => {
    onChange(tags.filter(x => x !== t).join(', '));
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5 min-h-[42px] w-full px-3 py-2 rounded-xl text-sm border transition-all duration-200 cursor-text"
         style={{ background: 'var(--bg-secondary)', borderColor: 'var(--surface-border)' }}
         onClick={() => document.getElementById('tag-input-field')?.focus()}>
      {tags.map(t => (
        <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          <Tag size={10} /> {t}
          <button type="button" onClick={(e) => { e.stopPropagation(); removeTag(t); }} className="ml-0.5 hover:text-white transition-colors">
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        id="tag-input-field"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => addTag(input)}
        placeholder={tags.length ? '' : 'Add tags (Enter or comma)…'}
        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm"
        style={{ color: 'var(--text-primary)' }}
      />
    </div>
  );
}

// ─── Task Modal ────────────────────────────────────────────────────────────────
function TaskModal({ task, onClose }) {
  const { addTask, updateTask } = useTodoStore();
  const isEdit = Boolean(task);

  const [form, setForm] = useState(
    isEdit
      ? { ...task, tags: Array.isArray(task.tags) ? task.tags.join(', ') : (task.tags || '') }
      : { ...DEFAULT_FORM }
  );
  const [errors, setErrors] = useState({});

  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      ...form,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    };
    if (isEdit) {
      updateTask(task.id, payload);
    } else {
      addTask(payload);
    }
    onClose();
  };

  const inputCls = (field) =>
    `input ${errors[field] ? 'border-red-500 focus:border-red-400' : ''}`;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="modal-content w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-none"
        style={{ background: 'var(--surface-primary)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-fg flex items-center gap-2">
              {isEdit ? <><Edit3 size={18} className="text-indigo-400" /> Edit Task</> : <><Sparkles size={18} className="text-indigo-400" /> New Task</>}
            </h2>
            <p className="text-xs text-fg-3 mt-0.5">{isEdit ? 'Update task details below' : 'Fill in the details to add a new task'}</p>
          </div>
          <button type="button" onClick={onClose} className="btn-icon hover:bg-white/10 text-fg-3 hover:text-fg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-fg-2 mb-1.5 uppercase tracking-wide">Title *</label>
            <input
              className={inputCls('title')}
              placeholder="What needs to be done?"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              autoFocus
            />
            {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-fg-2 mb-1.5 uppercase tracking-wide">Description</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Add a description…"
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>

          {/* Due Date + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-fg-2 mb-1.5 uppercase tracking-wide">
                <Calendar size={10} className="inline mr-1" />Due Date
              </label>
              <input
                type="date"
                className="input"
                value={form.dueDate}
                onChange={e => set('dueDate', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-fg-2 mb-1.5 uppercase tracking-wide">
                <Flag size={10} className="inline mr-1" />Priority
              </label>
              <select
                className="input"
                value={form.priority}
                onChange={e => set('priority', e.target.value)}
              >
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-fg-2 mb-1.5 uppercase tracking-wide">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => {
                const cfg = CATEGORY_CONFIG[cat];
                const active = form.category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => set('category', cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150 ${
                      active
                        ? `${cfg.bg} ${cfg.color} scale-105`
                        : 'bg-transparent border-surface text-fg-3 hover:border-indigo-500/40 hover:text-fg-2'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-fg-2 mb-1.5 uppercase tracking-wide">
              <Tag size={10} className="inline mr-1" />Tags
            </label>
            <TagInput value={form.tags} onChange={val => set('tags', val)} />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-fg-2 mb-1.5 uppercase tracking-wide">Notes</label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="Any additional notes…"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center border border-surface">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1 justify-center">
              {isEdit ? <><Check size={15} /> Save Changes</> : <><Plus size={15} /> Add Task</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteModal({ task, onConfirm, onClose }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="card w-full max-w-sm p-6 shadow-2xl"
        style={{ background: 'var(--surface-primary)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
            <Trash2 size={18} className="text-red-400" />
          </div>
          <div>
            <h3 className="font-bold text-fg">Delete Task?</h3>
            <p className="text-xs text-fg-3">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-fg-2 mb-5 pl-0.5">
          Are you sure you want to delete <span className="font-semibold text-fg">"{task.title}"</span>?
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1 justify-center border border-surface">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn-danger flex-1 justify-center">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ filter, onAdd }) {
  const config = {
    all:       { emoji: '✨', title: 'No tasks yet', sub: 'Create your first task to get started!' },
    today:     { emoji: '📅', title: 'Nothing due today', sub: 'You\'re all clear for today — enjoy!' },
    pending:   { emoji: '🎉', title: 'All caught up!', sub: 'No pending tasks. Great job!' },
    completed: { emoji: '🏆', title: 'No completed tasks', sub: 'Complete some tasks to see them here.' },
    archived:  { emoji: '📦', title: 'No archived tasks', sub: 'Archived tasks will appear here.' },
  }[filter] || { emoji: '🔍', title: 'No results', sub: 'Try adjusting your filters or search.' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="text-6xl mb-4 select-none">{config.emoji}</div>
      <h3 className="text-lg font-bold text-fg mb-1">{config.title}</h3>
      <p className="text-sm text-fg-3 mb-6 max-w-xs">{config.sub}</p>
      {(filter === 'all' || filter === 'pending' || filter === 'today') && (
        <button onClick={onAdd} className="btn-primary">
          <Plus size={16} /> Add Task
        </button>
      )}
    </motion.div>
  );
}

// ─── Task Row ──────────────────────────────────────────────────────────────────
function TaskRow({ task, onEdit, onDelete }) {
  const { toggleComplete, archiveTask, unarchiveTask } = useTodoStore();
  const overdue = isOverdue(task);
  const done    = task.status === 'done';

  return (
    <motion.div
      layout
      variants={itemVariants}
      className={`card p-4 group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
        overdue && !done ? 'border-red-500/40 bg-red-500/5' : ''
      } ${done ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => toggleComplete(task.id)}
          className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
            done
              ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
              : 'border-[var(--surface-border)] hover:border-indigo-400 hover:bg-indigo-500/10'
          }`}
        >
          <AnimatePresence>
            {done && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Check size={11} className="text-white" strokeWidth={3} />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <p className={`font-semibold text-sm leading-snug ${done ? 'line-through text-fg-3' : 'text-fg'}`}>
              {task.title}
              {overdue && !done && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs text-red-400 font-normal">
                  <AlertTriangle size={11} /> Overdue
                </span>
              )}
            </p>

            {/* Action buttons — revealed on hover */}
            <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              {!task.archived && (
                <button
                  onClick={() => onEdit(task)}
                  className="btn-icon w-7 h-7 rounded-lg hover:bg-indigo-500/15 text-fg-3 hover:text-indigo-400"
                  title="Edit"
                >
                  <Edit3 size={13} />
                </button>
              )}
              <button
                onClick={() => task.archived ? unarchiveTask(task.id) : archiveTask(task.id)}
                className="btn-icon w-7 h-7 rounded-lg hover:bg-amber-500/15 text-fg-3 hover:text-amber-400"
                title={task.archived ? 'Unarchive' : 'Archive'}
              >
                {task.archived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
              </button>
              <button
                onClick={() => onDelete(task)}
                className="btn-icon w-7 h-7 rounded-lg hover:bg-red-500/15 text-fg-3 hover:text-red-400"
                title="Delete"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-fg-3 mt-1 line-clamp-1">{task.description}</p>
          )}

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <PriorityBadge priority={task.priority} />
            <CategoryBadge category={task.category} />
            <DueDateBadge task={task} />
            {task.tags && Array.isArray(task.tags) && task.tags.slice(0, 3).map(t => (
              <span key={t} className="badge bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Tag size={9} /> {t}
              </span>
            ))}
            {task.tags && Array.isArray(task.tags) && task.tags.length > 3 && (
              <span className="badge-gray">+{task.tags.length - 3}</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Todos() {
  const {
    tasks,
    filter,
    searchQuery,
    sortBy,
    setFilter,
    setSearchQuery,
    setSortBy,
    deleteTask,
    getPendingCount,
    getCompletedTodayCount,
  } = useTodoStore();

  const [showModal, setShowModal]   = useState(false);
  const [editTask,  setEditTask]    = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showSort, setShowSort]     = useState(false);
  const sortRef = useRef(null);

  // Stats
  const pendingCount       = getPendingCount();
  const completedTodayCount = getCompletedTodayCount();
  const overdueCount       = useMemo(
    () => tasks.filter(t => isOverdue(t)).length,
    [tasks]
  );

  // Filtered + sorted tasks
  const visibleTasks = useMemo(() => {
    let list = [...tasks];

    // Filter
    switch (filter) {
      case 'today':
        list = list.filter(t => {
          if (t.archived) return false;
          try { return t.dueDate && isToday(parseISO(t.dueDate)); } catch { return false; }
        });
        break;
      case 'pending':
        list = list.filter(t => t.status === 'pending' && !t.archived);
        break;
      case 'completed':
        list = list.filter(t => t.status === 'done' && !t.archived);
        break;
      case 'archived':
        list = list.filter(t => t.archived);
        break;
      default: // 'all'
        list = list.filter(t => !t.archived);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q) ||
        (Array.isArray(t.tags) && t.tags.some(tag => tag.toLowerCase().includes(q)))
      );
    }

    // Sort
    list.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          return (a.dueDate || '9999').localeCompare(b.dueDate || '9999');
        case 'priority':
          return (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2);
        case 'created':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return list;
  }, [tasks, filter, searchQuery, sortBy]);

  const openAdd  = useCallback(() => { setEditTask(null); setShowModal(true); }, []);
  const openEdit = useCallback((task) => { setEditTask(task); setShowModal(true); }, []);
  const closeModal = useCallback(() => { setShowModal(false); setEditTask(null); }, []);

  const confirmDelete = useCallback(() => {
    if (deleteTarget) {
      deleteTask(deleteTarget.id);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteTask]);

  // Close sort dropdown on outside click
  const handleSortToggle = () => setShowSort(v => !v);

  return (
    <div className="page-enter min-h-screen p-4 sm:p-6 lg:p-8" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Page Header ── */}
        <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="page-title flex items-center gap-2">
              <ClipboardList size={24} className="text-indigo-400" />
              <span className="gradient-text">Task Manager</span>
            </h1>
            <p className="page-subtitle">Stay organized, stay ahead.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={openAdd}
            className="btn-primary self-start sm:self-auto"
          >
            <Plus size={16} /> Add Task
          </motion.button>
        </div>

        {/* ── Stats Bar ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard
            icon={Clock}
            label="Pending Tasks"
            value={pendingCount}
            colorClass="bg-indigo-500/15 text-indigo-400"
            glowClass="shadow-[0_0_12px_rgba(99,102,241,0.3)]"
          />
          <StatCard
            icon={CheckCircle2}
            label="Completed Today"
            value={completedTodayCount}
            colorClass="bg-emerald-500/15 text-emerald-400"
            glowClass="shadow-[0_0_12px_rgba(16,185,129,0.3)]"
          />
          <StatCard
            icon={AlertTriangle}
            label="Overdue"
            value={overdueCount}
            colorClass={overdueCount > 0 ? 'bg-red-500/15 text-red-400' : 'bg-gray-500/15 text-gray-400'}
            glowClass={overdueCount > 0 ? 'shadow-[0_0_12px_rgba(239,68,68,0.3)]' : ''}
          />
        </div>

        {/* ── Filter Tabs ── */}
        <div className="card p-1 flex overflow-x-auto scrollbar-none gap-1">
          {FILTERS.map(f => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-fg-2 hover:bg-white/5 hover:text-fg'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* ── Search + Sort Row ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-3 pointer-events-none" />
            <input
              className="input pl-9 pr-4"
              placeholder="Search tasks, tags, categories…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-3 hover:text-fg transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="relative" ref={sortRef}>
            <button
              onClick={handleSortToggle}
              className="btn-secondary h-10 gap-2 whitespace-nowrap"
            >
              <SortAsc size={15} />
              {SORT_OPTIONS.find(s => s.key === sortBy)?.label || 'Sort'}
              <ChevronDown size={13} className={`transition-transform duration-200 ${showSort ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showSort && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0,  scale: 1   }}
                  exit={{   opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="card absolute right-0 top-12 z-30 min-w-[160px] py-1 shadow-2xl"
                  style={{ background: 'var(--surface-primary)' }}
                >
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => { setSortBy(opt.key); setShowSort(false); }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors duration-150 ${
                        sortBy === opt.key
                          ? 'text-indigo-400 bg-indigo-500/10'
                          : 'text-fg-2 hover:bg-white/5 hover:text-fg'
                      }`}
                    >
                      {sortBy === opt.key && <span className="mr-1.5">✓</span>}
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Task Count + Reset ── */}
        {(searchQuery || filter !== 'all') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between"
          >
            <p className="text-xs text-fg-3">
              {visibleTasks.length} task{visibleTasks.length !== 1 ? 's' : ''} found
            </p>
            {(searchQuery) && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                <RotateCcw size={11} /> Clear search
              </button>
            )}
          </motion.div>
        )}

        {/* ── Task List ── */}
        <AnimatePresence mode="wait">
          {visibleTasks.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <EmptyState filter={filter} onAdd={openAdd} />
            </motion.div>
          ) : (
            <motion.div
              key={filter + searchQuery + sortBy}
              variants={listVariants}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              <AnimatePresence>
                {visibleTasks.map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onEdit={openEdit}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Footer hint ── */}
        {visibleTasks.length > 0 && (
          <p className="text-center text-xs text-fg-3 pb-4">
            {visibleTasks.length} task{visibleTasks.length !== 1 ? 's' : ''} · Hover a task to edit or delete
          </p>
        )}
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {showModal && (
          <TaskModal
            key="task-modal"
            task={editTask}
            onClose={closeModal}
          />
        )}
        {deleteTarget && (
          <DeleteModal
            key="delete-modal"
            task={deleteTarget}
            onConfirm={confirmDelete}
            onClose={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* Sort dropdown backdrop */}
      {showSort && (
        <div className="fixed inset-0 z-20" onClick={() => setShowSort(false)} />
      )}
    </div>
  );
}
