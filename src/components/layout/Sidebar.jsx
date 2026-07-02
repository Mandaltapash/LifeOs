import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Calendar, CheckSquare, BookOpen, Code2, Dumbbell,
  Target, Timer, FileText, TrendingUp, Star, MessageSquareMore,
  ChevronLeft, ChevronRight, Zap, ClipboardList
} from 'lucide-react';
import { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, examName } = useAppStore();

  const navItems = useMemo(() => [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/planner', label: 'Daily Planner', icon: Calendar },
    { path: '/todos', label: 'To-Do', icon: CheckSquare },
    { path: '/gate', label: `${examName || 'GATE'} Prep`, icon: BookOpen },
    { path: '/coding', label: 'Coding', icon: Code2 },
    { path: '/fitness', label: 'Fitness', icon: Dumbbell },
    { path: '/habits', label: 'Habits', icon: Target },
    { path: '/pomodoro', label: 'Pomodoro', icon: Timer },
    { path: '/notes', label: 'Notes', icon: FileText },
    { path: '/goals', label: 'Goals', icon: Star },
    { path: '/review', label: 'Daily Review', icon: ClipboardList },
    { path: '/analytics', label: 'Analytics', icon: TrendingUp },
    { path: '/ai', label: 'AI Assistant', icon: MessageSquareMore },
  ], [examName]);

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 72 : 240 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen z-30 flex flex-col border-r"
      style={{
        background: 'var(--surface-primary)',
        borderColor: 'var(--surface-border)',
        minWidth: sidebarCollapsed ? 72 : 240,
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: 'var(--surface-border)' }}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0 shadow-glow-primary">
          <Zap size={18} className="text-white" />
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <span className="font-bold text-lg gradient-text">LifeOS</span>
              <p className="text-[10px] text-fg-3 -mt-0.5">Your Productivity OS</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-none py-3 px-2 space-y-0.5">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-0' : ''}`
            }
            title={sidebarCollapsed ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="whitespace-nowrap overflow-hidden"
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* Collapse button */}
      <div className="p-3 border-t" style={{ borderColor: 'var(--surface-border)' }}>
        <button
          onClick={toggleSidebar}
          className="btn-icon w-full hover:bg-white/5 text-fg-3 hover:text-fg transition-colors"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </motion.aside>
  );
}
