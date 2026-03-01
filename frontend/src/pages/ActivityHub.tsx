import { Play, Download, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const inProgressItems = [
  {
    name: "Post-Matric Scholarship",
    progress: 60,
    lastEdited: "2 days ago",
  },
  {
    name: "AICTE Pragati Scheme",
    progress: 30,
    lastEdited: "5 days ago",
  },
];

const completedItems = [
  { name: "PM Kisan Samman Nidhi", submittedOn: "12 Feb 2026", receiptId: "PMK-20260212" },
  { name: "Farmer Crop Insurance", submittedOn: "28 Jan 2026", receiptId: "FCI-20260128" },
];

const ActivityHub = () => {
  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-foreground mb-5">Activity Hub</h1>

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
            <Card key={i} className="shadow-md animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{item.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{item.progress}% Complete</span>
                  </div>
                  <Progress value={item.progress} className="h-2" />
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock size={14} />
                  Last edited {item.lastEdited}
                </div>
                <Button className="w-full min-h-[48px] text-base font-semibold gap-2">
                  <Play size={18} />
                  Resume Application
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedItems.map((item, i) => (
            <Card key={i} className="shadow-md animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-success" />
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Submitted on {item.submittedOn} · Ref: {item.receiptId}
                </p>
                <Button variant="outline" className="w-full min-h-[48px] text-base font-semibold gap-2 border-primary/30 text-primary">
                  <Download size={18} />
                  Download Receipt PDF
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ActivityHub;
