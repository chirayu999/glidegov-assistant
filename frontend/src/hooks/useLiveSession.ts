import { useState, useEffect, useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const STORAGE_KEY = "govglide_session_id";

export function useLiveSession(): {
  sessionId: string | null;
  loading: boolean;
  error: string | null;
  ensureSession: () => Promise<string | null>;
} {
  const [sessionId, setSessionId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ensureSession = useCallback(async (): Promise<string | null> => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setSessionId(stored);
      return stored;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: "en" }),
      });
      if (!res.ok) throw new Error("Failed to create session");
      const data = await res.json();
      const id = data.session_id;
      if (id) {
        localStorage.setItem(STORAGE_KEY, id);
        setSessionId(id);
        return id;
      }
      return null;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create session");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    ensureSession();
  }, [ensureSession]);

  return { sessionId, loading, error, ensureSession };
}
