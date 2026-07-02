import { useAppStore } from '../store/useAppStore';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Copy, Key, Sparkles, X, Check, Eye, EyeOff } from 'lucide-react';

export default function AIAssistant() {
  const { geminiApiKey, setGeminiApiKey } = useAppStore();

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I am your LifeOS AI Assistant. I know your goals: to crack GATE, build CollegeX, improve fitness, and kickstart freelancing.\n\nHow can I help you optimize your schedule, plan subjects, or suggest productivity habits today?",
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

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

  const handleSaveKey = (e) => {
    e.preventDefault();
    setGeminiApiKey(apiKeyInput.trim());
    setShowKeyModal(false);
  };

  const handleSend = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInputText('');
    setLoading(true);

    const apiKey = geminiApiKey || apiKeyInput;

    if (!apiKey) {
      // Offline fallback rules
      setTimeout(() => {
        const response = getOfflineResponse(text);
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        setLoading(false);
      }, 1000);
      return;
    }

    try {
      const systemContext = `You are LifeOS AI, a personal productivity assistant for a CS student preparing for GATE 2027. 
Their goals are: Crack GATE, Build CollegeX, Start Freelancing, Improve Fitness, Complete M.Tech.
They track: GATE study (10 subjects), daily coding (DSA+Python), fitness (gym/water/sleep), 8 habits, Pomodoro sessions.
Give concise, actionable, motivating responses. Use bullet points and structure. Output in clear markdown format.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemContext + '\n\nUser: ' + text }] }]
          })
        }
      );

      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't process that response. Please check your network or API key.";
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Failed to connect to AI server. Running fallback offline answer:\n\n" + getOfflineResponse(text) }]);
    } finally {
      setLoading(false);
    }
  };

  const getOfflineResponse = (text) => {
    const q = text.toLowerCase();
    if (q.includes('schedule') || q.includes('routine') || q.includes('plan')) {
      return `### 📅 Smart Daily Schedule Suggestion
Here is an optimized routine aligned to your goals:
*   **05:30 AM** – Wake Up & Hydrate 🌅
*   **06:00 AM** – Exercise / Gym 🏋️ (Goal: Improve Fitness)
*   **07:00 AM** – Study block: GATE Core Subject (e.g. DBMS) 📚
*   **10:00 AM** – Coding Practice (DSA/Python Problems) 💻
*   **01:00 PM** – Lunch & Rest 🥗
*   **02:00 PM** – College Work / Projects (Build CollegeX) 🛠️
*   **06:00 PM** – Freelancing tasks or Skills development 🚀
*   **08:00 PM** – Dinner & Revision 📖
*   **10:00 PM** – Wind Down & Sleep 🌙`;
    }
    if (q.includes('gate') || q.includes('study')) {
      return `### 📚 GATE 2027 Syllabus Strategy
Focus on high-weightage topics to maximize your efficiency:
1.  **Algorithms & Data Structures** – 12-15 marks. Core foundation of programming.
2.  **DBMS & Operating Systems** – 15-18 marks. Highly scoring; conceptual.
3.  **Computer Networks** – 8-10 marks. Practice routing protocols.
4.  **TOC & Compiler** – 10-12 marks. Clear, formula-based scoring.
*Action Step*: Solve at least 15 PYQs today for your current study subject.`;
    }
    if (q.includes('code') || q.includes('dsa') || q.includes('python')) {
      return `### 💻 DSA & Python Mastery Roadmap
To crack top roles and build CollegeX efficiently:
*   **Daily Target**: Solve 2 standard LeetCode problems (Array/Graph/DP).
*   **Current Stack**: Practice Python OOP syntax, script automations.
*   **GitHub**: Commit code daily to build up your contribution graph!`;
    }
    if (q.includes('freelance') || q.includes('collegex') || q.includes('project')) {
      return `### 🚀 Project & Career Action Plan
*   **CollegeX MVP**: Focus on user routing and schema design in DBMS. Keep it clean.
*   **Freelance Client**: Set up a GitHub repository containing 3 portfolio templates.
*   **Routine**: Dedicate 1 Focus Session (50 mins) every evening strictly for CollegeX build.`;
    }
    return `### ✨ LifeOS Daily Motivation
*   "Consistency outperforms intensity in the long run."
*   Continue checking off your habits: Coding, Study, Fitness.
*   Log a Pomodoro focus session today to build momentum!
*   **AI Tip**: Paste your Google Gemini API Key in settings to enable full customized conversational AI recommendations.`;
  };

  const handleCopy = (content, idx) => {
    navigator.clipboard.writeText(content);
    setCopiedId(idx);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] page-enter">
      {/* Top Banner with API Settings button */}
      <div className="flex justify-between items-center pb-4 border-b border-surface-border">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Sparkles className="text-yellow-400" /> AI Productivity Assistant
          </h1>
          <p className="page-subtitle">Custom routines, syllabus suggestions, and goals coaching.</p>
        </div>
        <button
          onClick={() => {
            setApiKeyInput(geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY || '');
            setShowKeyModal(true);
          }}
          className={`btn ${geminiApiKey ? 'btn-secondary' : 'btn-primary'}`}
        >
          <Key size={14} /> {geminiApiKey ? 'API Key Saved' : 'Add Gemini API Key'}
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto py-6 space-y-4 pr-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 max-w-[85%] ${
              msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-primary-600 text-white' : 'bg-surface-secondary border border-surface-border text-primary-400'
            }`}>
              {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>

            <div className={`p-4 rounded-2xl border relative group ${
              msg.role === 'user'
                ? 'bg-primary-600/10 border-primary-500/20 text-fg'
                : 'bg-surface-secondary/40 border-surface-border text-fg'
            }`}>
              <button
                onClick={() => handleCopy(msg.content, idx)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-fg-3 hover:text-fg p-1"
                title="Copy response"
              >
                {copiedId === idx ? <Check size={12} className="text-accent-400" /> : <Copy size={12} />}
              </button>
              <div className="prose ProseMirror prose-sm max-w-none text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {msg.content.split('\n').map((line, lIdx) => {
                  if (line.startsWith('###')) return <h3 key={lIdx} className="text-sm font-bold mt-3 mb-1 text-primary-400">{line.replace('###', '')}</h3>;
                  if (line.startsWith('*')) return <li key={lIdx} className="ml-3 my-0.5">{line.replace('*', '').trim()}</li>;
                  return <p key={lIdx} className="mb-1">{line}</p>;
                })}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 max-w-[85%] mr-auto">
            <div className="w-8 h-8 rounded-full bg-surface-secondary border border-surface-border text-primary-400 flex items-center justify-center">
              <Bot size={14} />
            </div>
            <div className="p-4 rounded-2xl bg-surface-secondary/40 border border-surface-border flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Pills */}
      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none">
        <button onClick={() => handleSend("Generate today's schedule")} className="tag text-[10px] font-bold py-1.5 px-3">📅 Suggested Schedule</button>
        <button onClick={() => handleSend("Create GATE study plan")} className="tag text-[10px] font-bold py-1.5 px-3">📚 GATE Study Plan</button>
        <button onClick={() => handleSend("Suggest coding improvements")} className="tag text-[10px] font-bold py-1.5 px-3">💻 Coding Advice</button>
        <button onClick={() => handleSend("Suggest habit improvements")} className="tag text-[10px] font-bold py-1.5 px-3">✨ Habit Tips</button>
      </div>

      {/* Chat Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2 border-t border-surface-border pt-4"
      >
        <input
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Ask AI for study schedule, DSA plans, or motivation..."
          className="input flex-1 py-3 text-xs"
        />
        <button type="submit" className="btn-primary p-3">
          <Send size={16} />
        </button>
      </form>

      {/* Key Setup Modal */}
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
                <h3 className="text-lg font-bold text-fg">Gemini API Configuration</h3>
                <button onClick={() => setShowKeyModal(false)} className="btn-icon text-fg-3 hover:text-fg">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveKey} className="space-y-4">
                <p className="text-xs text-fg-3 leading-relaxed">
                  Enter your Google Gemini API key to enable tailored AI suggestions. Your key is stored locally in your browser and never sent to our servers.
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
                      title={showApiKey ? "Hide API Key" : "Show API Key"}
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
