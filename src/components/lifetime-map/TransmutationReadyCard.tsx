import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";

interface TransmutationReadyCardProps {
  patternName: string;
  onStartTransmutation: () => void;
  onDismiss: () => void;
}

export const TransmutationReadyCard = ({
  patternName,
  onStartTransmutation,
  onDismiss,
}: TransmutationReadyCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
    >
      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-sm font-medium">
                  Ready to transform this into gold?
                </p>
                <p className="text-sm text-muted-foreground">
                  Your pattern "{patternName}" is ready for transmutation.
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-500"
                  onClick={onStartTransmutation}
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Start Transmutation
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
