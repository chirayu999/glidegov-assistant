import { CheckCircle2, ChevronDown, ShieldCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const filledData = [
  { label: "Full Name", value: "Priya Sharma" },
  { label: "Date of Birth", value: "15 March 2005" },
  { label: "State", value: "Maharashtra" },
  { label: "Category", value: "OBC" },
  { label: "Annual Family Income", value: "₹2,00,000" },
  { label: "Current Education", value: "B.Tech – Computer Science" },
  { label: "Scheme Selected", value: "Post-Matric Scholarship" },
  { label: "Institution", value: "VJTI Mumbai" },
];

const FinalReview = () => {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        {/* Success Illustration */}
        <div className="flex flex-col items-center mb-6 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-4">
            <CheckCircle2 size={48} className="text-success" />
          </div>
          <h1 className="text-2xl font-bold text-foreground text-center">Application Ready!</h1>
          <p className="text-muted-foreground text-center mt-1">Review the details GovGlide filled for you.</p>
        </div>

        {/* Data Summary */}
        <Accordion type="single" collapsible defaultValue="details" className="w-full">
          <AccordionItem value="details" className="border rounded-xl overflow-hidden shadow-sm">
            <AccordionTrigger className="px-5 py-4 text-base font-semibold hover:no-underline">
              Filled Application Data
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-4">
              <div className="space-y-3">
                {filledData.map((item, i) => (
                  <div key={i} className="flex justify-between items-start py-2 border-b border-border last:border-0">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-medium text-foreground text-right max-w-[60%]">{item.value}</span>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Trust badge */}
        <div className="flex items-center gap-2 mt-4 px-4 py-3 bg-success/5 border border-success/20 rounded-xl">
          <ShieldCheck size={20} className="text-success flex-shrink-0" />
          <p className="text-sm text-success font-medium">
            All data verified and ready for submission.
          </p>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="sticky bottom-0 bg-card border-t border-border px-4 py-4 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)]">
        <div className="max-w-lg mx-auto space-y-3">
          {/* Warning Banner */}
          <div className="bg-warning/10 border border-warning/30 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
              <span className="text-warning font-bold text-sm">1/1</span>
            </div>
            <p className="text-sm font-semibold text-foreground">
              Step remaining: <span className="text-warning">Final Verification</span>
            </p>
          </div>

          {/* CTA Button */}
          <Button className="w-full min-h-[56px] text-lg font-bold gap-2 shadow-lg">
            <ExternalLink size={22} />
            Take me to the portal to enter OTP & Submit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FinalReview;
