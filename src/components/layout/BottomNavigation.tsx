import { useLocation, useNavigate } from "react-router-dom";
import { LayoutGrid, Users, FlaskConical, User, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProblemClarificationStatus } from "@/hooks/useProblemClarificationStatus";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  matchPaths?: string[];
}

const navItems: NavItem[] = [
  {
    icon: LayoutGrid,
    label: "Home",
    path: "/dashboard",
    matchPaths: ["/dashboard"],
  },
  {
    icon: Globe,
    label: "Creators",
    path: "/creators",
    matchPaths: ["/creators"],
  },
  {
    icon: Users,
    label: "Council",
    path: "/council",
    matchPaths: ["/council", "/council-meeting", "/chat", "/console-thread"],
  },
  {
    icon: FlaskConical,
    label: "Creation Lab",
    path: "/creation-lab",
    matchPaths: ["/creation-lab", "/future-self"],
  },
  {
    icon: User,
    label: "Profile",
    path: "/profile",
    matchPaths: ["/profile"],
  },
];

export const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { needsClarification, badgeCount, isInClarificationSession } = useProblemClarificationStatus();
  const [councilBadge, setCouncilBadge] = useState(false);

  useEffect(() => {
    const checkCouncilBadge = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_quest_completed, console_intake_completed" as any)
        .eq("id", user.id)
        .single();
      const p = data as any;
      setCouncilBadge(!!p?.onboarding_quest_completed && !p?.console_intake_completed);
    };
    checkCouncilBadge();
  }, [location.pathname]);

  const isActive = (item: NavItem) => {
    const currentPath = location.pathname;
    
    // Check exact match first
    if (currentPath === item.path) return true;
    
    // Check if current path starts with any of the match paths
    if (item.matchPaths) {
      return item.matchPaths.some(path => currentPath.startsWith(path));
    }
    
    return false;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-1">
        {navItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          // Hide badge when user is in the clarification session
          const showCreationBadge = item.path === "/creation-lab" && needsClarification && badgeCount > 0 && !isInClarificationSession;
          const showCouncilBadge = item.path === "/council" && councilBadge;
          const showBadge = showCreationBadge || showCouncilBadge;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                active 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("w-6 h-6", active && "text-primary")} />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {showCouncilBadge ? "!" : badgeCount}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-xs font-medium",
                active && "text-primary"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
