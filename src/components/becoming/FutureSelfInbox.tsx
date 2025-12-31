import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, ChevronRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface FutureSelfMessage {
  id: string;
  message: string;
  trigger_reason: string;
  emotional_tone: string | null;
  created_at: string;
  was_received: boolean | null;
}

export const FutureSelfInbox = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<FutureSelfMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("future_self_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChat = () => {
    navigate("/chat/future_self");
  };

  const getToneEmoji = (tone: string | null) => {
    switch (tone) {
      case "encouraging": return "💪";
      case "reflective": return "🪞";
      case "celebratory": return "🎉";
      case "nurturing": return "🌱";
      case "challenging": return "⚡";
      default: return "✨";
    }
  };

  if (loading) {
    return (
      <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/5">
        <CardContent className="py-8 text-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-violet-500" />
            Future Self Inbox
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenChat}
            className="text-violet-500 hover:text-violet-600"
          >
            Open Chat
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-6">
            <Sparkles className="w-10 h-10 mx-auto text-violet-500/30 mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              No messages yet. Start a conversation with your Future Self.
            </p>
            <Button
              onClick={handleOpenChat}
              className="bg-violet-500 hover:bg-violet-600"
            >
              Start Conversation
            </Button>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {messages.slice(0, 5).map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "p-3 rounded-lg cursor-pointer transition-colors",
                  "bg-background/50 hover:bg-background/80 border border-violet-500/10",
                  !msg.was_received && "border-violet-500/30 bg-violet-500/5"
                )}
                onClick={handleOpenChat}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg">{getToneEmoji(msg.emotional_tone)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-2">{msg.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                      </span>
                      {!msg.was_received && (
                        <Badge variant="secondary" className="text-xs bg-violet-500/20 text-violet-600">
                          New
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
};
