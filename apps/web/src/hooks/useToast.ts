'use client';

import { useState, useCallback, useRef } from 'react';

export function useToast(duration = 3000) {
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<NodeJS.Timeout | null>(null);

  const showError = useCallback((text: string) => {
    setError(text);
    setMsg(null);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setError(null), duration);
  }, [duration]);

  const showMsg = useCallback((text: string) => {
    setMsg(text);
    setError(null);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), duration);
  }, [duration]);

  return { error, msg, showError, showMsg, setError, setMsg };
}
