import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, ArrowRight, Heart, Briefcase, Users, DollarSign, Sparkles, Palette, Home, Sun } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import FutureSelfBackground from "@/components/FutureSelfBackground";

const DOMAINS = [
  { name: "Health & Fitness", icon: Heart },
  { name: "Career & Work", icon: Briefcase },
  { name: "Relationships & Love", icon: Users },
  { name: "Financial & Wealth", icon: DollarSign },
  { name: "Personal Growth", icon: Sparkles },
  { name: "Fun & Recreation", icon: Palette },
  { name: "Physical Environment", icon: Home },
  { name: "Spiritual & Purpose", icon: Sun },
];

const LifeAssessment = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [currentScores, setCurrentScores] = useState<number[]>(DOMAINS.map(() => 5));
  const [futureScores, setFutureScores] = useState<number[]>(DOMAINS.map(() => 7));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      for (let i = 0; i < DOMAINS.length; i++) {
        const { error } = await supabase
          .from("life_domains")
          .upsert({
            user_id: user.id,
            domain_name: DOMAINS[i].name,
            current_score: currentScores[i],
            future_score: futureScores[i],
          }, { onConflict: "user_id,domain_name" });

        if (error) throw error;
      }

      toast({ title: "Assessment saved!", description: "Your life domains radar has been updated." });
      navigate(-1);
    } catch (error) {
      console.error(error);
      toast({ title: "Error saving", description: "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const scores = step === 1 ? currentScores : futureScores;
  const setScores = step === 1 ? setCurrentScores : setFutureScores;

  return (
    <motion.div
      className="min-h-screen relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <FutureSelfBackground />

      <div className="sticky top-0 z-10 bg-card/50 backdrop-blur-lg border-b border-border/30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => step === 1 ? navigate(-1) : setStep(1)} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            {step === 1 ? "Back" : "Previous"}
          </Button>
          <span className="text-sm text-muted-foreground">Step {step} of 2</span>
        </div>
      </div>

      <motion.div
        key={step}
        className="max-w-2xl mx-auto px-4 py-8 space-y-6"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            {step === 1 ? "Rate Your Current State" : "Envision Your Future"}
          </h1>
          <p className="text-muted-foreground">
            {step === 1
              ? "How satisfied are you with each area of your life right now? (1 = very low, 10 = excellent)"
              : "Where would you like each area to be? (1 = minimal focus, 10 = fully thriving)"}
          </p>
        </div>

        <div className="space-y-4">
          {DOMAINS.map((domain, i) => {
            const Icon = domain.icon;
            return (
              <Card key={domain.name} className="bg-card/80 backdrop-blur-sm border-border/40">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-primary" />
                      <span className="font-medium text-foreground text-sm">{domain.name}</span>
                    </div>
                    <span className="text-lg font-bold text-primary">{scores[i]}</span>
                  </div>
                  <Slider
                    value={[scores[i]]}
                    min={1}
                    max={10}
                    step={1}
                    onValueChange={([v]) => {
                      const next = [...scores];
                      next[i] = v;
                      setScores(next);
                    }}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1</span>
                    <span>10</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-end pt-4">
          {step === 1 ? (
            <Button onClick={() => setStep(2)} className="gap-2">
              Next: Future Vision
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Assessment"}
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LifeAssessment;
