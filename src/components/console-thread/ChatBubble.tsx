import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "system" | "mentor";
  content: string;
  mentorName?: string;
  mentorIcon?: string;
  mentorColor?: string;
  card?: ReactNode;
  timestamp?: string;
}

interface ChatBubbleProps {
  message: ChatMessage;
  index: number;
}

const ChatBubble = ({ message, index }: ChatBubbleProps) => {
  const isUser = message.role === "user";

  return (
    <motion.div
      className={cn("flex px-4 py-1.5", isUser ? "justify-end" : "justify-start")}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
    >
      {!isUser && (
        <div className="flex items-start gap-2.5 max-w-[85%]">
          {message.mentorIcon && (
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm mt-0.5",
              message.mentorColor || "bg-primary/20"
            )}>
              {message.mentorIcon}
            </div>
          )}
          <div className="space-y-1">
            {message.mentorName && (
              <span className="text-xs text-muted-foreground font-medium">{message.mentorName}</span>
            )}
            {message.card ? (
              <div>{message.card}</div>
            ) : (
              <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {message.content}
              </div>
            )}
          </div>
        </div>
      )}

      {isUser && (
        <div className="max-w-[80%]">
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ChatBubble;
