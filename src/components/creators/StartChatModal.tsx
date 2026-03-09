import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface StartChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorName: string;
  receiverId: string;
}

export const StartChatModal = ({ open, onOpenChange, creatorName, receiverId }: StartChatModalProps) => {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Please sign in first", variant: "destructive" });
        return;
      }

      const { error } = await supabase.from("creator_chat_requests").insert({
        sender_id: user.id,
        receiver_id: receiverId,
        message: message.trim() || null,
        status: "pending",
      });

      if (error) throw error;

      toast({ title: "Request sent! ✨", description: `${creatorName} will be notified.` });
      setMessage("");
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Failed to send request", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Start a conversation with {creatorName}</DialogTitle>
          <DialogDescription>Send a short message to introduce yourself.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value.slice(0, 200))}
              placeholder="Write a short message to introduce yourself..."
              rows={3}
              className="w-full text-sm bg-muted/30 border border-border rounded-lg px-3 py-2 resize-none placeholder:text-muted-foreground/50 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <span className={cn(
              "absolute bottom-2 right-2 text-[10px]",
              message.length > 180 ? "text-destructive" : "text-muted-foreground/40"
            )}>
              {message.length}/200
            </span>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSend} disabled={sending}>
              {sending ? "Sending..." : "Send request"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
