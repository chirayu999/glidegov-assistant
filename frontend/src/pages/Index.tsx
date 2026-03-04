import { useEffect } from "react";
import { Mic } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSession } from "@/contexts/SessionContext";

const chips = [
  "Check Scholarship Eligibility",
  "Apply for Pension",
  "Farmer Subsidies",
];

const Index = () => {
  const navigate = useNavigate();
  const { ensureSession } = useSession();
  useEffect(() => {
    ensureSession();
  }, [ensureSession]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-6 pt-4 pb-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-center text-foreground leading-tight max-w-md mb-10">
        Tap to speak.{" "}
        <span className="text-primary">What government scheme do you need help with today?</span>
      </h1>

      {/* Mic Button */}
      <button
        onClick={() => navigate("/chat")}
        className="relative flex items-center justify-center w-36 h-36 rounded-full bg-primary text-primary-foreground shadow-lg animate-mic-pulse transition-transform active:scale-95 hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-ring"
        aria-label="Start voice conversation"
      >
        <Mic size={56} strokeWidth={2.2} />
      </button>

      {/* Suggestion Chips */}
      <div className="flex flex-wrap justify-center gap-3 mt-10 max-w-sm">
        {chips.map((chip) => (
          <Button
            key={chip}
            variant="outline"
            className="rounded-full px-5 py-3 text-base font-medium min-h-[48px] border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={() => navigate("/chat")}
          >
            {chip}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default Index;
