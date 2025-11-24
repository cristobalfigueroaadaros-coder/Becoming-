import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ChevronDown, ChevronUp, Sparkles, Target, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useShadowEncounters } from "@/hooks/useShadowEncounters";
import { motion, AnimatePresence } from "framer-motion";

const mentorNames: Record<string, string> = {
  mamba_mentor: "Mamba Mentor",
  creative_visionary: "Creative Visionary",
  quantum_inventor: "Quantum Inventor",
  ancient_sage: "Ancient Sage",
  compassionate_elder: "Compassionate Elder",
  future_self: "Future Self",
  business_mentor: "Business Mentor",
  creator_mentor: "Creator Mentor",
  mystic_mentor: "Mystic Mentor",
  heart_mentor: "Heart Mentor",
  strategist_mentor: "Strategist Mentor",
  explorer_mentor: "Explorer Mentor",
};

const emotionalIcons: Record<string, string> = {
  fear: "😰",
  anxiety: "😓",
  confusion: "🤔",
  overwhelm: "😵",
  excitement: "🤩",
  motivation: "💪",
  shame: "😔",
  anger: "😤",
  sadness: "😢",
  breakthrough: "✨",
  neutral: "💭"
};

const CouncilMeeting = () => {
  const navigate = useNavigate();
  const { refetch } = useShadowEncounters();
  const [question, setQuestion] = useState("");
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [expandedMentors, setExpandedMentors] = useState<Set<string>>(new Set());
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  
  // New state for enhanced features
  const [stage, setStage] = useState<'input' | 'clarifying' | 'complete'>('input');
  const [mirrorBack, setMirrorBack] = useState("");
  const [clarifyingQuestions, setClarifyingQuestions] = useState<string[]>([]);
  const [emotionalTone, setEmotionalTone] = useState<string>("");
  const [detectedPattern, setDetectedPattern] = useState<string | null>(null);
  const [patternCount, setPatternCount] = useState<number | undefined>(undefined);
  const [isThresholdMoment, setIsThresholdMoment] = useState(false);
  const [banter, setBanter] = useState("");
  const [futureSelfInterruption, setFutureSelfInterruption] = useState("");
  const [resolution, setResolution] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleExpand = (mentorType: string) => {
    setExpandedMentors((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(mentorType)) {
        newSet.delete(mentorType);
      } else {
        newSet.add(mentorType);
      }
      return newSet;
    });
  };

  const handleAsk = async (continueConversation = false) => {
    if (!question.trim() || loading) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: mentors } = await supabase
        .from("user_mentors")
        .select("mentor_type")
        .eq("user_id", user.id);

      const currentHistory = continueConversation ? conversationHistory : [];

      const { data, error } = await supabase.functions.invoke("council-meeting", {
        body: {
          question: question.trim(),
          mentorTypes: [...(mentors?.map(m => m.mentor_type) || []), "future_self"],
          conversationHistory: currentHistory,
        },
      });

      if (error) throw error;

      // Update conversation history
      setConversationHistory([
        ...currentHistory,
        { role: 'user', content: question.trim() },
        { role: 'council', content: data }
      ]);

      if (data.stage === 'clarifying') {
        // Show clarifying questions
        setStage('clarifying');
        setMirrorBack(data.mirrorBack || "");
        setClarifyingQuestions(data.clarifyingQuestions || []);
        setEmotionalTone(data.emotionalTone || "");
        setDetectedPattern(data.detectedPattern);
        setPatternCount(data.patternCount);
        toast.info("The Council seeks to understand deeper...");
      } else {
        // Complete response
        setStage('complete');
        setMirrorBack(data.mirrorBack || "");
        setAnswers(data.answers || {});
        setBanter(data.banter || "");
        setFutureSelfInterruption(data.futureSelfInterruption || "");
        setResolution(data.resolution || "");
        setEmotionalTone(data.emotionalTone || "");
        setDetectedPattern(data.detectedPattern);
        setPatternCount(data.patternCount);
        setIsThresholdMoment(data.isThresholdMoment || false);

        // Save meeting to database
        await supabase.from("council_meetings").insert({
          user_id: user.id,
          question: question.trim(),
          answers: data.answers,
          banter: data.banter || null,
          resolution: data.resolution || null,
          emotional_tone: data.emotionalTone,
          threshold_moment: data.isThresholdMoment || false,
          pattern_detected: data.detectedPattern,
          clarifying_questions: clarifyingQuestions.length > 0 ? clarifyingQuestions : null,
          conversation_flow: conversationHistory,
          shadow_triggers: data.shadowTriggers || {},
        });

        toast.success(data.isThresholdMoment ? "✨ Threshold moment detected!" : "Council has responded!");
        refetch();
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetConversation = () => {
    setQuestion("");
    setAnswers({});
    setStage('input');
    setMirrorBack("");
    setClarifyingQuestions([]);
    setEmotionalTone("");
    setDetectedPattern(null);
    setPatternCount(undefined);
    setIsThresholdMoment(false);
    setBanter("");
    setFutureSelfInterruption("");
    setResolution("");
    setConversationHistory([]);
    setExpandedMentors(new Set());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-4xl font-bold">Council Meeting</h1>
            <p className="text-muted-foreground mt-2">
              Deep wisdom through clarifying questions and threshold moments
            </p>
          </div>
        </div>

        {/* Question Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Question</span>
              {emotionalTone && (
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{emotionalIcons[emotionalTone] || emotionalIcons.neutral}</span>
                  <Badge variant="outline" className="text-xs capitalize">
                    {emotionalTone}
                  </Badge>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="What question would you like to ask your council?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={4}
              disabled={loading || stage === 'complete'}
            />
            <Button
              onClick={() => handleAsk(stage === 'clarifying')}
              disabled={loading || !question.trim() || stage === 'complete'}
              className="w-full"
              size="lg"
            >
              {loading ? "Consulting the council..." : stage === 'clarifying' ? "Answer & Continue" : "Ask the Council"}
            </Button>
          </CardContent>
        </Card>

        {/* Pattern Alert */}
        {detectedPattern && patternCount && patternCount > 2 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-2 border-destructive/50 bg-destructive/5">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                  <div>
                    <p className="font-semibold text-destructive">Pattern Detected</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      "{detectedPattern.replace(/_/g, ' ')}" has appeared {patternCount} times. 
                      The Council sees this pattern and will address it.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Mirror-Back Reflection */}
        {mirrorBack && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-4">
                <p className="text-sm italic leading-relaxed">
                  💭 <strong>Council reflects:</strong> {mirrorBack}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Clarifying Questions Stage */}
        {stage === 'clarifying' && clarifyingQuestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-2 border-accent/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-accent" />
                  The Council Seeks Clarity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Before offering guidance, we need to understand your intention deeper:
                </p>
                <div className="space-y-2">
                  {clarifyingQuestions.map((q, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-muted/50 border-l-4 border-accent">
                      <p className="text-sm font-medium">{q}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground italic">
                  Answer the question above to continue the conversation...
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Mentor Answers (Complete Stage) */}
        {stage === 'complete' && Object.keys(answers).length > 0 && (
          <div className="space-y-6">
            {/* Threshold Moment Banner */}
            {isThresholdMoment && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-lg bg-gradient-to-r from-primary/20 to-accent/20 border-2 border-primary/50"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-primary" />
                  <div>
                    <p className="font-bold text-lg">Threshold Moment Detected</p>
                    <p className="text-sm text-muted-foreground">
                      You're at a turning point. Let's turn this clarity into action.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Mentor Responses */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Council Responses
              </h2>
              {Object.entries(answers).map(([mentorType, answer]) => {
                const isExpanded = expandedMentors.has(mentorType);
                const answerObj = typeof answer === 'object' ? answer : { short: answer, expanded: answer };
                
                return (
                  <Card key={mentorType} className="border-l-4 border-l-primary/50 overflow-hidden">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        {mentorNames[mentorType]}
                        {answerObj.coreTheme && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {answerObj.coreTheme}
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm sm:text-base leading-relaxed font-medium">
                        {answerObj.short}
                      </p>
                      
                      <AnimatePresence>
                        {isExpanded && answerObj.expanded !== answerObj.short && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="pt-3 border-t border-border/50">
                              <p className="text-sm leading-relaxed text-muted-foreground">
                                {answerObj.expanded}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      {answerObj.expanded !== answerObj.short && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand(mentorType)}
                          className="w-full text-xs"
                        >
                          {isExpanded ? (
                            <><ChevronUp className="w-3 h-3 mr-1" />Show less</>
                          ) : (
                            <><ChevronDown className="w-3 h-3 mr-1" />Expand deeper wisdom</>
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Banter */}
            {banter && (
              <div className="space-y-3">
                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                <Card className="bg-muted/30">
                  <CardHeader>
                    <CardTitle className="text-sm">🗣️ Council Banter</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed whitespace-pre-line italic">
                      {banter}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Future Self Interruption */}
            {futureSelfInterruption && (
              <div className="space-y-3">
                <div className="h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
                <Card className="border-2 border-accent/50 bg-gradient-to-br from-accent/5 to-primary/5">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-accent" />
                      Future Self Speaks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed font-medium">
                      {futureSelfInterruption}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Resolution */}
            {resolution && (
              <div className="space-y-3">
                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
                  <CardHeader>
                    <CardTitle className="text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      ✨ Council Resolution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm sm:text-base leading-relaxed font-medium">
                      {resolution}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button onClick={() => navigate("/my-tasks")} className="flex-1" size="lg">
                View Tasks
              </Button>
              <Button onClick={() => navigate("/future-self/constellation")} variant="outline" className="flex-1">
                View Mapping Dots
              </Button>
              <Button onClick={resetConversation} variant="outline" className="flex-1">
                New Question
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CouncilMeeting;