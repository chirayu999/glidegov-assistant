import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/contexts/SessionContext";
import { getSessionSchemes, type SessionScheme } from "@/lib/api";

const statusConfig = {
  eligible: {
    icon: CheckCircle2,
    label: "Eligible",
    borderClass: "border-l-4 border-l-success",
    badgeClass: "bg-success/10 text-success",
    iconClass: "text-success",
  },
  action: {
    icon: AlertTriangle,
    label: "Action Needed",
    borderClass: "border-l-4 border-l-warning",
    badgeClass: "bg-warning/10 text-warning",
    iconClass: "text-warning",
  },
  ineligible: {
    icon: XCircle,
    label: "Not Eligible",
    borderClass: "border-l-4 border-l-destructive",
    badgeClass: "bg-destructive/10 text-destructive",
    iconClass: "text-destructive",
  },
  checking: {
    icon: Loader2,
    label: "Checking…",
    borderClass: "border-l-4 border-l-muted",
    badgeClass: "bg-muted text-muted-foreground",
    iconClass: "text-muted-foreground",
  },
};

type CardStatus = "eligible" | "action" | "ineligible" | "checking";

function schemeToCard(s: SessionScheme): {
  status: CardStatus;
  id: number;
  name: string;
  summary: string;
  action?: string;
  startUrl?: string;
  missing?: string;
  reason?: string;
} {
  const el = s.eligibility;
  if (!el) {
    return {
      status: "checking",
      id: s.id,
      name: s.name,
      summary: s.summary || "",
    };
  }
  const status: CardStatus =
    el.status === "eligible" ? "eligible" : el.status === "action_required" ? "action" : "ineligible";
  const missing =
    el.missing_info && el.missing_info.length > 0 ? el.missing_info.join(", ") : undefined;
  return {
    status,
    id: s.id,
    name: s.name,
    summary: s.summary || "",
    action: status === "eligible" ? "Apply using GovGlide" : undefined,
    startUrl: s.source_url || undefined,
    missing,
    reason: el.reason || undefined,
  };
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { sessionId } = useSession();
  const { data, isLoading, error } = useQuery({
    queryKey: ["sessionSchemes", sessionId ?? ""],
    queryFn: () => getSessionSchemes(sessionId!),
    enabled: !!sessionId,
  });

  const handleApply = (schemeId: number, startUrl: string) => {
    navigate(`/autofill?scheme_id=${schemeId}&start_url=${encodeURIComponent(startUrl)}`);
  };

  const schemes = (data?.schemes ?? []).map(schemeToCard);

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">Your Scheme Matches</h1>

      {error && (
        <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-3 text-sm mb-4">
          {error instanceof Error ? error.message : "Failed to load schemes"}
        </div>
      )}

      {isLoading && !data && (
        <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
          <Loader2 size={24} className="animate-spin" />
          <span>Loading…</span>
        </div>
      )}

      {!sessionId && !isLoading && (
        <p className="text-muted-foreground text-center py-8">
          Start a conversation to discover schemes that match you.
        </p>
      )}

      {sessionId && !isLoading && schemes.length === 0 && !error && (
        <p className="text-muted-foreground text-center py-8">
          No schemes yet. Start a conversation to discover schemes that match you.
        </p>
      )}

      <div className="flex flex-col gap-5">
        {schemes.map((scheme, i) => {
          const config = statusConfig[scheme.status];
          const Icon = config.icon;

          return (
            <Card
              key={scheme.id}
              className={`${config.borderClass} shadow-md animate-fade-in`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <Icon
                    size={24}
                    className={`${config.iconClass} ${scheme.status === "checking" ? "animate-spin" : ""}`}
                  />
                  <div className="flex-1">
                    <span
                      className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1 ${config.badgeClass}`}
                    >
                      {config.label}
                    </span>
                    <CardTitle className="text-lg">{scheme.name}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-base text-muted-foreground leading-relaxed mb-3">
                  {scheme.summary}
                </p>

                {scheme.status === "eligible" && (
                  <Button
                    className="w-full min-h-[48px] text-base font-semibold"
                    onClick={() =>
                      handleApply(scheme.id, scheme.startUrl || "https://scholarships.gov.in")
                    }
                  >
                    {scheme.action}
                  </Button>
                )}

                {scheme.status === "action" && scheme.missing && (
                  <p className="text-destructive font-semibold text-base">
                    Missing: {scheme.missing}
                  </p>
                )}

                {scheme.status === "ineligible" && scheme.reason && (
                  <p className="text-muted-foreground text-base italic">{scheme.reason}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
