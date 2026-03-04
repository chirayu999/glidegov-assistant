import { useNavigate } from "react-router-dom";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const schemes = [
  {
    status: "eligible" as const,
    id: 1,
    name: "Post-Matric Scholarship",
    summary: "Full tuition fee waiver and monthly stipend for students from economically weaker sections pursuing post-matriculation education.",
    action: "Apply using GovGlide",
    startUrl: "https://scholarships.gov.in",
  },
  {
    status: "action" as const,
    id: 2,
    name: "AICTE Pragati Scheme",
    summary: "Financial assistance up to ₹50,000 per year for girl students in AICTE-approved institutions.",
    missing: "Family Income Certificate",
  },
  {
    status: "ineligible" as const,
    id: 3,
    name: "National Merit Scholarship",
    summary: "Scholarship for students scoring above 80% in board examinations.",
    reason: "Requires 80% marks in Class 12 board exams.",
  },
];

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
};

const Dashboard = () => {
  const navigate = useNavigate();

  const handleApply = (schemeId: number, startUrl: string) => {
    navigate(`/autofill?scheme_id=${schemeId}&start_url=${encodeURIComponent(startUrl)}`);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">Your Scheme Matches</h1>

      <div className="flex flex-col gap-5">
        {schemes.map((scheme, i) => {
          const config = statusConfig[scheme.status];
          const Icon = config.icon;

          return (
            <Card
              key={i}
              className={`${config.borderClass} shadow-md animate-fade-in`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <Icon size={24} className={config.iconClass} />
                  <div className="flex-1">
                    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1 ${config.badgeClass}`}>
                      {config.label}
                    </span>
                    <CardTitle className="text-lg">{scheme.name}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-base text-muted-foreground leading-relaxed mb-3">{scheme.summary}</p>

                {scheme.status === "eligible" && (
                  <Button
                    className="w-full min-h-[48px] text-base font-semibold"
                    onClick={() => handleApply(scheme.id, (scheme as { startUrl?: string }).startUrl || "https://scholarships.gov.in")}
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
