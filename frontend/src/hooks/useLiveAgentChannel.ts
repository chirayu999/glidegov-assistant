import { useEffect, useRef, useState, useCallback } from "react";
import { createConsumer, Cable } from "@rails/actioncable";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function getCableUrl(sessionId: string | null): string {
  const base = API_URL.replace(/^http/, "ws") + "/cable";
  if (sessionId) {
    return `${base}?session_id=${encodeURIComponent(sessionId)}`;
  }
  return base;
}

export type LiveAgentEvent =
  | { type: "live_ready"; data: Record<string, unknown> }
  | { type: "live"; data: string }
  | { type: "error"; data: { message: string } };

export function useLiveAgentChannel(
  sessionId: string | null,
  onEvent: (event: LiveAgentEvent) => void
): { connected: boolean; sendAudio: (base64: string) => void } {
  const [connected, setConnected] = useState(false);
  const subscriptionRef = useRef<ReturnType<Cable["subscriptions"]["create"]> | null>(null);
  const consumerRef = useRef<Cable | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const sendAudio = useCallback((base64: string) => {
    const sub = subscriptionRef.current as { perform?: (action: string, data: unknown) => void } | null;
    if (sub?.perform) {
      sub.perform("receive", { data: base64 });
    }
  }, []);

  useEffect(() => {
    if (!sessionId) {
      setConnected(false);
      return;
    }

    const consumer = createConsumer(getCableUrl(sessionId));
    consumerRef.current = consumer;

    const subscription = consumer.subscriptions.create(
      { channel: "LiveAgentChannel", session_id: sessionId },
      {
        connected() {
          setConnected(true);
        },
        disconnected() {
          setConnected(false);
        },
        received(payload: { type?: string; data?: unknown }) {
          const t = payload.type ?? "live";
          const d = payload.data;
          if (t === "live_ready") {
            onEventRef.current({ type: "live_ready", data: (d as Record<string, unknown>) || {} });
          } else if (t === "error") {
            onEventRef.current({
              type: "error",
              data: { message: (d as { message?: string })?.message ?? "Unknown error" },
            });
          } else {
            onEventRef.current({ type: "live", data: typeof d === "string" ? d : JSON.stringify(d ?? {}) });
          }
        },
      }
    );

    subscriptionRef.current = subscription;

    return () => {
      subscription.unsubscribe();
      consumer.disconnect();
      consumerRef.current = null;
      subscriptionRef.current = null;
      setConnected(false);
    };
  }, [sessionId]);

  return { connected, sendAudio };
}
