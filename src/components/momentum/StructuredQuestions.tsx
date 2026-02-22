import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export interface StructuredAnswers {
  usefulness: string;
  frictionType: string;
  biggestWin: string;
  directionConfidence: number;
}

interface StructuredQuestionsProps {
  onComplete: (answers: StructuredAnswers) => void;
}

const USEFULNESS_OPTIONS = [
  "Extremely useful",
  "Useful",
  "Neutral",
  "Not very useful",
  "Misaligned",
];

const FRICTION_OPTIONS = [
  "Lack of clarity",
  "Overwhelm",
  "Low motivation",
  "External distractions",
  "Task too complex",
  "Doubt about direction",
  "Nothing significant",
];

const WIN_OPTIONS = [
  "Completed key milestone",
  "Gained clarity",
  "Tested something new",
  "Improved structure",
  "Built consistency",
  "Learned something important",
  "Other",
];

export function StructuredQuestions({ onComplete }: StructuredQuestionsProps) {
  const [usefulness, setUsefulness] = useState("");
  const [frictionType, setFrictionType] = useState("");
  const [biggestWin, setBiggestWin] = useState("");
  const [directionConfidence, setDirectionConfidence] = useState(5);

  const isValid = usefulness && frictionType && biggestWin;

  return (
    <div className="space-y-6 py-2 max-h-[60vh] overflow-y-auto pr-1">
      {/* Usefulness */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">How useful were this week's tasks?</Label>
        <RadioGroup value={usefulness} onValueChange={setUsefulness} className="space-y-1.5">
          {USEFULNESS_OPTIONS.map((opt) => (
            <div key={opt} className="flex items-center gap-2">
              <RadioGroupItem value={opt} id={`use-${opt}`} />
              <Label htmlFor={`use-${opt}`} className="text-sm font-normal cursor-pointer">{opt}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Friction */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">What slowed you down most?</Label>
        <RadioGroup value={frictionType} onValueChange={setFrictionType} className="space-y-1.5">
          {FRICTION_OPTIONS.map((opt) => (
            <div key={opt} className="flex items-center gap-2">
              <RadioGroupItem value={opt} id={`fric-${opt}`} />
              <Label htmlFor={`fric-${opt}`} className="text-sm font-normal cursor-pointer">{opt}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Biggest Win */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">What was your strongest win?</Label>
        <RadioGroup value={biggestWin} onValueChange={setBiggestWin} className="space-y-1.5">
          {WIN_OPTIONS.map((opt) => (
            <div key={opt} className="flex items-center gap-2">
              <RadioGroupItem value={opt} id={`win-${opt}`} />
              <Label htmlFor={`win-${opt}`} className="text-sm font-normal cursor-pointer">{opt}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Direction Confidence */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label className="text-sm font-medium">Direction Confidence</Label>
          <span className="text-sm font-medium">{directionConfidence}/10</span>
        </div>
        <Slider
          value={[directionConfidence]}
          min={1}
          max={10}
          step={1}
          onValueChange={([v]) => setDirectionConfidence(v)}
        />
      </div>

      <Button
        className="w-full"
        disabled={!isValid}
        onClick={() => onComplete({ usefulness, frictionType, biggestWin, directionConfidence })}
      >
        Continue
      </Button>
    </div>
  );
}
