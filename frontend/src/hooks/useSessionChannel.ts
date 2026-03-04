import { useEffect, useRef, useState } from "react";
import { createConsumer } from "@rails/actioncable";

export type SessionChannelEvent =
  | { type: "screenshot"; data: { image: string; message?: string; timestamp: string } }
  | { type: "form_progress"; data: { step_index: number; total_steps: number; message: string; state: string; timestamp: string } }
  | { type: "data_required"; data: { missing_fields: Array<{ key: string; label: string; type?: string; required?: boolean }>; message?: string; timestamp: string } }
  | { type: "handoff"; data: { reason: string; url?: string; timestamp: string } }
  | { type: "message"; data: { content: string; timestamp: string } }
  | { type: "error"; data: { message: string; timestamp?: string } }
  | { type: "discovery_done"; data: { schemes: unknown[]; timestamp: string } }
  | { type: "eligibility_done"; data: { results: unknown[]; timestamp: string } };

type EventHandler = (event: SessionChannelEvent) => void;

function getCableUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
  return apiUrl.replace(/^http/, "ws") + "/cable";
}

export function useSessionChannel(sessionId: string | null, onEvent: EventHandler) {
  const [connected, setConnected] = useState(false);
  const subscriptionRef = useRef<ReturnType<ReturnType<typeof createConsumer>["subscriptions"]["create"]> | null>(null);
  const consumerRef = useRef<ReturnType<typeof createConsumer> | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!sessionId) {
      setConnected(false);
      return;
    }

    const consumer = createConsumer(getCableUrl());
    consumerRef.current = consumer;

    const subscription = consumer.subscriptions.create(
      { channel: "SessionChannel", session_id: sessionId },
      {
        connected() {
          setConnected(true);
        },
        disconnected() {
          setConnected(false);
        },
        received(payload: { type: string; data: unknown }) {
          onEventRef.current(payload as SessionChannelEvent);
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

  return { connected };
}
