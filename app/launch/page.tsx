"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Lock, Rocket } from "lucide-react";

// Adjust this import path depending on your exact folder structure
import logo from "../../public/logo.png";

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

    // Calculate the next Sunday at 23:59:59
    const getNextSunday = () => {
      const now = new Date();
      const nextSunday = new Date();
      const daysUntilSunday = (7 - now.getDay()) % 7;
      
      nextSunday.setDate(now.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));
      nextSunday.setHours(23, 59, 59, 999);
      return nextSunday.getTime();
    };

    const time = getNextSunday();
    setTargetTime(time);
    
    if (time <= new Date().getTime()) {
      setIsLaunched(true);
    }
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
      
      {/* Ultra-Clean Container */}
      <div className="min-h-[100dvh] lg:h-[100dvh] w-full font-outfit bg-[#fafafa] dark:bg-[#050505] text-zinc-900 dark:text-zinc-100 antialiased selection:bg-blue-500/20 overflow-x-hidden relative flex flex-col justify-center py-12 lg:py-0">
        
        {/* Subtle, Static Ambient Light (No messy pulsing) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-blue-500/5 dark:bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

        {!targetTime ? (
          <div className="flex flex-col items-center justify-center gap-4 text-zinc-400 relative z-10 h-full">
            <Loader2 className="animate-spin text-blue-500" size={28} />
          </div>
        ) : (
          <div className="w-full max-w-[1200px] mx-auto px-6 sm:px-12 lg:px-16 flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-16 lg:gap-24 relative z-10">
            
            {/* ================= LEFT SIDE: PRECISION COPY ================= */}
            <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left w-full">
              
              {/* Refined Logo & Tagline (No pill background, purely typographic) */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="mb-10 flex flex-col items-center lg:items-start gap-4"
              >
                <Image src={logo} alt="Infera Core" width={150} height={38} className="dark:invert object-contain opacity-95 h-6 lg:h-7 w-auto" />
                <span className="font-google-sans text-[11px] lg:text-[12px] font-bold uppercase tracking-[0.25em] text-zinc-400 dark:text-zinc-500">
                  Where intelligence goes deeper.
                </span>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="font-google-sans text-[2.5rem] sm:text-5xl md:text-6xl lg:text-[4.5rem] leading-[1.1] font-extrabold tracking-tight mb-6 text-zinc-900 dark:text-white"
              >
                Stop guessing.<br />
                <span className="text-blue-600 dark:text-blue-500"> 
                  Start executing.
                </span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="text-[15px] sm:text-[17px] lg:text-[19px] text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed max-w-md mb-12"
              >
                Transforming Learning, AI Guidance, and Redefining Education. The intelligent engineering workspace.
              </motion.p>

              {/* 🚀 SINGLE ACTION BUTTON */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="w-full sm:w-auto"
              >
                <AnimatePresence mode="wait">
                  {isLaunched ? (
                    <motion.div
                      key="launched"
                      initial={{ opacity: 0, filter: "blur(4px)" }}
                      animate={{ opacity: 1, filter: "blur(0px)" }}
                      transition={{ duration: 0.5 }}
                    >
                      <Link
                        href="/"
                        className="group flex w-full sm:w-auto items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-google-sans font-bold h-14 sm:h-16 px-10 sm:px-14 rounded-full text-[16px] sm:text-[17px] transition-all outline-none shadow-[0_4px_20px_-4px_rgba(37,99,235,0.4)] active:scale-[0.98]"
                      >
                        <span>Initiate Launch</span>
                        <Rocket size={18} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5" />
                      </Link>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="locked"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, filter: "blur(4px)" }}
                    >
                      <button 
                        disabled
                        className="flex w-full sm:w-auto items-center justify-center gap-2.5 h-14 sm:h-16 px-10 sm:px-12 text-[15px] sm:text-[16px] text-zinc-500 dark:text-zinc-500 font-google-sans font-semibold bg-zinc-100 dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800/80 rounded-full cursor-not-allowed outline-none"
                      >
                        <Lock size={16} /> Sequence Locked
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* ================= RIGHT SIDE: HIGH-END WIDGET GRID ================= */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="w-full lg:flex-1 max-w-full lg:max-w-md shrink-0 order-first lg:order-none"
            >
              <div className="grid grid-cols-4 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
                {Object.entries(timeLeft).map(([unit, value]) => (
                  <motion.div 
                    key={unit} 
                    animate={isLaunched ? { borderColor: "rgba(59, 130, 246, 0.3)" } : {}}
                    transition={{ duration: 1 }}
                    className="relative overflow-hidden flex flex-col items-center justify-center bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-[1.25rem] lg:rounded-[2rem] aspect-square p-4 lg:p-8 shadow-sm transition-colors"
                  >
                    {/* Subtle internal top highlight for depth */}
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-300 dark:via-zinc-700 to-transparent opacity-50" />
                    
                    <span className={`font-mono text-3xl sm:text-5xl lg:text-7xl font-medium tracking-tighter tabular-nums mb-1 lg:mb-2 transition-colors duration-1000 ${isLaunched ? "text-blue-600 dark:text-blue-500" : "text-zinc-900 dark:text-white"}`}>
                      {value.toString().padStart(2, '0')}
                    </span>
                    <span className="text-zinc-400 dark:text-zinc-500 text-[9px] sm:text-[11px] lg:text-xs font-bold tracking-[0.2em] uppercase font-google-sans">
                      {unit}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

          </div>
        )}
      </div>
    </>
  );
}