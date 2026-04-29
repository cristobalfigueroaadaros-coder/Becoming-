import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Check, X } from "lucide-react";

interface WhitePhaseWinCardProps {
  open: boolean;
  patternName: string;
  shiftMoment: string;
  lesson: string;
  protectivePurpose?: string;
  onConfirm: () => void;
  onNotNow: () => void;
}

export const WhitePhaseWinCard = ({
  open,
  patternName,
  shiftMoment,
  lesson,
  protectivePurpose,
  onConfirm,
  onNotNow,
}: WhitePhaseWinCardProps) => {
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
    <Card className="w-full max-w-md border-slate-300 bg-gradient-to-br from-slate-50 via-white to-slate-100 shadow-xl max-h-[85vh] flex flex-col">
              <CardContent className="pt-6 pb-6 text-center space-y-4 overflow-y-auto flex-1">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center shadow-lg"
                >
                  <Sparkles className="w-7 h-7 text-slate-600" />
                </motion.div>

                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-1"
                >
                  <h2 className="text-lg font-bold text-slate-800">
                    The Shift Happened ✨
                  </h2>
                  <p className="text-xs text-slate-500">
                    You're seeing clearly now
                  </p>
                </motion.div>

                {/* Pattern name */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-slate-100 rounded-lg px-3 py-2"
                >
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                    Pattern
                  </p>
                  <p className="font-semibold text-slate-700 text-sm">{patternName}</p>
                </motion.div>

                {/* Extracted insights */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-2 text-left"
                >
                  <div className="bg-white/80 border border-slate-200 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1 font-medium">The Shift</p>
                    <p className="text-sm text-slate-700">{shiftMoment}</p>
                  </div>
                  
                  <div className="bg-white/80 border border-slate-200 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1 font-medium">The Lesson</p>
                    <p className="text-sm text-slate-700">{lesson}</p>
                  </div>

                  {protectivePurpose && (
                    <div className="bg-white/80 border border-slate-200 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-1 font-medium">Protective Role</p>
                      <p className="text-sm text-slate-700">{protectivePurpose}</p>
                    </div>
                  )}
                </motion.div>

                {/* Message */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-xs text-slate-500"
                >
                  The Red Phase is now unlocked.
                </motion.p>
              </CardContent>

              {/* Sticky actions at bottom */}
              <div className="px-6 pb-6 pt-2 border-t border-slate-200/50 bg-white/90">
                <div className="flex gap-3">
                  <Button
                    onClick={onNotNow}
                    variant="outline"
                    className="flex-1 border-slate-300"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Not now
                  </Button>
                  <Button
                    onClick={onConfirm}
                    className="flex-1 bg-slate-700 hover:bg-slate-600"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Confirm White
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
