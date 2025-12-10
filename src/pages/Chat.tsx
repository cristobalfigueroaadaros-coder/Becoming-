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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

// Mentors that make sense for handoffs based on different perspectives
const handoffMentors: Record<string, string[]> = {
  creative_visionary: ["business_mentor", "strategist_mentor", "marketing_mentor", "discipline_mentor"],
  business_mentor: ["creative_visionary", "strategist_mentor", "marketing_mentor", "discipline_mentor"],
  strategist_mentor: ["business_mentor", "creative_visionary", "discipline_mentor", "marketing_mentor"],
  marketing_mentor: ["business_mentor", "creative_visionary", "strategist_mentor"],
  discipline_mentor: ["strategist_mentor", "business_mentor", "heart_mentor"],
  heart_mentor: ["oracle_mother", "alignment_mentor", "mystic_mentor", "ancient_sage"],
  mystic_mentor: ["ancient_sage", "oracle_mother", "heart_mentor", "quantum_inventor"],
  ancient_sage: ["mystic_mentor", "heart_mentor", "oracle_mother"],
  oracle_mother: ["heart_mentor", "ancient_sage", "alignment_mentor"],
  alignment_mentor: ["heart_mentor", "strategist_mentor", "oracle_mother"],
  quantum_inventor: ["creative_visionary", "mystic_mentor", "scientific_mentor"],
  scientific_mentor: ["strategist_mentor", "quantum_inventor", "discipline_mentor"],
  future_self: ["discipline_mentor", "strategist_mentor", "heart_mentor"],
};

