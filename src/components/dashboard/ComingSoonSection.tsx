import { Card, CardContent } from "@/components/ui/card";
import { Users, Ghost, Target, Lock } from "lucide-react";

const ComingSoonSection = () => {
  const comingSoonItems = [
    {
      icon: Users,
      title: "Community",
      description: "Achievements & peer support",
      gradient: "from-violet-500/10 to-purple-500/15",
      iconBg: "from-violet-500/40 to-purple-500/40",
      borderColor: "border-violet-400/30",
      iconColor: "text-violet-600 dark:text-violet-400",
    },
    {
      icon: Ghost,
      title: "Face a Shadow",
      description: "Confront what holds you back",
      gradient: "from-pink-500/10 to-rose-500/15",
      iconBg: "from-pink-500/40 to-rose-500/40",
      borderColor: "border-pink-400/30",
      iconColor: "text-pink-600 dark:text-pink-400",
    },
    {
      icon: Target,
      title: "Daily Challenge",
      description: "One achievable step each day",
      gradient: "from-amber-500/10 to-orange-500/15",
      iconBg: "from-amber-500/40 to-orange-500/40",
      borderColor: "border-amber-400/30",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Coming Soon</span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {comingSoonItems.map((item) => (
          <Card 
            key={item.title} 
            className={`cursor-not-allowed ${item.borderColor} bg-gradient-to-br ${item.gradient} backdrop-blur-sm`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.iconBg} flex items-center justify-center relative`}>
                  <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background/90 border border-border flex items-center justify-center">
                    <Lock className="w-3 h-3 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground/80">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ComingSoonSection;
