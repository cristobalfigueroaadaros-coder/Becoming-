import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Sparkles, Target, MessageCircle, RefreshCw, GitBranch, Loader2, Hammer } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { HighlightedText } from "@/components/HighlightedText";
import { InsightActionButton } from "@/components/InsightActionButton";


// Builders Team mentors only
const BUILDERS_MENTORS = ['design_thinking_mentor', 'ux_mentor', 'gamification_mentor'];

const mentorNames: Record<string, string> = {
  design_thinking_mentor: "Design Thinking Mentor",
  ux_mentor: "UX Mentor",
  gamification_mentor: "Gamification Mentor",
};

const mentorIcons: Record<string, string> = {
  design_thinking_mentor: "🧪",
  ux_mentor: "💜",
  gamification_mentor: "🎮",
};

interface BuildersTeamProps {
  embedded?: boolean;
}

const BuildersTeam = ({ embedded = false }: BuildersTeamProps) => {
  const navigate = useNavigate();
  
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
  const [loading, setLoading] = useState(false);
  const [voiceUrl, setVoiceUrl] = useState<string>("");
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [answerDialogOpen, setAnswerDialogOpen] = useState(false);

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

      const { data, error } = await supabase.functions.invoke("builders-team-meeting", {
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
        { role: 'builders', content: data }
      ]);

      if (data.stage === 'seeking_clarity') {
        setStage('seeking_clarity');
        setClarityQuestion(data.clarityQuestion || "");
        setQuestionNumber(data.questionNumber);
        setQuestion("");
        toast.info("The Builders Team needs more clarity...");
      } else {
        setStage('complete');
        setQuestionNumber(data.questionNumber || 0);
        setCouncilInsight(data.councilInsight || "");
        setMentorPerspectives(data.mentorPerspectives || {});
        setBanterLines(data.banterLines || []);
        setEmotionalReflection(data.emotionalReflection || "");
        setSuggestedNextQuestion(data.suggestedNextQuestion || null);

        toast.success("Builders Team has responded!");
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
      "bg-gradient-to-br from-lime-500/5 via-background to-fuchsia-500/5 p-4 pb-28",
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
              <div className="w-10 h-10 rounded-full bg-lime-500/20 flex items-center justify-center">
                <Hammer className="w-5 h-5 text-lime-500" />
              </div>
              <div>
                <h1 className={cn("font-bold", embedded ? "text-2xl" : "text-3xl")}>
                  Builders Team
                </h1>
                <p className="text-muted-foreground text-sm">
                  Design Thinking • UX • Gamification
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
            <Card className="border-lime-500/30 bg-gradient-to-r from-lime-500/5 to-fuchsia-500/5">
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4 mb-4">
                  {BUILDERS_MENTORS.map((mentor) => (
                    <div key={mentor} className="flex items-center gap-2">
                      <span className="text-xl">{mentorIcons[mentor]}</span>
                      <span className="text-sm font-medium">{mentorNames[mentor]}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Three hands-on mentors focused on <strong>creation</strong>, <strong>iteration</strong>, and <strong>experience design</strong>. 
                  Together we turn ideas into experiments, experiments into experiences, and experiences into engaging journeys.
                </p>
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
            <Card className="border-lime-500/30 bg-lime-500/5">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GitBranch className="w-5 h-5 text-lime-500" />
                    <div>
                      <p className="text-sm font-medium">Active Build Session</p>
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
              <Hammer className="w-5 h-5 text-lime-500" />
              Ask the Builders Team
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder={hasActiveThread 
                ? "Continue building on this idea..." 
                : "What are you building? What experience do you want to create?"}
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
                    className="flex-1 bg-lime-600 hover:bg-lime-700"
                    size="lg"
                  >
                    <GitBranch className="w-4 h-4 mr-2" />
                    {loading ? "Building..." : "Continue Building"}
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
                  className="w-full bg-lime-600 hover:bg-lime-700"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Consulting the team...
                    </>
                  ) : (
                    "Ask the Builders Team"
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
            <Card className="border-2 border-lime-500/50 bg-lime-500/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-lime-500" />
                  Builders Seeking Clarity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Before we iterate further, we need to understand:
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setAnswerDialogOpen(true)}
                  className="w-full p-4 rounded-lg bg-gradient-to-r from-lime-500/10 to-fuchsia-500/10 border-2 border-lime-500/30 hover:border-lime-500/60 transition-all text-left group"
                >
                  <div className="flex items-start gap-3">
                    <MessageCircle className="w-5 h-5 text-lime-500 mt-0.5 group-hover:scale-110 transition-transform flex-shrink-0" />
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
                <div className="p-3 rounded-lg bg-lime-500/10 border-l-4 border-lime-500">
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
                    className="bg-lime-600 hover:bg-lime-700"
                  >
                    Submit Answer
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Complete Stage - Builders Response */}
        {stage === 'complete' && Object.keys(mentorPerspectives).length > 0 && (
          <div className="space-y-6">
            {/* Team Insight */}
            {councilInsight && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-2 border-lime-500/30 bg-gradient-to-br from-lime-500/5 to-transparent">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2 text-lime-600">
                        <Hammer className="w-4 h-4" />
                        Team Insight
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

            {/* Builder Perspectives */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="text-xl">🛠️</span>
                Builder Perspectives
              </h2>
              <div className="grid gap-3">
                {Object.entries(mentorPerspectives).map(([mentorType, perspective], idx) => (
                  <motion.div
                    key={mentorType}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className="border-l-4 border-l-lime-500/50">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lime-500/20 to-fuchsia-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-lg">{mentorIcons[mentorType] || "🔧"}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-lime-600">
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

            {/* Team Banter */}
            {banterLines.length > 0 && (
              <div className="space-y-3">
                <div className="h-px bg-gradient-to-r from-transparent via-lime-500/30 to-transparent" />
                <Card className="bg-lime-500/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">💬 Team Discussion</CardTitle>
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
                              {mentorIcons[line.mentor] || "🔧"} {mentorNames[line.mentor] || line.mentor}
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
                <Card className="border-fuchsia-500/30 bg-fuchsia-500/5">
                  <CardContent className="pt-4">
                    <p className="text-sm italic text-muted-foreground flex items-start gap-2">
                      <span className="text-lg">💭</span>
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
                <Card className="border-dashed border-2 border-lime-500/40 hover:border-lime-500/60 transition-colors cursor-pointer"
                  onClick={() => continueAsking(suggestedNextQuestion)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-lime-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Suggested next step:</p>
                        <p className="text-sm font-medium">{suggestedNextQuestion}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={() => continueAsking()}
                className="flex-1 bg-lime-600 hover:bg-lime-700"
                size="lg"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Continue Building
              </Button>
              <Button
                onClick={resetConversation}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                New Build Session
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuildersTeam;
