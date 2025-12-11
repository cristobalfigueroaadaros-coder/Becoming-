import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, MessageCircle, X, Sparkles, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface CouncilNotification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  context_data?: any;
  breakthrough_id?: string;
  created_at: string;
}

interface CouncilNotificationCardProps {
  notification: CouncilNotification;
  onDismiss: () => void;
  onRespond: () => void;
}

export const CouncilNotificationCard = ({
  notification,
  onDismiss,
  onRespond,
}: CouncilNotificationCardProps) => {
  const navigate = useNavigate();
  const [dismissing, setDismissing] = useState(false);

  const handleRespond = async () => {
    try {
      // Mark as read
      await supabase
        .from("council_notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", notification.id);

      onRespond();
      
      // Navigate to council meeting with context
      navigate("/council-meeting", {
        state: {
          notificationContext: notification.context_data,
          prefilledQuestion: notification.context_data?.suggested_question,
        }
      });
    } catch (error) {
      console.error("Error responding to notification:", error);
    }
  };

  const handleDismiss = async () => {
    setDismissing(true);
    try {
      await supabase
        .from("council_notifications")
        .update({ dismissed: true })
        .eq("id", notification.id);
      onDismiss();
    } catch (error) {
      console.error("Error dismissing notification:", error);
    } finally {
      setDismissing(false);
    }
  };

  const getIcon = () => {
    switch (notification.notification_type) {
      case "breakthrough_followup":
        return <Sparkles className="w-5 h-5 text-white" />;
      case "goal_created":
        return <Target className="w-5 h-5 text-white" />;
      default:
        return <Users className="w-5 h-5 text-white" />;
    }
  };

  const getGradient = () => {
    switch (notification.notification_type) {
      case "breakthrough_followup":
        return "from-primary to-accent";
      case "goal_created":
        return "from-green-500 to-emerald-600";
      default:
        return "from-secondary to-primary";
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getGradient()} flex items-center justify-center flex-shrink-0`}>
                {getIcon()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-foreground truncate">
                    {notification.title}
                  </h4>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {new Date(notification.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {notification.message}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={handleRespond}
                    className="h-7 text-xs gap-1"
                  >
                    <MessageCircle className="w-3 h-3" />
                    Talk to Council
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDismiss}
                    disabled={dismissing}
                    className="h-7 text-xs"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};
