import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createSession } from "@/lib/api";
import { useSessionChannel, type SessionChannelEvent } from "@/hooks/useSessionChannel";

const STORAGE_KEY = "govglide_session_id";

interface SessionContextValue {
  sessionId: string | null;
  loading: boolean;
  error: string | null;
  ensureSession: () => Promise<string | null>;
  channelConnected: boolean;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
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
      const data = await createSession("en");
      const id = data.session_id;
      if (id) {
        localStorage.setItem(STORAGE_KEY, id);
        setSessionId(id);
        return id;
      }
      return null;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to create session";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChannelEvent = useCallback(
    (event: SessionChannelEvent) => {
      if (event.type === "discovery_done" || event.type === "eligibility_done") {
        if (sessionId) {
          queryClient.invalidateQueries({ queryKey: ["sessionSchemes", sessionId] });
        }
        if (event.type === "eligibility_done" && sessionId) {
          queryClient.invalidateQueries({ queryKey: ["formStatus", sessionId] });
        }
      }
    },
    [sessionId, queryClient]
  );

  const { connected: channelConnected } = useSessionChannel(sessionId, handleChannelEvent);

  useEffect(() => {
    ensureSession();
  }, [ensureSession]);

  const value: SessionContextValue = {
    sessionId,
    loading,
    error,
    ensureSession,
    channelConnected,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return ctx;
}
