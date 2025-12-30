import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FlaskConical, Bell, ChevronRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface GuidanceCreationSectionProps {
  isFirstTimeUser: boolean;
  councilNotificationCount: number;
  onCouncilClick: () => void;
  isCouncilLocked?: boolean;
  isCreationLabLocked?: boolean;
}

const GuidanceCreationSection = ({ 
  isFirstTimeUser, 
  councilNotificationCount,
  onCouncilClick,
  isCouncilLocked = false,
  isCreationLabLocked = false,
}: GuidanceCreationSectionProps) => {
  const navigate = useNavigate();

  const handleCouncilClick = () => {
    if (isCouncilLocked) {
      toast.info("Complete the Self-Discovery Quest to unlock", { duration: 3000 });
      navigate("/future-self/quests");
      return;
    }
    onCouncilClick();
  };

  const handleCreationLabClick = () => {
    if (isCreationLabLocked) {
      toast.info("Unlocks after your first project", { duration: 3000 });
      return;
    }
    navigate("/creation-lab");
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-muted-foreground">Guidance & Creation</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ask the Council */}
        <Card 
          className={cn(
            "cursor-pointer transition-all relative shadow-md min-h-[140px]",
            isCouncilLocked 
              ? "bg-muted/50 border-border/30 opacity-70"
              : isFirstTimeUser 
                ? "ring-2 ring-primary bg-gradient-to-br from-primary/10 to-primary/20 border-primary/30 hover:shadow-xl" 
                : "bg-gradient-to-br from-primary/5 to-primary/15 border-primary/20 hover:border-primary/40 hover:shadow-xl"
          )}
          onClick={handleCouncilClick}
        >
          {isCouncilLocked ? (
            <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-muted-foreground/30 text-muted-foreground text-xs font-medium shadow flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Locked
            </div>
          ) : isFirstTimeUser ? (
            <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold shadow-lg flex items-center gap-1 animate-pulse">
              <Bell className="w-3 h-3" />
              NEW
            </div>
          ) : councilNotificationCount > 0 ? (
            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
              {councilNotificationCount}
            </div>
          ) : null}
          <CardContent className="p-6">
            <div className="flex items-center gap-5">
              <div className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center shadow-lg",
                isCouncilLocked 
                  ? "bg-muted-foreground/20" 
                  : "bg-gradient-to-br from-primary to-primary/70"
              )}>
                {isCouncilLocked ? (
                  <Lock className="w-7 h-7 text-muted-foreground" />
                ) : (
                  <Users className="w-7 h-7 text-primary-foreground" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">
                  {isCouncilLocked ? "Meet Your Council" : isFirstTimeUser ? "Meet Your Council" : "Ask the Council"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isCouncilLocked 
                    ? "Unlocks after a short quest"
                    : isFirstTimeUser 
                      ? "Your mentors are ready to guide you" 
                      : councilNotificationCount > 0
                        ? `${councilNotificationCount} message${councilNotificationCount > 1 ? 's' : ''} waiting`
                        : "Get wisdom for your project"
                  }
                </p>
              </div>
              <ChevronRight className="w-6 h-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Creation Lab */}
        <Card 
          className={cn(
            "cursor-pointer transition-all shadow-md min-h-[140px] relative",
            isCreationLabLocked
              ? "bg-muted/50 border-border/30 opacity-70"
              : "bg-gradient-to-br from-accent/5 to-accent/15 border-accent/20 hover:border-accent/40 hover:shadow-xl"
          )}
          onClick={handleCreationLabClick}
        >
          {isCreationLabLocked && (
            <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-muted-foreground/30 text-muted-foreground text-xs font-medium shadow flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Locked
            </div>
          )}
          <CardContent className="p-6">
            <div className="flex items-center gap-5">
              <div className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center shadow-lg",
                isCreationLabLocked
                  ? "bg-muted-foreground/20"
                  : "bg-gradient-to-br from-accent to-accent/70"
              )}>
                {isCreationLabLocked ? (
                  <Lock className="w-7 h-7 text-muted-foreground" />
                ) : (
                  <FlaskConical className="w-7 h-7 text-accent-foreground" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">Creation Lab</h3>
                <p className="text-sm text-muted-foreground">
                  {isCreationLabLocked 
                    ? "Unlocks after your first project"
                    : "Break it into steps and build"
                  }
                </p>
              </div>
              <ChevronRight className="w-6 h-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GuidanceCreationSection;
