import { useAppStore } from '../store/useAppStore';
import { useGateStore } from '../store/useGateStore';
import { useTodoStore } from '../store/useTodoStore';
import { useHabitStore } from '../store/useHabitStore';
import { useFitnessStore } from '../store/useFitnessStore';
import { usePlannerStore } from '../store/usePlannerStore';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Bot, User, Copy, Key, Sparkles, X, Check, Eye, EyeOff, 
  Mic, MicOff, Volume2, VolumeX, MessageSquare, Radio, Sliders, Flame
} from 'lucide-react';
import SaraVisualizer from '../components/SaraVisualizer';
import { 
  SARA_TONES, 
  generateSaraSystemContext, 
  SaraVoicePlayer, 
  SaraSpeechRecognizer 
} from '../services/saraService';

export default function AIAssistant() {
  const { geminiApiKey, setGeminiApiKey, settings } = useAppStore();
  const userName = settings?.name || 'Tapash';

  // LifeOS Stores for Context
  const { subjects: gateSubjects, progress: gateProgress, getTotalHours } = useGateStore();
  const { tasks, getPendingCount, getCompletedTodayCount } = useTodoStore();
  const { habits, getTodayCompletedCount: getHabitsCompletedCount, getLongestStreak } = useHabitStore();
  const { goals: fitnessTargets, fitnessGoals, getTodayLog: getFitnessTodayLog, getGymStreak } = useFitnessStore();
  const { getTodayBlocks } = usePlannerStore();

  // Assistant State
  const [viewMode, setViewMode] = useState('voice'); // 'voice' | 'chat'
  const [tone, setTone] = useState('sassy'); // 'sassy' | 'sweet' | 'professional'
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [assistantState, setAssistantState] = useState('idle'); // 'idle' | 'listening' | 'processing' | 'speaking'
  const [interimSpeech, setInterimSpeech] = useState('');

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello ${userName}! Main hoon SARA, aapki personal AI assistant. 💅\n\nMujhe aapke GATE exam, daily To-Dos, habits, fitness goals, aur routine sab ka pura pata hai. Boliye, aaj kya plan karein?`,
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const voicePlayerRef = useRef(null);
  const recognizerRef = useRef(null);

  // Initialize Voice Player
  useEffect(() => {
    voicePlayerRef.current = new SaraVoicePlayer();
    return () => {
      if (voicePlayerRef.current) voicePlayerRef.current.stop();
    };
  }, []);

  // Initialize Speech Recognizer
  useEffect(() => {
    recognizerRef.current = new SaraSpeechRecognizer(
      (transcript, isFinal) => {
        setInterimSpeech(transcript);
        if (isFinal && transcript.trim()) {
          setInterimSpeech('');
          handleSend(transcript.trim());
        }
      },
      (isListening) => {
        if (isListening) {
          setAssistantState('listening');
        } else {
          setAssistantState(prev => prev === 'listening' ? 'idle' : prev);
        }
      },
      (error) => {
        console.warn('Speech Rec Error:', error);
        setAssistantState('idle');
      }
    );

    return () => {
      if (recognizerRef.current) recognizerRef.current.stop();
    };
  }, []);

  useEffect(() => {
    if (!geminiApiKey) {
      const defaultKey = import.meta.env.VITE_GEMINI_API_KEY || '';
      if (defaultKey) {
        setGeminiApiKey(defaultKey);
        setApiKeyInput(defaultKey);
      }
    }
  }, [geminiApiKey, setGeminiApiKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const toggleMicListening = () => {
    if (!recognizerRef.current) return;
    if (assistantState === 'listening') {
      recognizerRef.current.stop();
      setAssistantState('idle');
    } else {
      if (voicePlayerRef.current) voicePlayerRef.current.stop();
      recognizerRef.current.start();
    }
  };

  const handleSaveKey = (e) => {
    e.preventDefault();
    setGeminiApiKey(apiKeyInput.trim());
    setShowKeyModal(false);
  };

  // Compile real-time LifeOS stats snapshot
  const getLifeOsSnapshot = useCallback(() => {
    let gateHours = 0;
    let gatePyqs = 0;
    Object.values(gateProgress || {}).forEach(p => {
      gateHours += p.hours || 0;
      gatePyqs += p.pyqs || 0;
    });

    const todayFitness = getFitnessTodayLog() || {};

    return {
      userName,
      gateStats: {
        totalHours: gateHours,
        totalPyqs: gatePyqs,
        subjectsCount: gateSubjects?.length || 0,
      },
      tasksStats: {
        pendingCount: getPendingCount(),
        completedTodayCount: getCompletedTodayCount(),
        overdueCount: tasks.filter(t => t.dueDate && t.dueDate < new Date().toISOString().split('T')[0] && t.status !== 'done').length,
      },
      habitsStats: {
        completedToday: getHabitsCompletedCount(),
        totalHabits: habits?.length || 0,
        longestStreak: getLongestStreak(),
      },
      fitnessStats: {
        gymStreak: getGymStreak(),
        water: todayFitness.waterGlasses || 0,
        waterTarget: fitnessTargets?.waterTarget || 8,
        sleep: todayFitness.sleepHours || 0,
        sleepTarget: fitnessTargets?.sleepTarget || 7,
        weight: todayFitness.weight,
      },
      plannerStats: {
        todayBlocksCount: getTodayBlocks()?.length || 0,
      },
    };
  }, [
    userName, gateProgress, gateSubjects, getPendingCount, getCompletedTodayCount,
    tasks, getHabitsCompletedCount, habits, getLongestStreak, getGymStreak,
    getFitnessTodayLog, fitnessTargets, getTodayBlocks
  ]);

  const handleSend = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    // Stop ongoing speech
    if (voicePlayerRef.current) voicePlayerRef.current.stop();

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInputText('');
    setLoading(true);
    setAssistantState('processing');

    const apiKey = geminiApiKey || apiKeyInput;
    const lifeOsData = getLifeOsSnapshot();
    const systemInstruction = generateSaraSystemContext(lifeOsData, tone);

    if (!apiKey) {
      // Offline fallback
      setTimeout(() => {
        const response = getOfflineSaraResponse(text, lifeOsData, tone);
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        setLoading(false);
        speakResponse(response);
      }, 700);
      return;
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemInstruction}\n\nUser Question: ${text}` }]
              }
            ]
          })
        }
      );

      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 
        "Uff Tapash, response process nahi ho paya. Ek baar network ya API key check karo!";

      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      speakResponse(reply);
    } catch (err) {
      console.error('Gemini error:', err);
      const fallback = getOfflineSaraResponse(text, lifeOsData, tone);
      setMessages(prev => [...prev, { role: 'assistant', content: fallback }]);
      speakResponse(fallback);
    } finally {
      setLoading(false);
    }
  };

  const speakResponse = (replyText) => {
    if (isVoiceMuted || !voicePlayerRef.current) {
      setAssistantState('idle');
      return;
    }

    voicePlayerRef.current.speak(
      replyText,
      () => setAssistantState('speaking'),
      () => setAssistantState('idle'),
      () => setAssistantState('idle')
    );
  };

  const getOfflineSaraResponse = (text, lifeData, currentTone) => {
    const q = text.toLowerCase();
    const { gateStats, tasksStats, habitsStats, fitnessStats } = lifeData;

    if (q.includes('gate') || q.includes('study') || q.includes('syllabus')) {
      return `### 📚 GATE Prep Status & Advice
Arre ${userName}, ab tak aapne total **${gateStats.totalHours} hours** study aur **${gateStats.totalPyqs} PYQs** solve kiye hain ${gateStats.subjectsCount} subjects me!

*   **Focus Point**: DBMS, OS, aur TOC high scoring subjects hain.
*   **Next Step**: Aaj kam se kam 15-20 PYQs solve karo bina distraction ke!`;
    }

    if (q.includes('task') || q.includes('todo') || q.includes('pending')) {
      return `### 📋 To-Do Check-in
Suno ${userName}, aapke paas **${tasksStats.pendingCount} pending tasks** hain aur aaj **${tasksStats.completedTodayCount} tasks** complete huye hain.

${tasksStats.overdueCount > 0 ? `⚠️ **${tasksStats.overdueCount} overdue tasks** hain jo pehle khatam karne hain!` : 'Sab time par chal raha hai. Keep it up!'}`;
    }

    if (q.includes('fitness') || q.includes('gym') || q.includes('water')) {
      return `### 🏋️ Fitness Status
*   **Gym Streak**: ${fitnessStats.gymStreak} days active streak! 🔥
*   **Water**: ${fitnessStats.water}/${fitnessStats.waterTarget} glasses piyen.
*   **Sleep**: ${fitnessStats.sleep}/${fitnessStats.sleepTarget} hours logged.
Hydrate raho aur fitness goal skip mat karo!`;
    }

    if (q.includes('roast') || q.includes('motivate')) {
      return `Arre ${userName}! GATE 2027 me IIT jana hai ya bas sapne dekhne hain? 💅
Aapke **${tasksStats.pendingCount} tasks** wait kar rahe hain aur screen pe timepass ho raha hai! Chalo jaldi focus mode on karo aur padhai shuru karo, IIT Bombay aise hi nahi milta!`;
    }

    return `Suno ${userName}! Main yahan hoon aapko track par rakhne ke liye.
Aapka GATE study, ${tasksStats.pendingCount} pending tasks, aur fitness routine ready hai. Boliye, kis cheez me help chahiye? 🌸`;
  };

  const handleCopy = (content, idx) => {
    navigator.clipboard.writeText(content);
    setCopiedId(idx);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] page-enter">
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-surface-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 p-[1.5px] shadow-glow-primary">
            <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center overflow-hidden">
              <img src="/sara/idle.png" alt="Sara" className="w-full h-full object-cover" />
            </div>
          </div>
          <div>
            <h1 className="page-title flex items-center gap-2 text-xl font-bold">
              <span>SARA</span>
              <span className="badge badge-purple text-[10px] uppercase">AI Companion</span>
            </h1>
            <p className="page-subtitle text-xs">Voice & Productivity Co-Pilot with full LifeOS Context</p>
          </div>
        </div>

        {/* Controls: Mode Toggle, Tone, Mute, API Key */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Mode switch */}
          <div className="flex items-center bg-surface-secondary border border-surface-border rounded-xl p-0.5 text-xs">
            <button
              onClick={() => setViewMode('voice')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'voice' ? 'bg-primary-600 text-white shadow-sm font-semibold' : 'text-fg-3 hover:text-fg'
              }`}
            >
              <Radio size={13} /> Voice Mode
            </button>
            <button
              onClick={() => setViewMode('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'chat' ? 'bg-primary-600 text-white shadow-sm font-semibold' : 'text-fg-3 hover:text-fg'
              }`}
            >
              <MessageSquare size={13} /> Chat Mode
            </button>
          </div>

          {/* Tone Selector */}
          <select
            value={tone}
            onChange={e => setTone(e.target.value)}
            className="input py-1.5 px-2.5 text-xs bg-surface-secondary border-surface-border cursor-pointer"
            title="Sara's Personality Tone"
          >
            {SARA_TONES.map(t => (
              <option key={t.id} value={t.id}>
                {t.emoji} {t.name}
              </option>
            ))}
          </select>

          {/* Mute/Unmute */}
          <button
            onClick={() => {
              if (!isVoiceMuted && voicePlayerRef.current) {
                voicePlayerRef.current.stop();
                setAssistantState('idle');
              }
              setIsVoiceMuted(!isVoiceMuted);
            }}
            className={`btn-icon p-2 rounded-xl border border-surface-border ${
              isVoiceMuted ? 'text-red-400 bg-red-500/10' : 'text-fg-2 hover:text-fg bg-surface-secondary'
            }`}
            title={isVoiceMuted ? 'Unmute Sara Voice' : 'Mute Sara Voice'}
          >
            {isVoiceMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          {/* API Key Modal Button */}
          <button
            onClick={() => {
              setApiKeyInput(geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY || '');
              setShowKeyModal(true);
            }}
            className={`btn py-1.5 px-3 text-xs ${geminiApiKey ? 'btn-secondary' : 'btn-primary'}`}
          >
            <Key size={13} /> {geminiApiKey ? 'Key Active' : 'Add Key'}
          </button>
        </div>
      </div>

      {/* ── Main View (Voice Mode vs Chat Mode) ── */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 pt-4 min-h-0 overflow-hidden">
        {/* VOICE MODE: SARA VISUALIZER STAGE */}
        {viewMode === 'voice' ? (
          <div className="flex-1 flex flex-col items-center justify-between p-6 rounded-3xl border border-surface-border bg-gradient-to-b from-surface-primary to-surface-secondary/40 relative overflow-hidden shadow-2xl">
            {/* Visualizer center */}
            <div className="flex-1 flex flex-col items-center justify-center w-full">
              <SaraVisualizer state={assistantState} />

              {/* Interim voice speech banner */}
              {interimSpeech && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 px-4 py-2 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-200 text-xs text-center max-w-md backdrop-blur-md"
                >
                  <span className="font-semibold text-purple-400">Listening:</span> "{interimSpeech}"
                </motion.div>
              )}
            </div>

            {/* Voice Controls & Mic Button */}
            <div className="w-full flex flex-col items-center gap-4 z-20">
              <div className="flex items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleMicListening}
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 ${
                    assistantState === 'listening'
                      ? 'bg-gradient-to-tr from-red-500 to-rose-600 shadow-[0_0_25px_rgba(244,63,94,0.6)] animate-pulse'
                      : 'bg-gradient-to-tr from-purple-600 to-pink-500 shadow-[0_0_25px_rgba(168,85,247,0.5)]'
                  }`}
                  title={assistantState === 'listening' ? 'Stop Listening' : 'Tap to Speak to Sara'}
                >
                  {assistantState === 'listening' ? <MicOff size={26} /> : <Mic size={26} />}
                </motion.button>
              </div>
              <p className="text-[11px] text-fg-3">
                {assistantState === 'listening' 
                  ? 'Bolye, SARA sun rahi hai... (Tap again to stop)' 
                  : 'Tap Mic to speak, or use prompt chips below'}
              </p>
            </div>
          </div>
        ) : null}

        {/* CHAT STREAM (Shown beside visualizer on large screens, or full width in chat mode) */}
        <div className={`flex flex-col h-full rounded-2xl border border-surface-border bg-surface-primary/60 p-4 ${
          viewMode === 'voice' ? 'hidden lg:flex w-[420px]' : 'flex-1'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <span className="text-xs font-semibold text-fg uppercase tracking-wider flex items-center gap-1.5">
              <Bot size={14} className="text-primary-400" /> SARA Conversation
            </span>
            <span className="text-[10px] text-fg-3">{messages.length} messages</span>
          </div>

          {/* Messages scroll list */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 max-w-[90%] ${
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs overflow-hidden ${
                  msg.role === 'user' ? 'bg-primary-600 text-white' : 'bg-purple-900/60 border border-purple-500/30'
                }`}>
                  {msg.role === 'user' ? <User size={13} /> : <img src="/sara/idle.png" alt="Sara" className="w-full h-full object-cover" />}
                </div>

                <div className={`p-3 rounded-2xl border relative group text-xs ${
                  msg.role === 'user'
                    ? 'bg-primary-600/15 border-primary-500/25 text-fg'
                    : 'bg-surface-secondary/60 border-surface-border text-fg'
                }`}>
                  <button
                    onClick={() => handleCopy(msg.content, idx)}
                    className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-fg-3 hover:text-fg p-1"
                    title="Copy"
                  >
                    {copiedId === idx ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  </button>
                  <div className="prose ProseMirror prose-sm max-w-none text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    {msg.content.split('\n').map((line, lIdx) => {
                      if (line.startsWith('###')) return <h4 key={lIdx} className="text-xs font-bold mt-2 mb-1 text-primary-400">{line.replace('###', '')}</h4>;
                      if (line.startsWith('*')) return <li key={lIdx} className="ml-2.5 my-0.5">{line.replace('*', '').trim()}</li>;
                      return <p key={lIdx} className="mb-1">{line}</p>;
                    })}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 max-w-[90%] mr-auto">
                <div className="w-7 h-7 rounded-full bg-purple-900/60 border border-purple-500/30 flex items-center justify-center overflow-hidden">
                  <img src="/sara/thinking.png" alt="Thinking" className="w-full h-full object-cover animate-pulse" />
                </div>
                <div className="p-3 rounded-2xl bg-surface-secondary/40 border border-surface-border flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Input within Chat box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2 pt-2 border-t border-surface-border"
          >
            <input
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={`Message Sara (${tone})...`}
              className="input flex-1 py-2 text-xs"
            />
            <button type="submit" className="btn-primary py-2 px-3">
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>

      {/* ── Suggested LifeOS Prompt Pills ── */}
      <div className="flex gap-2 overflow-x-auto pt-3 pb-1 scrollbar-none">
        <button 
          onClick={() => handleSend("Sara, mera GATE study status check karo aur strategy batao")} 
          className="tag text-[10px] font-semibold py-1.5 px-3 flex items-center gap-1.5 whitespace-nowrap hover:border-purple-500/40"
        >
          📚 GATE Prep Status
        </button>
        <button 
          onClick={() => handleSend("Mera aaj ka To-Do aur routine check karo")} 
          className="tag text-[10px] font-semibold py-1.5 px-3 flex items-center gap-1.5 whitespace-nowrap hover:border-purple-500/40"
        >
          📋 Check Pending Tasks
        </button>
        <button 
          onClick={() => handleSend("Mera fitness goal kaisa chal raha hai?") 
          } className="tag text-[10px] font-semibold py-1.5 px-3 flex items-center gap-1.5 whitespace-nowrap hover:border-purple-500/40"
        >
          🏋️ Fitness Goals Review
        </button>
        <button 
          onClick={() => handleSend("Sara, mujhe thoda roast karo aur motivate karo!")} 
          className="tag text-[10px] font-semibold py-1.5 px-3 flex items-center gap-1.5 whitespace-nowrap hover:border-purple-500/40 text-pink-400 border-pink-500/30"
        >
          🔥 Roast & Motivate Me!
        </button>
      </div>

      {/* ── Gemini Key Setup Modal ── */}
      <AnimatePresence>
        {showKeyModal && (
          <div className="modal-overlay" onClick={() => setShowKeyModal(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="modal-content"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-fg flex items-center gap-2">
                  <Key size={18} className="text-primary-400" /> Gemini API Key Setup
                </h3>
                <button onClick={() => setShowKeyModal(false)} className="btn-icon text-fg-3 hover:text-fg">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveKey} className="space-y-4">
                <p className="text-xs text-fg-3 leading-relaxed">
                  Enter your Google Gemini API key to enable high-intelligence conversational responses from SARA. Your key is stored safely in your browser localStorage.
                </p>
                <div>
                  <label className="text-xs font-semibold text-fg-2 uppercase mb-1 block">API Key</label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      autoFocus
                      value={apiKeyInput}
                      onChange={e => setApiKeyInput(e.target.value)}
                      placeholder="AIzaSy..."
                      className="input font-mono pr-10 w-full"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-3 hover:text-fg"
                      title={showApiKey ? "Hide Key" : "Show Key"}
                    >
                      {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowKeyModal(false)} className="btn-ghost">Cancel</button>
                  <button type="submit" className="btn-primary">Save Key</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
