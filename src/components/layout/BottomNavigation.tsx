import { useLocation, useNavigate } from "react-router-dom";
import { LayoutGrid, Users, FlaskConical, Globe, Compass, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProblemClarificationStatus } from "@/hooks/useProblemClarificationStatus";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProgressiveUnlock } from "@/hooks/useProgressiveUnlock";
import { toast } from "sonner";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  unlockKey: string;
  matchPaths?: string[];
}

const navItems: NavItem[] = [
  { icon: LayoutGrid, label: "Home", path: "/dashboard", unlockKey: "home", matchPaths: ["/dashboard"] },
  { icon: Compass, label: "Atlas", path: "/atlas", unlockKey: "atlas", matchPaths: ["/atlas"] },
  { icon: Users, label: "Chats", path: "/council", unlockKey: "chat", matchPaths: ["/council", "/council-meeting", "/chat", "/console-thread"] },
  { icon: FlaskConical, label: "Projects", path: "/creation-lab", unlockKey: "projects", matchPaths: ["/creation-lab", "/future-self"] },
  { icon: Globe, label: "Creators", path: "/creators", unlockKey: "creators", matchPaths: ["/creators"] },
];

export const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { needsClarification, badgeCount, isInClarificationSession } = useProblemClarificationStatus();
  const [councilBadge, setCouncilBadge] = useState(false);
  const [creatorRequestCount, setCreatorRequestCount] = useState(0);
  const [showAtlasBadge, setShowAtlasBadge] = useState(false);
  const [onboardingHighlight, setOnboardingHighlight] = useState<string | null>(null);
  const { isLocked, getLockMessage, refreshUnlocks } = useProgressiveUnlock();

  useEffect(() => { refreshUnlocks(); }, [location.pathname, refreshUnlocks]);

  useEffect(() => {
    const stepToKey = ["atlas", "chat", "projects", "creators"];
    const handler = (e: Event) => {
      const step = (e as CustomEvent).detail?.step;
      setOnboardingHighlight(step >= 0 && step < stepToKey.length ? stepToKey[step] : null);
    };
    window.addEventListener('atlas-onboarding-step', handler);
    return () => window.removeEventListener('atlas-onboarding-step', handler);
  }, []);

  useEffect(() => {
    const checkBadges = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_quest_completed, console_intake_completed, atlas_onboarding_completed" as any)
        .eq("id", user.id)
        .single();
      const p = data as any;
      setCouncilBadge(!!p?.onboarding_quest_completed && !p?.console_intake_completed);
      setShowAtlasBadge(!p?.atlas_onboarding_completed);

      const { count } = await supabase
        .from("creator_chat_requests")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("status", "pending");
      setCreatorRequestCount(count || 0);
    };
    checkBadges();
  }, [location.pathname]);

  const isActive = (item: NavItem) => {
    const currentPath = location.pathname;
    if (currentPath === item.path) return true;
    if (item.matchPaths) return item.matchPaths.some(path => currentPath.startsWith(path));
    return false;
  };

  const handleNavClick = (item: NavItem) => {
    if (isLocked(item.unlockKey)) {
      toast(getLockMessage(item.unlockKey), { duration: 3000 });
      return;
    }
    navigate(item.path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-t border-border/40 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
        {navItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          const locked = isLocked(item.unlockKey);
          const showCreationBadge = item.path === "/creation-lab" && needsClarification && badgeCount > 0 && !isInClarificationSession && !locked;
          const showCouncilBadge = item.path === "/council" && (councilBadge || creatorRequestCount > 0) && !locked;
          const showAtlasDot = item.path === "/atlas" && showAtlasBadge;
          const showBadge = showCreationBadge || showCouncilBadge || showAtlasDot;

          const isOnboardingHighlighted = onboardingHighlight === item.unlockKey;

          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200",
                locked && !isOnboardingHighlighted
                  ? "text-muted-foreground/30"
                  : active
                    ? "text-primary"
                    : isOnboardingHighlighted
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                {locked && !isOnboardingHighlighted ? (
                  <div className="relative">
                    <Icon className="w-5 h-5 opacity-30" />
                    <Lock className="w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 text-muted-foreground/50" />
                  </div>
                ) : isOnboardingHighlighted ? (
                  <div className={cn("p-1.5 rounded-xl transition-all duration-300 bg-primary/15 shadow-[0_0_20px_hsl(265_90%_62%/0.3)]")}>
                    <Icon className="w-5 h-5 text-primary drop-shadow-[0_0_8px_hsl(265_90%_62%/0.5)]" />
                  </div>
                ) : (
                  <>
                    <div className={cn(
                      "p-1.5 rounded-xl transition-all duration-200",
                      active && "bg-primary/10 shadow-[0_0_15px_hsl(265_90%_62%/0.2)]"
                    )}>
                      <Icon className={cn("w-5 h-5", active && "text-primary drop-shadow-[0_0_8px_hsl(265_90%_62%/0.5)]")} />
                    </div>
                    {showBadge && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center animate-pulse shadow-[0_0_8px_hsl(0_72%_55%/0.4)]">
                        {showAtlasDot ? "!" : showCouncilBadge ? (creatorRequestCount > 0 ? creatorRequestCount : "!") : badgeCount}
                      </span>
                    )}
                  </>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-all duration-200",
                locked && !isOnboardingHighlighted
                  ? "text-muted-foreground/30"
                  : isOnboardingHighlighted
                    ? "text-primary font-semibold"
                    : active && "text-primary font-semibold"
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
