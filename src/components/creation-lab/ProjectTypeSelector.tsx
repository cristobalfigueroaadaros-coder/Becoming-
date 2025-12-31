import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { User, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProjectType = "becoming" | "creating";

interface ProjectTypeSelectorProps {
  currentType: ProjectType;
  onTypeChange: (type: ProjectType) => void;
}

export const ProjectTypeSelector = ({
  currentType,
  onTypeChange,
}: ProjectTypeSelectorProps) => {
  const types = [
    {
      key: "becoming" as const,
      label: "Becoming Path",
      description: "Who you are becoming",
      icon: User,
      gradient: "from-violet-500/20 to-purple-500/20",
      borderColor: "border-violet-500/50",
    },
    {
      key: "creating" as const,
      label: "Creating Project",
      description: "What you are building",
      icon: Rocket,
      gradient: "from-primary/20 to-accent/20",
      borderColor: "border-primary/50",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {types.map((type) => {
        const Icon = type.icon;
        const isActive = currentType === type.key;

        return (
          <motion.div
            key={type.key}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              className={cn(
                "relative cursor-pointer p-4 transition-all duration-200",
                "bg-gradient-to-br hover:shadow-lg",
                type.gradient,
                isActive ? type.borderColor : "border-border/50",
                isActive && "ring-2 ring-offset-2 ring-offset-background",
                isActive && type.key === "becoming" ? "ring-violet-500/50" : "",
                isActive && type.key === "creating" ? "ring-primary/50" : ""
              )}
              onClick={() => onTypeChange(type.key)}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    type.key === "becoming" ? "bg-violet-500/20" : "bg-primary/20"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5",
                      type.key === "becoming" ? "text-violet-500" : "text-primary"
                    )}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{type.label}</h3>
                  <p className="text-xs text-muted-foreground">
                    {type.description}
                  </p>
                </div>
              </div>

              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className={cn(
                    "absolute bottom-0 left-0 right-0 h-1 rounded-b-lg",
                    type.key === "becoming" ? "bg-violet-500" : "bg-primary"
                  )}
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};
