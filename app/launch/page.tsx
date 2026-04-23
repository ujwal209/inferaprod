"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

// Adjust this import path depending on your exact folder structure
import logo from "../../public/logo.png";

export default function LaunchPage() {
  const [mounted, setMounted] = React.useState(false);
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
      
      // If today is Sunday, we target today at midnight. 
      // If you want it to target NEXT Sunday if today is Sunday, change to: daysUntilSunday === 0 ? 7 : daysUntilSunday
      nextSunday.setDate(now.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));
      nextSunday.setHours(23, 59, 59, 999);
      return nextSunday.getTime();
    };

    const targetDate = getNextSunday();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Helper to format numbers with leading zero
  const pad = (num: number) => num.toString().padStart(2, "0");

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&family=Outfit:wght@100..900&display=swap');
        
        .font-outfit { font-family: 'Outfit', sans-serif !important; }
        .font-google-sans { font-family: 'Google Sans', sans-serif !important; }
      `,
        }}
      />

      <div className="min-h-screen font-outfit bg-[#fafafa] dark:bg-[#050505] text-zinc-900 dark:text-zinc-100 relative overflow-hidden selection:bg-blue-500/20 flex flex-col">
        
        {/* =========================================
            BACKGROUND ARCHITECTURE
        ========================================= */}
        {/* Sweeping Soft Spotlight */}
        <div className="absolute top-0 right-0 w-[80vw] h-[80vh] bg-gradient-to-bl from-blue-500/10 via-blue-600/5 to-transparent rounded-full blur-[150px] pointer-events-none transform translate-x-1/4 -translate-y-1/4" />
        
        {/* Precision Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:linear-gradient(to_bottom,white,transparent)] pointer-events-none" />

        {/* =========================================
            TOP NAVIGATION / BRANDING
        ========================================= */}
        <header className="relative z-20 w-full px-6 py-8 sm:px-12 lg:px-24">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <Image
              src={logo}
              alt="Platform Logo"
              width={160}
              height={40}
              priority
              className="h-7 sm:h-9 w-auto dark:invert"
            />
          </motion.div>
        </header>

        {/* =========================================
            MAIN CONTENT
        ========================================= */}
        <main className="relative z-10 flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-24 pb-24">
          <div className="max-w-5xl w-full">
            
            {/* Massive Human-Centric Headline */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="font-google-sans text-[4rem] sm:text-[6rem] lg:text-[8rem] xl:text-[9rem] leading-[0.95] font-extrabold tracking-tighter text-zinc-900 dark:text-white mb-6 sm:mb-8">
                Your space <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400 dark:from-blue-500 dark:to-blue-300">
                  to grow.
                </span>
              </h1>
            </motion.div>

            {/* Premium Countdown Block */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="mb-10 sm:mb-16"
            >
              <div className="flex items-start gap-4 sm:gap-6">
                {[
                  { label: "Days", value: pad(timeLeft.days) },
                  { label: "Hours", value: pad(timeLeft.hours) },
                  { label: "Mins", value: pad(timeLeft.minutes) },
                  { label: "Secs", value: pad(timeLeft.seconds) },
                ].map((block, i, arr) => (
                  <React.Fragment key={block.label}>
                    <div className="flex flex-col items-center min-w-[3.5rem] sm:min-w-[4.5rem]">
                      <span className="font-google-sans text-3xl sm:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight tabular-nums">
                        {mounted ? block.value : "00"}
                      </span>
                      <span className="text-[10px] sm:text-xs font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mt-1">
                        {block.label}
                      </span>
                    </div>
                    {i !== arr.length - 1 && (
                      <span className="font-google-sans text-3xl sm:text-5xl font-medium text-zinc-300 dark:text-zinc-800 -mt-1 sm:mt-0">
                        :
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </motion.div>

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 lg:gap-8 border-t border-zinc-200 dark:border-zinc-800/60 pt-10">
              
              {/* Meaningful Subtext */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="text-[18px] sm:text-[20px] lg:text-[22px] text-zinc-500 dark:text-zinc-400 font-medium leading-[1.5] max-w-lg"
              >
                We have prepared everything you need to learn faster and work smarter. Create your free account today and be ready.
              </motion.p>

              {/* Action Block */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col sm:flex-row items-center gap-4 lg:shrink-0 w-full sm:w-auto"
              >
                <Link
                  href="/auth/signup"
                  className="group relative flex w-full sm:w-auto items-center justify-center gap-4 bg-blue-600 text-white font-google-sans font-bold h-16 sm:h-20 px-10 sm:px-12 rounded-full text-[17px] sm:text-[19px] transition-all outline-none border border-transparent shadow-[0_15px_40px_-10px_rgba(37,99,235,0.4)] hover:shadow-[0_20px_50px_-10px_rgba(37,99,235,0.6)] hover:bg-blue-500 active:scale-[0.98]"
                >
                  <span>Get Started</span>
                  <ArrowRight size={24} className="transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/auth/login"
                  className="flex w-full sm:w-auto items-center justify-center h-16 sm:h-20 px-10 sm:px-12 text-[17px] sm:text-[19px] font-bold font-google-sans text-zinc-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 bg-transparent rounded-full transition-all active:scale-[0.98] hover:bg-zinc-100 dark:hover:bg-zinc-900/50"
                >
                  Log in
                </Link>
              </motion.div>

            </div>
          </div>
        </main>
      </div>
    </>
  );
}