import { Bot, Mic, Camera } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

const mockMessages = [
  { from: "ai", text: "Hello! I'm GovGlide, your government scheme assistant. How can I help you today?" },
  { from: "user", text: "I want to check scholarship eligibility for my daughter." },
  { from: "ai", text: "Sure! I can help with that. Could you tell me her current education level and annual family income?" },
  { from: "user", text: "She's in 12th standard. Our income is about 2 lakhs per year." },
  { from: "ai", text: "Great! Based on that, she may be eligible for the Post-Matric Scholarship and the AICTE Pragati Scheme. Would you like me to check the full details?" },
];

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

const Chat = () => {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Wave Visualizer */}
      <div className="flex-shrink-0 border-b border-border bg-card">
        <WaveVisualizer />
        <p className="text-center text-sm text-muted-foreground pb-2">GovGlide is listening...</p>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="flex flex-col gap-4 max-w-lg mx-auto">
          {mockMessages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 animate-fade-in ${msg.from === "user" ? "flex-row-reverse" : ""}`}
              style={{ animationDelay: `${i * 0.08}s` }}
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
        </div>
      </ScrollArea>

      {/* Bottom FABs */}
      <div className="flex-shrink-0 flex items-center justify-center gap-6 py-5 bg-card border-t border-border">
        <button
          className="flex flex-col items-center justify-center w-20 h-20 rounded-full bg-primary text-primary-foreground shadow-lg animate-mic-pulse transition-transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-ring"
          aria-label="Talk"
        >
          <Mic size={32} />
          <span className="text-xs mt-1 font-medium">Talk</span>
        </button>
        <button
          className="flex flex-col items-center justify-center w-20 h-20 rounded-full bg-secondary text-secondary-foreground shadow-lg transition-transform active:scale-95 hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-ring"
          aria-label="Scan Document"
        >
          <Camera size={32} />
          <span className="text-xs mt-1 font-medium">Scan</span>
        </button>
      </div>
    </div>
  );
};

export default Chat;
