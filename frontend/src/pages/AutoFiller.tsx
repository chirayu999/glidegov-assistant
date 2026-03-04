import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useSessionChannel, type SessionChannelEvent } from "@/hooks/useSessionChannel";
import { useDataVault } from "@/hooks/useDataVault";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const AutoFiller = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { load: loadVault, merge: mergeVault } = useDataVault();

  const sessionId = searchParams.get("session_id");
  const schemeId = searchParams.get("scheme_id");
  const startUrl = searchParams.get("start_url") || "https://scholarships.gov.in";

  const [sessionIdResolved, setSessionIdResolved] = useState<string | null>(sessionId);
  const [latestScreenshot, setLatestScreenshot] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [stepIndex, setStepIndex] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [state, setState] = useState<"idle" | "data_required" | "filling" | "otp" | "review">("idle");
  const [missingFields, setMissingFields] = useState<Array<{ key: string; label: string; type?: string; required?: boolean }>>([]);
  const [missingDataForm, setMissingDataForm] = useState<Record<string, string>>({});
  const [otpValue, setOtpValue] = useState("");
  const [jobStarted, setJobStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEvent = useCallback((event: SessionChannelEvent) => {
    switch (event.type) {
      case "screenshot":
        setLatestScreenshot(event.data.image);
        if (event.data.message) setMessage(event.data.message);
        break;
      case "form_progress":
        setStepIndex(event.data.step_index);
        setTotalSteps(event.data.total_steps);
        setMessage(event.data.message);
        setState(event.data.state === "pending_otp" ? "otp" : "filling");
        break;
      case "data_required":
        setMissingFields(event.data.missing_fields || []);
        setMessage(event.data.message || "We need a few more details.");
        setState("data_required");
        setMissingDataForm({});
        break;
      case "handoff":
        if (event.data.reason === "otp") {
          setState("otp");
          setMessage("OTP sent to your phone. Please enter it below.");
        } else if (event.data.reason === "review") {
          setState("review");
          setMessage("Form filling complete! Review your application.");
          navigate("/review");
        } else if (event.data.reason === "captcha") {
          setMessage("Captcha detected. Please complete it on the portal.");
        }
        break;
      case "error":
        setError(event.data.message);
        break;
    }
  }, [navigate]);

  useSessionChannel(sessionIdResolved, handleEvent);

  useEffect(() => {
    if (!sessionId && sessionIdResolved === null) {
      fetch(`${API_URL}/api/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: "en" }),
      })
        .then((r) => r.json())
        .then((data) => {
          setSessionIdResolved(data.session_id);
        })
        .catch(() => setError("Failed to create session"));
    } else if (sessionId) {
      setSessionIdResolved(sessionId);
    }
  }, [sessionId, sessionIdResolved]);

  const startFormFilling = async () => {
    if (!sessionIdResolved || !schemeId) return;
    const piiData = loadVault();
    try {
      const res = await fetch(`${API_URL}/api/form_navigation/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionIdResolved,
          scheme_id: schemeId,
          start_url: startUrl,
          pii_data: piiData,
        }),
      });
      if (res.ok) {
        setJobStarted(true);
        setState("filling");
      } else {
        setError("Failed to start form filling");
      }
    } catch {
      setError("Failed to start form filling");
    }
  };

  const submitMissingData = async () => {
    if (!sessionIdResolved) return;
    const data: Record<string, string> = {};
    missingFields.forEach((f) => {
      const val = missingDataForm[f.key];
      if (val) data[f.key] = val;
    });
    try {
      await fetch(`${API_URL}/api/form_navigation/submit_data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionIdResolved, data }),
      });
      if (Object.keys(data).length > 0) {
        mergeVault(data);
      }
      setState("filling");
      setMissingFields([]);
    } catch {
      setError("Failed to submit data");
    }
  };

  const submitOtp = async () => {
    if (!sessionIdResolved || !otpValue) return;
    try {
      await fetch(`${API_URL}/api/form_navigation/submit_otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionIdResolved, otp: otpValue }),
      });
      setOtpValue("");
      setState("filling");
    } catch {
      setError("Failed to submit OTP");
    }
  };

  const progressPercent = totalSteps > 0 ? Math.round((stepIndex / totalSteps) * 100) : 0;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Top: Live screenshot or placeholder */}
      <div className="relative flex-1 overflow-hidden bg-muted min-h-[200px]">
        {latestScreenshot ? (
          <img
            src={`data:image/jpeg;base64,${latestScreenshot}`}
            alt="Live form view"
            className="w-full h-full object-contain object-top"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-4">
            <p className="text-center">
              {state === "idle" && !jobStarted
                ? "Start form filling to see the live view"
                : "Connecting..."}
            </p>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Bottom Sheet */}
      <div className="relative bg-card border-t border-border rounded-t-3xl shadow-[0_-8px_30px_-10px_rgba(0,0,0,0.15)] px-6 py-6 space-y-5 flex-shrink-0">
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Progress */}
        {(state === "filling" || state === "otp") && totalSteps > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium text-muted-foreground">
              <span>Step {stepIndex} of {totalSteps}</span>
              <span>{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2.5" />
          </div>
        )}

        {/* State A: Collecting missing data */}
        {state === "data_required" && (
          <div className="space-y-4">
            <p className="text-base leading-relaxed text-foreground">{message}</p>
            <div className="space-y-3">
              {missingFields.map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <Label>{f.label}</Label>
                  <Input
                    value={missingDataForm[f.key] ?? ""}
                    onChange={(e) =>
                      setMissingDataForm((prev) => ({ ...prev, [f.key]: e.target.value }))
                    }
                    type={f.type || "text"}
                    placeholder={`Enter ${f.label.toLowerCase()}`}
                    className="min-h-[48px]"
                  />
                </div>
              ))}
            </div>
            <Button className="w-full min-h-[52px]" onClick={submitMissingData}>
              Continue Filling
            </Button>
          </div>
        )}

        {/* State B: Live filling - AI message */}
        {(state === "filling" || state === "idle") && state !== "data_required" && (
          <>
            {message && (
              <div className="bg-muted rounded-2xl px-5 py-4">
                <p className="text-base leading-relaxed text-foreground">{message}</p>
              </div>
            )}
            {!jobStarted && sessionIdResolved && schemeId && (
              <Button className="w-full min-h-[52px]" onClick={startFormFilling}>
                Start Form Filling
              </Button>
            )}
          </>
        )}

        {/* State C: OTP handoff */}
        {state === "otp" && (
          <div className="space-y-4">
            <p className="text-base leading-relaxed text-foreground">{message}</p>
            <div className="flex gap-3">
              <Input
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value)}
                placeholder="Enter OTP"
                className="min-h-[52px] text-center text-lg tracking-widest"
                maxLength={6}
              />
              <Button className="min-h-[52px] px-6" onClick={submitOtp}>
                Submit OTP
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutoFiller;
