import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Sparkles, Target, MessageCircle, RefreshCw, GitBranch, Bell } from "lucide-react";
import { toast } from "sonner";
import { useShadowEncounters } from "@/hooks/useShadowEncounters";
import { motion } from "framer-motion";
import { VoiceRecorder } from "@/components/VoiceRecorder";

// Updated mentor names with new 12-mentor system
const mentorNames: Record<string, string> = {
  discipline_mentor: "Discipline Mentor",
  strategist_mentor: "Strategist Mentor",
  creative_visionary: "Creative Visionary",
  quantum_inventor: "Quantum Inventor",
  mystic_mentor: "Mystic Mentor",
  business_mentor: "Business Mentor",
  marketing_mentor: "Marketing Mentor",
  scientific_mentor: "Scientific Mentor",
  heart_mentor: "Heart Mentor",
  ancient_sage: "Ancient Sage",
  alignment_mentor: "Alignment Mentor",
  oracle_mother: "Oracle Mother",
  future_self: "Future Self",
};

const CouncilMeeting = () => {
  const navigate = useNavigate();
  const { refetch } = useShadowEncounters();
  const [question, setQuestion] = useState("");
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  
  // New state for 3-question journey
  const [stage, setStage] = useState<'input' | 'seeking_clarity' | 'complete' | 'action'>('input');
  const [questionNumber, setQuestionNumber] = useState<number>(0);
  const [clarityQuestion, setClarityQuestion] = useState<string>("");
  const [councilInsight, setCouncilInsight] = useState("");
  const [mentorPerspectives, setMentorPerspectives] = useState<Record<string, string>>({});
  const [banterLines, setBanterLines] = useState<Array<{mentor: string, text: string, color: string}>>([]);
  const [emotionalReflection, setEmotionalReflection] = useState("");
  const [suggestedNextQuestion, setSuggestedNextQuestion] = useState<string | null>(null);
  const [councilGuidance, setCouncilGuidance] = useState<string | null>(null);
  const [recommendedMentor, setRecommendedMentor] = useState<string | null>(null);
  const [mentorDM, setMentorDM] = useState<{mentor: string, mentorName: string, message: string, color: string} | null>(null);
  const [loading, setLoading] = useState(false);
  const [voiceUrl, setVoiceUrl] = useState<string>("");
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [answerDialogOpen, setAnswerDialogOpen] = useState(false);
  const [tasksGenerated, setTasksGenerated] = useState(false);
  const [mainGoalAccepted, setMainGoalAccepted] = useState(false);
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

  // Track if we have an active thread
  const hasActiveThread = conversationHistory.length > 0;
  const isQ3 = questionNumber >= 3;

  const handleAsk = async (continueConversation = false, questionOverride?: string) => {
    const actualQuestion = questionOverride ?? question.trim();
    if (!actualQuestion || loading) return;

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
          question: actualQuestion,
          mentorTypes: [...(mentors?.map(m => m.mentor_type) || []), "future_self"],
          conversationHistory: currentHistory,
        },
      });

      if (error) throw error;

      // Update conversation history
      setConversationHistory([
        ...currentHistory,
        { role: 'user', content: actualQuestion },
        { role: 'council', content: data }
      ]);

      if (data.stage === 'seeking_clarity') {
        // Q2 ONLY: Council Seeking Clarity
        setStage('seeking_clarity');
        setClarityQuestion(data.clarityQuestion || "");
        setQuestionNumber(data.questionNumber);
        setQuestion(""); // Clear input for next response
        toast.info("The Council seeks to understand deeper...");
      } else {
        // Complete response
        setStage('complete');
        setQuestionNumber(data.questionNumber || 0);
        setCouncilInsight(data.councilInsight || "");
        setMentorPerspectives(data.mentorPerspectives || {});
        setBanterLines(data.banterLines || []);
        setEmotionalReflection(data.emotionalReflection || "");
        setSuggestedNextQuestion(data.suggestedNextQuestion || null);
        setCouncilGuidance(data.councilGuidance || null);
        setRecommendedMentor(data.recommendedMentor || null);
        setMentorDM(data.mentorDM || null);

        toast.success(data.questionNumber >= 3 ? "✨ Q3: Momentum phase!" : "Council has responded!");
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
    setStage('input');
    setQuestionNumber(0);
    setClarityQuestion("");
    setCouncilInsight("");
    setMentorPerspectives({});
    setBanterLines([]);
    setEmotionalReflection("");
    setSuggestedNextQuestion(null);
    setCouncilGuidance(null);
    setRecommendedMentor(null);
    setMentorDM(null);
    setConversationHistory([]);
    setVoiceUrl("");
    setCurrentAnswer("");
    setTasksGenerated(false);
    setMainGoalAccepted(false);
    setGoalData(null);
  };

  const continueAsking = () => {
    setStage('input');
    setQuestion("");
    setCouncilInsight("");
    setMentorPerspectives({});
    setBanterLines([]);
    setEmotionalReflection("");
    setSuggestedNextQuestion(null);
    setTasksGenerated(false);
    setMainGoalAccepted(false);
    setGoalData(null);
    // Keep conversation history and question number
  };

  const handleReadyForAction = async () => {
    if (tasksGenerated) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-council-tasks", {
        body: {
          mentorAnswers: mentorPerspectives,
          question,
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

  const handleVoiceTranscription = (text: string, audioUrl: string) => {
    setCurrentAnswer(text);
    setVoiceUrl(audioUrl);
    toast.success("Voice transcribed - ready to send");
  };

  const submitClarityAnswer = async () => {
    if (!currentAnswer.trim()) return;
    
    const answer = currentAnswer.trim();
    setAnswerDialogOpen(false);
    setQuestion(answer);  // Still set state for UI consistency
    setCurrentAnswer("");
    
    // Pass the answer directly - don't rely on state update
    handleAsk(true, answer);
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
              {questionNumber === 0 && "Deep wisdom through a 3-question journey"}
              {questionNumber === 1 && "Q1: Discovery - Light, welcoming, inspiring"}
              {questionNumber === 2 && "Q2: Depth - Council Seeking Clarity"}
              {questionNumber >= 3 && "Q3: Momentum - Ready for action"}
            </p>
          </div>
          {mentorDM && (
            <Button variant="outline" className="relative" onClick={() => toast.info(mentorDM.message)}>
              <Bell className="w-4 h-4 mr-2" style={{ color: mentorDM.color }} />
              {mentorDM.mentorName}
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center" style={{ backgroundColor: mentorDM.color }}>
                1
              </Badge>
            </Button>
          )}
        </div>

        {/* Active Thread Indicator */}
        {hasActiveThread && stage === 'input' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-accent/30 bg-accent/5">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GitBranch className="w-5 h-5 text-accent" />
                    <div>
                      <p className="text-sm font-medium">Active Thread</p>
                      <p className="text-xs text-muted-foreground">
                        Question {questionNumber} in this conversation
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={resetConversation}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    New Topic
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Question Input */}
        <Card>
          <CardHeader>
            <CardTitle>Ask the Council</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder={hasActiveThread 
                ? "Continue exploring this topic..." 
                : "What question would you like to ask your council?"}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={4}
              disabled={loading || stage === 'complete' || stage === 'seeking_clarity'}
            />
            
            {/* Thread Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {hasActiveThread ? (
                <>
                  <Button
                    onClick={() => handleAsk(true)}
                    disabled={loading || !question.trim() || stage === 'complete' || stage === 'seeking_clarity'}
                    className="flex-1"
                    size="lg"
                  >
                    <GitBranch className="w-4 h-4 mr-2" />
                    {loading ? "Consulting..." : "Continue This Thread"}
                  </Button>
                  <Button
                    onClick={() => {
                      resetConversation();
                      if (question.trim()) {
                        setTimeout(() => handleAsk(false), 100);
                      }
                    }}
                    disabled={loading || !question.trim() || stage === 'complete' || stage === 'seeking_clarity'}
                    variant="outline"
                    className="flex-1"
                    size="lg"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Start New Topic
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => handleAsk(false)}
                  disabled={loading || !question.trim() || stage === 'complete' || stage === 'seeking_clarity'}
                  className="w-full"
                  size="lg"
                >
                  {loading ? "Consulting the council..." : "Ask the Council"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Q2 ONLY: Council Seeking Clarity */}
        {stage === 'seeking_clarity' && clarityQuestion && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-2 border-accent/50 bg-accent/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-accent" />
                  Council Seeking Clarity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Before we go deeper, the Council needs to understand:
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setAnswerDialogOpen(true)}
                  className="w-full p-4 rounded-lg bg-gradient-to-r from-accent/10 to-primary/10 border-2 border-accent/30 hover:border-accent/60 transition-all text-left group"
                >
                  <div className="flex items-start gap-3">
                    <MessageCircle className="w-5 h-5 text-accent mt-0.5 group-hover:scale-110 transition-transform" />
                    <p className="text-sm font-medium flex-1">{clarityQuestion}</p>
                  </div>
                </motion.button>
                <p className="text-xs text-muted-foreground italic flex items-center gap-2">
                  <span>👆</span> Tap to answer this question
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
              {clarityQuestion && (
                <div className="p-3 rounded-lg bg-muted/50 border-l-4 border-accent">
                  <p className="text-sm font-medium">{clarityQuestion}</p>
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
                    onClick={submitClarityAnswer}
                    disabled={loading || !currentAnswer.trim()}
                  >
                    Submit Answer
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Complete Stage - Council Response */}
        {stage === 'complete' && Object.keys(mentorPerspectives).length > 0 && (
          <div className="space-y-6">
            {/* 1. COUNCIL INSIGHT */}
            {councilInsight && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-transparent">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-accent">
                      <span className="text-lg">🔮</span>
                      Council Insight
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm sm:text-base leading-relaxed font-medium">
                      {councilInsight}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* 2. MENTOR MICRO-PERSPECTIVES */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="text-xl">👁️</span>
                Mentor Perspectives
              </h2>
              <div className="grid gap-3">
                {Object.entries(mentorPerspectives).map(([mentorType, perspective], idx) => (
                  <motion.div
                    key={mentorType}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="border-l-4 border-l-primary/50">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold">
                              {(mentorNames[mentorType] || mentorType).charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-primary">
                              {mentorNames[mentorType] || mentorType.replace(/_/g, ' ')}
                            </p>
                            <p className="text-sm leading-relaxed mt-1 text-muted-foreground">
                              {perspective}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* 3. COUNCIL BANTER (WhatsApp-style) */}
            {banterLines.length > 0 && (
              <div className="space-y-3">
                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                <Card className="bg-muted/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">💬 Council Banter</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 px-3 py-4">
                    {banterLines.map((line, idx) => {
                      const isEven = idx % 2 === 0;
                      const cleanText = line.text.replace(/\*\*/g, '');
                      
                      // Add contextual emoji based on mentor and text
                      const getEmoji = () => {
                        if (cleanText.toLowerCase().includes('build') || cleanText.toLowerCase().includes('create')) return '🚀';
                        if (cleanText.toLowerCase().includes('energy') || cleanText.toLowerCase().includes('frequency')) return '⚡';
                        if (cleanText.toLowerCase().includes('vision') || cleanText.toLowerCase().includes('dream')) return '✨';
                        if (cleanText.toLowerCase().includes('action') || cleanText.toLowerCase().includes('move')) return '🎯';
                        if (cleanText.toLowerCase().includes('wisdom') || cleanText.toLowerCase().includes('truth')) return '🧘';
                        if (cleanText.toLowerCase().includes('heart') || cleanText.toLowerCase().includes('love')) return '❤️';
                        return '';
                      };
                      
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: isEven ? -20 : 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.15 }}
                          className={`flex ${isEven ? 'justify-start' : 'justify-end'}`}
                        >
                          <div 
                            className={`px-4 py-2.5 rounded-2xl max-w-[85%] shadow-sm ${
                              isEven 
                                ? 'rounded-tl-sm bg-muted' 
                                : 'rounded-tr-sm'
                            }`}
                            style={{ 
                              backgroundColor: isEven ? undefined : line.color + '15',
                              borderLeft: isEven ? `3px solid ${line.color}` : undefined,
                              borderRight: !isEven ? `3px solid ${line.color}` : undefined,
                            }}
                          >
                            <p className="text-xs font-semibold mb-1" style={{ color: line.color }}>
                              {line.mentor}
                            </p>
                            <p className="text-sm leading-relaxed text-foreground">
                              {cleanText} {getEmoji()}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 4. EMOTIONAL REFLECTION */}
            {emotionalReflection && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-primary">
                      <span className="text-lg">💫</span>
                      Emotional Reflection
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm sm:text-base leading-relaxed italic">
                      {emotionalReflection}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* 5. SUGGESTED NEXT QUESTION (NOT in Q3) */}
            {suggestedNextQuestion && !isQ3 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border border-dashed border-accent/50 bg-accent/5">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      💭 The Council suggests:
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-left h-auto py-3"
                      onClick={() => {
                        setQuestion(suggestedNextQuestion);
                        continueAsking();
                      }}
                    >
                      {suggestedNextQuestion}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* 6. Q3 ONLY: COUNCIL GUIDANCE */}
            {isQ3 && councilGuidance && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/10 to-accent/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Council Guidance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm sm:text-base leading-relaxed font-medium">
                      {councilGuidance}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Thread Continuation Options */}
            {!tasksGenerated && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-transparent">
                  <CardContent className="pt-6 space-y-4">
                    <p className="text-sm text-muted-foreground italic text-center">
                      💭 Would you like to continue this topic or begin a new one?
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        onClick={continueAsking} 
                        variant="outline" 
                        className="flex-1"
                        size="lg"
                      >
                        <GitBranch className="w-4 h-4 mr-2" />
                        Continue This Conversation
                      </Button>
                      <Button 
                        onClick={resetConversation} 
                        variant="ghost" 
                        className="flex-1"
                        size="lg"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Start New Question
                      </Button>
                    </div>
                    <div className="pt-2 border-t border-border/50">
                      <Button 
                        onClick={handleReadyForAction}
                        disabled={loading}
                        className="w-full"
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
          </div>
        )}

        {/* Action Stage - Display Goals */}
        {stage === 'action' && goalData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* User Direction */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Your Direction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/90">{goalData.userDirection}</p>
              </CardContent>
            </Card>

            {/* Main Goal */}
            <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-secondary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Your Main Goal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-lg mb-3">{goalData.mainGoal.title}</h4>
                  
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-background/50">
                      <p className="text-sm font-medium text-primary mb-1">Daily Micro-Step</p>
                      <p className="text-sm text-foreground/80">{goalData.mainGoal.daily}</p>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-background/50">
                      <p className="text-sm font-medium text-primary mb-1">Weekly Step</p>
                      <p className="text-sm text-foreground/80">{goalData.mainGoal.weekly}</p>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-background/50">
                      <p className="text-sm font-medium text-primary mb-1">Monthly Outcome</p>
                      <p className="text-sm text-foreground/80">{goalData.mainGoal.monthly}</p>
                    </div>
                  </div>
                </div>

                {!mainGoalAccepted ? (
                  <Button 
                    onClick={() => {
                      setMainGoalAccepted(true);
                      toast.success("Goal accepted! View your tasks or explore optional goals below.");
                    }}
                    className="w-full"
                  >
                    Accept Main Goal
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => navigate('/my-tasks')}
                      className="flex-1"
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Go to My Tasks
                    </Button>
                    <Badge className="bg-green-500 text-white px-4 py-2 text-sm flex items-center gap-2">
                      ✓ Accepted
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Optional Goals */}
            {goalData.optionalGoals && goalData.optionalGoals.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Additional Growth Opportunities</h3>
                <div className="grid gap-4">
                  {goalData.optionalGoals.map((goal: any, index: number) => (
                    <Card key={index} className="border-accent/20 bg-gradient-to-br from-accent/5 to-background">
                      <CardHeader>
                        <CardTitle className="text-base">{goal.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2 text-sm">
                          <p><span className="font-medium text-primary">Daily:</span> {goal.daily}</p>
                          <p><span className="font-medium text-primary">Weekly:</span> {goal.weekly}</p>
                          <p><span className="font-medium text-primary">Monthly:</span> {goal.monthly}</p>
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          size="sm"
                          onClick={() => toast.success("Optional goal added!")}
                        >
                          Add This Goal
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Mentor Whisper */}
            {goalData.mentorWhisper && (
              <Card className="border-secondary/20 bg-gradient-to-br from-secondary/5 to-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-secondary" />
                    Message from {goalData.mentorWhisper.mentor}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/90 italic">"{goalData.mentorWhisper.message}"</p>
                </CardContent>
              </Card>
            )}

            {/* Back to Council Button */}
            <Button 
              variant="outline" 
              onClick={continueAsking}
              className="w-full"
            >
              Continue Conversation
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CouncilMeeting;
