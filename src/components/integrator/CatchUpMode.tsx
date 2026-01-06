import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sunrise, ArrowRight } from "lucide-react";

interface CatchUpModeProps {
  missedDays: number;
  onResume: () => void;
  onCompress?: () => void;
  onSkipMissed?: () => void;
}

export function CatchUpMode({
  missedDays,
  onResume
}: CatchUpModeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Sunrise className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Welcome Back!</CardTitle>
              <p className="text-sm text-muted-foreground">
                You have {missedDays} task{missedDays > 1 ? 's' : ''} waiting
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Life happens. Your tasks are still here, waiting patiently. 
            Ready when you are.
          </p>

          <Button
            className="w-full justify-center h-auto py-4 px-4 gap-3"
            onClick={onResume}
          >
            <ArrowRight className="w-5 h-5" />
            <div className="text-left">
              <div className="font-medium">Continue my journey</div>
              <div className="text-xs opacity-80">
                Pick up where you left off
              </div>
            </div>
          </Button>

          <p className="text-xs text-center text-muted-foreground pt-2">
            Every return is a win. Let's keep moving.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
