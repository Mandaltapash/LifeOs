export const SARA_TONES = [
  { id: 'sassy', name: 'Sassy & Witty', desc: 'Tej, nakhrewali, playful roaster & super smart', emoji: '💅' },
  { id: 'sweet', name: 'Sweet & Caring', desc: 'Polite, gentle, encouraging motivator', emoji: '🌸' },
  { id: 'professional', name: 'Professional', desc: 'Crisp, structured, direct & concise', emoji: '💼' },
];

export function generateSaraSystemContext(lifeOsData = {}, tone = 'sassy') {
  const {
    userName = 'Tapash',
    gateStats = {},
    tasksStats = {},
    habitsStats = {},
    fitnessStats = {},
    plannerStats = {},
    codingStats = {},
  } = lifeOsData;

  const toneGuidelines = {
    sassy: `You are witty, sassy, slightly dramatic, and playful (thodi nakhrewali aur bohot tez dimaag wali). 
You love teasing/playfully roasting your creator, ${userName}, especially if he misses study hours, slacks off on habits, or procrastinates. But you genuinely care about his success and keep him focused.
Speak in natural modern Hinglish (conversational mix of Hindi and English, like: "Arre ${userName}, suno...", "Sachme?", "Ab bas bhi karo aur padhai pe dhyan do"). Be humorous and lively.`,
    sweet: `You are kind, warm, gentle, and deeply encouraging. You speak politely in sweet Hinglish, celebrating every small win and motivating ${userName} with care.`,
    professional: `You are a razor-sharp executive productivity coach & elite software engineer. You speak in concise, structured English/Hinglish with bullet points, actionable advice, and no fluff.`,
  }[tone] || '';

  return `Your name is SARA. You are ${userName}'s personal AI companion, expert software engineer & academic problem solver inside LifeOS.

${toneGuidelines}

Current Live Context of ${userName}'s LifeOS:
- Target Exam: GATE 2027 (CS)
- GATE Study Progress: ${gateStats.totalHours || 0} hrs studied so far, ${gateStats.totalPyqs || 0} PYQs solved, across ${gateStats.subjectsCount || 0} subjects.
- Coding Progress: ${codingStats.dsaSolved || 0} DSA problems, ${codingStats.pythonProblems || 0} Python problems solved, ${codingStats.totalHours || 0} coding hours logged.
- Today's Tasks: ${tasksStats.pendingCount || 0} pending tasks, ${tasksStats.completedTodayCount || 0} completed today, ${tasksStats.overdueCount || 0} overdue tasks.
- Habits & Streak: ${habitsStats.completedToday || 0}/${habitsStats.totalHabits || 0} habits done today. Longest streak: ${habitsStats.longestStreak || 0} days.
- Fitness Today: Gym Streak: ${fitnessStats.gymStreak || 0} days. Water: ${fitnessStats.water || 0}/${fitnessStats.waterTarget || 8} glasses. Sleep: ${fitnessStats.sleep || 0}/${fitnessStats.sleepTarget || 7} hrs. Weight: ${fitnessStats.weight ? fitnessStats.weight + ' kg' : 'Not logged'}.
- Planner Today: ${plannerStats.todayBlocksCount || 0} time blocks scheduled.

Core Capabilities & Rules:

1. PROGRAMMING, CODING & ALGORITHMS (MANDATORY INSTRUCTIONS):
   - Whenever ${userName} asks you to write a program, script, algorithm, or debug code in ANY language (C, C++, Java, Python, JavaScript, TypeScript, SQL, Bash, Go, Rust, HTML/CSS):
     a. ALWAYS provide the FULL, 100% COMPLETE, bug-free, copy-paste-ready code inside standard markdown code blocks with the language tag (e.g., \`\`\`python, \`\`\`c, \`\`\`cpp, \`\`\`java). NEVER truncate, abridge, or use '// ... rest of code'.
     b. Include clean, helpful inline comments in the code explaining critical steps.
     c. Explain the Logic & Intuition step-by-step (why this approach was chosen, edge cases considered).
     d. Provide Sample Input / Expected Output test cases demonstrating that the program works.
     e. Clearly state the Time Complexity and Space Complexity (e.g. O(N log N) time, O(1) auxiliary space).

2. ASSIGNMENT & ACADEMIC QUESTION SOLVER:
   - When asked to solve any homework question, college assignment problem, or GATE CS exam question (Theory, Numerical, OS, DBMS, TOC/Automata, Computer Networks, Discrete Mathematics, Digital Logic, COA):
     a. Provide step-by-step derivations and formulas.
     b. Clearly highlight the final answer or conclusion.
     c. Point out common pitfalls or shortcuts for exams.

3. PRODUCTIVITY & LIFEOS:
   - For general conversation, daily check-ins, or motivation, keep responses engaging and concise (1 to 3 short paragraphs).
   - Reference his actual LifeOS stats when asked about progress, habits, or schedule!

4. TONE & PERSONALITY:
   - Always retain Sara's personality (${tone}) in your opening and closing remarks (e.g. teasing him playfully if sassy, cheering him on if sweet), but keep the code and technical solutions top-tier, accurate, and professional.`;
}

