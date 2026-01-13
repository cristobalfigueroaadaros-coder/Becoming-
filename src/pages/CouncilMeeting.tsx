import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Sparkles, Target, MessageCircle, RefreshCw, GitBranch, Bell, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useShadowEncounters } from "@/hooks/useShadowEncounters";
import { useIntegratorProjects } from "@/hooks/useIntegratorProjects";
import { useBreakthroughDetection } from "@/hooks/useBreakthroughDetection";
import { useMicroWins } from "@/hooks/useMicroWins";
import { motion } from "framer-motion";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { CouncilIntroductionModal } from "@/components/CouncilIntroductionModal";
import { HighlightedText } from "@/components/HighlightedText";
import { InsightActionButton } from "@/components/InsightActionButton";
import { ValueMapUnlockCelebration } from "@/components/ValueMapUnlockCelebration";
import { MentorSuggestionCard } from "@/components/MentorSuggestionCard";

interface ValueMapDetection {
  blockKey: string;
  blockTitle: string;
  blockDescription: string;
  suggestedContent: string;
  confidence: number;
  reasoning: string;
  source: string;
  mentorType?: string;
}

interface LocationState {
  notificationContext?: {
    breakthrough_title?: string;
    breakthrough_description?: string;
    suggested_question?: string;
    [key: string]: any;
  };
  prefilledQuestion?: string;
  openerType?: "check_in" | "breakthrough_followup" | "gravity_first_project";
  notificationId?: string;
  isFirstProjectFlow?: boolean;
}

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

interface CouncilMeetingProps {
  embedded?: boolean;
  locationState?: LocationState | null;
}

