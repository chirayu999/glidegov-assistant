import { useRef, useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bot, Mic } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSession } from "@/contexts/SessionContext";
import { useLiveAgentChannel, type LiveAgentEvent } from "@/hooks/useLiveAgentChannel";
import { getTurns, createTurn } from "@/lib/api";

const WaveVisualizer = () => (
  <div className="flex items-end justify-center gap-1 h-10 py-2">
    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
      <div
        key={i}
        className="w-1 rounded-full bg-primary animate-wave-bar"
        style={{ animationDelay: `${i * 0.15}s`, height: "8px" }}
      />
    ))}
  </div>
);

type Message = { from: "user" | "ai"; text: string };

const DEFAULT_GREETING: Message = {
  from: "ai",
  text: "Hello! I'm GovGlide. Tell me what government scheme you need help with—scholarship, pension, or something else.",
};

const Chat = () => {
  const { sessionId, loading: sessionLoading, error: sessionError } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const hydratedRef = useRef(false);
  const [liveReady, setLiveReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const outAudioContextRef = useRef<AudioContext | null>(null);
  const outWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const outWorkletReadyRef = useRef<Promise<void> | null>(null);

  const { data: turnsData } = useQuery({
    queryKey: ["turns", sessionId ?? ""],
    queryFn: () => getTurns(sessionId!),
    enabled: !!sessionId,
  });

  useEffect(() => {
    if (hydratedRef.current || !turnsData) return;
    hydratedRef.current = true;
    const turns = turnsData.turns ?? [];
    if (turns.length === 0) {
      setMessages([DEFAULT_GREETING]);
    } else {
      setMessages(
        turns.map((t) => ({
          from: t.role === "user" ? "user" : "ai",
          text: t.content_text ?? "",
        }))
      );
    }
  }, [turnsData]);

  const ensureOutputWorklet = useCallback(async () => {
    if (outWorkletNodeRef.current) return;
    if (outWorkletReadyRef.current) return outWorkletReadyRef.current;

    outWorkletReadyRef.current = (async () => {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx({ sampleRate: 24000 });
      outAudioContextRef.current = ctx;
      await ctx.audioWorklet.addModule(new URL("../audio/pcm_stream_player.worklet.ts", import.meta.url));
      const node = new AudioWorkletNode(ctx, "pcm-stream-player", {
        numberOfInputs: 0,
        numberOfOutputs: 1,
        outputChannelCount: [1],
      });
      node.connect(ctx.destination);
      outWorkletNodeRef.current = node;
    })();

    return outWorkletReadyRef.current;
  }, []);

  const resetOutputPlayback = useCallback(() => {
    // Reset buffered audio to avoid “mixing” when the user barges in.
    outWorkletNodeRef.current?.port.postMessage({ type: "reset" });
  }, []);

  const playAudioBase64 = useCallback(
    async (base64: string) => {
      try {
        await ensureOutputWorklet();
        const node = outWorkletNodeRef.current;
        const ctx = outAudioContextRef.current;
        if (!node || !ctx) return;

        if (ctx.state === "suspended") {
          // Resume on user gesture paths; safe to call multiple times.
          await ctx.resume().catch(() => {});
        }

        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

        // Transfer Int16Array buffer to worklet for minimal overhead.
        const pcm16 = new Int16Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
        node.port.postMessage({ type: "pcm16", pcm: pcm16.buffer }, [pcm16.buffer]);
      } catch (e) {
        console.warn("Play audio failed", e);
      }
    },
    [ensureOutputWorklet]
  );

  const persistTurn = useCallback(
    (role: "user" | "assistant", contentText: string) => {
      if (!sessionId) return;
      createTurn(sessionId, { role, content_text: contentText }).catch(() => {});
    },
    [sessionId]
  );

  const handleLiveEvent = useCallback((event: LiveAgentEvent) => {
    if (event.type === "live_ready") {
      setLiveReady(true);
      setError(null);
    } else if (event.type === "error") {
      setError(event.data.message);
      setIsWaitingForResponse(false);
    } else if (event.type === "live") {
      try {
        const raw = event.data;
        const parsed =
          typeof raw === "string" ? JSON.parse(raw) : (raw as Record<string, unknown>);
        const hasTopLevelToolCall = !!(parsed?.toolCall ?? parsed?.tool_call);
        if (hasTopLevelToolCall) setIsWaitingForResponse(false);

        const content = (parsed?.serverContent ?? parsed?.server_content) as Record<string, unknown> | undefined;
        if (import.meta.env.DEV) {
          console.log("[LiveAgent] received:", Object.keys(parsed), content ? Object.keys(content) : "no serverContent");
        }
        if (!content) return;

        const modelTurn = (content.modelTurn ?? content.model_turn) as { parts?: Array<{ text?: { text?: string }; inlineData?: { data?: string }; inline_data?: { data?: string } }> } | undefined;
        const hasToolCall = !!(content.toolCall ?? content.tool_call);
        if (modelTurn?.parts?.length || hasToolCall) {
          setIsWaitingForResponse(false);
        }

        // Model turn: text and audio in parts (turnComplete is boolean per API; audio only in modelTurn.parts)
        if (modelTurn?.parts) {
          for (const part of modelTurn.parts) {
            const text = part.text?.text;
            if (text) {
              setMessages((prev) => [...prev, { from: "ai", text }]);
              persistTurn("assistant", text);
            }
            const audioB64 = part.inlineData?.data ?? (part.inline_data as { data?: string } | undefined)?.data;
            if (audioB64) playAudioBase64(audioB64);
          }
        }
      } catch (e) {
        if (import.meta.env.DEV) console.warn("[LiveAgent] parse error", e);
      }
    }
  }, [persistTurn, playAudioBase64]);

  const { connected, sendAudio } = useLiveAgentChannel(sessionId, handleLiveEvent);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isWaitingForResponse]);

  const startMic = useCallback(() => {
    if (!sessionId || !connected || !liveReady) return;
    // Barge-in: clear any queued output so it doesn't overlap with the user speaking.
    resetOutputPlayback();
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      mediaStreamRef.current = stream;
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        const pcm = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
          const s = Math.max(-1, Math.min(1, input[i]));
          pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        const binary = String.fromCharCode(...new Uint8Array(pcm.buffer));
        const base64 = btoa(binary);
        sendAudio(base64);
      };
      source.connect(processor);
      processor.connect(ctx.destination);
      processorRef.current = processor;
      setIsMicActive(true);
    }).catch((e) => {
      setError("Microphone access denied");
      console.error(e);
    });
  }, [sessionId, connected, liveReady, sendAudio, resetOutputPlayback]);

  const stopMic = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    processorRef.current?.disconnect();
    processorRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    setIsMicActive(false);
    setIsWaitingForResponse(true);
  }, []);

  useEffect(() => {
    return () => {
      outWorkletNodeRef.current?.disconnect();
      outWorkletNodeRef.current = null;
      outAudioContextRef.current?.close().catch(() => {});
      outAudioContextRef.current = null;
      outWorkletReadyRef.current = null;
    };
  }, []);

  const displayError = sessionError ?? error;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex-shrink-0 border-b border-border bg-card">
        <WaveVisualizer />
        <p className="text-center text-sm text-muted-foreground pb-2">
          {sessionLoading ? "Starting…" : !sessionId ? "Create a session…" : !connected ? "Connecting…" : !liveReady ? "Live agent connecting…" : isMicActive ? "Listening…" : "Tap Talk to speak."}
        </p>
      </div>

      <ScrollArea className="flex-1 px-4 py-4">
        <div className="flex flex-col gap-4 max-w-lg mx-auto">
          {displayError && (
            <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-2 text-sm">
              {displayError}
            </div>
          )}
          {(messages.length === 0 ? [DEFAULT_GREETING] : messages).map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 animate-fade-in ${msg.from === "user" ? "flex-row-reverse" : ""}`}
            >
              {msg.from === "ai" && (
                <Avatar className="w-10 h-10 flex-shrink-0 bg-primary/10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Bot size={22} />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`rounded-2xl px-5 py-3 text-base leading-relaxed max-w-[80%] ${
                  msg.from === "ai"
                    ? "bg-card border border-border text-card-foreground shadow-sm"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isWaitingForResponse && (
            <div className="flex gap-3 animate-fade-in">
              <Avatar className="w-10 h-10 flex-shrink-0 bg-primary/10">
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Bot size={22} />
                </AvatarFallback>
              </Avatar>
              <div className="rounded-2xl px-5 py-3 text-base text-muted-foreground bg-card border border-border shadow-sm flex items-center gap-1">
                <span>GovGlide is thinking</span>
                <span className="flex gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: "200ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: "400ms" }} />
                </span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="flex-shrink-0 flex items-center justify-center py-5 bg-card border-t border-border">
        <button
          onClick={isMicActive ? stopMic : startMic}
          disabled={!sessionId || !connected || !liveReady}
          className={`flex flex-col items-center justify-center w-20 h-20 rounded-full shadow-lg transition-transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-ring ${
            isMicActive ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground animate-mic-pulse"
          }`}
          aria-label={isMicActive ? "Stop" : "Talk"}
        >
          <Mic size={32} />
          <span className="text-xs mt-1 font-medium">{isMicActive ? "Stop" : "Talk"}</span>
        </button>
      </div>
    </div>
  );
};

export default Chat;
