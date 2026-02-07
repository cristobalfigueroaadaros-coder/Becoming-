import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Sparkles, Target, MessageCircle, RefreshCw, GitBranch, Loader2, Flame } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { HighlightedText } from "@/components/HighlightedText";
import { InsightActionButton } from "@/components/InsightActionButton";
import { PatternDiscoveryCard, PatternCelebration } from "@/components/pattern-map";
import { useInnerPatterns } from "@/hooks/useInnerPatterns";

// Types for conversation history
interface ConversationEntry {
  role: 'user' | 'council';
  content: string | {
    councilInsight?: string;
    mentorPerspectives?: Record<string, string>;
    stage?: string;
    clarityQuestion?: string;
    questionNumber?: number;
    banterLines?: Array<{mentor: string; text: string; color: string}>;
    emotionalReflection?: string;
    suggestedNextQuestion?: string | null;
    suggestedMentor?: { targetMentor: string; reason: string } | null;
  };
}

// Transmutation Council mentors
const TRANSMUTATION_MENTORS = ['storybreaker_mentor', 'phoenix_mentor', 'stoic_mentor'] as const;

const mentorNames: Record<string, string> = {
  storybreaker_mentor: "Storybreaker",
  phoenix_mentor: "Phoenix",
  stoic_mentor: "Stoic",
};

const mentorIcons: Record<string, string> = {
  storybreaker_mentor: "📖",
  phoenix_mentor: "🔥",
  stoic_mentor: "⚖️",
};

const mentorColors: Record<string, string> = {
  storybreaker_mentor: "#e11d48",
  phoenix_mentor: "#f97316",
  stoic_mentor: "#78716c",
};

