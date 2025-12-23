import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Send, Sparkles, MessageCircle, RefreshCw, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MentorLearningModule } from "@/components/MentorLearningModule";
import { HighlightedText } from "@/components/HighlightedText";
import { BreakthroughDetectedCard } from "@/components/BreakthroughDetectedCard";
import { useBreakthroughDetection } from "@/hooks/useBreakthroughDetection";
import { InsightActionButton } from "@/components/InsightActionButton";
import { ValueMapUnlockCelebration } from "@/components/ValueMapUnlockCelebration";
import { MentorTransitionCard } from "@/components/MentorTransitionCard";
import { FirstWinNamingCard } from "@/components/FirstWinNamingCard";
import { FirstWinCelebration } from "@/components/FirstWinCelebration";
import { useMicroWins } from "@/hooks/useMicroWins";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

interface SuggestedHandoff {
  shouldSuggest: boolean;
  targetMentor: string;
  reason: string;
}

interface ProjectCoherence {
  isCoherent: boolean;
  projectName: string;
  projectDescription: string;
  confidence: number;
}

interface Whisper {
  id: string;
  mentor_type: string;
  message: string;
  whisper_type?: string;
  created_at: string;
}

const mentorNames: Record<string, string> = {
  discipline_mentor: "The Discipline Mentor",
  strategist_mentor: "The Strategist Mentor",
  business_mentor: "The Business Mentor",
  creative_visionary: "The Creative Visionary",
  marketing_mentor: "The Marketing Mentor",
  quantum_inventor: "The Quantum Inventor",
  scientific_mentor: "The Scientific Mentor",
  mystic_mentor: "The Mystic Mentor",
  ancient_sage: "The Ancient Sage",
  alignment_mentor: "The Alignment Mentor",
  oracle_mother: "The Oracle Mother",
  heart_mentor: "The Heart Mentor",
  future_self: "Your Future Self",
};

