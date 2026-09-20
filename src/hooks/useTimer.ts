import { useEffect, useRef } from 'react';
import { useFocusStore } from '../store/useFocusStore';

export const useTimer = () => {
  const { 
    isActive, 
    timeLeft, 
    mode, 
    setTimeLeft, 
    setIsActive, 
    setMode, 
    incrementPomodoros,
    workDuration,
    breakDuration,
    longBreakDuration,
    pomodorosCompletedToday,
    autoStartBreaks,
    autoStartPomodoros
  } = useFocusStore();

  const endTimeRef = useRef<number | null>(null);

  useEffect(() => {
    let interval: number;

    if (!isActive) {
      endTimeRef.current = null;
    } else if (isActive && timeLeft > 0) {
      if (!endTimeRef.current) {
        endTimeRef.current = Date.now() + timeLeft * 1000;
      }
      
      interval = setInterval(() => {
        if (!endTimeRef.current) return;
        const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
        setTimeLeft(remaining);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      // Timer finished or skipped
      endTimeRef.current = null;
      setIsActive(false);
      
      if (mode === 'work') {
        incrementPomodoros();
        // Determine next mode
        const nextMode = (pomodorosCompletedToday + 1) % 4 === 0 ? 'longBreak' : 'shortBreak';
        setMode(nextMode);
        setTimeLeft((nextMode === 'longBreak' ? longBreakDuration : breakDuration) * 60);
        
        if (autoStartBreaks) {
          setTimeout(() => setIsActive(true), 1000);
        }
      } else {
        // Break finished
        setMode('work');
        setTimeLeft(workDuration * 60);
        
        if (autoStartPomodoros) {
          setTimeout(() => setIsActive(true), 1000);
        }
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    isActive, 
    timeLeft, 
    mode, 
    setTimeLeft, 
    setIsActive, 
    setMode, 
    incrementPomodoros,
    workDuration,
    breakDuration,
    longBreakDuration,
    pomodorosCompletedToday,
    autoStartBreaks,
    autoStartPomodoros
  ]);
};
