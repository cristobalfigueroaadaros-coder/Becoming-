import { Card, CardContent } from "@/components/ui/card";
import { Users, Ghost, Lock } from "lucide-react";

const ComingSoonSection = () => {
  const comingSoonItems = [
    {
      icon: Users,
      title: "Community",
      description: "Achievements & peer support",
    },
    {
      icon: Ghost,
      title: "Face a Shadow",
      description: "Confront what holds you back",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground uppercase tracking-wide">Coming Soon</span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {comingSoonItems.map((item) => (
          <Card 
            key={item.title} 
            className="opacity-50 cursor-not-allowed border-dashed"
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center relative">
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                  <Lock className="w-3 h-3 absolute -bottom-1 -right-1 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-muted-foreground">{item.title}</h3>
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
