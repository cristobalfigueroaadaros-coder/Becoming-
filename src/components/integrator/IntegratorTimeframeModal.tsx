import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Sparkles, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface IntegratorTimeframeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectTitle: string;
  onConfirm: (days: number) => void;
  isLoading?: boolean;
}

const PRESET_TIMEFRAMES = [
  { days: 7, label: "1 Week", description: "Quick sprint" },
  { days: 14, label: "2 Weeks", description: "Focused exploration" },
  { days: 21, label: "3 Weeks", description: "Balanced journey" },
  { days: 30, label: "1 Month", description: "Deep development" },
  { days: 60, label: "2 Months", description: "Full transformation" },
];

export function IntegratorTimeframeModal({
  open,
  onOpenChange,
  projectTitle,
  onConfirm,
  isLoading = false
}: IntegratorTimeframeModalProps) {
  const [selectedDays, setSelectedDays] = useState<number | null>(21);
  const [customDays, setCustomDays] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const handleConfirm = () => {
    const days = showCustom ? parseInt(customDays) : selectedDays;
    if (days && days > 0 && days <= 90) {
      onConfirm(days);
    }
  };

  const isValidSelection = showCustom 
    ? parseInt(customDays) > 0 && parseInt(customDays) <= 90
    : selectedDays !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            How many days for this journey?
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Your project: <span className="font-medium text-foreground">{projectTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            The Integrator will create daily micro-steps (under 30 min each) to guide you through 
            Exploration → Validation → Creation → Expression → Reflection.
          </p>

          <div className="grid grid-cols-2 gap-2">
            {PRESET_TIMEFRAMES.map((tf) => (
              <motion.button
                key={tf.days}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedDays(tf.days);
                  setShowCustom(false);
                }}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedDays === tf.days && !showCustom
                    ? 'border-primary bg-primary/10 ring-1 ring-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="font-medium">{tf.label}</div>
                <div className="text-xs text-muted-foreground">{tf.description}</div>
              </motion.button>
            ))}
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCustom(true)}
              className={`p-3 rounded-lg border text-left transition-all ${
                showCustom
                  ? 'border-primary bg-primary/10 ring-1 ring-primary'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="font-medium">Custom</div>
              <div className="text-xs text-muted-foreground">Set your own</div>
            </motion.button>
          </div>

          {showCustom && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-2"
            >
              <Input
                type="number"
                min="1"
                max="90"
                placeholder="Number of days"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">days (max 90)</span>
            </motion.div>
          )}

          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Daily steps take ~20-30 minutes. Gentle pace, sustainable progress.
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!isValidSelection || isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Sparkles className="w-4 h-4 animate-pulse" />
                Creating your journey...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Begin Journey
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
