import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Pattern interpretation system
const PATTERN_INTERPRETATIONS = {
  hesitation_pattern: {
    A: { pattern: 'overthinking', insight: 'Tends to analyze before acting', mentor_approach: 'Encourage small experiments over perfect plans' },
    B: { pattern: 'hesitation_to_start', insight: 'Struggles with initiation', mentor_approach: 'Focus on first tiny step, not full journey' },
    C: { pattern: 'inconsistency', insight: 'Starts strong but loses momentum', mentor_approach: 'Build accountability checkpoints' },
    D: { pattern: 'perfectionism', insight: 'Waits until everything is ready', mentor_approach: 'Celebrate imperfect progress' },
  },
  momentum_trigger: {
    A: { pattern: 'planning', insight: 'Motivated by clear structure', mentor_approach: 'Provide step-by-step frameworks' },
    B: { pattern: 'experimentation', insight: 'Learns by doing', mentor_approach: 'Encourage rapid prototyping' },
    C: { pattern: 'encouragement', insight: 'Needs external validation', mentor_approach: 'Offer warm affirmation frequently' },
    D: { pattern: 'accountability', insight: 'Performs with external pressure', mentor_approach: 'Set check-in commitments' },
  },
  decision_pattern: {
    A: { pattern: 'researcher', insight: 'Gathers information before deciding', mentor_approach: 'Give data but set decision deadlines' },
    B: { pattern: 'waiter', insight: 'Hopes clarity will arrive', mentor_approach: 'Help create clarity through action' },
    C: { pattern: 'tester', insight: 'Takes small actions to learn', mentor_approach: 'Support rapid experimentation' },
    D: { pattern: 'avoider', insight: 'Delays difficult decisions', mentor_approach: 'Break decisions into smaller choices' },
  },
  risk_tolerance: {
    A: { pattern: 'private_sharer', insight: 'Comfortable with trusted audience', mentor_approach: 'Start with inner circle feedback' },
    B: { pattern: 'solo_tester', insight: 'Prefers independent validation', mentor_approach: 'Create safe testing environments' },
    C: { pattern: 'imperfect_sharer', insight: 'Comfortable with public iteration', mentor_approach: 'Encourage public experimentation' },
    D: { pattern: 'perfectionist', insight: 'Needs completion before sharing', mentor_approach: 'Set "good enough" milestones' },
  },
  energy_orientation: {
    A: { pattern: 'creator', insight: 'Wants to build something new', mentor_approach: 'Focus on creation projects' },
    B: { pattern: 'refiner', insight: 'Wants to improve existing work', mentor_approach: 'Focus on optimization projects' },
    C: { pattern: 'seeker', insight: 'Needs direction first', mentor_approach: 'Start with discovery before action' },
    D: { pattern: 'unstuck', insight: 'Feeling blocked, needs movement', mentor_approach: 'Prioritize momentum over perfection' },
  },
};

const QUESTIONS = [
  {
    id: 'q1',
    key: 'hesitation_pattern',
    question: "When something meaningful calls you, what slows you down most?",
    options: [
      { key: 'A', label: 'Overthinking' },
      { key: 'B', label: 'Hesitation to start' },
      { key: 'C', label: 'Difficulty staying consistent' },
      { key: 'D', label: 'Pressure to do it perfectly' },
    ]
  },
  {
    id: 'q2',
    key: 'momentum_trigger',
    question: "What helps you move forward right now?",
    options: [
      { key: 'A', label: 'A clear plan' },
      { key: 'B', label: 'A small experiment' },
      { key: 'C', label: 'Encouragement' },
      { key: 'D', label: 'Accountability' },
    ]
  },
  {
    id: 'q3',
    key: 'decision_pattern',
    question: "When things feel uncertain, you usually…",
    options: [
      { key: 'A', label: 'Research more' },
      { key: 'B', label: 'Wait for clarity' },
      { key: 'C', label: 'Take a small test action' },
      { key: 'D', label: 'Avoid the decision' },
    ]
  },
  {
    id: 'q4',
    key: 'risk_tolerance',
    question: "When creating something new, what feels safest?",
    options: [
      { key: 'A', label: 'Sharing privately' },
      { key: 'B', label: 'Testing quietly alone' },
      { key: 'C', label: 'Sharing imperfectly' },
      { key: 'D', label: 'Waiting until it\'s ready' },
    ]
  },
  {
    id: 'q5',
    key: 'energy_orientation',
    question: "Right now, your energy feels most drawn toward…",
    options: [
      { key: 'A', label: 'Creating something new' },
      { key: 'B', label: 'Refining something existing' },
      { key: 'C', label: 'Finding direction' },
      { key: 'D', label: 'Getting unstuck and moving again' },
    ]
  },
];

