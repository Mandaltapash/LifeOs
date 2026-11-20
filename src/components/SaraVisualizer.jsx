import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const EXPRESSION_IMAGES = {
  neutral: "/sara/idle.png",
  listening: "/sara/listening.png",
  thinking: "/sara/thinking.png",
  speaking: "/sara/speaking.png",
  happy: "/sara/speaking.png",
  concerned: "/sara/thinking.png",
  excited: "/sara/speaking.png",
};

export default function SaraVisualizer({ state = "idle", expression, accentColor = "purple" }) {
  const [waveHeights, setWaveHeights] = useState(Array(13).fill(4));

  useEffect(() => {
    if (state !== "speaking" && state !== "listening") {
      setWaveHeights(Array(13).fill(3));
      return;
    }

    const interval = setInterval(() => {
      setWaveHeights(
        Array.from({ length: 13 }, () => {
          const min = state === "speaking" ? 6 : 3;
          const max = state === "speaking" ? 28 : 14;
          return Math.floor(Math.random() * (max - min + 1) + min);
        })
      );
    }, 65);

    return () => clearInterval(interval);
  }, [state]);

  const getStateConfig = () => {
    switch (state) {
      case "listening":
        return {
          glowColor: "rgba(139, 92, 246, 0.55)",
          borderGlow: "rgba(139, 92, 246, 0.6)",
          text: "Listening to You...",
          textColor: "text-purple-300",
          badgeBg: "bg-purple-500/15 border-purple-500/30",
          waveClasses: "from-purple-500 to-indigo-300",
          ringColor: "border-purple-500/40",
        };
      case "processing":
        return {
          glowColor: "rgba(6, 182, 212, 0.55)",
          borderGlow: "rgba(34, 211, 238, 0.6)",
          text: "Sara is Thinking...",
          textColor: "text-cyan-300",
          badgeBg: "bg-cyan-500/15 border-cyan-500/30",
          waveClasses: "from-cyan-500 to-sky-300",
          ringColor: "border-cyan-500/40",
        };
      case "speaking":
        return {
          glowColor: "rgba(236, 72, 153, 0.55)",
          borderGlow: "rgba(236, 72, 153, 0.6)",
          text: "Sara is Speaking",
          textColor: "text-pink-300",
          badgeBg: "bg-pink-500/15 border-pink-500/30",
          waveClasses: "from-pink-500 to-rose-300",
          ringColor: "border-pink-500/40",
        };
      case "idle":
      default:
        return {
          glowColor: "rgba(168, 85, 247, 0.3)",
          borderGlow: "rgba(139, 92, 246, 0.35)",
          text: "Sara is Ready",
          textColor: "text-purple-300/80",
          badgeBg: "bg-white/5 border-white/10",
          waveClasses: "from-purple-500/60 to-purple-400/20",
          ringColor: "border-purple-500/20",
        };
    }
  };

  const config = getStateConfig();

  const getActiveExpression = () => {
    if (expression) return expression;
    if (state === "listening") return "listening";
    if (state === "processing") return "thinking";
    if (state === "speaking") return "speaking";
    return "neutral";
  };

  const activeExp = getActiveExpression();
  const currentImage = EXPRESSION_IMAGES[activeExp] || "/sara/idle.png";

  return (
    <div className="relative w-full max-w-[340px] flex flex-col items-center justify-center select-none py-2">
      {/* LAYER 1: DEEP NEBULA GLOW BACKDROP */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          animate={{
            scale: state === "speaking" ? [1, 1.2, 0.95, 1.1, 1] :
                   state === "listening" ? [1, 1.08, 0.97, 1.04, 1] :
                   state === "processing" ? [1, 1.05, 1] : [1, 1.03, 1],
            opacity: state === "speaking" ? [0.35, 0.55, 0.35] :
                     state === "listening" ? [0.3, 0.45, 0.3] :
                     state === "processing" ? [0.3, 0.4, 0.3] : 0.2,
          }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-[260px] h-[260px] rounded-full blur-[70px] transition-all duration-700"
          style={{ backgroundColor: config.glowColor }}
        />

        {/* Outer orbital tech circles */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className={`absolute w-[280px] h-[280px] rounded-full border border-dashed ${config.ringColor} transition-colors duration-700`}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="absolute w-[240px] h-[240px] rounded-full border border-dotted border-white/10"
        />
      </div>

      {/* LAYER 2: CHARACTER PORTRAIT WITH GLASS FRAME */}
      <div className="relative z-10 w-[190px] h-[190px] flex items-center justify-center">
        {/* Animated border ring glow */}
        <motion.div
          animate={{
            boxShadow: [
              `0 0 25px ${config.borderGlow}, inset 0 0 20px rgba(0,0,0,0.3)`,
              `0 0 45px ${config.borderGlow}, inset 0 0 25px rgba(0,0,0,0.2)`,
              `0 0 25px ${config.borderGlow}, inset 0 0 20px rgba(0,0,0,0.3)`,
            ],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full"
        />

        {/* Glass frame container */}
        <div className="absolute inset-0 rounded-full p-[2px] bg-gradient-to-tr from-white/20 via-white/10 to-transparent">
          <div className="w-full h-full rounded-full bg-slate-950/70 backdrop-blur-xl overflow-hidden relative shadow-2xl">
            {/* Character image with smooth crossfade */}
            <AnimatePresence mode="wait">
              <motion.img
                key={activeExp}
                src={currentImage}
                alt={`Sara - ${activeExp}`}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full object-cover rounded-full"
                draggable={false}
              />
            </AnimatePresence>

            {/* Breathing animation overlay */}
            <motion.div
              animate={{
                scale: state === "speaking" ? [1, 1.02, 0.99, 1.01, 1] :
                       state === "listening" ? [1, 1.01, 1] : 1,
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full pointer-events-none"
            />

            {/* Holographic sheen */}
            <motion.div
              animate={{ backgroundPosition: ["0% 50%", "200% 50%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent bg-[length:200%_auto] pointer-events-none rounded-full"
            />
          </div>
        </div>
      </div>

      {/* LAYER 3: VOICE WAVEFORM BAR */}
      <div className="mt-4 flex items-end justify-center gap-[3px] h-6 w-36 z-20">
        {waveHeights.map((h, i) => (
          <motion.div
            key={i}
            animate={{ height: h }}
            transition={{ type: "spring", stiffness: 380, damping: 18 }}
            className={`w-[3px] rounded-full bg-gradient-to-t transition-colors duration-500 ${config.waveClasses}`}
            style={{ height: `${h}px` }}
          />
        ))}
      </div>

      {/* LAYER 4: STATE INFORMATION BADGE */}
      <div className="mt-3 flex flex-col items-center select-none z-20">
        <div className={`flex items-center gap-2 px-3.5 py-1 rounded-full border ${config.badgeBg} backdrop-blur-md shadow-xl text-[10px] tracking-[0.12em] uppercase font-mono transition-all duration-500`}>
          {state === "speaking" && (
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-pink-500"></span>
            </span>
          )}
          {state === "listening" && (
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-500"></span>
            </span>
          )}
          {state === "processing" && (
            <span className="flex h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          )}
          {state === "idle" && (
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          )}
          
          <span className={`${config.textColor} font-semibold`}>
            {config.text}
          </span>
        </div>
      </div>
    </div>
  );
}
