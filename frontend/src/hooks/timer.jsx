import { useState, useRef, useEffect, useCallback } from 'react';

export default (onComplete) => {
  let [totalSeconds, setTotalSeconds] = useState(null);
  let [isRunning, setIsRunning] = useState(false);
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
    setIsRunning(isRunning=false);
  }, []);

  const start = useCallback(() => {
    if (totalSeconds === null || totalSeconds <= 0 || isRunning) return;
    
    setIsRunning(isRunning=true);
    intervalRef.current = setInterval(() => {
      setTotalSeconds(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setIsRunning(isRunning=false);
          if (prev !== null && onCompleteRef.current) {
            onCompleteRef.current();
          }
          return totalSeconds=prev === null ? null : 0;
        }
        return totalSeconds=prev - 1;
      });
    }, 1000);
  }, [totalSeconds, isRunning]);

  const setTime = useCallback((seconds, autoStart = false) => {
    stop();
    setTotalSeconds(totalSeconds=seconds > 0 ? seconds : 0);
    if (autoStart && seconds > 0) {
      // Используем setTimeout, чтобы дать React обновить totalSeconds
      setTimeout(() => start(), 0);
    }
  }, [stop, start]);

  // cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current){
        clearInterval(intervalRef.current);
        setIsRunning(isRunning=false)
      } 
    };
  }, []);

  const days = totalSeconds === null ? 0 : Math.floor(totalSeconds / 86400);
  const hours = totalSeconds === null ? 0 : Math.floor((totalSeconds % 86400) / 3600);
  const minutes = totalSeconds === null ? 0 : Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds === null ? 0 : totalSeconds % 60;

  return {
    totalSeconds,
    days, hours, minutes, seconds,
    isRunning,
    start,
    stop,
    setTime,
  };
};