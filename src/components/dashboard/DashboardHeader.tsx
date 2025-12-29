import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bell, Settings, User } from "lucide-react";

interface DashboardHeaderProps {
  displayName?: string;
}

const DashboardHeader = ({ displayName }: DashboardHeaderProps) => {
  const navigate = useNavigate();
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Good Morning", emoji: "☀️" };
    if (hour < 17) return { text: "Good Afternoon", emoji: "🌤️" };
    return { text: "Good Evening", emoji: "🌙" };
  };

  const greeting = getGreeting();
  const name = displayName || "Explorer";

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-bold">
          {greeting.text}, {name} {greeting.emoji}
        </h1>
        <p className="text-muted-foreground text-lg">
          Now, transform hesitation into action.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate("/profile")}>
          <Settings className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full bg-muted" onClick={() => navigate("/profile")}>
          <User className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;
