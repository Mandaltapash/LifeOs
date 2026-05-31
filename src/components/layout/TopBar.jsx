import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Sun, Moon, Bell, Search, Plus, Settings, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

function useGreeting(name) {
  const [greeting, setGreeting] = useState('');
  useEffect(() => {
    const update = () => {
      const h = new Date().getHours();
      if (h >= 5 && h < 12) setGreeting(`Good morning, ${name}! ☀️`);
      else if (h >= 12 && h < 17) setGreeting(`Good afternoon, ${name}! 🌤️`);
      else if (h >= 17 && h < 21) setGreeting(`Good evening, ${name}! 🌇`);
      else setGreeting(`Good night, ${name}! 🌙`);
    };
    update();
    const i = setInterval(update, 60000);
    return () => clearInterval(i);
  }, [name]);
  return greeting;
}

export default function TopBar() {
  const { theme, toggleTheme, settings } = useAppStore();
  const navigate = useNavigate();
  const greeting = useGreeting(settings.name);
  const [time, setTime] = useState(new Date());
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const i = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <header
      className="fixed top-0 right-0 left-0 z-20 flex items-center justify-between px-6 h-16 border-b"
      style={{
        background: 'var(--surface-primary)',
        borderColor: 'var(--surface-border)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Greeting */}
      <div>
        <p className="text-sm font-medium text-fg">{greeting}</p>
        <p className="text-xs text-fg-3">{format(time, 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Center: Time */}
      <div className="hidden md:flex flex-col items-center">
        <span className="font-mono text-2xl font-bold gradient-text tabular-nums">
          {format(time, 'HH:mm:ss')}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 220, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <input
                autoFocus
                placeholder="Search anything..."
                className="input py-1.5 text-sm"
                onKeyDown={e => e.key === 'Escape' && setSearchOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setSearchOpen(s => !s)}
          className="btn-icon hover:bg-white/5 text-fg-3 hover:text-fg"
          title="Search"
        >
          {searchOpen ? <X size={18} /> : <Search size={18} />}
        </button>

        <button
          onClick={toggleTheme}
          className="btn-icon hover:bg-white/5 text-fg-3 hover:text-fg"
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          onClick={() => navigate('/pomodoro')}
          className="btn-primary px-3 py-1.5 text-xs hidden sm:flex"
          title="Start Focus Session"
        >
          <Plus size={14} />
          Focus
        </button>
      </div>
    </header>
  );
}
