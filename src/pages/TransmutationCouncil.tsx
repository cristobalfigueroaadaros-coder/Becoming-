import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { HighlightedText } from "@/components/HighlightedText";
import { PatternDiscoveryCard, PatternCelebration } from "@/components/pattern-map";
import { useInnerPatterns } from "@/hooks/useInnerPatterns";

// Transmutation Council mentors
const TRANSMUTATION_MENTORS = ['storybreaker_mentor', 'phoenix_mentor', 'stoic_mentor'] as const;

const mentorConfig: Record<string, { name: string; color: string; icon: string; role: string }> = {
  storybreaker_mentor: { 
    name: "Storybreaker", 
    color: "bg-rose-600", 
    icon: "📖",
    role: "Cleans narrative, rewrites beliefs"
  },
  phoenix_mentor: { 
    name: "Phoenix", 
    color: "bg-orange-500", 
    icon: "🔥",
    role: "Turns pain into power"
  },
  stoic_mentor: { 
    name: "Stoic", 
    color: "bg-stone-600", 
    icon: "⚖️",
    role: "Brings grounded action"
  },
};

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  mentorType?: string;
}

const TransmutationCouncil = () => {
  const navigate = useNavigate();
  const { createPattern } = useInnerPatterns();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // State detection for onboarding
  const [hasCompletedTransmutation, setHasCompletedTransmutation] = useState(false);
  const [isLoadingState, setIsLoadingState] = useState(true);

  // Pattern detection state
  const [patternDetection, setPatternDetection] = useState<any>(null);
  const [showPatternCard, setShowPatternCard] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [createdPatternId, setCreatedPatternId] = useState<string | null>(null);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setQuestionNumber(prev => prev + 1);
    const currentQ = questionNumber + 1;

    // Add user message immediately
    const userMsgId = crypto.randomUUID();
    setMessages(prev => [...prev, { id: userMsgId, role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to continue");
        navigate("/");
        return;
      }

      // Call the council-meeting function with Transmutation Council context
      const { data, error } = await supabase.functions.invoke("council-meeting", {
        body: {
          question: userMessage,
          questionNumber: currentQ,
          councilType: "transmutation",
          mentorTypes: [...TRANSMUTATION_MENTORS],
        },
      });

      if (error) throw error;

      // Add council response
      if (data?.answers) {
        // Parse answers and create messages
        for (const answer of data.answers) {
          const mentorMsgId = crypto.randomUUID();
          setMessages(prev => [...prev, {
            id: mentorMsgId,
            role: "assistant",
            content: answer.response,
            mentorType: answer.mentor,
          }]);
        }
      }

      // Check for pattern detection from Storybreaker 1:1
      if (data?.patternDetection) {
        setPatternDetection(data.patternDetection);
        setShowPatternCard(true);
      }

      // Handle mentor handoff suggestion
      if (data?.mentorSuggestion) {
        const handoffMsgId = crypto.randomUUID();
        setMessages(prev => [...prev, {
          id: handoffMsgId,
          role: "assistant",
          content: `💡 **${data.mentorSuggestion.reason}**\n\nWould you like to continue with the ${mentorConfig[data.mentorSuggestion.targetMentor]?.name || data.mentorSuggestion.targetMentor} for a deeper 1:1 conversation?`,
          mentorType: "system",
        }]);
      }

    } catch (error: any) {
      console.error("Error in Transmutation Council:", error);
      toast.error("Failed to get council response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMentorClick = async (mentorType: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to continue");
        navigate("/");
        return;
      }

      // Build source messages from the Transmutation Council conversation
      const sourceMessages = messages.map((msg: Message) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.mentorType && mentorConfig[msg.mentorType] 
          ? `${mentorConfig[msg.mentorType].name}: ${msg.content}`
          : msg.content
      }));

      // Create handoff record
      const chainId = crypto.randomUUID();
      const { data: handoff, error: handoffError } = await supabase
        .from("conversation_handoffs")
        .insert({
          user_id: user.id,
          source_mentor_type: 'transmutation_council',
          target_mentor_type: mentorType,
          source_messages: sourceMessages,
          handoff_chain_id: chainId,
          chain_position: 1,
          journey_topic: "Continuing transmutation journey",
          processed: false,
          initiated_by: 'transmutation_council'
        })
        .select()
        .single();

      if (handoffError) {
        console.error("Handoff creation failed:", handoffError);
        // Fall back to simple navigation
        navigate(`/council?view=${mentorType}`);
        return;
      }

      // Navigate with handoff context
      navigate(`/council?view=${mentorType}`, { 
        state: { handoffId: handoff.id } 
      });
    } catch (error) {
      console.error("Error creating handoff:", error);
      toast.error("Failed to create handoff. Please try again.");
      navigate(`/council?view=${mentorType}`);
    }
  };

  // Pattern acceptance handler
  const handlePatternAccept = async (patternName: string) => {
    if (!patternDetection) return;
    
    try {
      // Map the extracted data to life_events format for Pattern Map nodes
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
      
      // Map to transmutation_data for Black Phase
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
        setCreatedPatternId(pattern.id);
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

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/50 sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/council")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h1 className="font-semibold">Transmutation Council</h1>
              <p className="text-xs text-muted-foreground">Transform pain into gold</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mentor Badges - Horizontal scroll on mobile */}
      <div className="container max-w-4xl mx-auto px-4 py-4 shrink-0">
        <div className="flex gap-2 flex-nowrap overflow-x-auto pb-2 scrollbar-hide">
          {TRANSMUTATION_MENTORS.map((mentor) => {
            const config = mentorConfig[mentor];
            return (
              <button
                key={mentor}
                onClick={() => handleMentorClick(mentor)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${config.color} text-white hover:opacity-90`}
              >
                <span>{config.icon}</span>
                <span>{config.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat + input */}
      <div className="flex-1 overflow-hidden">
        <div className="container max-w-4xl mx-auto px-4 h-full flex flex-col">
          <div className="flex-1 overflow-hidden pb-4">
            <ScrollArea className="h-full">
              {messages.length === 0 && !isLoadingState ? (
                <Card className="mt-8 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      The Transmutation Journey
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Mentor badges - Horizontal layout */}
                    <div className="flex gap-2 flex-wrap">
                      {TRANSMUTATION_MENTORS.map((mentor) => {
                        const config = mentorConfig[mentor];
                        return (
                          <Badge
                            key={mentor}
                            variant="secondary"
                            className={`${config.color} text-white px-3 py-1.5 text-sm font-medium`}
                          >
                            <span className="mr-1.5">{config.icon}</span>
                            {config.name}
                          </Badge>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Storybreaker cleans narrative • Phoenix turns pain into power • Stoic brings action
                    </p>

                    {/* State-aware initiation copy */}
                    {hasCompletedTransmutation ? (
                      <div className="space-y-3 pt-2 border-t border-amber-500/20">
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
                      <div className="space-y-3 pt-2 border-t border-amber-500/20">
                        <p className="text-base font-medium text-foreground">
                          Let's pause for a moment and look inward.
                        </p>
                        <p className="text-sm text-muted-foreground">
                          This is a safe space. You're in control of what you share.
                        </p>
                        <p className="text-sm text-muted-foreground">
                          To begin, think about a life event that challenged you, changed you,
                          or marked a turning point for you.
                        </p>
                        <p className="text-sm text-muted-foreground">
                          It doesn't have to be dramatic or traumatic.
                          It could be a big decision, a transition, a failure, a loss,
                          or a moment when life pushed you in a new direction.
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          Share what feels meaningful to you right now.
                        </p>
                      </div>
                    )}

                    {/* Examples (always visible in the intro card) */}
                    <div className="pt-2 border-t border-amber-500/20">
                      <p className="text-xs text-muted-foreground mb-2">Examples you can copy:</p>
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
                            onClick={() => setInput(example)}
                            className="text-xs px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 transition-colors"
                          >
                            {example}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4 py-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : message.mentorType === "system"
                            ? "bg-amber-500/10 border border-amber-500/20"
                            : "bg-muted"
                        }`}
                      >
                        {message.mentorType &&
                          message.mentorType !== "system" &&
                          mentorConfig[message.mentorType] && (
                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
                              <span className="text-lg">{mentorConfig[message.mentorType].icon}</span>
                              <span className="font-medium text-sm">{mentorConfig[message.mentorType].name}</span>
                            </div>
                          )}
                        <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                          <HighlightedText text={message.content} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Input Area */}
          <div className="shrink-0 bg-background border-t border-border p-4">
            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="flex gap-2 items-end">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (input.trim() && !isLoading) {
                        handleSubmit(e as any);
                      }
                    }
                  }}
                  placeholder={messages.length > 0 ? "Continue sharing..." : "Share a life event that challenged or changed you..."}
                  className="flex-1 min-h-[48px] max-h-[120px] resize-none"
                  rows={2}
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className={messages.length === 0 ? "bg-amber-600 hover:bg-amber-500 px-4" : ""}
                  size={messages.length === 0 ? "default" : "icon"}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : messages.length === 0 ? (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Ask the Council
                    </span>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {messages.length === 0 && !input.trim() && (
                <p className="text-[10px] text-muted-foreground text-center">
                  Type a life event (or tap an example above) to begin
                </p>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Pattern Discovery Card (Winning Card) */}
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