import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Play, Download, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/contexts/SessionContext";
import { getFormStatus, type FormProgressItem } from "@/lib/api";

const DEFAULT_START_URL = "https://scholarships.gov.in";

function formatRelativeTime(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

function formatSubmittedDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const ActivityHub = () => {
  const navigate = useNavigate();
  const { sessionId } = useSession();
  const { data, isLoading, error } = useQuery({
    queryKey: ["formStatus", sessionId ?? ""],
    queryFn: () => getFormStatus(sessionId!),
    enabled: !!sessionId,
  });

  const progresses = data?.form_progresses ?? [];
  const inProgressItems = progresses.filter(
    (p: FormProgressItem) => p.state === "draft" || p.state === "pending_otp"
  );
  const completedItems = progresses.filter((p: FormProgressItem) => p.state === "handoff");

  const handleResume = (schemeId: number) => {
    if (!sessionId) return;
    navigate(
      `/autofill?session_id=${encodeURIComponent(sessionId)}&scheme_id=${schemeId}&start_url=${encodeURIComponent(DEFAULT_START_URL)}`
    );
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-foreground mb-5">Activity Hub</h1>

      {error && (
        <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-3 text-sm mb-4">
          {error instanceof Error ? error.message : "Failed to load activity"}
        </div>
      )}

      {!sessionId && !isLoading && (
        <p className="text-muted-foreground text-center py-8">
          Start a session to see your applications.
        </p>
      )}

      {sessionId && isLoading && !data && (
        <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
          <Loader2 size={24} className="animate-spin" />
          <span>Loading…</span>
        </div>
      )}

      {sessionId && !isLoading && progresses.length === 0 && !error && (
        <p className="text-muted-foreground text-center py-8">
          No applications yet. Apply from the Dashboard to see them here.
        </p>
      )}

      {sessionId && (progresses.length > 0 || (isLoading && data)) && (
        <Tabs defaultValue="in-progress" className="w-full">
          <TabsList className="w-full min-h-[48px] mb-5">
            <TabsTrigger value="in-progress" className="flex-1 min-h-[44px] text-base font-semibold">
              In Progress
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex-1 min-h-[44px] text-base font-semibold">
              Completed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="in-progress" className="space-y-4">
            {inProgressItems.map((item, i) => (
              <Card
                key={`${item.scheme_id}-${i}`}
                className="shadow-md animate-fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{item.scheme_name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{item.progress_percentage}% Complete</span>
                    </div>
                    <Progress value={item.progress_percentage} className="h-2" />
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock size={14} />
                    Last edited {formatRelativeTime(item.last_activity_at)}
                  </div>
                  <Button
                    className="w-full min-h-[48px] text-base font-semibold gap-2"
                    onClick={() => handleResume(item.scheme_id)}
                  >
                    <Play size={18} />
                    Resume Application
                  </Button>
                </CardContent>
              </Card>
            ))}
            {inProgressItems.length === 0 && !isLoading && (
              <p className="text-muted-foreground text-center py-6">No applications in progress.</p>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedItems.map((item, i) => (
              <Card
                key={`${item.scheme_id}-${i}`}
                className="shadow-md animate-fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={20} className="text-success" />
                    <CardTitle className="text-lg">{item.scheme_name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Submitted {formatSubmittedDate(item.last_activity_at)} · Ref: {item.scheme_id}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full min-h-[48px] text-base font-semibold gap-2 border-primary/30 text-primary"
                  >
                    <Download size={18} />
                    Download Receipt PDF
                  </Button>
                </CardContent>
              </Card>
            ))}
            {completedItems.length === 0 && !isLoading && (
              <p className="text-muted-foreground text-center py-6">No completed applications.</p>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ActivityHub;
