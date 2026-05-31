import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import { useAppStore } from './store/useAppStore';

// Lazy load pages
const Dashboard   = lazy(() => import('./pages/Dashboard'));
const Planner     = lazy(() => import('./pages/Planner'));
const Todos       = lazy(() => import('./pages/Todos'));
const Gate        = lazy(() => import('./pages/Gate'));
const Coding      = lazy(() => import('./pages/Coding'));
const Fitness     = lazy(() => import('./pages/Fitness'));
const Habits      = lazy(() => import('./pages/Habits'));
const Pomodoro    = lazy(() => import('./pages/Pomodoro'));
const Notes       = lazy(() => import('./pages/Notes'));
const Goals       = lazy(() => import('./pages/Goals'));
const DailyReview = lazy(() => import('./pages/DailyReview'));
const Analytics   = lazy(() => import('./pages/Analytics'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
        <p className="text-sm text-fg-3">Loading...</p>
      </div>
    </div>
  );
}

function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const { theme, sidebarCollapsed } = useAppStore();

  // Apply theme on mount and change
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const sidebarWidth = sidebarCollapsed ? 72 : 240;

  return (
    <BrowserRouter>
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <Sidebar />
        <TopBar />

        {/* Main content area */}
        <main
          className="transition-all duration-300 ease-in-out pt-16 min-h-screen"
          style={{ marginLeft: sidebarWidth }}
        >
          <div className="p-6 max-w-[1600px] mx-auto">
            <Suspense fallback={<PageLoader />}>
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/"         element={<PageWrapper><Dashboard /></PageWrapper>} />
                  <Route path="/planner"  element={<PageWrapper><Planner /></PageWrapper>} />
                  <Route path="/todos"    element={<PageWrapper><Todos /></PageWrapper>} />
                  <Route path="/gate"     element={<PageWrapper><Gate /></PageWrapper>} />
                  <Route path="/coding"   element={<PageWrapper><Coding /></PageWrapper>} />
                  <Route path="/fitness"  element={<PageWrapper><Fitness /></PageWrapper>} />
                  <Route path="/habits"   element={<PageWrapper><Habits /></PageWrapper>} />
                  <Route path="/pomodoro" element={<PageWrapper><Pomodoro /></PageWrapper>} />
                  <Route path="/notes"    element={<PageWrapper><Notes /></PageWrapper>} />
                  <Route path="/goals"    element={<PageWrapper><Goals /></PageWrapper>} />
                  <Route path="/review"   element={<PageWrapper><DailyReview /></PageWrapper>} />
                  <Route path="/analytics"element={<PageWrapper><Analytics /></PageWrapper>} />
                  <Route path="/ai"       element={<PageWrapper><AIAssistant /></PageWrapper>} />
                </Routes>
              </AnimatePresence>
            </Suspense>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}
