import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Target, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface InlineProjectSuggestionProps {
  projectName: string;
  onAccept: (projectName: string) => void;
  onDecline: () => void;
}

export const InlineProjectSuggestion = ({
  projectName,
  onAccept,
  onDecline,
}: InlineProjectSuggestionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-2 border-primary/40 bg-gradient-to-br from-primary/10 via-accent/5 to-background shadow-lg">
        <CardContent className="pt-5 pb-4 px-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
              <Target className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground mb-1">
                Ready to build this?
              </p>
              <p className="text-lg font-bold text-primary">
                "{projectName}"
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={() => onAccept(projectName)}
              className="flex-1 gap-2"
              size="lg"
            >
              Yes, let's build this
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              onClick={onDecline}
              size="lg"
            >
              Keep shaping
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
