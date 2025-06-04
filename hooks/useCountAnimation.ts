import { useState, useEffect } from 'react';

interface UseCountAnimationOptions {
  duration?: number; // Duração da animação em ms
  delay?: number; // Delay antes de iniciar em ms
}

export const useCountAnimation = (
  targetValue: number,
  options: UseCountAnimationOptions = {}
) => {
  const { duration = 2000, delay = 0 } = options;
  const [currentValue, setCurrentValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (targetValue === 0) {
      setCurrentValue(0);
      return;
    }

    const startAnimation = () => {
      setIsAnimating(true);
      setCurrentValue(0);
      
      const increment = targetValue / (duration / 16); // 60fps
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        
        if (current >= targetValue) {
          setCurrentValue(targetValue);
          setIsAnimating(false);
          clearInterval(timer);
        } else {
          setCurrentValue(current);
        }
      }, 16);

      return () => clearInterval(timer);
    };

    const timeoutId = setTimeout(startAnimation, delay);
    return () => clearTimeout(timeoutId);
  }, [targetValue, duration, delay]);

  return {
    value: Number(currentValue.toFixed(1)),
    isAnimating
  };
}; 