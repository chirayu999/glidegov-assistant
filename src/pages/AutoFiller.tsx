import { Mic, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const AutoFiller = () => {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Top: Mock government website (blurred) */}
      <div className="relative flex-1 overflow-hidden bg-muted">
        <div className="absolute inset-0 blur-[2px] opacity-70 flex flex-col p-4 gap-2 text-xs text-muted-foreground font-mono select-none pointer-events-none">
          <div className="bg-primary/10 h-10 rounded flex items-center px-3 text-foreground font-bold text-sm">
            🇮🇳 National Scholarship Portal — Application Form
          </div>
          <div className="flex gap-2 mt-2">
            <div className="flex-1 space-y-2">
              <div className="bg-card border border-border rounded p-3 space-y-2">
                <div className="h-3 bg-muted-foreground/20 rounded w-24" />
                <div className="h-8 bg-background border border-border rounded" />
              </div>
              <div className="bg-card border border-border rounded p-3 space-y-2">
                <div className="h-3 bg-muted-foreground/20 rounded w-32" />
                <div className="h-8 bg-background border border-border rounded" />
              </div>
              <div className="bg-card border border-border rounded p-3 space-y-2 ring-2 ring-primary">
                <div className="h-3 bg-primary/30 rounded w-28" />
                <div className="h-8 bg-primary/5 border border-primary rounded flex items-center px-2 text-primary text-xs">
                  B.Tech ▸
                </div>
              </div>
              <div className="bg-card border border-border rounded p-3 space-y-2">
                <div className="h-3 bg-muted-foreground/20 rounded w-20" />
                <div className="h-8 bg-background border border-border rounded" />
              </div>
            </div>
            <div className="w-1/3 space-y-2">
              <div className="bg-card border border-border rounded p-3 h-20" />
              <div className="bg-card border border-border rounded p-3 h-16" />
            </div>
          </div>
        </div>
        {/* Overlay gradient */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Bottom Sheet */}
      <div className="relative bg-card border-t border-border rounded-t-3xl shadow-[0_-8px_30px_-10px_rgba(0,0,0,0.15)] px-6 py-6 space-y-5 flex-shrink-0" style={{ minHeight: "50%" }}>
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium text-muted-foreground">
            <span>Step 3 of 5</span>
            <span>60%</span>
          </div>
          <Progress value={60} className="h-2.5" />
        </div>

        {/* AI Message */}
        <div className="bg-muted rounded-2xl px-5 py-4">
          <p className="text-base leading-relaxed text-foreground">
            I am looking at the <span className="font-semibold text-primary">Education Details</span> section. Should I enter{" "}
            <span className="font-bold">B.Tech</span> as your current degree?
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <Button className="flex-1 min-h-[52px] text-base font-semibold gap-2">
            <Check size={20} />
            Yes, correct
          </Button>
          <Button variant="outline" className="flex-1 min-h-[52px] text-base font-semibold gap-2 border-primary/30 text-primary">
            <X size={20} />
            No, let me change it
          </Button>
        </div>

        {/* Mic */}
        <div className="flex justify-center pt-2">
          <button
            className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground shadow-lg animate-mic-pulse transition-transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-ring"
            aria-label="Answer by voice"
          >
            <Mic size={28} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutoFiller;
