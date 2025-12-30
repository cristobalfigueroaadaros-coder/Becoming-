import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Loader2, Lightbulb, Zap, Trees, Sparkles, Briefcase, Compass, Target, TrendingUp, Megaphone, FlaskConical, Scale, Moon, Lock } from "lucide-react";
import { toast } from "sonner";

const mentorIcons = {
  discipline_mentor: Target,
  creative_visionary: Lightbulb,
  quantum_inventor: Zap,
  ancient_sage: Trees,
  future_self: Sparkles,
  business_mentor: Briefcase,
  mystic_mentor: Compass,
  strategist_mentor: TrendingUp,
  marketing_mentor: Megaphone,
  scientific_mentor: FlaskConical,
  alignment_mentor: Scale,
  oracle_mother: Moon,
  heart_mentor: Sparkles,
};

const mentorColors = {
  discipline_mentor: "bg-primary",
  creative_visionary: "bg-purple-500",
  quantum_inventor: "bg-cyan-500",
  ancient_sage: "bg-emerald-600",
  future_self: "bg-pink-500",
  business_mentor: "bg-primary",
  mystic_mentor: "bg-secondary",
  strategist_mentor: "bg-cyan-500",
  marketing_mentor: "bg-accent",
  scientific_mentor: "bg-cyan-500",
  alignment_mentor: "bg-secondary",
  oracle_mother: "bg-amber-600",
  heart_mentor: "bg-rose-500",
};

const mentorNames = {
  discipline_mentor: "Discipline Mentor",
  creative_visionary: "Creative Visionary",
  quantum_inventor: "Quantum Inventor",
  ancient_sage: "Ancient Sage",
  future_self: "Future Self",
  business_mentor: "Business Mentor",
  mystic_mentor: "Mystic Mentor",
  strategist_mentor: "Strategist Mentor",
  marketing_mentor: "Marketing Mentor",
  scientific_mentor: "Scientific Mentor",
  alignment_mentor: "Alignment Mentor",
  oracle_mother: "Oracle Mother",
  heart_mentor: "Heart Mentor",
};

interface MentorsSectionProps {
  mentors: any[];
  mentorNotifications: Record<string, number>;
  processingMentor: string | null;
  onMentorClick: (mentorType: string) => void;
  isLocked?: boolean;
}

const MentorsSection = ({ 
  mentors, 
  mentorNotifications, 
  processingMentor, 
  onMentorClick,
  isLocked = false,
}: MentorsSectionProps) => {

  const handleClick = (mentorType: string) => {
    if (isLocked) {
      toast.info("Mentors unlock after your first Council meeting");
      return;
    }
    onMentorClick(mentorType);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-muted-foreground">Your Mentors</h2>
        {isLocked && (
          <Badge variant="secondary" className="text-xs gap-1">
            <Lock className="w-3 h-3" />
            Unlocks after Council
          </Badge>
        )}
      </div>
      <div className={cn(
        "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3",
        isLocked && "opacity-50"
      )}>
        {mentors.map((mentor) => {
          const Icon = mentorIcons[mentor.mentor_type as keyof typeof mentorIcons];
          const color = mentorColors[mentor.mentor_type as keyof typeof mentorColors];
          const name = mentorNames[mentor.mentor_type as keyof typeof mentorNames];

          return (
            <Card
              key={mentor.id}
              className={cn(
                "cursor-pointer hover:shadow-lg transition-all relative",
                !isLocked && "hover:scale-[1.02]",
                processingMentor === mentor.mentor_type && "opacity-50 cursor-wait",
                isLocked && "cursor-not-allowed"
              )}
              onClick={() => handleClick(mentor.mentor_type)}
              style={{ pointerEvents: processingMentor ? 'none' : 'auto' }}
            >
              {processingMentor === mentor.mentor_type && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg z-10">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              )}
              {!isLocked && mentorNotifications[mentor.mentor_type] > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold p-0">
                  {mentorNotifications[mentor.mentor_type]}
                </Badge>
              )}
              {isLocked && (
                <div className="absolute top-2 right-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              <CardContent className="p-4 text-center space-y-2">
                <div className={cn("w-12 h-12 mx-auto rounded-xl flex items-center justify-center", color)}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="font-medium text-sm">{name}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MentorsSection;
