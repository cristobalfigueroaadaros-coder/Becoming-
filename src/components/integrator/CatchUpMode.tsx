import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sunrise, ArrowRight, Layers, SkipForward } from "lucide-react";

interface CatchUpModeProps {
  missedDays: number;
  onResume: () => void;
  onCompress: () => void;
  onSkipMissed: () => void;
}

export function CatchUpMode({
  missedDays,
  onResume,
  onCompress,
  onSkipMissed
}: CatchUpModeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Sunrise className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Welcome Back!</CardTitle>
              <p className="text-sm text-muted-foreground">
                You've been away for {missedDays} day{missedDays > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            That's perfectly okay. Life happens. Let's get you back on track in a way that feels right:
          </p>

          <div className="space-y-3">
            {/* Option 1: Resume */}
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-3 px-4"
              onClick={onResume}
            >
              <ArrowRight className="w-5 h-5 mr-3 text-primary" />
              <div className="text-left">
                <div className="font-medium">Resume where I left off</div>
                <div className="text-xs text-muted-foreground">
                  Continue with the next pending step
                </div>
              </div>
            </Button>

            {/* Option 2: Compress */}
            {missedDays >= 2 && (
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-3 px-4"
                onClick={onCompress}
              >
                <Layers className="w-5 h-5 mr-3 text-amber-600" />
                <div className="text-left">
                  <div className="font-medium">Compress missed steps</div>
                  <div className="text-xs text-muted-foreground">
                    Combine {missedDays} steps into one catch-up session
                  </div>
                </div>
              </Button>
            )}

            {/* Option 3: Skip */}
            <Button
              variant="ghost"
              className="w-full justify-start h-auto py-3 px-4"
              onClick={onSkipMissed}
            >
              <SkipForward className="w-5 h-5 mr-3 text-muted-foreground" />
              <div className="text-left">
                <div className="font-medium">Skip and continue</div>
                <div className="text-xs text-muted-foreground">
                  Mark missed days as skipped and move forward
                </div>
              </div>
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground pt-2">
            Remember: progress isn't linear. Every return is a win.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
