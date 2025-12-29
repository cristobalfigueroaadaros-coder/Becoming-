import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FlaskConical, Bell, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface GuidanceCreationSectionProps {
  isFirstTimeUser: boolean;
  councilNotificationCount: number;
  onCouncilClick: () => void;
}

const GuidanceCreationSection = ({ 
  isFirstTimeUser, 
  councilNotificationCount,
  onCouncilClick
}: GuidanceCreationSectionProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-muted-foreground">Guidance & Creation</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ask the Council */}
        <Card 
          className={cn(
            "cursor-pointer hover:shadow-lg transition-all relative",
            isFirstTimeUser 
              ? "ring-2 ring-primary bg-gradient-to-br from-primary/10 to-accent/5" 
              : "hover:border-primary/30"
          )}
          onClick={onCouncilClick}
        >
          {isFirstTimeUser && (
            <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold shadow-lg flex items-center gap-1 animate-pulse">
              <Bell className="w-3 h-3" />
              NEW
            </div>
          )}
          {!isFirstTimeUser && councilNotificationCount > 0 && (
            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
              {councilNotificationCount}
            </div>
          )}
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">
                  {isFirstTimeUser ? "Meet Your Council" : "Ask the Council"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isFirstTimeUser 
                    ? "Your mentors are ready to guide you" 
                    : councilNotificationCount > 0
                      ? `${councilNotificationCount} message${councilNotificationCount > 1 ? 's' : ''} waiting`
                      : "Get wisdom for your project"
                  }
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Creation Lab */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all hover:border-accent/30"
          onClick={() => navigate("/creation-lab")}
        >
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center">
                <FlaskConical className="w-6 h-6 text-accent-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Creation Lab</h3>
                <p className="text-sm text-muted-foreground">Break it into steps and build</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GuidanceCreationSection;
