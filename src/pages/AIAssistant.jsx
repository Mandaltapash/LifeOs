import { useAppStore } from '../store/useAppStore';
import { useGateStore } from '../store/useGateStore';
import { useTodoStore } from '../store/useTodoStore';
import { useHabitStore } from '../store/useHabitStore';
import { useFitnessStore } from '../store/useFitnessStore';
import { usePlannerStore } from '../store/usePlannerStore';
import { useCodingStore } from '../store/useCodingStore';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Bot, User, Copy, Key, Sparkles, X, Check, Eye, EyeOff, 
  Mic, MicOff, Volume2, VolumeX, MessageSquare, Radio, Sliders, Flame, ChevronDown,
  Code2, BookmarkCheck, Terminal, BookOpen
} from 'lucide-react';
import SaraVisualizer from '../components/SaraVisualizer';
import { 
  SARA_TONES, 
  generateSaraSystemContext, 
  SaraVoicePlayer, 
  SaraSpeechRecognizer 
} from '../services/saraService';

function CodeBlock({ language, code, onSaveToLifeOS }) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (onSaveToLifeOS) {
      onSaveToLifeOS(code, language);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  return (
    <div className="my-2.5 rounded-xl border border-white/[0.08] bg-[#0b0f19] shadow-lg overflow-hidden text-left">
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.04] border-b border-white/[0.06] text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <span className="text-[10px] font-mono font-bold uppercase text-purple-300 ml-1 tracking-wider flex items-center gap-1">
            <Code2 size={11} className="text-purple-400" />
            {language || 'code'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {onSaveToLifeOS && (
            <button
              type="button"
              onClick={handleSave}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${
                saved
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-white/[0.05] hover:bg-white/[0.1] text-fg-3 hover:text-fg border border-white/[0.08]'
              }`}
              title="Save snippet to LifeOS Coding section"
            >
              {saved ? (
                <>
                  <Check size={10} className="text-emerald-400" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <BookmarkCheck size={10} />
                  <span>Save Snippet</span>
                </>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${
              copied
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-white/[0.05] hover:bg-white/[0.1] text-fg-3 hover:text-fg border border-white/[0.08]'
            }`}
            title="Copy Code"
          >
            {copied ? (
              <>
                <Check size={10} className="text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={10} />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>
      </div>
      <pre className="p-3.5 overflow-x-auto text-[11px] font-mono leading-relaxed text-emerald-300 selection:bg-purple-500/30 select-text">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderInlineText(text) {
  if (!text) return null;
  const tokens = [];
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      tokens.push(
        <strong key={match.index} className="font-semibold text-fg">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      tokens.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded bg-white/[0.08] border border-white/[0.08] font-mono text-[10.5px] text-purple-300 mx-0.5"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    tokens.push(text.slice(lastIndex));
  }
  return tokens.length > 0 ? tokens : text;
}

function SaraMessageRenderer({ content, onSaveSnippet }) {
  if (!content) return null;

  // Match fenced code blocks
  const codeRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const blocks = [];
  let lastIndex = 0;
  let match;

  while ((match = codeRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({
        type: 'text',
        text: content.slice(lastIndex, match.index),
      });
    }
    blocks.push({
      type: 'code',
      language: match[1] || 'code',
      code: match[2].trim(),
    });
    lastIndex = codeRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    blocks.push({
      type: 'text',
      text: content.slice(lastIndex),
    });
  }

  return (
    <div className="space-y-1">
      {blocks.map((block, bIdx) => {
        if (block.type === 'code') {
          return (
            <CodeBlock
              key={bIdx}
              language={block.language}
              code={block.code}
              onSaveToLifeOS={onSaveSnippet}
            />
          );
        }

        const lines = block.text.split('\n');
        return (
          <div key={bIdx} className="space-y-1">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={lIdx} className="h-1" />;

              if (line.startsWith('### ')) {
                return (
                  <h4 key={lIdx} className="text-xs font-bold mt-2.5 mb-1 text-primary-400">
                    {renderInlineText(line.replace('### ', ''))}
                  </h4>
                );
              }
              if (line.startsWith('## ')) {
                return (
                  <h3 key={lIdx} className="text-sm font-bold mt-3 mb-1 text-primary-300">
                    {renderInlineText(line.replace('## ', ''))}
                  </h3>
                );
              }
              if (line.startsWith('# ')) {
                return (
                  <h2 key={lIdx} className="text-sm font-extrabold mt-3 mb-1 text-primary-200">
                    {renderInlineText(line.replace('# ', ''))}
                  </h2>
                );
              }
              if (line.startsWith('* ') || line.startsWith('- ')) {
                return (
                  <div key={lIdx} className="flex items-start gap-1.5 ml-1 my-0.5">
                    <span className="text-purple-400 mt-1 flex-shrink-0">•</span>
                    <span className="text-fg-2 leading-relaxed">{renderInlineText(line.replace(/^(\*|-)\s+/, ''))}</span>
                  </div>
                );
              }
              if (line.match(/^\d+\.\s+/)) {
                return (
                  <div key={lIdx} className="flex items-start gap-1.5 ml-1 my-0.5">
                    <span className="text-primary-400 font-semibold text-[11px] mt-0.5 flex-shrink-0">
                      {line.match(/^\d+\./)[0]}
                    </span>
                    <span className="text-fg-2 leading-relaxed">{renderInlineText(line.replace(/^\d+\.\s+/, ''))}</span>
                  </div>
                );
              }
              return (
                <p key={lIdx} className="mb-1 leading-relaxed text-fg">
                  {renderInlineText(line)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default function AIAssistant() {
  const { geminiApiKey, setGeminiApiKey, settings } = useAppStore();
  const userName = settings?.name || 'Tapash';

  // LifeOS Stores for Context
  const { subjects: gateSubjects, progress: gateProgress, getTotalHours } = useGateStore();
  const { tasks, getPendingCount, getCompletedTodayCount } = useTodoStore();
  const { habits, getTodayCompletedCount: getHabitsCompletedCount, getLongestStreak } = useHabitStore();
  const { goals: fitnessTargets, fitnessGoals, getTodayLog: getFitnessTodayLog, getGymStreak } = useFitnessStore();
  const { getTodayBlocks } = usePlannerStore();
  const { addProblem, stats: codingStats } = useCodingStore();

  // Assistant State
  const [viewMode, setViewMode] = useState('voice'); // 'voice' | 'chat'
  const [tone, setTone] = useState('sassy'); // 'sassy' | 'sweet' | 'professional'
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [assistantState, setAssistantState] = useState('idle'); // 'idle' | 'listening' | 'processing' | 'speaking'
  const [interimSpeech, setInterimSpeech] = useState('');

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello ${userName}! Main hoon SARA, aapki personal AI companion & coding/assignment solver. 💅\n\nAap mujhe koi bhi programming task, DSA problem, college assignment, ya GATE CS ka numerical question solve karne ke liye bol sakte ho. Main complete working code, test cases, aur step-by-step logic ke sath solve kar dungi!\n\nBoliye, aaj kya code ya study solve karein?`,
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
      codingStats: {
        dsaSolved: codingStats?.dsaSolved || 0,
        pythonProblems: codingStats?.pythonProblems || 0,
        totalHours: codingStats?.totalHours || 0,
      },
    };
  }, [
    userName, gateProgress, gateSubjects, getPendingCount, getCompletedTodayCount,
    tasks, getHabitsCompletedCount, habits, getLongestStreak, getGymStreak,
    getFitnessTodayLog, fitnessTargets, getTodayBlocks, codingStats
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
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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
      let reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!response.ok || !reply) {
        console.warn('Gemini API call failed, falling back to smart offline response:', data?.error || data);
        reply = getOfflineSaraResponse(text, lifeOsData, tone);
      }

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

    if (q.includes('program') || q.includes('code') || q.includes('assignment') || q.includes('question') || q.includes('solve') || q.includes('dsa') || q.includes('algorithm') || q.includes('python') || q.includes('java') || q.includes(' c ') || q.startsWith('c ') || q.includes('c++')) {
      return `### 💻 SARA Coding & Assignment Solver
Arre ${userName}! Chahe koi bhi complex programming problem ho, DSA algorithm, ya academic assignment—main sab step-by-step solve kar sakti hoon! 💅

Yahan ek classic **QuickSort Algorithm in C** ka complete runnable code aur logic hai:

\`\`\`c
#include <stdio.h>

// Partition helper: places pivot in correct sorted position
int partition(int arr[], int low, int high) {
    int pivot = arr[high]; // Choosing the last element as pivot
    int i = (low - 1);
    
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            int temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }
    int temp = arr[i + 1];
    arr[i + 1] = arr[high];
    arr[high] = temp;
    return (i + 1);
}

// Recursive QuickSort function
void quickSort(int arr[], int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);  // Sort elements before partition
        quickSort(arr, pi + 1, high); // Sort elements after partition
    }
}

int main() {
    int arr[] = {24, 9, 29, 14, 19, 27};
    int n = sizeof(arr) / sizeof(arr[0]);
    
    quickSort(arr, 0, n - 1);
    
    printf("Sorted Array: ");
    for (int i = 0; i < n; i++) {
        printf("%d ", arr[i]);
    }
    printf("\\n");
    return 0;
}
\`\`\`

### 📊 Step-by-Step Logic & Complexity:
*   **Divide & Conquer Approach**: Pivot element choose karke sub-arrays ko recursively partition aur sort karte hain.
*   **Time Complexity**: Average & Best Case: **O(N log N)**. Worst Case: **O(N²)** (jab array already sorted ho).
*   **Space Complexity**: **O(log N)** auxiliary stack space.
*   **Assignment Tip**: Aap koi bhi custom assignment question ya coding problem mujhe prompt karo (C, C++, Java, Python, SQL, OS, DBMS), main complete code aur test cases ke sath deliver kar dungi!`;
    }

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
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-surface-border">
        {/* Left: Sara Identity & Live Status */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex-shrink-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 p-[2px] shadow-glow-primary">
              <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center overflow-hidden">
                <img src="/sara/idle.png" alt="Sara" className="w-full h-full object-cover" />
              </div>
            </div>
            {/* Live pulsing online indicator */}
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-950"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-200 bg-clip-text text-transparent">
                SARA
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-purple-500/10 text-purple-300 border border-purple-500/20 shadow-sm">
                <Sparkles size={10} className="text-purple-400" /> AI Co-Pilot
              </span>
            </div>
            <p className="text-xs text-fg-3 flex items-center gap-1.5 mt-0.5">
              <span>Voice & Productivity Co-Pilot</span>
              <span className="text-white/20">•</span>
              <span className="text-emerald-400/90 font-medium">LifeOS Synced</span>
            </p>
          </div>
        </div>

        {/* Right: Sleek Unified Control Bar */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Segmented Mode Switcher */}
          <div className="inline-flex items-center bg-surface-secondary/90 border border-surface-border rounded-xl p-1 text-xs shadow-sm">
            <button
              onClick={() => setViewMode('voice')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                viewMode === 'voice'
                  ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-sm shadow-primary-500/20 font-semibold'
                  : 'text-fg-3 hover:text-fg hover:bg-white/[0.04]'
              }`}
            >
              <Radio size={13} className={viewMode === 'voice' ? 'animate-pulse' : ''} />
              <span>Voice Mode</span>
            </button>
            <button
              onClick={() => setViewMode('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                viewMode === 'chat'
                  ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-sm shadow-primary-500/20 font-semibold'
                  : 'text-fg-3 hover:text-fg hover:bg-white/[0.04]'
              }`}
            >
              <MessageSquare size={13} />
              <span>Chat Mode</span>
            </button>
          </div>

          {/* Quick Actions Group: Tone, Mute, Key */}
          <div className="flex items-center gap-2">
            {/* Tone Selector */}
            <div className="relative inline-flex items-center">
              <select
                value={tone}
                onChange={e => setTone(e.target.value)}
                className="h-[38px] appearance-none pl-3 pr-8 py-1.5 text-xs font-medium rounded-xl bg-surface-secondary/90 border border-surface-border hover:border-surface-border-hover text-fg focus:outline-none focus:border-primary-500 cursor-pointer transition-all shadow-sm"
                title="Sara's Personality Tone"
              >
                {SARA_TONES.map(t => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-fg">
                    {t.emoji} {t.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-3 pointer-events-none" />
            </div>

            {/* Mute/Unmute Audio Button */}
            <button
              onClick={() => {
                if (!isVoiceMuted && voicePlayerRef.current) {
                  voicePlayerRef.current.stop();
                  setAssistantState('idle');
                }
                setIsVoiceMuted(!isVoiceMuted);
              }}
              className={`w-[38px] h-[38px] rounded-xl flex items-center justify-center border transition-all ${
                isVoiceMuted
                  ? 'text-rose-400 bg-rose-500/10 border-rose-500/25 hover:bg-rose-500/20'
                  : 'text-fg-2 hover:text-fg bg-surface-secondary/90 border-surface-border hover:border-surface-border-hover hover:bg-surface-hover shadow-sm'
              }`}
              title={isVoiceMuted ? 'Voice Muted (Click to Unmute)' : 'Voice Active (Click to Mute)'}
            >
              {isVoiceMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>

            {/* API Key Modal Button */}
            <button
              onClick={() => {
                setApiKeyInput(geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY || '');
                setShowKeyModal(true);
              }}
              className={`h-[38px] px-3.5 rounded-xl text-xs font-medium flex items-center gap-2 border transition-all shadow-sm ${
                geminiApiKey
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/20'
                  : 'bg-primary-600 hover:bg-primary-500 text-white border-primary-500/30 shadow-primary-500/25'
              }`}
              title="Configure Gemini API Key"
            >
              {geminiApiKey ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <Key size={13} />
                  <span>Key Active</span>
                </>
              ) : (
                <>
                  <Key size={13} />
                  <span>Add Key</span>
                </>
              )}
            </button>
          </div>
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
                  <div className="text-xs leading-relaxed">
                    <SaraMessageRenderer
                      content={msg.content}
                      onSaveSnippet={(code, lang) => {
                        addProblem({
                          title: `SARA Solution (${(lang || 'code').toUpperCase()})`,
                          difficulty: 'medium',
                          topic: (lang || '').toLowerCase() === 'python' ? 'python' : 'dsa',
                          platform: 'assignment',
                          notes: code,
                        });
                      }}
                    />
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
              placeholder={`Message Sara (${tone}) - code, homework, GATE or chat...`}
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
          onClick={() => handleSend("Sara, ek Python program likho: QuickSort with step-by-step logic, test cases aur time complexity analysis")} 
          className="tag text-[10px] font-semibold py-1.5 px-3 flex items-center gap-1.5 whitespace-nowrap hover:border-purple-500/40 text-purple-300 border-purple-500/30"
        >
          💻 Write Code / Program
        </button>
        <button 
          onClick={() => handleSend("Sara, mera ye assignment solve karo: In Paging system, calculate physical address given 32-bit logical address and 4KB page size with numerical steps")} 
          className="tag text-[10px] font-semibold py-1.5 px-3 flex items-center gap-1.5 whitespace-nowrap hover:border-emerald-500/40 text-emerald-300 border-emerald-500/30"
        >
          📝 Solve Assignment Question
        </button>
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
          onClick={() => handleSend("Mera fitness goal kaisa chal raha hai?")} 
          className="tag text-[10px] font-semibold py-1.5 px-3 flex items-center gap-1.5 whitespace-nowrap hover:border-purple-500/40"
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
