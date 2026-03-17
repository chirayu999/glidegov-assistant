import { Lock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const STATE_OPTIONS = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const CATEGORY_OPTIONS = ["SC", "ST", "OBC", "General", "EWS"];

const EDUCATION_OPTIONS = [
  "10th Pass",
  "12th Pass",
  "Diploma",
  "Undergraduate",
  "Postgraduate",
  "Doctorate",
];

type FieldKey = keyof VaultData;

type FieldConfig = {
  key: FieldKey;
  label: string;
  type?: string;
};

type FieldErrorState = Record<string, string | undefined>;

interface DateOfBirthPickerProps {
  value?: string;
  onChange: (value: string) => void;
  onErrorChange?: (message: string | undefined) => void;
}

function parseDateValue(val: string | undefined) {
  const [y, m, d] = (val ?? "").split("-").map((v) => (v ? Number(v) : undefined));
  return {
    year: y != null && Number.isFinite(y) ? y : undefined,
    month: m != null && Number.isFinite(m) ? m : undefined,
    day: d != null && Number.isFinite(d) ? d : undefined,
  };
}

const DateOfBirthPicker = ({ value, onChange, onErrorChange }: DateOfBirthPickerProps) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= 1920; y -= 1) {
    years.push(y);
  }

  const parsed = parseDateValue(value);
  const [localYear, setLocalYear] = useState<number | undefined>(parsed.year);
  const [localMonth, setLocalMonth] = useState<number | undefined>(parsed.month);
  const [localDay, setLocalDay] = useState<number | undefined>(parsed.day);

  useEffect(() => {
    const { year: y, month: m, day: d } = parseDateValue(value);
    setLocalYear(y);
    setLocalMonth(m);
    setLocalDay(d);
  }, [value]);

  const getDaysInMonth = (y: number, m: number) => {
    return new Date(y, m, 0).getDate();
  };

  const maxDay =
    localYear != null && localMonth != null ? getDaysInMonth(localYear, localMonth) : 31;

  const tryCommit = (y: number | undefined, m: number | undefined, d: number | undefined) => {
    if (y != null && m != null && d != null) {
      const safeDay = Math.min(d, getDaysInMonth(y, m));
      const next = `${y.toString().padStart(4, "0")}-${m.toString().padStart(2, "0")}-${safeDay
        .toString()
        .padStart(2, "0")}`;
      onChange(next);
      onErrorChange?.(undefined);
    } else {
      onErrorChange?.("Please select day, month, and year.");
    }
  };

  const handleYearChange = (newYear: string) => {
    const y = Number(newYear);
    setLocalYear(y);
    tryCommit(y, localMonth, localDay);
  };

  const handleMonthChange = (newMonth: string) => {
    const m = Number(newMonth);
    setLocalMonth(m);
    tryCommit(localYear, m, localDay);
  };

  const handleDayChange = (newDay: string) => {
    const d = Number(newDay);
    setLocalDay(d);
    tryCommit(localYear, localMonth, d);
  };

  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  return (
    <div className="grid grid-cols-3 gap-2">
      <Select
        value={localDay != null ? localDay.toString() : ""}
        onValueChange={handleDayChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Day" />
        </SelectTrigger>
        <SelectContent>
          {days.map((d) => (
            <SelectItem key={d} value={d.toString()}>
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={localMonth != null ? localMonth.toString() : ""}
        onValueChange={handleMonthChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          {[
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ].map((name, index) => {
            const valueIndex = index + 1;
            return (
              <SelectItem key={name} value={valueIndex.toString()}>
                {name}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      <Select
        value={localYear != null ? localYear.toString() : ""}
        onValueChange={handleYearChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={y.toString()}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

const DataVault = () => {
  const { load, save, clear } = useDataVault();
  const [data, setData] = useState<VaultData>({});
   const [errors, setErrors] = useState<FieldErrorState>({});

  useEffect(() => {
    setData(load());
  }, [load]);

  const validateField = (key: FieldKey, value: string): string | undefined => {
    const trimmed = value.trim();

    switch (key) {
      case "full_name":
        if (!trimmed) return "Please enter your full name.";
        if (trimmed.length < 2) return "Full name must be at least 2 characters.";
        return undefined;
      case "date_of_birth":
        if (!trimmed) return "Please select your full date of birth.";
        return undefined;
      case "mobile":
        if (!trimmed) return "Please enter your mobile number.";
        if (!/^\d+$/.test(trimmed)) return "Mobile number should contain only digits.";
        if (trimmed.length !== 10) return "Mobile number should be 10 digits.";
        return undefined;
      case "email":
        if (!trimmed) return "Please enter your email address.";
        // simple email pattern
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "Please enter a valid email address.";
        return undefined;
      case "state":
        if (!trimmed) return "Please select your state.";
        return undefined;
      case "category":
        if (!trimmed) return "Please select your category.";
        return undefined;
      case "annual_income":
        if (!trimmed) return "Please enter your annual family income.";
        if (!/^\d+$/.test(trimmed)) return "Income should contain only digits.";
        return undefined;
      case "address":
        if (!trimmed) return "Please enter your address.";
        if (trimmed.length < 5) return "Address looks too short.";
        return undefined;
      case "pincode":
        if (!trimmed) return "Please enter your pincode.";
        if (!/^\d+$/.test(trimmed)) return "Pincode should contain only digits.";
        if (trimmed.length !== 6) return "Pincode should be 6 digits.";
        return undefined;
      case "education_level":
        if (!trimmed) return "Please select your education level.";
        return undefined;
      default:
        return undefined;
    }
  };

  const handleChange = (key: FieldKey, value: string) => {
    const next = { ...data, [key]: value };
    setData(next);
    save(next);
    setErrors((prev) => ({
      ...prev,
      [key]: validateField(key, value),
    }));
  };

  const handleBlur = (key: FieldKey) => {
    const currentValue = data[key] ?? "";
    setErrors((prev) => ({
      ...prev,
      [key]: validateField(key, currentValue),
    }));
  };

  const handleClear = () => {
    if (window.confirm("Delete all your stored data? This cannot be undone.")) {
      clear();
      setData({});
      setErrors({});
    }
  };

  const renderField = (field: FieldConfig) => {
    const value = data[field.key] ?? "";

    if (field.key === "date_of_birth") {
      return (
        <DateOfBirthPicker
          value={value}
          onChange={(next) => handleChange(field.key, next)}
          onErrorChange={(message) =>
            setErrors((prev) => ({
              ...prev,
              [field.key]: message,
            }))
          }
        />
      );
    }

    if (field.key === "state") {
      return (
        <Select
          value={value}
          onValueChange={(val) => handleChange(field.key, val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select state" />
          </SelectTrigger>
          <SelectContent>
            {STATE_OPTIONS.map((state) => (
              <SelectItem key={state} value={state}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (field.key === "category") {
      return (
        <Select
          value={value}
          onValueChange={(val) => handleChange(field.key, val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (field.key === "education_level") {
      return (
        <Select
          value={value}
          onValueChange={(val) => handleChange(field.key, val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select education level" />
          </SelectTrigger>
          <SelectContent>
            {EDUCATION_OPTIONS.map((level) => (
              <SelectItem key={level} value={level}>
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (field.key === "annual_income" || field.key === "mobile" || field.key === "pincode") {
      return (
        <Input
          value={value}
          onChange={(e) => {
            const numeric = e.target.value.replace(/\D/g, "");
            handleChange(field.key, numeric);
          }}
          onBlur={() => handleBlur(field.key)}
          inputMode="numeric"
          pattern="[0-9]*"
          className="min-h-[48px] text-base"
          placeholder={`Enter ${field.label.toLowerCase()}`}
        />
      );
    }

    if (field.key === "address") {
      return (
        <Textarea
          value={value}
          onChange={(e) => handleChange(field.key, e.target.value)}
          onBlur={() => handleBlur(field.key)}
          className="min-h-[72px] text-base"
          placeholder={`Enter ${field.label.toLowerCase()}`}
        />
      );
    }

    return (
      <Input
        value={value}
        onChange={(e) => handleChange(field.key, e.target.value)}
        onBlur={() => handleBlur(field.key)}
        type={field.type || "text"}
        className="min-h-[48px] text-base"
        placeholder={`Enter ${field.label.toLowerCase()}`}
      />
    );
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
          <div
            key={field.key}
            className="space-y-1.5 animate-fade-in"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <Label className="text-sm font-medium text-muted-foreground">{field.label}</Label>
            {renderField(field)}
            {errors[field.key] && (
              <p className="text-xs text-destructive mt-1">{errors[field.key]}</p>
            )}
          </div>
        ))}
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
