import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, ChevronDown, ChevronUp, Sparkles, Target, AlertCircle, MessageCircle, Plus, Check, Calendar, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { useShadowEncounters } from "@/hooks/useShadowEncounters";
import { motion, AnimatePresence } from "framer-motion";
import { VoiceRecorder } from "@/components/VoiceRecorder";

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
  const [stage, setStage] = useState<'input' | 'clarifying' | 'complete' | 'action'>('input');
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
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [answerDialogOpen, setAnswerDialogOpen] = useState(false);
  const [questionTier, setQuestionTier] = useState<number>(1);
  const [voiceUrl, setVoiceUrl] = useState<string>("");
  const [clarifyingAnswers, setClarifyingAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [tasksGenerated, setTasksGenerated] = useState(false);
  const [goalData, setGoalData] = useState<{
    userDirection: string;
    mainGoal: {
      title: string;
      daily: string;
      weekly: string;
      monthly: string;
    };
    optionalGoals: Array<{
      title: string;
      description: string;
      added?: boolean;
    }>;
    mentorWhisper: {
      mentor: string;
      message: string;
      growthNeed: string;
    };
  } | null>(null);

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
        setQuestionTier(data.questionTier || 1);
        setQuestion(""); // Clear input for next response
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
    setSelectedQuestion(null);
    setAnswerDialogOpen(false);
    setQuestionTier(1);
    setVoiceUrl("");
    setClarifyingAnswers({});
    setCurrentAnswer("");
    setTasksGenerated(false);
    setGoalData(null);
  };

  const continueAsking = () => {
    setStage('input');
    setQuestion("");
    setAnswers({});
    setMirrorBack("");
    setEmotionalTone("");
    setBanter("");
    setFutureSelfInterruption("");
    setResolution("");
    setExpandedMentors(new Set());
    setTasksGenerated(false);
    setGoalData(null);
    // Keep conversation history and detected patterns
  };

  const handleReadyForAction = async () => {
    if (tasksGenerated) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-council-tasks", {
        body: {
          mentorAnswers: answers,
          question,
          emotionalTone,
          detectedPattern,
          conversationHistory,
        },
      });

      if (error) throw error;

      setGoalData(data);
      setTasksGenerated(true);
      setStage('action');
      toast.success("🔥 Your Guidance Is Ready!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOptionalGoal = async (goalIndex: number) => {
    if (!goalData) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const goal = goalData.optionalGoals[goalIndex];
      
      // Add to weekly goals as optional side goal
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + 1);
      
      await supabase.from("weekly_goals").insert({
        user_id: user.id,
        goal_text: goal.title,
        week_start: weekStart.toISOString().split('T')[0],
        completed: false,
        xp_awarded: false,
      });

      // Update local state
      setGoalData({
        ...goalData,
        optionalGoals: goalData.optionalGoals.map((g, i) => 
          i === goalIndex ? { ...g, added: true } : g
        ),
      });

      toast.success("Side goal added to your Goal Board! ✨");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleQuestionSelect = (q: string) => {
    setSelectedQuestion(q);
    setCurrentAnswer(clarifyingAnswers[q] || "");
    setAnswerDialogOpen(true);
  };

  const handleVoiceTranscription = (text: string, audioUrl: string) => {
    setCurrentAnswer(text);
    setVoiceUrl(audioUrl);
    toast.success("Voice transcribed - ready to send");
  };

  const submitClarifyingAnswer = async () => {
    if (!selectedQuestion || !currentAnswer.trim()) return;
    
    // Store this answer independently
    const updatedAnswers = {
      ...clarifyingAnswers,
      [selectedQuestion]: currentAnswer.trim()
    };
    setClarifyingAnswers(updatedAnswers);
    
    // Save to database as independent data point
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("insight_dots").insert({
          user_id: user.id,
          source_type: "council_clarification",
          core_theme: "Clarity Question",
          insight_text: `Q: ${selectedQuestion}\nA: ${currentAnswer.trim()}`,
          emotional_tone: emotionalTone || "reflective",
          skill_tags: ["self_reflection", "clarity"]
        });
      }
    } catch (error) {
      console.error("Error saving clarifying answer:", error);
    }
    
    // Close dialog and continue conversation
    setAnswerDialogOpen(false);
    setQuestion(currentAnswer.trim());
    setCurrentAnswer("");
    
    // Continue the conversation with this answer
    handleAsk(true);
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

        {/* Clarifying Questions Stage - Tap to Answer */}
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
                  <Badge variant="outline" className="ml-auto text-xs">
                    Tier {questionTier}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {questionTier === 1 && "Let's start with something simple:"}
                  {questionTier === 2 && "Now, let's dig a bit deeper:"}
                  {questionTier === 3 && "You're ready for deeper insight. Answer this:"}
                </p>
                <div className="space-y-2">
                  {clarifyingQuestions.map((q, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleQuestionSelect(q)}
                      className="w-full p-4 rounded-lg bg-gradient-to-r from-accent/10 to-primary/10 border-2 border-accent/30 hover:border-accent/60 transition-all text-left group"
                    >
                      <div className="flex items-start gap-3">
                        <MessageCircle className="w-5 h-5 text-accent mt-0.5 group-hover:scale-110 transition-transform" />
                        <p className="text-sm font-medium flex-1">{q}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground italic flex items-center gap-2">
                  <span>👆</span> Tap a question to answer it
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Answer Dialog */}
        <Dialog open={answerDialogOpen} onOpenChange={setAnswerDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg">Your Answer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedQuestion && (
                <div className="p-3 rounded-lg bg-muted/50 border-l-4 border-accent">
                  <p className="text-sm font-medium">{selectedQuestion}</p>
                </div>
              )}
              <Textarea
                placeholder="Type your answer here..."
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <div className="flex items-center justify-between gap-3 pt-2">
                <VoiceRecorder 
                  onTranscription={handleVoiceTranscription}
                  disabled={loading}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAnswerDialogOpen(false);
                      setCurrentAnswer("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={submitClarifyingAnswer}
                    disabled={loading || !currentAnswer.trim()}
                  >
                    Submit Answer
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
                const answerObj = typeof answer === 'object' ? answer : { emotional: answer, practical: [answer] };
                
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
                    <CardContent className="space-y-4">
                      {/* Emotional Guidance Layer */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            💭 Emotional Guidance
                          </span>
                        </div>
                        <p className="text-sm sm:text-base leading-relaxed font-medium text-foreground/90">
                          {answerObj.emotional}
                        </p>
                      </div>
                      
                      {/* Practical Action Layer */}
                      {answerObj.practical && answerObj.practical.length > 0 && (
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <div className="pt-3 border-t border-border/50 space-y-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                                    ⚡ Practical Action
                                  </span>
                                </div>
                                <ul className="space-y-2">
                                  {answerObj.practical.map((step: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                      <span className="text-accent font-bold mt-0.5">•</span>
                                      <span className="flex-1">{step}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpand(mentorType)}
                        className="w-full text-xs"
                      >
                        {isExpanded ? (
                          <><ChevronUp className="w-3 h-3 mr-1" />Hide Action Steps</>
                        ) : (
                          <><ChevronDown className="w-3 h-3 mr-1" />Show Action Steps</>
                        )}
                      </Button>
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

            {/* Gentle Action Prompt */}
            {!tasksGenerated && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-transparent">
                  <CardContent className="pt-6 space-y-4">
                    <p className="text-sm text-muted-foreground italic text-center">
                      💭 When you feel ready, we can turn this clarity into action...
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        onClick={continueAsking} 
                        variant="outline" 
                        className="flex-1"
                        size="lg"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Keep Asking
                      </Button>
                      <Button 
                        onClick={handleReadyForAction}
                        disabled={loading}
                        className="flex-1"
                        size="lg"
                      >
                        <Target className="w-4 h-4 mr-2" />
                        {loading ? "Creating Tasks..." : "I'm Ready for Action"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Action Phase - Comprehensive Goal Display */}
            {tasksGenerated && goalData && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                {/* Header */}
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent flex items-center justify-center gap-2">
                    <Sparkles className="w-6 h-6 text-primary" />
                    Your Guidance Is Ready
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {goalData.userDirection}
                  </p>
                </div>

                {/* Main Goal Card */}
                <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/10 to-accent/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      MAIN GOAL
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-lg font-semibold">{goalData.mainGoal.title}</p>
                    
                    <div className="space-y-3 pt-2">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <Target className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Daily Task</p>
                          <p className="text-sm">{goalData.mainGoal.daily}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Weekly Milestone</p>
                          <p className="text-sm">{goalData.mainGoal.weekly}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                        <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                          <CalendarDays className="w-4 h-4 text-secondary-foreground" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Monthly Objective</p>
                          <p className="text-sm">{goalData.mainGoal.monthly}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Optional Side Goals */}
                <Card className="border border-accent/30">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-accent" />
                      OPTIONAL SIDE GOALS
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Bonus missions to support your growth
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {goalData.optionalGoals.map((goal, idx) => (
                      <div 
                        key={idx}
                        className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border/50 hover:border-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{idx + 1}. {goal.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{goal.description}</p>
                        </div>
                        <Button
                          size="sm"
                          variant={goal.added ? "secondary" : "outline"}
                          onClick={() => handleAddOptionalGoal(idx)}
                          disabled={goal.added}
                          className="flex-shrink-0"
                        >
                          {goal.added ? (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              Added
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3 mr-1" />
                              Add to Goals
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Mentor Whisper */}
                <Card className="border-2 border-accent/50 bg-gradient-to-br from-accent/5 to-primary/5">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-accent" />
                      Private Whisper from {mentorNames[goalData.mentorWhisper.mentor] || goalData.mentorWhisper.mentor.replace(/_/g, ' ')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed italic whitespace-pre-line">
                      {goalData.mentorWhisper.message}
                    </p>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={() => navigate("/future-self/goal-structure")} className="flex-1" size="lg">
                    <Target className="w-4 h-4 mr-2" />
                    View Goal Board
                  </Button>
                  <Button onClick={() => navigate("/chat")} variant="outline" className="flex-1">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Reply to {mentorNames[goalData.mentorWhisper.mentor]?.split(' ')[0] || 'Mentor'}
                  </Button>
                </div>

                <Button onClick={resetConversation} variant="ghost" className="w-full">
                  Start Fresh Conversation
                </Button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CouncilMeeting;