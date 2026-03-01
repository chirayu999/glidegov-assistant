import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Home, MessageSquare, LayoutDashboard, User, Globe, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";

const navLinks = [
  { to: "/", label: "Home", icon: Home },
  { to: "/chat", label: "My Conversations", icon: MessageSquare },
  { to: "/dashboard", label: "Eligibility Dashboard", icon: LayoutDashboard },
  { to: "/activity", label: "Activity Hub", icon: Clock },
  { to: "/vault", label: "My Data Vault", icon: Shield },
];

const NavBar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { language, setLanguage } = useLanguage();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-16 px-4 bg-card border-b border-border shadow-sm">
      {/* Left: Hamburger */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="min-w-[48px] min-h-[48px]">
            <Menu size={28} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72">
          <SheetHeader>
            <SheetTitle className="text-xl font-bold text-primary">GovGlide</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-2 mt-6">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-lg font-medium transition-colors min-h-[48px] ${
                  location.pathname === to
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent text-foreground"
                }`}
              >
                <Icon size={22} />
                {label}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Center: Logo */}
      <Link to="/" className="text-xl font-extrabold tracking-tight text-primary">
        GovGlide
      </Link>

      {/* Right: Language + Profile */}
      <div className="flex items-center gap-2">
        <Select value={language} onValueChange={(v) => setLanguage(v as any)}>
          <SelectTrigger className="w-auto min-h-[48px] min-w-[48px] gap-1 border-none shadow-none bg-transparent text-foreground">
            <Globe size={20} />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="English">EN</SelectItem>
            <SelectItem value="Hindi">हि</SelectItem>
            <SelectItem value="Marathi">म</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" className="min-w-[48px] min-h-[48px]" asChild>
          <Link to="/vault">
            <User size={24} />
          </Link>
        </Button>
      </div>
    </nav>
  );
};

export default NavBar;
