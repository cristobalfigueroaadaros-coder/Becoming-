import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Sparkles, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MentorLearningModule } from "@/components/MentorLearningModule";
import { HighlightedText } from "@/components/HighlightedText";

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
  const [messages, setMessages] = useState<any[]>([]);
  const [whispers, setWhispers] = useState<Whisper[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLearningModule, setShowLearningModule] = useState(false);
  const [learningModuleData, setLearningModuleData] = useState<any>(null);
  const [exchangeCount, setExchangeCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    // Count user messages to track exchanges
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
      
      // Count exchanges
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
              // Prevent duplicates
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

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Save user message and add to state immediately
      const { data: userMsgData } = await supabase.from("chats").insert({
        user_id: user.id,
        mentor_type: mentorType as any,
        role: "user",
        content: userMessage,
      }).select().single();
      
      if (userMsgData) {
        setMessages((prev) => [...prev, userMsgData]);
      }

      // Call AI function
      const { data, error } = await supabase.functions.invoke("chat-mentor", {
        body: {
          mentorType,
          message: userMessage,
        },
      });

      if (error) throw error;

      // Save assistant response and add to state immediately
      const { data: assistantMsgData } = await supabase.from("chats").insert({
        user_id: user.id,
        mentor_type: mentorType as any,
        role: "assistant",
        content: data.response,
      }).select().single();

      if (assistantMsgData) {
        setMessages((prev) => [...prev, assistantMsgData]);
      }

      // Check if we should offer learning module (after 4-6 exchanges)
      const newExchangeCount = exchangeCount + 1;
      setExchangeCount(newExchangeCount);
      
      if (newExchangeCount >= 4 && newExchangeCount <= 6 && Math.random() > 0.5) {
        // Suggest learning module
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
      // Reload messages on error to sync state
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
          {exchangeCount >= 3 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartLearningModule}
              disabled={loading}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Take Quiz
            </Button>
          )}
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
