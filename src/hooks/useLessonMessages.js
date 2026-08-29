import { useState, useEffect } from 'react';
import { api } from '../api.js';

export function useLessonMessages(lessonId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!lessonId) return;
    setLoading(true);
    setError(null);
    api.getLessonMessages(lessonId)
      .then(res => {
        if (res.ok) setMessages(res.data);
        else setError(res.error);
      })
      .catch(e => setError(e?.message || 'Błąd'))
      .finally(() => setLoading(false));
  }, [lessonId]);

  return { messages, loading, error };
}
