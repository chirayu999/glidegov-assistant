import { Lock, Trash2, FileText, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

const profileFields = [
  { label: "Full Name", value: "Priya Sharma" },
  { label: "Date of Birth", value: "15/03/2005" },
  { label: "State", value: "Maharashtra" },
  { label: "Category", value: "OBC" },
  { label: "Annual Family Income", value: "₹2,00,000" },
];

const documents = [
  { name: "Aadhaar Card", icon: CreditCard },
  { name: "Income Certificate", icon: FileText },
];

const DataVault = () => {
  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header with trust badge */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Data Vault</h1>
        <div className="flex items-center gap-1.5 bg-success/10 text-success px-3 py-1.5 rounded-full text-xs font-semibold">
          <Lock size={14} />
          Encrypted & Stored Locally
        </div>
      </div>

      {/* Profile Fields */}
      <div className="space-y-4 mb-8">
        {profileFields.map((field, i) => (
          <div key={i} className="space-y-1.5 animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
            <Label className="text-sm font-medium text-muted-foreground">{field.label}</Label>
            <Input
              defaultValue={field.value}
              className="min-h-[48px] text-base"
            />
          </div>
        ))}
      </div>

      {/* Scanned Documents */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-3">Scanned Documents</h2>
        <div className="grid grid-cols-2 gap-3">
          {documents.map((doc, i) => {
            const Icon = doc.icon;
            return (
              <Card key={i} className="shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex flex-col items-center justify-center py-6 gap-3">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon size={28} className="text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground text-center">{doc.name}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Delete All Data */}
      <Button
        variant="ghost"
        className="w-full min-h-[48px] text-destructive hover:text-destructive hover:bg-destructive/10 text-base font-bold gap-2"
      >
        <Trash2 size={20} />
        Delete All My Data
      </Button>
    </div>
  );
};

export default DataVault;