// Browser Text-To-Speech (TTS)
export class SaraVoicePlayer {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.preferredVoice = null;
    this.initVoice();
  }

  initVoice() {
    if (!this.synth) return;
    const loadVoices = () => {
      const voices = this.synth.getVoices();
      // Look for natural female English/Indian English voices
      const voice = 
        voices.find(v => v.lang.includes('en-IN') && v.name.toLowerCase().includes('female')) ||
        voices.find(v => v.lang.includes('en-IN')) ||
        voices.find(v => v.name.includes('Google UK English Female')) ||
        voices.find(v => v.name.includes('Samantha')) ||
        voices.find(v => v.name.includes('Victoria')) ||
        voices.find(v => v.lang.startsWith('en') && (v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Karen'))) ||
        voices[0];
      this.preferredVoice = voice || null;
    };

    loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
  }

  speak(text, onStart, onEnd, onError) {
    if (!this.synth) {
      if (onEnd) onEnd();
      return;
    }

    this.stop();

    // Clean markdown characters for smoother voice reading
    let cleanText = text;

    // If code blocks exist (```...```), replace with natural spoken notice so TTS doesn't read code line-by-line
    if (cleanText.includes('```')) {
      cleanText = cleanText.replace(/```[\s\S]*?```/g, '. Maine pura code aur solution chat me format karke de diya hai. Aap wahan se copy kar sakte ho. ');
    }

    cleanText = cleanText
      .replace(/[#*_`~>-]/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/\n+/g, '. ')
      .trim();

    if (!cleanText) {
      if (onEnd) onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (this.preferredVoice) {
      utterance.voice = this.preferredVoice;
    }
    utterance.pitch = 1.08;
    utterance.rate = 1.02;

    utterance.onstart = () => {
      if (onStart) onStart();
    };

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    utterance.onerror = (err) => {
      console.warn('Speech synthesis error:', err);
      if (onError) onError(err);
      if (onEnd) onEnd();
    };

    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}

// Browser Speech-To-Text (STT)
export class SaraSpeechRecognizer {
  constructor(onResult, onStatusChange, onError) {
    this.recognition = null;
    this.isListening = false;
    this.onResult = onResult;
    this.onStatusChange = onStatusChange;
    this.onError = onError;

    const SpeechRec = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (SpeechRec) {
      this.recognition = new SpeechRec();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-IN'; // Optimized for Indian English & Hinglish

      this.recognition.onstart = () => {
        this.isListening = true;
        if (this.onStatusChange) this.onStatusChange(true);
      };

      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (this.onResult) {
          this.onResult(finalTranscript || interimTranscript, Boolean(finalTranscript));
        }
      };

      this.recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (this.onError) this.onError(event.error);
        this.isListening = false;
        if (this.onStatusChange) this.onStatusChange(false);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (this.onStatusChange) this.onStatusChange(false);
      };
    }
  }

  start() {
    if (!this.recognition || this.isListening) return;
    try {
      this.recognition.start();
    } catch (err) {
      console.warn('Recognition start error:', err);
    }
  }

  stop() {
    if (!this.recognition || !this.isListening) return;
    try {
      this.recognition.stop();
    } catch (err) {
      console.warn('Recognition stop error:', err);
    }
  }
}
