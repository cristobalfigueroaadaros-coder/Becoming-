import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, Check, X } from "lucide-react";

interface RedPhaseWinCardProps {
  open: boolean;
  patternName: string;
  releaseBurden: string;
  releaseBelief: string;
  releaseCost: string;
  onConfirm: () => void;
  onNotNow: () => void;
}

export const RedPhaseWinCard = ({
  open,
  patternName,
  releaseBurden,
  releaseBelief,
  releaseCost,
  onConfirm,
  onNotNow,
}: RedPhaseWinCardProps) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onNotNow()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            <Card className="w-full max-w-md border-red-300 bg-gradient-to-br from-red-50 via-white to-red-100 shadow-xl max-h-[85vh] flex flex-col">
              <CardContent className="pt-6 pb-6 text-center space-y-4 overflow-y-auto flex-1">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-red-200 to-red-400 flex items-center justify-center shadow-lg"
                >
                  <Flame className="w-7 h-7 text-white" />
                </motion.div>

                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-1"
                >
                  <h2 className="text-lg font-bold text-red-800">
                    Release Complete 🔥
                  </h2>
                  <p className="text-xs text-red-500">
                    You've decided what you're done carrying
                  </p>
                </motion.div>

                {/* Pattern name */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-red-100 rounded-lg px-3 py-2"
                >
                  <p className="text-xs text-red-500 font-medium uppercase tracking-wide">Pattern</p>
                  <p className="font-semibold text-red-700 text-sm">{patternName}</p>
                </motion.div>

                {/* Release answers */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-2 text-left"
                >
                  {releaseBurden && (
                    <div className="bg-white/80 border border-red-200 rounded-lg p-3">
                      <p className="text-xs text-red-500 mb-1 font-medium">What You're Letting Go Of</p>
                      <p className="text-sm text-red-900">{releaseBurden}</p>
                    </div>
                  )}
                  
                  {releaseBelief && (
                    <div className="bg-white/80 border border-red-200 rounded-lg p-3">
                      <p className="text-xs text-red-500 mb-1 font-medium">Belief Released</p>
                      <p className="text-sm text-red-900">{releaseBelief}</p>
                    </div>
                  )}

                  {releaseCost && (
                    <div className="bg-white/80 border border-red-200 rounded-lg p-3">
                      <p className="text-xs text-red-500 mb-1 font-medium">Cost Recognized</p>
                      <p className="text-sm text-red-900">{releaseCost}</p>
                    </div>
                  )}
                </motion.div>

                {/* Message */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-xs text-red-500"
                >
                  The Gold Phase is now unlocked.
                </motion.p>
              </CardContent>

              {/* Sticky actions at bottom */}
              <div className="px-6 pb-6 pt-2 border-t border-red-200/50 bg-white/90">
                <div className="flex gap-3">
                  <Button
                    onClick={onNotNow}
                    variant="outline"
                    className="flex-1 border-red-300"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Not now
                  </Button>
                  <Button
                    onClick={onConfirm}
                    className="flex-1 bg-red-600 hover:bg-red-500"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Confirm Release
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};