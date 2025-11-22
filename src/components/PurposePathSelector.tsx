import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Compass, TrendingUp, HelpCircle } from "lucide-react";

interface PurposePathSelectorProps {
  onSelect: (path: string) => void;
  selectedPath: string | null;
}

const purposePaths = [
  {
    id: "has_purpose",
    title: "I have a purpose and want to grow from it",
    description: "You know your calling and want to deepen your impact",
    icon: Target,
    gradient: "from-primary to-primary/70"
  },
  {
    id: "discovering_purpose",
    title: "I want to discover my purpose",
    description: "You're on a journey of self-discovery and meaning",
    icon: Compass,
    gradient: "from-accent to-accent/70"
  },
  {
    id: "has_goal",
    title: "I have a goal I'm working toward",
    description: "You have specific objectives you want to achieve",
    icon: TrendingUp,
    gradient: "from-mentor-future to-mentor-future/70"
  },
  {
    id: "not_sure",
    title: "I don't know yet",
    description: "You're exploring and open to guidance",
    icon: HelpCircle,
    gradient: "from-muted-foreground to-muted-foreground/70"
  }
];

export const PurposePathSelector = ({ onSelect, selectedPath }: PurposePathSelectorProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          What are you here for?
        </h2>
        <p className="text-muted-foreground text-lg">
          Choose the path that resonates most with where you are right now
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {purposePaths.map((path) => {
          const Icon = path.icon;
          const isSelected = selectedPath === path.id;

          return (
            <Card
              key={path.id}
              className={`cursor-pointer transition-all hover:scale-105 ${
                isSelected
                  ? "border-2 border-primary shadow-lg"
                  : "border-2 border-transparent hover:border-primary/50"
              }`}
              onClick={() => onSelect(path.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-3 rounded-lg bg-gradient-to-br ${path.gradient} text-white`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg leading-tight">
                      {path.title}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {path.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
