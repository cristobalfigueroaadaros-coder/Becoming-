import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Sparkles, Target, MessageCircle, RefreshCw, GitBranch, Loader2, Heart, Orbit } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { HighlightedText } from "@/components/HighlightedText";
import { InsightActionButton } from "@/components/InsightActionButton";
import { PatternDiscoveryCard, PatternCelebration } from "@/components/pattern-map";
import { useInnerPatterns } from "@/hooks/useInnerPatterns";

// Helper function to get onboarding placeholders
const getPlaceholderText = (hasActiveThread: boolean, hasCompletedTransmutation: boolean): string => {
  if (hasActiveThread) {
    return "Continue exploring what you're feeling...";
  }
  if (hasCompletedTransmutation) {
    return `For example:
"I was bullied for years and it affected how I see myself."
"One of my parents left when I was young."
"I lost someone important and never fully processed it."`;
  }
  return `For example:
"I left my business and moved to another country."
"I ended a long relationship and had to rebuild myself."
"I failed at something I deeply cared about."`;
};

// Types for conversation history
interface ConversationEntry {
  role: 'user' | 'inner_self';
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

// Inner Self Council mentors
const INNER_SELF_MENTORS = ['alignment_mentor', 'perspective_mentor', 'inner_clarity_mentor', 'quantum_inventor', 'release_mentor'];

const mentorNames: Record<string, string> = {
  alignment_mentor: "Alignment Mentor",
  perspective_mentor: "Perspective Mentor",
  inner_clarity_mentor: "Inner Clarity Mentor",
  quantum_inventor: "Quantum Mentor",
  release_mentor: "Release Mentor",
};

const mentorIcons: Record<string, string> = {
  alignment_mentor: "🧭",
  perspective_mentor: "🗺️",
  inner_clarity_mentor: "🪞",
  quantum_inventor: "⚡",
  release_mentor: "🌊",
};

interface InnerSelfCouncilProps {
  embedded?: boolean;
}

const InnerSelfCouncil = ({ embedded = false }: InnerSelfCouncilProps) => {
  const navigate = useNavigate();
  const { createPattern } = useInnerPatterns();
  
  const [question, setQuestion] = useState("");
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      setUserProfile(profile);
    };
    loadProfile();
  }, []);
  
  // State for conversation journey
  const [stage, setStage] = useState<'input' | 'seeking_clarity' | 'complete'>('input');
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
  
  // Pattern detection state
  const [detectedPattern, setDetectedPattern] = useState<any>(null);
  const [showPatternCard, setShowPatternCard] = useState(false);
  const [showPatternCelebration, setShowPatternCelebration] = useState(false);
  const [createdPatternId, setCreatedPatternId] = useState<string | null>(null);
  const [showAgeQuestion, setShowAgeQuestion] = useState(false);

  // Onboarding state detection
  const [hasCompletedTransmutation, setHasCompletedTransmutation] = useState(false);
  const [isLoadingOnboardingState, setIsLoadingOnboardingState] = useState(true);

  // Check if user has completed any transmutation cycles
  useEffect(() => {
    const checkTransmutationHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoadingOnboardingState(false);
        return;
      }
      
      const { data: transmutedPatterns, error } = await supabase
        .from("inner_patterns")
        .select("id")
        .eq("user_id", user.id)
        .or("status.eq.transmuted,transformed_at.not.is.null")
        .limit(1);
      
      if (!error && transmutedPatterns && transmutedPatterns.length > 0) {
        setHasCompletedTransmutation(true);
      }
      
      setIsLoadingOnboardingState(false);
    };
    
    checkTransmutationHistory();
  }, []);

  // Track if we have an active thread
  const hasActiveThread = conversationHistory.length > 0;

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

      const { data, error } = await supabase.functions.invoke("inner-self-council", {
        body: {
          question: actualQuestion,
          conversationHistory: currentHistory,
        },
      });

      if (error) throw error;

      // Update conversation history
      setConversationHistory([
        ...currentHistory,
        { role: 'user', content: actualQuestion },
        { role: 'inner_self', content: data }
      ]);

      if (data.stage === 'seeking_clarity') {
        setStage('seeking_clarity');
        setClarityQuestion(data.clarityQuestion || "");
        setQuestionNumber(data.questionNumber);
        setQuestion("");
        toast.info("The Inner Self Council is listening deeply...");
      } else {
        setStage('complete');
        setQuestionNumber(data.questionNumber || 0);
        setCouncilInsight(data.councilInsight || "");
        setMentorPerspectives(data.mentorPerspectives || {});
        setBanterLines(data.banterLines || []);
        setEmotionalReflection(data.emotionalReflection || "");
        setSuggestedNextQuestion(data.suggestedNextQuestion || null);
        setSuggestedMentor(data.suggestedMentor || null);
        
        // Pattern detection is now delayed until after mentor redirect
        // The inner_clarity_mentor will detect patterns during 1:1 exploration
        // Pattern card will only show when user returns from mentor with extracted data

        toast.success("The Inner Self Council has responded.");
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
    setSuggestedMentor(null);
    setConversationHistory([]);
    setVoiceUrl("");
    setCurrentAnswer("");
    setDetectedPattern(null);
    setShowPatternCard(false);
    setShowPatternCelebration(false);
    setCreatedPatternId(null);
    setShowAgeQuestion(false);
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

  // Pattern acceptance handler
  const handlePatternAccept = async (patternName: string) => {
    if (!detectedPattern) return;
    
    try {
      const pattern = await createPattern({
        pattern_name: patternName,
        pattern_description: detectedPattern.triggerContext || undefined,
        pattern_type: detectedPattern.patternType || 'limiting_belief',
        trigger_context: detectedPattern.triggerContext || undefined,
        primary_emotion: detectedPattern.primaryEmotion || undefined,
        related_emotions: detectedPattern.relatedEmotions || undefined,
        body_sensation: detectedPattern.bodySensation || undefined,
      });
      
      if (pattern) {
        setCreatedPatternId(pattern.id);
        setShowPatternCard(false);
        setShowPatternCelebration(true);
      }
    } catch (error) {
      console.error("Failed to create pattern:", error);
      toast.error("Failed to save pattern");
    }
  };

  const handlePatternCelebrationContinue = () => {
    setShowPatternCelebration(false);
    if (createdPatternId) {
      navigate(`/pattern-map/${createdPatternId}`);
    }
  };

  const handlePatternDismiss = () => {
    setShowPatternCard(false);
    setDetectedPattern(null);
  };

  const handleMentorHandoff = async (targetMentor: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to continue");
        navigate("/");
        return;
      }

      // Build source messages from the Inner Self Council conversation
      const sourceMessages = conversationHistory.flatMap((entry: ConversationEntry) => {
        const messages: Array<{ role: string; content: string }> = [];
        if (entry.role === 'user' && typeof entry.content === 'string') {
          messages.push({ role: 'user', content: entry.content });
        } else if (entry.role === 'inner_self' && typeof entry.content === 'object' && entry.content) {
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
              content: `${targetMentor.replace(/_/g, ' ')}: ${entry.content.mentorPerspectives[targetMentor]}` 
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
          source_mentor_type: 'inner_self_council',
          target_mentor_type: targetMentor,
          source_messages: sourceMessages,
          handoff_chain_id: chainId,
          chain_position: 1,
          journey_topic: suggestedMentor?.reason || "Continuing inner exploration from council",
          processed: false,
          initiated_by: 'inner_self_council'
        })
        .select()
        .single();

      if (handoffError) {
        console.error("Handoff creation failed:", handoffError);
        // Fall back to simple navigation
        navigate(`/council?view=${targetMentor}`);
        return;
      }

      // Navigate with handoff context
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

  return (
    <div className={cn(
      "bg-gradient-to-br from-indigo-500/5 via-background to-purple-500/5 p-4 pb-28",
      embedded ? "h-full overflow-y-auto" : "min-h-screen py-8"
    )}>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          {!embedded && (
            <Button variant="ghost" size="icon" onClick={() => navigate("/council")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <Heart className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <h1 className={cn("font-bold", embedded ? "text-2xl" : "text-3xl")}>
                  Inner Self Council
                </h1>
                <p className="text-muted-foreground text-sm">
                  Clarity • Perspective • Release
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Council Introduction Card */}
        {!hasActiveThread && stage === 'input' && !isLoadingOnboardingState && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-indigo-500/30 bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
              <CardContent className="pt-6 space-y-4">
                <div className="flex flex-wrap gap-4">
                  {INNER_SELF_MENTORS.map((mentor) => (
                    <div key={mentor} className="flex items-center gap-2">
                      <span className="text-xl">{mentorIcons[mentor]}</span>
                      <span className="text-sm font-medium">{mentorNames[mentor]}</span>
                    </div>
                  ))}
                </div>
                
                {/* State-aware onboarding copy */}
                {hasCompletedTransmutation ? (
                  // STATE 2: Returning User - Deeper Emotional Exploration
                  <div className="space-y-3 pt-2">
                    <p className="text-base font-medium text-foreground">
                      You've already worked through something important here.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      If you feel ready, this space can hold something deeper this time.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      You might choose a life moment that still carries emotional weight for you.
                      Something that shaped you in a lasting way.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Or, if that doesn't feel right today, you can share another meaningful experience instead.
                      <strong> You're always in control.</strong>
                    </p>
                  </div>
                ) : (
                  // STATE 1: First Time User - Life Event Focus
                  <div className="space-y-3 pt-2">
                    <p className="text-base font-medium text-foreground">
                      Let's pause for a moment and look inward.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      This is a safe space. You're in control of what you share.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      To begin, think about a life event that challenged you, changed you, or marked a turning point for you.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      It doesn't have to be dramatic or traumatic.
                      It could be a big decision, a transition, a failure, a loss, or a moment when life pushed you in a new direction.
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      Share what feels meaningful to you right now.
                    </p>
                  </div>
                )}
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
            <Card className="border-indigo-500/30 bg-indigo-500/5">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GitBranch className="w-5 h-5 text-indigo-500" />
                    <div>
                      <p className="text-sm font-medium">Active Exploration</p>
                      <p className="text-xs text-muted-foreground">
                        Message {questionNumber} in this session
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
              <Heart className="w-5 h-5 text-indigo-500" />
              Share what's on your heart
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder={getPlaceholderText(hasActiveThread, hasCompletedTransmutation)}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={5}
              disabled={loading || stage === 'complete' || stage === 'seeking_clarity'}
            />
            
            <div className="flex flex-col sm:flex-row gap-3">
              {hasActiveThread ? (
                <>
                  <Button
                    onClick={() => handleAsk(true)}
                    disabled={loading || !question.trim() || stage === 'complete' || stage === 'seeking_clarity'}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                    size="lg"
                  >
                    <GitBranch className="w-4 h-4 mr-2" />
                    {loading ? "Listening..." : "Continue Exploring"}
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
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      The council is listening...
                    </>
                  ) : (
                    "Ask the Inner Self Council"
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
            <Card className="border-2 border-indigo-500/50 bg-indigo-500/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-500" />
                  Going Deeper
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  To truly understand what you're experiencing:
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setAnswerDialogOpen(true)}
                  className="w-full p-4 rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-2 border-indigo-500/30 hover:border-indigo-500/60 transition-all text-left group"
                >
                  <div className="flex items-start gap-3">
                    <MessageCircle className="w-5 h-5 text-indigo-500 mt-0.5 group-hover:scale-110 transition-transform flex-shrink-0" />
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
              <DialogTitle className="text-lg">Your Response</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {clarityQuestion && (
                <div className="p-3 rounded-lg bg-indigo-500/10 border-l-4 border-indigo-500">
                  <p className="text-sm font-medium">{clarityQuestion}</p>
                </div>
              )}
              <Textarea
                placeholder="Take your time... what comes up for you?"
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
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    Share
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
                <Card className="border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 to-transparent">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2 text-indigo-600">
                        <Heart className="w-4 h-4" />
                        Collective Understanding
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
                <span className="text-xl">💫</span>
                Different Perspectives
              </h2>
              <div className="grid gap-3">
                {Object.entries(mentorPerspectives).map(([mentorType, perspective], idx) => (
                  <motion.div
                    key={mentorType}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className="border-l-4 border-l-indigo-500/50">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-lg">{mentorIcons[mentorType] || "💜"}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-indigo-600">
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

            {/* Council Dialogue */}
            {banterLines.length > 0 && (
              <div className="space-y-3">
                <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
                <Card className="bg-indigo-500/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">💭 Council Dialogue</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 px-3 py-4">
                    {banterLines.map((line, idx) => {
                      const isEven = idx % 2 === 0;
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
                            style={{ backgroundColor: `${line.color}15`, borderLeft: `3px solid ${line.color}` }}
                          >
                            <p className="text-xs font-semibold mb-1" style={{ color: line.color }}>
                              {mentorIcons[line.mentor] || "💜"} {mentorNames[line.mentor] || line.mentor}
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
                <Card className="border-purple-500/30 bg-purple-500/5">
                  <CardContent className="pt-4">
                    <p className="text-sm italic text-muted-foreground flex items-start gap-2">
                      <span className="text-lg">🌸</span>
                      <HighlightedText text={emotionalReflection} />
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Suggested Next Question */}
            {suggestedNextQuestion && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="border-dashed border-2 border-indigo-500/40 hover:border-indigo-500/60 transition-colors cursor-pointer"
                  onClick={() => continueAsking(suggestedNextQuestion)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Go deeper:</p>
                        <p className="text-sm font-medium">{suggestedNextQuestion}</p>
                      </div>
                    </div>
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
                <Card className="border-2 border-indigo-500/50 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                  <CardContent className="pt-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg">{mentorIcons[suggestedMentor.targetMentor] || "💜"}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Continue with focused guidance</p>
                          <p className="text-xs text-muted-foreground">{suggestedMentor.reason}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleMentorHandoff(suggestedMentor.targetMentor)}
                        variant="outline"
                        className="border-indigo-500/50 hover:bg-indigo-500/10"
                      >
                        Go deeper with {mentorNames[suggestedMentor.targetMentor]}
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
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
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
                New Session
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Pattern Discovery Overlay */}
      {showPatternCard && detectedPattern && (
        <PatternDiscoveryCard
          proposedName={detectedPattern.patternName}
          patternType={detectedPattern.patternType}
          triggerContext={detectedPattern.triggerContext || ""}
          primaryEmotion={detectedPattern.primaryEmotion || ""}
          onAccept={handlePatternAccept}
          onKeepExploring={handlePatternDismiss}
        />
      )}
      
      {/* Pattern Celebration Overlay */}
      {showPatternCelebration && (
        <PatternCelebration
          patternName={detectedPattern?.patternName || "Your Pattern"}
          onContinue={handlePatternCelebrationContinue}
        />
      )}
    </div>
  );
};

export default InnerSelfCouncil;
