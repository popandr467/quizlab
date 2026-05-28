import { useState, useEffect, useRef, useCallback } from 'react';

const useTimer = (initialTime = 0, onComplete) => {
  // initialTime - общее количество секунд
  const [totalSeconds, setTotalSeconds] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const start = useCallback(() => {
    if (totalSeconds <= 0) return;
    if (isRunning) return;

    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setTotalSeconds(prev => {
        if (prev <= 1) {
          // Время истекло
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setIsRunning(false);
          if (onCompleteRef.current) onCompleteRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [totalSeconds, isRunning]);

  const reset = useCallback(() => {
    stop();
    setTotalSeconds(initialTime);
  }, [initialTime, stop]);

  const setTime = useCallback((seconds) => {
    if (!isRunning) {
      setTotalSeconds(seconds);
    }
  }, [isRunning]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Вычисление дней, часов и т.д. для удобства
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    totalSeconds,
    days,
    hours,
    minutes,
    seconds,
    isRunning,
    start,
    stop,
    reset,
    setTime
  };
};

export default useTimer;