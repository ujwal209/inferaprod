'use client'
import React, { useState, useRef, useEffect } from 'react'

export const useTypewriter = (text: string, enabled: boolean, forceStop: boolean, onComplete?: () => void) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingState, setIsTypingState] = useState(false);
  const hasFinishedRef = useRef(false);

  useEffect(() => {
    if (hasFinishedRef.current) { setDisplayedText(text); return; }
    if (!enabled || !text || forceStop) {
      setDisplayedText(text || '');
      setIsTypingState(false);
      hasFinishedRef.current = true;
      onComplete?.();
      return;
    }
    setIsTypingState(true);
    let i = 0;
    const interval = setInterval(() => {
      i += 8; // Very fast
      if (i >= text.length) {
        setDisplayedText(text);
        setIsTypingState(false);
        hasFinishedRef.current = true;
        clearInterval(interval);
        onComplete?.();
      } else {
        setDisplayedText(text.slice(0, i));
      }
    }, 10);
    return () => clearInterval(interval);
  }, [text, enabled, forceStop]);
  return { displayedText, isTyping: isTypingState };
};

export const TypewriterMessage = ({ content, isNew, forceStop, scrollRef, onComplete, children }: any) => {
  const { displayedText } = useTypewriter(content, isNew, forceStop, onComplete);
  useEffect(() => {
    if (scrollRef?.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [displayedText, scrollRef]);
  return <>{children(displayedText)}</>;
};