const Chat = () => {
  const { mentorType } = useParams<{ mentorType: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [messages, setMessages] = useState<any[]>([]);
  const [whispers, setWhispers] = useState<Whisper[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLearningModule, setShowLearningModule] = useState(false);
  const [learningModuleData, setLearningModuleData] = useState<any>(null);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [isHandoffProcessed, setIsHandoffProcessed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

      // Call the edge function with handoff context
      const { data, error } = await supabase.functions.invoke("chat-mentor", {
        body: {
          mentorType,
          message: "__HANDOFF_INIT__",
          handoffId,
        },
      });

      if (error) throw error;

      // Save and display the welcome message from new mentor
      const { data: welcomeMsgData } = await supabase.from("chats").insert({
        user_id: user.id,
        mentor_type: mentorType as any,
        role: "assistant",
        content: data.response,
      }).select().single();

      if (welcomeMsgData) {
        setMessages((prev) => [...prev, welcomeMsgData]);
      }

      // Mark handoff as processed
      await supabase
        .from("conversation_handoffs")
        .update({ processed: true })
        .eq("id", handoffId);

      setIsHandoffProcessed(true);
      
      // Clear the location state to prevent re-processing
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
    countExchanges();
    
    return () => {
      unsubscribe();
    };
  }, [mentorType]);

  const countExchanges = () => {
    const userMessages = messages.filter(m => m.role === "user");
    setExchangeCount(userMessages.length);
  };

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
      
      const userMessages = data?.filter((m: any) => m.role === "user") || [];
      setExchangeCount(userMessages.length);
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
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chats",
          filter: `mentor_type=eq.${mentorType}`,
        },
        async (payload) => {
          const { data: { user } } = await supabase.auth.getUser();
          if (payload.new.mentor_type === mentorType && payload.new.user_id === user?.id) {
            setMessages((prev) => {
              if (prev.some(m => m.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleHandoff = async (targetMentor: string) => {
    if (messages.length < 2) {
      toast.error("Have a conversation first before switching perspectives");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get last 20 messages for context
      const recentMessages = messages.slice(-20).map(m => ({
        role: m.role,
        content: m.content,
        created_at: m.created_at
      }));

      // Check if there's a recent handoff TO this mentor (to continue the chain)
      const { data: existingChainHandoff } = await supabase
        .from("conversation_handoffs")
        .select("handoff_chain_id, chain_position, journey_topic")
        .eq("user_id", user.id)
        .eq("target_mentor_type", mentorType)
        .eq("processed", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Extract topic from first user message for journey tracking
      const firstUserMessage = messages.find(m => m.role === "user");
      const journeyTopic = existingChainHandoff?.journey_topic || 
        (firstUserMessage?.content?.substring(0, 100) + "...");

      // Create handoff record with chain tracking
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

      const chainPosition = (existingChainHandoff?.chain_position || 0) + 1;
      const journeyMessage = chainPosition > 1 
        ? `Continuing journey (step ${chainPosition + 1}) with ${mentorNames[targetMentor]}...`
        : `Getting fresh perspective from ${mentorNames[targetMentor]}...`;
      
      toast.success(journeyMessage);
      
      // Navigate to new mentor with handoff context
      navigate(`/chat/${targetMentor}`, { 
        state: { handoffId: handoff.id }
      });
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
      
      if (userMsgData) {
        setMessages((prev) => [...prev, userMsgData]);
      }

      const { data, error } = await supabase.functions.invoke("chat-mentor", {
        body: {
          mentorType,
          message: userMessage,
        },
      });

      if (error) throw error;

      const { data: assistantMsgData } = await supabase.from("chats").insert({
        user_id: user.id,
        mentor_type: mentorType as any,
        role: "assistant",
        content: data.response,
      }).select().single();

      if (assistantMsgData) {
        setMessages((prev) => [...prev, assistantMsgData]);
      }

      const newExchangeCount = exchangeCount + 1;
      setExchangeCount(newExchangeCount);
      
      if (newExchangeCount >= 4 && newExchangeCount <= 6 && Math.random() > 0.5) {
        const { data: quizMsgData } = await supabase.from("chats").insert({
          user_id: user.id,
          mentor_type: mentorType as any,
          role: "assistant",
          content: "🎓 I sense you're learning a lot! Would you like to test your understanding with a quick quiz? You might earn a badge!",
        }).select().single();
        
        if (quizMsgData) {
          setMessages((prev) => [...prev, quizMsgData]);
        }
      }
    } catch (error: any) {
      toast.error(error.message);
      await loadMessages();
    } finally {
      setLoading(false);
    }
  };

  const handleStartLearningModule = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-learning-module", {
        body: {
          chatHistory: messages,
          mentorType,
        },
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

  const availableHandoffs = handoffMentors[mentorType || ""] || [];

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
            <p className="text-sm text-muted-foreground">Your personal mentor</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Handoff Dropdown */}
            {availableHandoffs.length > 0 && messages.length >= 2 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={loading}
                    className="gap-2"
                  >
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
                    <DropdownMenuItem 
                      key={mentor}
                      onClick={() => handleHandoff(mentor)}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{mentorNames[mentor]}</span>
                        <span className="text-xs text-muted-foreground">
                          Get their unique perspective
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {exchangeCount >= 3 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartLearningModule}
                disabled={loading}
                className="gap-2"
              >
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
          {/* Show recent whispers at top */}
          {whispers.length > 0 && (
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MessageCircle className="w-3 h-3" />
                <span>Recent Private Whispers</span>
              </div>
              {whispers.slice(0, 2).map((whisper) => (
                <Card
                  key={whisper.id}
                  className="p-3 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20"
                >
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {whisper.whisper_type ? `${whisper.whisper_type} whisper` : 'whisper'}
                      </p>
                      <p className="text-sm italic">{whisper.message}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
            >
              <Card
                className={cn(
                  "max-w-[80%] p-4",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card"
                )}
              >
                {message.role === "user" ? (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <HighlightedText text={message.content} />
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
            <Input
              placeholder="Ask your mentor..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              disabled={loading}
            />
            <Button onClick={handleSend} disabled={loading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Learning Module Modal */}
      {showLearningModule && learningModuleData && (
        <MentorLearningModule
          mentorType={mentorType || ""}
          mentorName={mentorNames[mentorType || ""]}
          moduleData={learningModuleData}
          onComplete={() => {
            setShowLearningModule(false);
            setLearningModuleData(null);
          }}
          onClose={() => {
            setShowLearningModule(false);
            setLearningModuleData(null);
          }}
        />
      )}
    </div>
  );
};

export default Chat;