const Chat = () => {
  const { mentorType } = useParams<{ mentorType: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const fromCouncil = searchParams.get('fromCouncil') === 'true';
  
  const [messages, setMessages] = useState<any[]>([]);
  const [whispers, setWhispers] = useState<Whisper[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLearningModule, setShowLearningModule] = useState(false);
  const [learningModuleData, setLearningModuleData] = useState<any>(null);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [isHandoffProcessed, setIsHandoffProcessed] = useState(false);
  const [valueMapDetection, setValueMapDetection] = useState<ValueMapDetection | null>(null);
  const [suggestedHandoff, setSuggestedHandoff] = useState<SuggestedHandoff | null>(null);
  const [userMentors, setUserMentors] = useState<string[]>([]);
  const [showFirstWinNaming, setShowFirstWinNaming] = useState(false);
  const [showFirstWinCelebration, setShowFirstWinCelebration] = useState(false);
  const [firstWinConceptName, setFirstWinConceptName] = useState("");
  const [projectCoherence, setProjectCoherence] = useState<ProjectCoherence | null>(null);
  const [showCommitmentCard, setShowCommitmentCard] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Micro wins for post-first-win celebrations
  const { triggerMicroWin } = useMicroWins();
  
  // Breakthrough detection
  const {
    latestBreakthrough,
    isFirstSession,
    checkForBreakthrough,
    dismissBreakthrough,
    clearBreakthrough,
    completeFirstWin,
  } = useBreakthroughDetection(mentorType);

  // Load user's selected mentors
  useEffect(() => {
    const loadUserMentors = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase
        .from("user_mentors")
        .select("mentor_type")
        .eq("user_id", user.id);
      
      if (data) {
        const mentors = data.map(m => m.mentor_type).filter(m => m !== mentorType);
        setUserMentors(mentors);
      }
    };
    loadUserMentors();
  }, [mentorType]);

  // Check for handoff state on mount
  useEffect(() => {
    const handoffState = location.state as { handoffId?: string } | null;
    if (handoffState?.handoffId && !isHandoffProcessed) {
      processHandoff(handoffState.handoffId);
    }
  }, [location.state, mentorType]);

  const processHandoff = async (handoffId: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.functions.invoke("chat-mentor", {
        body: { mentorType, message: "__HANDOFF_INIT__", handoffId },
      });

      if (error) throw error;

      const { data: welcomeMsgData } = await supabase.from("chats").insert({
        user_id: user.id,
        mentor_type: mentorType as any,
        role: "assistant",
        content: data.response,
      }).select().single();

      if (welcomeMsgData) {
        setMessages((prev) => [...prev, welcomeMsgData]);
      }

      await supabase.from("conversation_handoffs").update({ processed: true }).eq("id", handoffId);
      setIsHandoffProcessed(true);
      navigate(location.pathname, { replace: true, state: {} });
    } catch (error: any) {
      console.error("Error processing handoff:", error);
      toast.error("Failed to process handoff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    loadWhispers();
    const unsubscribe = subscribeToMessages();
    return () => { unsubscribe(); };
  }, [mentorType]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("chats")
        .select("*")
        .eq("user_id", user.id)
        .eq("mentor_type", mentorType as any)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      setExchangeCount(data?.filter((m: any) => m.role === "user").length || 0);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const loadWhispers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("daily_whispers")
        .select("*")
        .eq("user_id", user.id)
        .eq("mentor_type", mentorType as any)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setWhispers((data || []) as Whisper[]);
    } catch (error: any) {
      console.error("Error loading whispers:", error);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`chats-${mentorType}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chats", filter: `mentor_type=eq.${mentorType}` },
        async (payload) => {
          const { data: { user } } = await supabase.auth.getUser();
          if (payload.new.mentor_type === mentorType && payload.new.user_id === user?.id) {
            setMessages((prev) => prev.some(m => m.id === payload.new.id) ? prev : [...prev, payload.new]);
          }
        }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  };

  const handleHandoff = async (targetMentor: string) => {
    if (messages.length < 2) {
      toast.error("Have a conversation first before switching perspectives");
      return;
    }

    setLoading(true);
    setSuggestedHandoff(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const recentMessages = messages.slice(-20).map(m => ({ role: m.role, content: m.content, created_at: m.created_at }));

      const { data: existingChainHandoff } = await supabase
        .from("conversation_handoffs")
        .select("handoff_chain_id, chain_position, journey_topic")
        .eq("user_id", user.id)
        .eq("target_mentor_type", mentorType)
        .eq("processed", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const firstUserMessage = messages.find(m => m.role === "user");
      const journeyTopic = existingChainHandoff?.journey_topic || (firstUserMessage?.content?.substring(0, 100) + "...");

      const { data: handoff, error } = await supabase
        .from("conversation_handoffs")
        .insert({
          user_id: user.id,
          source_mentor_type: mentorType,
          target_mentor_type: targetMentor,
          source_messages: recentMessages,
          handoff_chain_id: existingChainHandoff?.handoff_chain_id || undefined,
          chain_position: (existingChainHandoff?.chain_position || 0) + 1,
          journey_topic: journeyTopic,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Getting fresh perspective from ${mentorNames[targetMentor]}...`);
      navigate(`/chat/${targetMentor}`, { state: { handoffId: handoff.id } });
    } catch (error: any) {
      console.error("Error creating handoff:", error);
      toast.error("Failed to handoff conversation");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: userMsgData } = await supabase.from("chats").insert({
        user_id: user.id,
        mentor_type: mentorType as any,
        role: "user",
        content: userMessage,
      }).select().single();
      
      if (userMsgData) setMessages((prev) => [...prev, userMsgData]);

      const { data, error } = await supabase.functions.invoke("chat-mentor", {
        body: { mentorType, message: userMessage },
      });

      if (error) throw error;

      const { data: assistantMsgData } = await supabase.from("chats").insert({
        user_id: user.id,
        mentor_type: mentorType as any,
        role: "assistant",
        content: data.response,
      }).select().single();

      if (assistantMsgData) setMessages((prev) => [...prev, assistantMsgData]);

      // Handle Value Map detection
      if (data.valueMapDetection) setValueMapDetection(data.valueMapDetection);

      // Handle suggested handoff
      if (data.suggestedHandoff?.shouldSuggest) setSuggestedHandoff(data.suggestedHandoff);

      // PDR v2.1: Handle project coherence detection (Commitment Card trigger)
      if (data.projectCoherence?.isCoherent) {
        setProjectCoherence(data.projectCoherence);
        setShowCommitmentCard(true);
      }

      const newExchangeCount = exchangeCount + 1;
      setExchangeCount(newExchangeCount);
      
      // Check for breakthrough with proper timing (adaptive detection)
      // Skip if we already detected coherence (PDR v2.1 takes precedence)
      if (mentorType && isFirstSession && newExchangeCount >= 6 && !data.projectCoherence?.isCoherent) {
        const allMessages = [...messages, { role: "user", content: userMessage }, { role: "assistant", content: data.response }];
        const breakthrough = await checkForBreakthrough(
          allMessages.map(m => ({ role: m.role, content: m.content })),
          mentorType,
          false,
          'mentor'
        );
        
        if (breakthrough) {
          setShowFirstWinNaming(true);
        }
      }
    } catch (error: any) {
      toast.error(error.message);
      await loadMessages();
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptFirstWin = async (conceptName: string) => {
    setFirstWinConceptName(conceptName);
    setShowFirstWinNaming(false);
    await completeFirstWin();
    triggerMicroWin('naming');
    setShowFirstWinCelebration(true);
  };

  // PDR v2.1: Handle Commitment Card acceptance (First Win moment)
  const handleCommitmentAccept = async (projectName: string) => {
    setShowCommitmentCard(false);
    await completeFirstWin();
    triggerMicroWin('naming');
    
    // Navigate to Creation Lab with project info
    navigate('/creation-lab', {
      state: {
        projectName,
        projectDescription: projectCoherence?.projectDescription || ''
      }
    });
  };

  const handleStartLearningModule = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-learning-module", {
        body: { chatHistory: messages, mentorType },
      });
      if (error) throw error;
      setLearningModuleData(data.module);
      setShowLearningModule(true);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Use user's selected mentors, fallback to some defaults
  const availableHandoffs = userMentors.length > 0 ? userMentors : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex flex-col">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto p-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{mentorNames[mentorType || ""]}</h1>
            <p className="text-sm text-muted-foreground">
              {fromCouncil ? "Shaping session" : "Your personal mentor"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {availableHandoffs.length > 0 && messages.length >= 2 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={loading} className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    <span className="hidden sm:inline">Get Perspective</span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-popover z-50">
                  <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">
                    Continue with another mentor
                  </div>
                  {availableHandoffs.map((mentor) => (
                    <DropdownMenuItem key={mentor} onClick={() => handleHandoff(mentor)} className="cursor-pointer">
                      <div className="flex flex-col">
                        <span className="font-medium">{mentorNames[mentor]}</span>
                        <span className="text-xs text-muted-foreground">Get their unique perspective</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {exchangeCount >= 3 && (
              <Button variant="outline" size="sm" onClick={handleStartLearningModule} disabled={loading} className="gap-2">
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Take Quiz</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Proactive Mentor Transition Suggestion */}
          {suggestedHandoff && (
            <MentorTransitionCard
              currentMentor={mentorType || ""}
              suggestedMentor={suggestedHandoff.targetMentor}
              suggestedMentorName={mentorNames[suggestedHandoff.targetMentor]}
              reason={suggestedHandoff.reason}
              onAccept={() => handleHandoff(suggestedHandoff.targetMentor)}
              onDismiss={() => setSuggestedHandoff(null)}
            />
          )}

          {/* Breakthrough Detection Card */}
          {latestBreakthrough && !showFirstWinNaming && (
            <BreakthroughDetectedCard
              breakthrough={latestBreakthrough}
              onDismiss={dismissBreakthrough}
              onConvertToGoal={clearBreakthrough}
            />
          )}

          {/* PDR v2.1: Commitment Card (appears on coherence detection) */}
          {showCommitmentCard && projectCoherence && (
            <FirstWinNamingCard
              proposedName={projectCoherence.projectName}
              description={projectCoherence.projectDescription}
              onAccept={handleCommitmentAccept}
              onKeepExploring={() => {
                setShowCommitmentCard(false);
                setProjectCoherence(null);
              }}
            />
          )}

          {/* First Win Naming Card (legacy - for breakthrough detection) */}
          {showFirstWinNaming && latestBreakthrough && !showCommitmentCard && (
            <FirstWinNamingCard
              proposedName={latestBreakthrough.breakthrough_title}
              description={latestBreakthrough.breakthrough_description}
              onAccept={handleAcceptFirstWin}
              onKeepExploring={() => {
                setShowFirstWinNaming(false);
                dismissBreakthrough();
              }}
            />
          )}

          {/* Whispers */}
          {whispers.length > 0 && (
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MessageCircle className="w-3 h-3" />
                <span>Recent Private Whispers</span>
              </div>
              {whispers.slice(0, 2).map((whisper) => (
                <Card key={whisper.id} className="p-3 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground mb-1">
                          {whisper.whisper_type ? `${whisper.whisper_type} whisper` : 'whisper'}
                        </p>
                        <InsightActionButton insightText={whisper.message} sourceType="mentor_whisper" sourceMentor={whisper.mentor_type} sourceContext={{ whisperId: whisper.id }} />
                      </div>
                      <p className="text-sm italic">{whisper.message}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
              <Card className={cn("max-w-[80%] p-4", message.role === "user" ? "bg-primary text-primary-foreground" : "bg-card")}>
                {message.role === "user" ? (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <div className="space-y-2">
                    <HighlightedText text={message.content} />
                    <div className="flex justify-end pt-1">
                      <InsightActionButton insightText={message.content} sourceType="mentor_message" sourceMentor={mentorType} sourceContext={{ messageId: message.id }} />
                    </div>
                  </div>
                )}
              </Card>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <Card className="max-w-[80%] p-4 bg-card">
                <p className="text-muted-foreground italic">Thinking...</p>
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-card/80 backdrop-blur-sm sticky bottom-0">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex gap-2">
            <Input placeholder="Ask your mentor..." value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === "Enter" && handleSend()} disabled={loading} />
            <Button onClick={handleSend} disabled={loading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Learning Module Modal */}
      {showLearningModule && learningModuleData && (
        <MentorLearningModule mentorType={mentorType || ""} mentorName={mentorNames[mentorType || ""]} moduleData={learningModuleData} onComplete={() => { setShowLearningModule(false); setLearningModuleData(null); }} onClose={() => { setShowLearningModule(false); setLearningModuleData(null); }} />
      )}

      {/* Value Map Unlock Celebration */}
      {valueMapDetection && (
        <ValueMapUnlockCelebration
          detection={valueMapDetection}
          onAccept={async (blockKey, content) => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) throw new Error("Not authenticated");
              await supabase.from("value_map_blocks").upsert({ user_id: user.id, block_key: blockKey, content, is_unlocked: true, unlocked_at: new Date().toISOString(), unlock_source: "mentor_chat" }, { onConflict: "user_id,block_key" });
              await supabase.from("future_self_messages").insert({ user_id: user.id, message: `You just unlocked "${valueMapDetection.blockTitle}" in your Value Map. This clarity is building something real.`, trigger_reason: "value_map_unlock" });
              setValueMapDetection(null);
            } catch (error) {
              console.error("Error saving value map block:", error);
              throw error;
            }
          }}
          onDismiss={() => setValueMapDetection(null)}
        />
      )}

      {/* First Win Celebration */}
      {showFirstWinCelebration && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <FirstWinCelebration conceptName={firstWinConceptName} onContinue={() => setShowFirstWinCelebration(false)} />
        </div>
      )}
    </div>
  );
};

export default Chat;