const CouncilMeeting = ({ embedded = false, locationState: propState }: CouncilMeetingProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  // Use prop state if provided (embedded mode), otherwise use location state
  const locationState = (propState || location.state) as LocationState | null;
  const { refetch } = useShadowEncounters();
  const { createProject } = useIntegratorProjects();
  const { triggerMicroWin } = useMicroWins();
  const { 
    checkForBreakthrough, 
    isFirstSession, 
    completeFirstWin 
  } = useBreakthroughDetection();
  
  // First project flow detection
  const isFirstProjectFlow = locationState?.isFirstProjectFlow ?? false;
  
  const [question, setQuestion] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [showIntroductionModal, setShowIntroductionModal] = useState(false);
  const [checkingIntroduction, setCheckingIntroduction] = useState(true);
  const [councilOpener, setCouncilOpener] = useState<string | null>(null);
  const [openerLoading, setOpenerLoading] = useState(false);
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);
  
  // PDR v2.1: Grounding question state (shown after intro modal)
  const [showGroundingQuestion, setShowGroundingQuestion] = useState(false);
  const [groundingAnswer, setGroundingAnswer] = useState("");
  
  // PDR v2.1: Mentor suggestion state
  const [suggestedMentor, setSuggestedMentor] = useState<{
    mentorType: string;
    mentorName: string;
    suggestionMessage: string;
  } | null>(null);
  
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

  // Handle incoming notification context and first project flow auto-submit
  useEffect(() => {
    if (locationState?.prefilledQuestion) {
      setQuestion(locationState.prefilledQuestion);
      
      // For first project flow, auto-submit the prefilled question
      if (isFirstProjectFlow && !hasAutoSubmitted && locationState.prefilledQuestion.trim()) {
        setHasAutoSubmitted(true);
        // Small delay to ensure state is set
        setTimeout(() => {
          handleAsk(false, locationState.prefilledQuestion);
        }, 500);
      }
    }
    
    // If we have an opener type and notification context, generate a personalized greeting
    if (locationState?.openerType && locationState.notificationContext && !isFirstProjectFlow) {
      generateCouncilOpener();
    }
  }, [isFirstProjectFlow, hasAutoSubmitted]);

  const generateCouncilOpener = async () => {
    if (!locationState?.notificationContext) return;
    
    setOpenerLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("council-meeting", {
        body: {
          question: "",
          mentorTypes: [],
          conversationHistory: [],
          notificationContext: locationState.notificationContext,
          openerType: locationState.openerType,
          generateOpenerOnly: true
        },
      });

      if (!error && data?.councilOpener) {
        setCouncilOpener(data.councilOpener);
      }
    } catch (error) {
      console.error("Error generating council opener:", error);
    } finally {
      setOpenerLoading(false);
    }
  };

  // Check if this is the user's first time with the Council
  // Skip intro modal and grounding for first project flow (already done in Gravity screens)
  useEffect(() => {
    const checkFirstTimeUser = async () => {
      try {
        // If coming from first project flow, skip intro modal
        if (isFirstProjectFlow) {
          setCheckingIntroduction(false);
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("council_introduction_completed")
          .eq("id", user.id)
          .single();

        if (!profile?.council_introduction_completed) {
          setShowIntroductionModal(true);
        }
      } catch (error) {
        console.error("Error checking introduction status:", error);
      } finally {
        setCheckingIntroduction(false);
      }
    };
    
    checkFirstTimeUser();
  }, []);

  // PDR v2.1: After intro completes, show grounding question
  const handleIntroductionComplete = () => {
    setShowIntroductionModal(false);
    setShowGroundingQuestion(true);
    toast.success("Welcome to the Council.");
  };

  // PDR v2.1: Submit grounding question answer as Q1
  const handleGroundingSubmit = async () => {
    if (!groundingAnswer.trim()) return;
    
    setShowGroundingQuestion(false);
    setQuestion(groundingAnswer);
    
    // The grounding answer IS Q1 - submit it directly
    await handleAsk(false, groundingAnswer);
  };
  
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
  const [valueMapDetection, setValueMapDetection] = useState<ValueMapDetection | null>(null);

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
          notificationContext: !continueConversation ? locationState?.notificationContext : undefined,
          openerType: !continueConversation ? locationState?.openerType : undefined,
        },
      });
      
      // Clear the council opener once user starts asking
      if (councilOpener) setCouncilOpener(null);

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

        // Handle Value Map detection
        if (data.valueMapDetection) {
          setValueMapDetection(data.valueMapDetection);
        }

        // PDR v2.1: Handle mentor suggestion for 1-to-1
        if (data.suggestedMentorFor1to1) {
          setSuggestedMentor(data.suggestedMentorFor1to1);
        }

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
    setSuggestedMentor(null);
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
    setSuggestedMentor(null);
    // Keep conversation history and question number
  };

  // PDR v2.1: Navigate to 1-to-1 mentor chat
  const handleMentorSuggestionAccept = async () => {
    if (!suggestedMentor) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to continue");
        return;
      }

      // Build source messages from conversation history
      const sourceMessages = conversationHistory.map(h => ({
        role: h.role,
        content: h.role === 'user' ? h.content : (h.content?.councilInsight || h.content?.banter || '')
      })).filter(m => m.content);

      // Extract the main topic from the conversation
      const journeyTopic = conversationHistory.find(h => h.role === 'user')?.content?.substring(0, 200) || 'Council exploration';

      // Create a handoff record so the mentor can continue the conversation
      const { data: handoff, error } = await supabase
        .from("conversation_handoffs")
        .insert({
          user_id: user.id,
          source_mentor_type: "council",
          target_mentor_type: suggestedMentor.mentorType,
          source_messages: sourceMessages,
          journey_topic: journeyTopic,
          handoff_summary: suggestedMentor.suggestionMessage,
          processed: false
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating handoff:", error);
        toast.error("Failed to create handoff");
        return;
      }

      // Navigate to the embedded Council view (not standalone /chat route)
      // This ensures the handoff state is passed correctly through Council to ChatPage
      navigate(`/council?view=${suggestedMentor.mentorType}`, {
        state: { handoffId: handoff.id }
      });
    } catch (error) {
      console.error("Error in mentor suggestion accept:", error);
      toast.error("Something went wrong");
    }
  };

  const generateGoals = async () => {
    if (tasksGenerated) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-council-tasks", {
        body: {
          mentorAnswers: mentorPerspectives,
          question,
          conversationHistory,
          emotionalTone: emotionalReflection || null,
          detectedPattern: null,
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
    setQuestion(answer);
    setCurrentAnswer("");
    
    // Pass the answer directly
    handleAsk(true, answer);
  };

  return (
    <div className={cn(
      "bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 pb-28",
      embedded ? "h-full overflow-y-auto" : "min-h-screen py-8"
    )}>
      {/* Council Introduction Modal for First-Time Users */}
      <CouncilIntroductionModal 
        open={showIntroductionModal} 
        onComplete={handleIntroductionComplete} 
      />

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header - hide back button when embedded */}
        <div className="flex items-center gap-4">
          {!embedded && (
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="flex-1">
            <h1 className={cn("font-bold", embedded ? "text-2xl" : "text-4xl")}>
              {embedded ? "Council" : "Council Meeting"}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
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

        {/* PDR v2.1: Grounding Question (shown after intro modal closes) */}
        {showGroundingQuestion && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-2 border-accent/40 bg-gradient-to-br from-accent/10 via-primary/5 to-background">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">The Council asks...</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg text-foreground font-medium">
                  "What's on your mind right now, or what do you feel drawn to work toward?"
                </p>
                <Textarea
                  placeholder="Share what's alive for you..."
                  value={groundingAnswer}
                  onChange={(e) => setGroundingAnswer(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <Button
                  onClick={handleGroundingSubmit}
                  disabled={!groundingAnswer.trim() || loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? "Consulting the Council..." : "Share with the Council"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* PDR v2.1: Mentor Suggestion Card - MOVED TO END OF INTERACTION (after line 926) */}

        {/* Council Opener - Personalized Greeting */}
        {(councilOpener || openerLoading) && stage === 'input' && !hasActiveThread && !showGroundingQuestion && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-primary mb-1">The Council</p>
                    {openerLoading ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Preparing a personalized message...</span>
                      </div>
                    ) : (
                      <p className="text-foreground leading-relaxed">{councilOpener}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Active Thread Indicator */}
        {hasActiveThread && stage === 'input' && !showGroundingQuestion && (
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

        {/* Question Input - hidden during grounding question phase */}
        {!showGroundingQuestion && (
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
        )}

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
                    <MessageCircle className="w-5 h-5 text-accent mt-0.5 group-hover:scale-110 transition-transform flex-shrink-0" />
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
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2 text-accent">
                        <span className="text-lg">🔮</span>
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
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-primary">
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
                      
                      const getEmoji = () => {
                        const textLower = line.text.toLowerCase();
                        if (textLower.includes('build') || textLower.includes('create')) return '🚀';
                        if (textLower.includes('energy') || textLower.includes('frequency')) return '⚡';
                        if (textLower.includes('vision') || textLower.includes('dream')) return '✨';
                        if (textLower.includes('action') || textLower.includes('move')) return '🎯';
                        if (textLower.includes('wisdom') || textLower.includes('truth')) return '🧘';
                        if (textLower.includes('heart') || textLower.includes('love')) return '❤️';
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
                            <span className="text-sm leading-relaxed text-foreground">
                              <HighlightedText text={line.text} /> {getEmoji()}
                            </span>
                            {/* Save button - keeps user in Council flow */}
                            {(() => {
                              const mentorKey = Object.keys(mentorNames).find(k => mentorNames[k] === line.mentor);
                              if (mentorKey) {
                                return (
                                  <InsightActionButton
                                    insightText={line.text}
                                    sourceType="mentor_perspective"
                                    sourceMentor={mentorKey}
                                    sourceContext={{ question, fromBanter: true }}
                                    className="mt-2 h-6 text-xs opacity-70 hover:opacity-100"
                                  />
                                );
                              }
                              return null;
                            })()}
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
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2 text-primary">
                        <span className="text-lg">💫</span>
                        Emotional Reflection
                      </CardTitle>
                      <InsightActionButton
                        insightText={emotionalReflection}
                        sourceType="emotional_reflection"
                        sourceContext={{ question }}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <HighlightedText text={emotionalReflection} className="text-sm sm:text-base leading-relaxed italic" />
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
              <Card className="border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
                  <CardContent className="pt-6 pb-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      💭 The Council suggests:
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-left h-auto py-4 px-4 border-primary/40 bg-background/80 whitespace-normal break-words"
                      onClick={() => {
                        setQuestion(suggestedNextQuestion);
                        continueAsking();
                      }}
                    >
                      <span className="break-words whitespace-normal text-sm sm:text-base">{suggestedNextQuestion}</span>
                    </Button>
                    <p className="text-xs text-muted-foreground mt-3 italic text-center">
                      Click to answer
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* PDR v2.1: Mentor Suggestion Card - NOW AT END OF INTERACTION */}
            {suggestedMentor && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <MentorSuggestionCard
                  mentorType={suggestedMentor.mentorType}
                  mentorName={suggestedMentor.mentorName}
                  suggestionMessage={suggestedMentor.suggestionMessage}
                  onAccept={handleMentorSuggestionAccept}
                  onDismiss={() => setSuggestedMentor(null)}
                />
              </motion.div>
            )}

            {/* Thread Continuation Options - Soft integration paths */}
            {!suggestedMentor && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-transparent">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        onClick={async () => {
                          // Save insight to project
                          try {
                            const { data: { user } } = await supabase.auth.getUser();
                            if (!user) throw new Error("Not authenticated");
                            
                            // Get active project
                            const { data: activeProject } = await supabase
                              .from("integrator_projects")
                              .select("id, project_title")
                              .eq("user_id", user.id)
                              .eq("status", "active")
                              .order("created_at", { ascending: false })
                              .limit(1)
                              .single();
                            
                            if (!activeProject) {
                              toast.info("No active project found. Start one in the Creation Lab.");
                              return;
                            }
                            
                            // Save insight
                            await supabase.from("saved_insights").insert({
                              user_id: user.id,
                              insight_text: councilInsight || Object.values(mentorPerspectives).join("\n\n"),
                              source_type: "council_meeting",
                              project_id: activeProject.id,
                            });
                            
                            toast.success(`Insight saved to "${activeProject.project_title}"`);
                            continueAsking();
                          } catch (error) {
                            console.error("Error saving insight:", error);
                            toast.error("Failed to save insight");
                          }
                        }}
                        variant="default" 
                        className="flex-1"
                        size="lg"
                      >
                        <Target className="w-4 h-4 mr-2" />
                        Add this insight to my project
                      </Button>
                      <Button 
                        onClick={continueAsking} 
                        variant="outline" 
                        className="flex-1"
                        size="lg"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Reflect more
                      </Button>
                    </div>
                    <div className="flex justify-center">
                      <Button 
                        onClick={resetConversation} 
                        variant="ghost" 
                        size="sm"
                        className="text-muted-foreground"
                      >
                        <RefreshCw className="w-3 h-3 mr-2" />
                        Start new topic
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        )}


        {/* Value Map Unlock Celebration */}
        {valueMapDetection && (
          <ValueMapUnlockCelebration
            detection={valueMapDetection}
            onAccept={async (blockKey, content) => {
              try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("Not authenticated");

                await supabase.from("value_map_blocks").upsert({
                  user_id: user.id,
                  block_key: blockKey,
                  content: content,
                  is_unlocked: true,
                  unlocked_at: new Date().toISOString(),
                  unlock_source: "council_meeting",
                }, { onConflict: "user_id,block_key" });

                await supabase.from("future_self_messages").insert({
                  user_id: user.id,
                  message: `You just unlocked "${valueMapDetection.blockTitle}" in your Value Map. This clarity is building something real.`,
                  trigger_reason: "value_map_unlock",
                });

                setValueMapDetection(null);
              } catch (error) {
                console.error("Error saving value map block:", error);
                throw error;
              }
            }}
            onDismiss={() => setValueMapDetection(null)}
          />
        )}
      </div>
    </div>
  );
};

export default CouncilMeeting;
