import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Zap, Heart, TrendingUp, Target, Waves } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function EnergyCaptureWidget() {
  const [momentType, setMomentType] = useState<string>("flow_state");
  const [energyLevel, setEnergyLevel] = useState<number[]>([7]);
  const [clarityLevel, setClarityLevel] = useState<number[]>([7]);
  const [expansionLevel, setExpansionLevel] = useState<number[]>([7]);
  const [alignmentFeeling, setAlignmentFeeling] = useState<number[]>([7]);
  const [coherenceLevel, setCoherenceLevel] = useState<number[]>([7]);
  const [emotionalState, setEmotionalState] = useState<string>("");
  const [activityContext, setActivityContext] = useState<string>("");
  const [userNotes, setUserNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCapture = async () => {
    try {
      setIsSubmitting(true);

      const { data, error } = await supabase.functions.invoke("capture-energetic-moment", {
        body: {
          momentType,
          energyLevel: energyLevel[0],
          clarityLevel: clarityLevel[0],
          expansionLevel: expansionLevel[0],
          alignmentFeeling: alignmentFeeling[0],
          coherenceLevel: coherenceLevel[0],
          emotionalState,
          activityContext,
          userNotes,
          somaticData: {
            captured_via: "manual_widget",
            timestamp: new Date().toISOString(),
          },
        },
      });

      if (error) throw error;

      toast({
        title: "✨ Energetic Moment Captured",
        description: `Frequency: ${data.frequency} | ${data.dot_created ? 'Insight dot created!' : 'Logged in your field'}`,
      });

      // Reset form
      setUserNotes("");
      setActivityContext("");
      setEmotionalState("");
    } catch (error: any) {
      console.error("Error capturing moment:", error);
      toast({
        title: "Error capturing moment",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6 bg-card/50 backdrop-blur border-primary/20">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Waves className="w-6 h-6 text-primary" />
          <div>
            <h3 className="text-xl font-semibold">Capture Energetic Moment</h3>
            <p className="text-sm text-muted-foreground">
              Record your current vibrational state
            </p>
          </div>
        </div>

        {/* Moment Type */}
        <div className="space-y-2">
          <Label>Moment Type</Label>
          <Select value={momentType} onValueChange={setMomentType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="flow_state">Flow State</SelectItem>
              <SelectItem value="breakthrough">Breakthrough</SelectItem>
              <SelectItem value="expansion">Expansion</SelectItem>
              <SelectItem value="resonance">Resonance</SelectItem>
              <SelectItem value="intuition_hit">Intuition Hit</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Energy Sliders */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Energy Level
              </Label>
              <span className="text-sm font-semibold text-primary">{energyLevel[0]}/10</span>
            </div>
            <Slider
              value={energyLevel}
              onValueChange={setEnergyLevel}
              max={10}
              step={1}
              className="[&_[role=slider]]:bg-primary"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Target className="w-4 h-4 text-accent" />
                Clarity Level
              </Label>
              <span className="text-sm font-semibold text-accent">{clarityLevel[0]}/10</span>
            </div>
            <Slider
              value={clarityLevel}
              onValueChange={setClarityLevel}
              max={10}
              step={1}
              className="[&_[role=slider]]:bg-accent"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-secondary" />
                Expansion Level
              </Label>
              <span className="text-sm font-semibold text-secondary">{expansionLevel[0]}/10</span>
            </div>
            <Slider
              value={expansionLevel}
              onValueChange={setExpansionLevel}
              max={10}
              step={1}
              className="[&_[role=slider]]:bg-secondary"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-accent" />
                Alignment Feeling
              </Label>
              <span className="text-sm font-semibold text-accent">{alignmentFeeling[0]}/10</span>
            </div>
            <Slider
              value={alignmentFeeling}
              onValueChange={setAlignmentFeeling}
              max={10}
              step={1}
              className="[&_[role=slider]]:bg-accent"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Waves className="w-4 h-4 text-primary" />
                Coherence Level
              </Label>
              <span className="text-sm font-semibold text-primary">{coherenceLevel[0]}/10</span>
            </div>
            <Slider
              value={coherenceLevel}
              onValueChange={setCoherenceLevel}
              max={10}
              step={1}
              className="[&_[role=slider]]:bg-primary"
            />
          </div>
        </div>

        {/* Context Fields */}
        <div className="space-y-2">
          <Label>Emotional State</Label>
          <input
            type="text"
            value={emotionalState}
            onChange={(e) => setEmotionalState(e.target.value)}
            placeholder="e.g., inspired, peaceful, powerful..."
            className="w-full px-3 py-2 border border-input rounded-md bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label>Activity Context</Label>
          <input
            type="text"
            value={activityContext}
            onChange={(e) => setActivityContext(e.target.value)}
            placeholder="What were you doing?"
            className="w-full px-3 py-2 border border-input rounded-md bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label>Notes (Optional)</Label>
          <Textarea
            value={userNotes}
            onChange={(e) => setUserNotes(e.target.value)}
            placeholder="Describe this moment..."
            rows={3}
          />
        </div>

        <Button
          onClick={handleCapture}
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
        >
          {isSubmitting ? "Capturing..." : "Capture Moment"}
        </Button>
      </div>
    </Card>
  );
}