const OnboardingQuest = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [otherText, setOtherText] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const question = QUESTIONS[currentQuestion];

  const handleSelect = (optionKey: string) => {
    const newAnswers = { ...answers, [question.id]: optionKey };
    setAnswers(newAnswers);

    if (optionKey !== 'E') {
      setTimeout(() => {
        if (currentQuestion < QUESTIONS.length - 1) {
          setCurrentQuestion(currentQuestion + 1);
        } else {
          handleComplete(newAnswers);
        }
      }, 300);
    }
  };

  const handleOtherSubmit = () => {
    const newAnswers = { ...answers, [question.id]: 'E' };
    setAnswers(newAnswers);

    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleComplete(newAnswers);
    }
  };

  const interpretPatterns = (rawAnswers: Record<string, string>) => {
    const patterns: Record<string, any> = {};
    
    QUESTIONS.forEach((q) => {
      const answer = rawAnswers[q.id];
      const patternKey = q.key as keyof typeof PATTERN_INTERPRETATIONS;
      const interpretations = PATTERN_INTERPRETATIONS[patternKey];
      
      if (answer && answer !== 'E' && interpretations[answer as keyof typeof interpretations]) {
        patterns[patternKey] = interpretations[answer as keyof typeof interpretations].pattern;
      } else if (answer === 'E') {
        patterns[patternKey] = 'custom';
      }
    });

    const mentorGuidance = generateMentorGuidance(patterns, rawAnswers);
    
    return {
      ...patterns,
      interpreted_at: new Date().toISOString(),
      mentor_guidance: mentorGuidance,
      raw_answers: rawAnswers,
      custom_responses: otherText,
    };
  };

  const generateMentorGuidance = (patterns: Record<string, any>, rawAnswers: Record<string, string>) => {
    const approaches: string[] = [];
    
    QUESTIONS.forEach((q) => {
      const answer = rawAnswers[q.id];
      const patternKey = q.key as keyof typeof PATTERN_INTERPRETATIONS;
      const interpretations = PATTERN_INTERPRETATIONS[patternKey];
      
      if (answer && answer !== 'E' && interpretations[answer as keyof typeof interpretations]) {
        approaches.push(interpretations[answer as keyof typeof interpretations].mentor_approach);
      }
    });

    let firstProjectType = 'Discovery-based project';
    if (patterns.energy_orientation === 'creator') {
      firstProjectType = 'Quick creation project';
    } else if (patterns.energy_orientation === 'refiner') {
      firstProjectType = 'Optimization project';
    } else if (patterns.energy_orientation === 'unstuck') {
      firstProjectType = 'Momentum-building micro-project';
    }

    return {
      approach: approaches.slice(0, 3).join('. '),
      avoid: patterns.hesitation_pattern === 'perfectionism' 
        ? 'Long planning phases or waiting for perfection' 
        : patterns.hesitation_pattern === 'overthinking'
        ? 'Extended analysis without action'
        : 'Generic advice without personalization',
      first_project_type: firstProjectType,
    };
  };

  const handleComplete = async (finalAnswers: Record<string, string>) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const actionPatterns = interpretPatterns(finalAnswers);

      // Save quest data
      await supabase.from("self_discovery_quests").insert({
        user_id: user.id,
        quest_type: 'unlock_quest',
        quest_data: {
          answers: finalAnswers,
          other_responses: otherText,
        },
        completed_at: new Date().toISOString(),
      });

      // Update profile with patterns + mark quest completed
      await supabase
        .from("profiles")
        .update({
          action_patterns: actionPatterns,
        })
        .eq("id", user.id);

      // These quick questions tailor the Atlas and mentor guidance. They are
      // not the Atlas onboarding itself: Council unlocks after the user has
      // created enough personal discoveries in the Atlas.
      toast.success("Your Atlas is ready to begin.");
      navigate("/atlas?intro=guide");
    } catch (error: any) {
      console.error("Error completing quest:", error);
      toast.error("Failed to save progress");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 py-12 flex items-center justify-center">
      <motion.div 
        className="max-w-lg w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {QUESTIONS.map((_, idx) => (
            <div 
              key={idx}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                idx === currentQuestion 
                  ? "w-8 bg-primary" 
                  : idx < currentQuestion 
                    ? "bg-primary" 
                    : "bg-muted"
              )}
            />
          ))}
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground">Quick Questions</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Helps your mentors understand how to guide you
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-border/50 shadow-xl">
              <CardContent className="p-6 space-y-6">
                <div className="text-center">
                  <span className="text-sm text-muted-foreground">
                    {currentQuestion + 1} of {QUESTIONS.length}
                  </span>
                  <h2 className="text-xl font-semibold mt-2">{question.question}</h2>
                </div>

                <div className="space-y-3">
                  {question.options.map((option) => (
                    <Button
                      key={option.key}
                      variant={answers[question.id] === option.key ? "default" : "outline"}
                      className={cn(
                        "w-full justify-start text-left h-auto py-4 px-5 transition-all",
                        answers[question.id] === option.key && "ring-2 ring-primary"
                      )}
                      onClick={() => handleSelect(option.key)}
                      disabled={saving}
                    >
                      <span className="font-semibold mr-3 text-muted-foreground">
                        {option.key}.
                      </span>
                      {option.label}
                    </Button>
                  ))}

                  {/* Other option */}
                  <div className="pt-2">
                    <Button
                      variant={answers[question.id] === 'E' ? "default" : "ghost"}
                      className="w-full justify-start text-left"
                      onClick={() => setAnswers({ ...answers, [question.id]: 'E' })}
                      disabled={saving}
                    >
                      <span className="font-semibold mr-3 text-muted-foreground">E.</span>
                      Other
                    </Button>
                    
                    {answers[question.id] === 'E' && (
                      <motion.div 
                        className="mt-3 space-y-3"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                      >
                        <Textarea
                          value={otherText[question.id] || ''}
                          onChange={(e) => setOtherText({ ...otherText, [question.id]: e.target.value })}
                          placeholder="Share your answer..."
                          className="min-h-[80px]"
                        />
                        <Button 
                          onClick={handleOtherSubmit}
                          disabled={saving}
                          className="w-full"
                        >
                          Continue
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {currentQuestion > 0 && (
          <Button
            variant="ghost"
            className="mt-4 mx-auto block"
            onClick={() => setCurrentQuestion(currentQuestion - 1)}
            disabled={saving}
          >
            ← Back
          </Button>
        )}
      </motion.div>
    </div>
  );
};

export default OnboardingQuest;
