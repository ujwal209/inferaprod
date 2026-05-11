"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2, Lock, Unlock } from "lucide-react";
import { getLaunchDate } from "@/app/actions/launch";

export default function LaunchPage() {
  const [mounted, setMounted] = React.useState(false);
  const [targetTime, setTargetTime] = React.useState<number | null>(null);
  const [isLaunched, setIsLaunched] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  React.useEffect(() => {
    setMounted(true);
    const fetchDate = async () => {
      try {
        const dateStr = await getLaunchDate();
        const time = new Date(dateStr).getTime();
        setTargetTime(time);
        
        if (time <= new Date().getTime()) {
          setIsLaunched(true);
        }
      } catch (error) {
        console.error("Failed to fetch launch date", error);
      }
    };
    fetchDate();
  }, []);

  React.useEffect(() => {
    if (!targetTime) return;
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      } else {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsLaunched(true);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [targetTime]);

  if (!mounted) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&family=Outfit:wght@100..900&display=swap');
        
        .font-outfit { font-family: 'Outfit', sans-serif !important; }
        .font-google-sans { font-family: 'Google Sans', sans-serif !important; }
      `}} />
      
      {/* Container: Acts strictly as a single screen on mobile (min-h-[100dvh]) and side-by-side on desktop */}
      <div className="min-h-[100dvh] lg:h-[100dvh] w-full font-outfit bg-[#fafafa] dark:bg-[#050505] text-zinc-900 dark:text-zinc-100 antialiased selection:bg-blue-500/20 overflow-x-hidden relative flex flex-col justify-center py-8 lg:py-0">
        
        {/* Ambient Glows */}
        <div className="absolute top-0 left-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-blue-500/5 blur-[100px] sm:blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] bg-indigo-500/5 blur-[80px] sm:blur-[100px] rounded-full pointer-events-none" />

        {!targetTime ? (
          <div className="flex flex-col items-center justify-center gap-4 text-zinc-400 relative z-10 h-full">
            <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
        ) : (
          <div className="w-full max-w-[1400px] mx-auto px-5 sm:px-12 lg:px-16 flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-8 lg:gap-20 relative z-10">
            
            {/* ================= LEFT SIDE: COPY & BRANDING ================= */}
            <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left w-full">
              
              {/* Logo & Tagline */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-6 lg:mb-10 relative group flex flex-col items-center lg:items-start"
              >
                <div className="absolute -inset-4 bg-blue-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-white/50 dark:bg-[#111113]/50 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 px-5 py-2.5 lg:px-6 lg:py-3 rounded-2xl shadow-sm mb-3 lg:mb-4">
                   <Image src="/logo.png" alt="Infera Core" width={140} height={35} className="dark:invert object-contain opacity-90 h-5 lg:h-6 w-auto" />
                </div>
                <span className="font-google-sans text-[10px] sm:text-[11px] lg:text-[13px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                  Where intelligence goes deeper.
                </span>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-google-sans text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.5rem] leading-[1.1] lg:leading-[1.05] font-extrabold tracking-tighter mb-4 lg:mb-6"
              >
                Stop guessing.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400 dark:from-blue-500 dark:to-blue-300"> 
                  Start executing.
                </span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-[14px] sm:text-[16px] lg:text-xl text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed max-w-lg mb-8 lg:mb-12 px-2 lg:px-0"
              >
                Transforming Learning, AI Guidance, and Redefining Education. The intelligent engineering workspace.
              </motion.p>

              {/* Action Buttons */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center gap-3 lg:gap-4 w-full sm:w-auto px-2 sm:px-0 order-last lg:order-none"
              >
                <Link 
                  href="/how-it-works" 
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/80 dark:bg-[#111113]/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-[#18181b] text-zinc-900 dark:text-zinc-100 font-google-sans font-bold px-6 lg:px-8 h-12 lg:h-14 rounded-full transition-all text-[14px] lg:text-[15px] shadow-sm hover:shadow-md active:scale-95 outline-none"
                >
                  Explore Features
                </Link>

                <AnimatePresence mode="wait">
                  {isLaunched ? (
                    <motion.div
                      key="unlocked"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="w-full sm:w-auto"
                    >
                      <Link 
                        href="/auth/login" 
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-google-sans font-bold px-6 lg:px-8 h-12 lg:h-14 rounded-full transition-all text-[14px] lg:text-[15px] active:scale-95 shadow-[0_10px_20px_rgba(37,99,235,0.2)] hover:shadow-[0_15px_30px_rgba(37,99,235,0.4)] outline-none"
                      >
                        <Unlock size={16} className="w-4 h-4" /> Node Login
                      </Link>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="locked"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full sm:w-auto"
                    >
                      <button 
                        disabled
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 font-google-sans font-bold px-6 lg:px-8 h-12 lg:h-14 rounded-full transition-all text-[14px] lg:text-[15px] cursor-not-allowed outline-none"
                      >
                        <Lock size={16} className="w-4 h-4" /> Login Locked
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* ================= RIGHT SIDE: COUNTDOWN GRID ================= */}
            {/* On Mobile: A sleek 4-column horizontal strip. On Desktop: The heavy 2x2 grid. */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="w-full lg:flex-1 max-w-full lg:max-w-lg shrink-0 mb-6 lg:mb-0 order-first lg:order-none px-2 sm:px-0"
            >
              <div className="grid grid-cols-4 lg:grid-cols-2 gap-2 sm:gap-4 lg:gap-5">
                {Object.entries(timeLeft).map(([unit, value]) => (
                  <div 
                    key={unit} 
                    className="flex flex-col items-center justify-center bg-white/60 dark:bg-[#0c0c0e]/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/80 rounded-2xl lg:rounded-[2rem] aspect-square lg:aspect-square p-2 sm:p-4 lg:p-6 shadow-xl shadow-zinc-200/20 dark:shadow-none transition-all duration-300 hover:border-blue-500/30 dark:hover:border-blue-500/30 hover:bg-white dark:hover:bg-[#111113]"
                  >
                    <span className="font-google-sans text-2xl sm:text-4xl lg:text-7xl font-extrabold text-zinc-900 dark:text-white mb-0.5 sm:mb-1 lg:mb-2 tracking-tight">
                      {value.toString().padStart(2, '0')}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400 text-[9px] sm:text-[11px] lg:text-xs font-bold tracking-[0.1em] lg:tracking-[0.2em] uppercase font-google-sans">
                      {unit}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>
        )}
      </div>
    </>
  );
} 