const TransmutationCouncil = () => {
  const navigate = useNavigate();
  const { createPattern } = useInnerPatterns();

  // Stage-based state (matching BuildersTeam)
  const [stage, setStage] = useState<'input' | 'seeking_clarity' | 'complete'>('input');
  const [question, setQuestion] = useState("");
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([]);
  const [questionNumber, setQuestionNumber] = useState<number>(0);
  const [clarityQuestion, setClarityQuestion] = useState<string>("");
  const [councilInsight, setCouncilInsight] = useState("");
  const [mentorPerspectives, setMentorPerspectives] = useState<Record<string, string>>({});
  const [banterLines, setBanterLines] = useState<Array<{mentor: string, text: string, color: string}>>([]);
  const [emotionalReflection, setEmotionalReflection] = useState("");
  const [suggestedNextQuestion, setSuggestedNextQuestion] = useState<string | null>(null);
  const [suggestedMentor, setSuggestedMentor] = useState<{ targetMentor: string; reason: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [voiceUrl, setVoiceUrl] = useState<string>("");
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [answerDialogOpen, setAnswerDialogOpen] = useState(false);

  // State detection for onboarding
  const [hasCompletedTransmutation, setHasCompletedTransmutation] = useState(false);
  const [isLoadingState, setIsLoadingState] = useState(true);

  // Pattern detection state
  const [patternDetection, setPatternDetection] = useState<any>(null);
  const [showPatternCard, setShowPatternCard] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Track if we have an active thread
  const hasActiveThread = conversationHistory.length > 0;

  // Check transmutation history on mount
  useEffect(() => {
    const checkTransmutationHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoadingState(false);
        return;
      }
      
      const { data: transmutedPatterns } = await supabase
        .from("inner_patterns")
        .select("id")
        .eq("user_id", user.id)
        .or("status.eq.transmuted,transformed_at.not.is.null")
        .limit(1);
      
      if (transmutedPatterns && transmutedPatterns.length > 0) {
        setHasCompletedTransmutation(true);
      }
      setIsLoadingState(false);
    };
    checkTransmutationHistory();
  }, []);

  const handleAsk = async (continueConversation = false, questionOverride?: string) => {
    const actualQuestion = questionOverride ?? question.trim();
    if (!actualQuestion || loading) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshData.session) {
          toast.error("Your session has expired. Please sign in again.");
          navigate("/");
          setLoading(false);
          return;
        }
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Unable to verify your session. Please sign in again.");
        navigate("/");
        setLoading(false);
        return;
      }

      const currentHistory = continueConversation ? conversationHistory : [];

      const { data, error } = await supabase.functions.invoke("council-meeting", {
        body: {
          question: actualQuestion,
          questionNumber: currentHistory.length > 0 ? questionNumber + 1 : 1,
          councilType: "transmutation",
          mentorTypes: [...TRANSMUTATION_MENTORS],
          conversationHistory: currentHistory.map(entry => 
            typeof entry.content === 'string' 
              ? { role: entry.role, content: entry.content }
              : { role: entry.role, content: JSON.stringify(entry.content) }
          ),
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
        setStage('seeking_clarity');
        setClarityQuestion(data.clarityQuestion || "");
        setQuestionNumber(data.questionNumber);
        setQuestion("");
        toast.info("The Council needs more clarity...");
      } else {
        setStage('complete');
        setQuestionNumber(data.questionNumber || 0);
        setCouncilInsight(data.councilInsight || "");
        setMentorPerspectives(data.mentorPerspectives || {});
        setBanterLines(data.banterLines || []);
        setEmotionalReflection(data.emotionalReflection || "");
        setSuggestedNextQuestion(data.suggestedNextQuestion || null);
        setSuggestedMentor(data.suggestedMentor || null);

        // Check for pattern detection
        if (data?.patternDetection) {
          setPatternDetection(data.patternDetection);
          setShowPatternCard(true);
        }

        toast.success("The Council has responded!");
      }
    } catch (error: any) {
      console.error("Error in Transmutation Council:", error);
      toast.error(error.message || "Failed to get council response");
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
    setSuggestedMentor(null);
    setConversationHistory([]);
    setVoiceUrl("");
    setCurrentAnswer("");
  };

  const continueAsking = (prefillQuestion?: string) => {
    setStage('input');
    setQuestion(prefillQuestion || "");
    setCouncilInsight("");
    setMentorPerspectives({});
    setBanterLines([]);
    setEmotionalReflection("");
    setSuggestedNextQuestion(null);
    setSuggestedMentor(null);
  };

  const handleMentorHandoff = async (targetMentor: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to continue");
        navigate("/");
        return;
      }

      // Build source messages from the Transmutation Council conversation
      const sourceMessages = conversationHistory.flatMap((entry: ConversationEntry) => {
        const messages: Array<{ role: string; content: string }> = [];
        if (entry.role === 'user' && typeof entry.content === 'string') {
          messages.push({ role: 'user', content: entry.content });
        } else if (entry.role === 'council' && typeof entry.content === 'object' && entry.content) {
          // Include council insight as context
          if (entry.content.councilInsight) {
            messages.push({ 
              role: 'assistant', 
              content: `Council Insight: ${entry.content.councilInsight}` 
            });
          }
          // Include relevant mentor perspective
          if (entry.content.mentorPerspectives?.[targetMentor]) {
            messages.push({ 
              role: 'assistant', 
              content: `${mentorNames[targetMentor]}: ${entry.content.mentorPerspectives[targetMentor]}` 
            });
          }
        }
        return messages;
      });

      // Create handoff record
      const chainId = crypto.randomUUID();
      const { data: handoff, error: handoffError } = await supabase
        .from("conversation_handoffs")
        .insert({
          user_id: user.id,
          source_mentor_type: 'transmutation_council',
          target_mentor_type: targetMentor,
          source_messages: sourceMessages,
          handoff_chain_id: chainId,
          chain_position: 1,
          journey_topic: suggestedMentor?.reason || "Continuing transmutation journey",
          processed: false,
          initiated_by: 'transmutation_council'
        })
        .select()
        .single();

      if (handoffError) {
        console.error("Handoff creation failed:", handoffError);
        navigate(`/council?view=${targetMentor}`);
        return;
      }

      navigate(`/council?view=${targetMentor}`, { 
        state: { handoffId: handoff.id } 
      });
    } catch (error) {
      console.error("Error creating handoff:", error);
      toast.error("Failed to create handoff. Please try again.");
      navigate(`/council?view=${targetMentor}`);
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
    setQuestion(answer);
    setCurrentAnswer("");
    
    handleAsk(true, answer);
  };

  // Pattern acceptance handler
  const handlePatternAccept = async (patternName: string) => {
    if (!patternDetection) return;
    
    try {
      const lifeEventsData = {
        trigger_event: patternDetection.triggerEvent || '',
        old_story: patternDetection.oldStory || '',
        mental_loop: patternDetection.mentalLoop || '',
        cost: patternDetection.cost || patternDetection.fear || '',
        protective_role: patternDetection.protectiveRole || '',
        life_event: patternDetection.lifeEvent || '',
        life_event_age_category: patternDetection.lifeEventAgeCategory || '',
        primary_emotion: patternDetection.primaryEmotion || '',
        fears: patternDetection.fears || patternDetection.fear || '',
      };
      
      const transmutationData = {
        shadow: patternDetection.oldStory || patternDetection.fear || '',
      };
      
      const pattern = await createPattern({
        pattern_name: patternName,
        pattern_type: patternDetection.patternType || 'life_event',
        pattern_description: patternDetection.lifeEvent || '',
        trigger_context: patternDetection.triggerEvent || '',
        primary_emotion: patternDetection.primaryEmotion || '',
        related_emotions: patternDetection.relatedEmotions || [],
        body_sensation: patternDetection.bodySensation || '',
        life_events: lifeEventsData,
        transmutation_data: transmutationData,
      });
      
      if (pattern) {
        setShowPatternCard(false);
        setShowCelebration(true);
      }
    } catch (error) {
      console.error("Failed to create pattern:", error);
      toast.error("Failed to save pattern");
    }
  };

  const handlePatternCelebrationContinue = () => {
    setShowCelebration(false);
    navigate(`/creation-lab?type=becoming&bmode=transmutation`);
  };

  if (isLoadingState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-500/5 via-background to-orange-500/5 min-h-screen py-8 p-4 pb-28">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/council")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Flame className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Transmutation Council</h1>
                <p className="text-muted-foreground text-sm">
                  Storybreaker • Phoenix • Stoic
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Team Introduction Card */}
        {!hasActiveThread && stage === 'input' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-orange-500/5">
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4 mb-4">
                  {TRANSMUTATION_MENTORS.map((mentor) => (
                    <div key={mentor} className="flex items-center gap-2">
                      <span className="text-xl">{mentorIcons[mentor]}</span>
                      <span className="text-sm font-medium">{mentorNames[mentor]}</span>
                    </div>
                  ))}
                </div>
                
                {/* State-aware initiation copy */}
                {hasCompletedTransmutation ? (
                  <div className="space-y-3">
                    <p className="text-base font-medium text-foreground">
                      You've already worked through something important here.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      If you feel ready, this space can hold something deeper this time.
                      You might choose a life moment that still carries emotional weight for you.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-base font-medium text-foreground">
                      Let's pause for a moment and look inward.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      This is a safe space. Share a life event that challenged you, changed you,
                      or marked a turning point for you.
                    </p>
                  </div>
                )}

                {/* Examples */}
                <div className="pt-4 border-t border-amber-500/20 mt-4">
                  <p className="text-xs text-muted-foreground mb-2">Examples you can use:</p>
                  <div className="flex gap-2 flex-wrap">
                    {(hasCompletedTransmutation
                      ? [
                          "I was bullied for years and it affected how I see myself.",
                          "One of my parents left when I was young.",
                          "I lost someone important and never fully processed it.",
                        ]
                      : [
                          "I left my business and moved to another country.",
                          "I ended a long relationship and had to rebuild myself.",
                          "I failed at something I deeply cared about.",
                        ]
                    ).map((example, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setQuestion(example)}
                        className="text-xs px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 transition-colors"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Active Thread Indicator */}
        {hasActiveThread && stage === 'input' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GitBranch className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium">Active Transmutation Session</p>
                      <p className="text-xs text-muted-foreground">
                        Question {questionNumber} in this session
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
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Ask the Transmutation Council
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder={hasActiveThread 
                ? "Continue sharing..." 
                : "Share a life event that challenged or changed you..."}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={4}
              disabled={loading || stage === 'complete' || stage === 'seeking_clarity'}
            />
            
            <div className="flex flex-col sm:flex-row gap-3">
              {hasActiveThread ? (
                <>
                  <Button
                    onClick={() => handleAsk(true)}
                    disabled={loading || !question.trim() || stage === 'complete' || stage === 'seeking_clarity'}
                    className="flex-1 bg-amber-600 hover:bg-amber-700"
                    size="lg"
                  >
                    <GitBranch className="w-4 h-4 mr-2" />
                    {loading ? "Processing..." : "Continue Journey"}
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
                    Start Fresh
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => handleAsk(false)}
                  disabled={loading || !question.trim() || stage === 'complete' || stage === 'seeking_clarity'}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Consulting the Council...
                    </>
                  ) : (
                    "Ask the Council"
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Seeking Clarity Stage */}
        {stage === 'seeking_clarity' && clarityQuestion && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-2 border-amber-500/50 bg-amber-500/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-amber-500" />
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
                  className="w-full p-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-2 border-amber-500/30 hover:border-amber-500/60 transition-all text-left group"
                >
                  <div className="flex items-start gap-3">
                    <MessageCircle className="w-5 h-5 text-amber-500 mt-0.5 group-hover:scale-110 transition-transform flex-shrink-0" />
                    <p className="text-sm font-medium flex-1 break-words whitespace-normal">{clarityQuestion}</p>
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
                <div className="p-3 rounded-lg bg-amber-500/10 border-l-4 border-amber-500">
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
                    className="bg-amber-600 hover:bg-amber-700"
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
            {/* Council Insight */}
            {councilInsight && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2 text-amber-600">
                        <Sparkles className="w-4 h-4" />
                        Council Insight
                      </CardTitle>
                      <InsightActionButton
                        insightText={councilInsight}
                        sourceType="council_insight"
                        sourceContext={{ question }}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <HighlightedText text={councilInsight} className="text-sm sm:text-base leading-relaxed font-medium" />
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Mentor Perspectives */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="text-xl">🔥</span>
                Mentor Perspectives
              </h2>
              <div className="grid gap-3">
                {Object.entries(mentorPerspectives).map(([mentorType, perspective], idx) => (
                  <motion.div
                    key={mentorType}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className="border-l-4" style={{ borderLeftColor: mentorColors[mentorType] || '#f59e0b' }}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${mentorColors[mentorType]}20` }}
                          >
                            <span className="text-lg">{mentorIcons[mentorType] || "✨"}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold" style={{ color: mentorColors[mentorType] }}>
                                {mentorNames[mentorType] || mentorType.replace(/_/g, ' ')}
                              </p>
                              <InsightActionButton
                                insightText={perspective}
                                sourceType="mentor_perspective"
                                sourceMentor={mentorType}
                                sourceContext={{ question }}
                              />
                            </div>
                            <HighlightedText text={perspective} className="text-sm leading-relaxed mt-1 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Council Banter (WhatsApp-style) */}
            {banterLines.length > 0 && (
              <div className="space-y-3">
                <div className="h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
                <Card className="bg-amber-500/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">💬 Council Discussion</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 px-3 py-4">
                    {banterLines.map((line, idx) => {
                      const isEven = idx % 2 === 0;
                      const mentorKey = Object.keys(mentorNames).find(k => mentorNames[k] === line.mentor) || line.mentor;
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: isEven ? -20 : 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className={cn("flex", isEven ? "justify-start" : "justify-end")}
                        >
                          <div 
                            className={cn(
                              "max-w-[85%] sm:max-w-[75%] p-3 rounded-2xl",
                              isEven ? "rounded-tl-sm" : "rounded-tr-sm"
                            )}
                            style={{ 
                              backgroundColor: `${line.color}15`, 
                              borderLeft: isEven ? `3px solid ${line.color}` : undefined,
                              borderRight: !isEven ? `3px solid ${line.color}` : undefined,
                            }}
                          >
                            <p className="text-xs font-semibold mb-1" style={{ color: line.color }}>
                              {mentorIcons[mentorKey] || "✨"} {line.mentor}
                            </p>
                            <HighlightedText text={line.text} className="text-sm leading-relaxed" />
                          </div>
                        </motion.div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Emotional Reflection */}
            {emotionalReflection && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border-orange-500/30 bg-orange-500/5">
                  <CardContent className="pt-4">
                    <p className="text-sm italic text-muted-foreground flex items-start gap-2">
                      <span className="text-lg">💭</span>
                      <HighlightedText text={emotionalReflection} />
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Suggested Next Question (Clickable) */}
            {suggestedNextQuestion && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card 
                  className="border-dashed border-2 border-amber-500/40 hover:border-amber-500/60 transition-colors cursor-pointer"
                  onClick={() => continueAsking(suggestedNextQuestion)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">💭 The Council suggests:</p>
                        <p className="text-sm font-medium">{suggestedNextQuestion}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 italic">Click to answer</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Suggested Mentor Handoff */}
            {suggestedMentor && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
              >
                <Card className="border-2 border-amber-500/50 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
                  <CardContent className="pt-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg">{mentorIcons[suggestedMentor.targetMentor] || "✨"}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Want to go deeper?</p>
                          <p className="text-xs text-muted-foreground">{suggestedMentor.reason}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleMentorHandoff(suggestedMentor.targetMentor)}
                        variant="outline"
                        className="border-amber-500/50 hover:bg-amber-500/10"
                      >
                        Continue with {mentorNames[suggestedMentor.targetMentor]}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={() => continueAsking()}
                className="flex-1 bg-amber-600 hover:bg-amber-700"
                size="lg"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Continue Exploring
              </Button>
              <Button
                onClick={resetConversation}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Start New Topic
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Pattern Discovery Card */}
      {showPatternCard && patternDetection && (
        <PatternDiscoveryCard
          proposedName={patternDetection.patternName}
          patternType={patternDetection.patternType || 'life_event'}
          triggerContext={patternDetection.triggerEvent || ''}
          primaryEmotion={patternDetection.primaryEmotion || ''}
          summary={patternDetection.lifeEvent}
          onAccept={handlePatternAccept}
          onKeepExploring={() => {
            setShowPatternCard(false);
            setPatternDetection(null);
          }}
        />
      )}

      {/* Pattern Celebration */}
      {showCelebration && patternDetection && (
        <PatternCelebration
          patternName={patternDetection.patternName || 'Your Pattern'}
          onContinue={handlePatternCelebrationContinue}
        />
      )}
    </div>
  );
};

export default TransmutationCouncil;
