import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Compass, Map, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PurposeOnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

export const PurposeOnboardingModal = ({ open, onClose }: PurposeOnboardingModalProps) => {
  const [step, setStep] = useState<"question" | "knows-purpose" | "discovering" | "complete">("question");
  const [purposeText, setPurposeText] = useState("");
  const [saving, setSaving] = useState(false);

  const handleKnowsPurpose = () => {
    setStep("knows-purpose");
  };

  const handleDoesntKnow = () => {
    setStep("discovering");
  };

  const savePurpose = async () => {
    if (!purposeText.trim()) {
      toast.error("Please describe your purpose");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({ main_mission: purposeText.trim() })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Purpose saved! It will guide your journey.");
      setStep("complete");
    } catch (error: any) {
      toast.error("Failed to save purpose", { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <AnimatePresence mode="wait">
          {step === "question" && (
            <motion.div
              key="question"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <DialogHeader className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <Compass className="w-10 h-10 text-primary" />
                </div>
                <DialogTitle className="text-2xl">
                  Welcome to Your Constellation
                </DialogTitle>
                <DialogDescription className="text-base">
                  This is where your journey's patterns come to light. Each insight, lesson, and breakthrough becomes a dot in your personal map of growth.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-8 space-y-4">
                <p className="text-center font-medium text-foreground">
                  Do you already know your life's purpose or mission?
                </p>

                <div className="grid grid-cols-1 gap-3">
                  <Card 
                    className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
                    onClick={handleKnowsPurpose}
                  >
                    <CardContent className="p-6 flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">Yes, I know my purpose</h3>
                        <p className="text-sm text-muted-foreground">
                          I have clarity on my mission and want to deepen it
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card 
                    className="cursor-pointer hover:border-accent/50 hover:shadow-md transition-all"
                    onClick={handleDoesntKnow}
                  >
                    <CardContent className="p-6 flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-6 h-6 text-accent" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">No, I'm still discovering</h3>
                        <p className="text-sm text-muted-foreground">
                          I'm on a journey to uncover my purpose
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}

          {step === "knows-purpose" && (
            <motion.div
              key="knows-purpose"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <DialogHeader className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-primary" />
                </div>
                <DialogTitle className="text-2xl">
                  Clarify Your Purpose
                </DialogTitle>
                <DialogDescription className="text-base">
                  Share your purpose or mission. This will serve as your North Star as you connect the dots of your journey.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="purpose">What is your life's purpose or mission?</Label>
                  <Textarea
                    id="purpose"
                    placeholder="Example: To help entrepreneurs build meaningful businesses that create positive change in the world..."
                    value={purposeText}
                    onChange={(e) => setPurposeText(e.target.value)}
                    rows={5}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be saved to your profile and help guide your journey
                  </p>
                </div>

                <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Map className="w-4 h-4" />
                    How Mapping Helps
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    As you use the app, every insight from mentors, journal entries, shadow work, and achievements becomes a dot on your map. Over time, you'll see patterns emerge that either validate your purpose or reveal new dimensions of it.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep("question")}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={savePurpose}
                    disabled={!purposeText.trim() || saving}
                    className="flex-1"
                  >
                    {saving ? "Saving..." : "Save & Continue"}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {step === "discovering" && (
            <motion.div
              key="discovering"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <DialogHeader className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-accent/10 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-accent" />
                </div>
                <DialogTitle className="text-2xl">
                  Your Purpose Awaits Discovery
                </DialogTitle>
                <DialogDescription className="text-base">
                  This constellation map is designed to help you discover your purpose by connecting the dots of your life experiences.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 space-y-4">
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="p-4 space-y-3">
                    <h4 className="font-semibold text-sm">Steve Jobs once said:</h4>
                    <blockquote className="text-sm italic text-muted-foreground border-l-2 border-primary pl-4">
                      "You can't connect the dots looking forward; you can only connect them looking backwards. So you have to trust that the dots will somehow connect in your future."
                    </blockquote>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">How It Works:</h4>
                  <div className="space-y-2">
                    {[
                      {
                        icon: "💬",
                        title: "Collect Insights",
                        desc: "Every conversation with mentors, journal entry, and breakthrough becomes a dot"
                      },
                      {
                        icon: "🔗",
                        title: "Find Connections",
                        desc: "AI helps you discover hidden patterns and themes across your experiences"
                      },
                      {
                        icon: "🎯",
                        title: "Reveal Purpose",
                        desc: "Over time, recurring themes emerge that point toward your unique mission"
                      }
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="text-2xl">{item.icon}</div>
                        <div className="flex-1">
                          <h5 className="text-sm font-medium">{item.title}</h5>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Your Mission:</strong> Engage fully with the app—chat with mentors, complete rituals, face shadows, and set goals. Each action adds a dot to your constellation. In time, your purpose will reveal itself.
                  </p>
                </div>

                <Button onClick={handleComplete} className="w-full">
                  Start Mapping My Journey
                </Button>
              </div>
            </motion.div>
          )}

          {step === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <DialogHeader className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                </div>
                <DialogTitle className="text-2xl">
                  Your Journey Begins
                </DialogTitle>
                <DialogDescription className="text-base">
                  Your purpose has been saved. Every insight you gather will now connect to this central mission.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 space-y-4">
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Next Steps:</strong> Continue engaging with mentors, journaling, and setting goals. Watch as your constellation grows and patterns emerge that deepen your understanding of your purpose.
                    </p>
                  </CardContent>
                </Card>

                <Button onClick={handleComplete} className="w-full">
                  Explore My Constellation
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
