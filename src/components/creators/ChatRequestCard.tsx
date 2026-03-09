import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ChatRequestCardProps {
  requestId: string;
  senderName: string;
  message: string | null;
  onHandled: () => void;
}

export const ChatRequestCard = ({ requestId, senderName, message, onHandled }: ChatRequestCardProps) => {
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      // Get the request to find sender/receiver
      const { data: request } = await supabase
        .from("creator_chat_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (!request) throw new Error("Request not found");

      // Create the chat
      const { data: chat, error: chatError } = await supabase
        .from("creator_chats")
        .insert({
          user1_id: request.sender_id,
          user2_id: request.receiver_id,
        })
        .select()
        .single();

      if (chatError) throw chatError;

      // Insert system message
      await supabase.from("creator_chat_messages").insert({
        chat_id: chat.id,
        sender_id: request.sender_id,
        content: `You connected through Creators.\n\n${senderName} started this conversation.`,
        is_system: true,
      });

      // Update request status
      await supabase
        .from("creator_chat_requests")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("id", requestId);

      toast({ title: "Connection accepted! 🎉" });
      onHandled();
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to accept", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    setLoading(true);
    try {
      await supabase
        .from("creator_chat_requests")
        .update({ status: "declined", updated_at: new Date().toISOString() })
        .eq("id", requestId);

      toast({ title: "Request declined" });
      onHandled();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-3 space-y-2 border-primary/20 bg-primary/5">
      <div>
        <p className="text-sm font-medium text-foreground">{senderName} wants to chat</p>
        {message && (
          <p className="text-xs text-muted-foreground mt-1 italic">"{message}"</p>
        )}
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="gap-1 flex-1" onClick={handleAccept} disabled={loading}>
          <Check className="w-3.5 h-3.5" /> Accept
        </Button>
        <Button size="sm" variant="outline" className="gap-1 flex-1" onClick={handleDecline} disabled={loading}>
          <X className="w-3.5 h-3.5" /> Decline
        </Button>
      </div>
    </Card>
  );
};
