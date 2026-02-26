import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  mentorName?: string;
  mentorIcon?: string;
  mentorColor?: string;
}

const TypingIndicator = ({ mentorName, mentorIcon, mentorColor }: TypingIndicatorProps) => {
  return (
    <div className="flex items-start gap-3 px-4 py-2">
      {mentorIcon && (
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm", mentorColor || "bg-primary/20")}>
          {mentorIcon}
        </div>
      )}
      <div className="space-y-1">
        {mentorName && (
          <span className="text-xs text-muted-foreground font-medium">{mentorName}</span>
        )}
        <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-muted-foreground/40"
              animate={{ y: [0, -4, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
