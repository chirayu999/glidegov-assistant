import { Lock, Trash2, FileText, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useDataVault, type VaultData } from "@/hooks/useDataVault";
import { useState, useEffect } from "react";

const PROFILE_FIELD_KEYS: Array<{ key: keyof VaultData; label: string; type?: string }> = [
  { key: "full_name", label: "Full Name" },
  { key: "date_of_birth", label: "Date of Birth" },
  { key: "mobile", label: "Mobile Number", type: "tel" },
  { key: "email", label: "Email Address", type: "email" },
  { key: "state", label: "State" },
  { key: "category", label: "Category" },
  { key: "annual_income", label: "Annual Family Income" },
  { key: "address", label: "Full Address" },
  { key: "pincode", label: "Pincode" },
  { key: "education_level", label: "Education Level" },
  { key: "institution_name", label: "Institution Name" },
];

const documents = [
  { name: "Aadhaar Card", icon: CreditCard },
  { name: "Income Certificate", icon: FileText },
];

const DataVault = () => {
  const { load, save, clear } = useDataVault();
  const [data, setData] = useState<VaultData>({});

  useEffect(() => {
    setData(load());
  }, [load]);

  const handleChange = (key: string, value: string) => {
    const next = { ...data, [key]: value };
    setData(next);
    save(next);
  };

  const handleClear = () => {
    if (window.confirm("Delete all your stored data? This cannot be undone.")) {
      clear();
      setData({});
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Data Vault</h1>
        <div className="flex items-center gap-1.5 bg-success/10 text-success px-3 py-1.5 rounded-full text-xs font-semibold">
          <Lock size={14} />
          Encrypted & Stored Locally
        </div>
      </div>

      <div className="space-y-4 mb-8">
        {PROFILE_FIELD_KEYS.map((field, i) => (
          <div key={field.key} className="space-y-1.5 animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
            <Label className="text-sm font-medium text-muted-foreground">{field.label}</Label>
            <Input
              value={data[field.key] ?? ""}
              onChange={(e) => handleChange(field.key, e.target.value)}
              type={field.type || "text"}
              className="min-h-[48px] text-base"
              placeholder={`Enter ${field.label.toLowerCase()}`}
            />
          </div>
        ))}
      </div>

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

      <Button
        variant="ghost"
        onClick={handleClear}
        className="w-full min-h-[48px] text-destructive hover:text-destructive hover:bg-destructive/10 text-base font-bold gap-2"
      >
        <Trash2 size={20} />
        Delete All My Data
      </Button>
    </div>
  );
};

export default DataVault;
