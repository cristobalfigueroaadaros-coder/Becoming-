import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Orbit, X } from "lucide-react";

interface PatternLinkSuggestionProps {
  eventLabel: string;
  onMapPattern: () => void;
  onDismiss: () => void;
}

export const PatternLinkSuggestion = ({
  eventLabel,
  onMapPattern,
  onDismiss,
}: PatternLinkSuggestionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
    >
      <Card className="border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-transparent">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
              <Orbit className="w-4 h-4 text-indigo-400" />
            </div>
            
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-sm font-medium">
                  This event shaped you deeply.
                </p>
                <p className="text-sm text-muted-foreground">
                  Want to map the pattern it created?
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-500"
                  onClick={onMapPattern}
                >
                  <Orbit className="w-3 h-3 mr-1" />
                  Map Pattern
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground"
                  onClick={onDismiss}
                >
                  Not now
                </Button>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={onDismiss}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
