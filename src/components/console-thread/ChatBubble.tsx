import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { InsightActionButton } from "@/components/InsightActionButton";

// Hex color map for inline styling (Tailwind purges dynamic classes)
// Using vivid neon/electric colors inspired by vibrant gradient palette
const mentorHexColors: Record<string, string> = {
  "bg-orange-500": "#ff6d00",   // discipline_mentor — electric orange
  "bg-blue-500": "#0091ff",     // strategist_mentor — vivid electric blue
  "bg-purple-500": "#e040fb",   // creative_visionary — electric magenta-violet
  "bg-cyan-500": "#00e5ff",     // quantum_inventor — neon cyan
  "bg-indigo-500": "#7c4dff",   // mystic_mentor — deep electric violet
  "bg-green-500": "#00e676",    // business_mentor — neon emerald
  "bg-pink-500": "#ff1a8c",     // marketing_mentor — hot neon pink
  "bg-teal-500": "#00e5cc",     // scientific_mentor — electric teal
  "bg-rose-500": "#ff2d55",     // heart_mentor — vivid coral-red
  "bg-amber-600": "#ffab00",    // ancient_sage — pure gold
  "bg-emerald-500": "#00ffcc",  // alignment_mentor — neon mint
  "bg-violet-500": "#aa00ff",   // oracle_mother — electric deep violet
  "bg-primary": "#8b5cf6",      // future_self — primary purple
  "bg-sky-500": "#00b0ff",      // perspective_mentor — vivid sky
  "bg-red-600": "#ff1744",      // challenger_mentor — vivid red
  "bg-lime-500": "#c6ff00",     // design_thinking_mentor — neon lime
  "bg-slate-600": "#536dfe",    // problem_mentor — electric indigo
  "bg-indigo-600": "#7986cb",   // inner_clarity_mentor — medium indigo
  "bg-teal-600": "#1de9b6",     // release_mentor — electric aqua
};

function getHexColor(tailwindClass?: string): string | undefined {
  if (!tailwindClass) return undefined;
  return mentorHexColors[tailwindClass] || undefined;
}

export interface ChatMessage {
  id: string;
  role: "user" | "system" | "mentor";
  content: string;
  mentorName?: string;
  mentorType?: string;
  mentorIcon?: string;
  mentorColor?: string;
  card?: ReactNode;
  cardType?: string;
  cardData?: Record<string, unknown>;
  timestamp?: string;
  messageType?: "perspective" | "banter" | "standard" | "notification";
}

interface ChatBubbleProps {
  message: ChatMessage;
  index: number;
  perspectiveIndex?: number; // which perspective message this is (1-based)
}

// Strip markdown bold/italic artifacts into proper JSX
const cleanMarkdown = (text: string): React.ReactNode => {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
};

const ChatBubble = ({ message, index, perspectiveIndex }: ChatBubbleProps) => {
  const isUser = message.role === "user";
  const isBanter = message.messageType === "banter";
  const isNotification = message.messageType === "notification";
  const hexColor = getHexColor(message.mentorColor);
  const isPerspective = message.messageType === "perspective";
  const tutorialNotShown = localStorage.getItem('save_tutorial_shown') !== '1';
  const showTutorialArrow = isPerspective && tutorialNotShown;

  // Notification: WhatsApp-style CTA card
  if (isNotification && !isUser) {
    return (
      <motion.div
        className="flex px-4 py-2 justify-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
      >
        <div
          className="max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed border-2 flex items-start gap-3"
          style={{
            borderColor: "#dc2626",
            backgroundColor: "#dc26260F",
          }}
        >
          {message.mentorIcon && (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm"
              style={{ backgroundColor: hexColor ? `${hexColor}33` : "#dc262633" }}
            >
              {message.mentorIcon}
            </div>
          )}
          <div className="flex-1">
            {message.mentorName && (
              <span className="text-xs font-bold block mb-1" style={{ color: "#dc2626" }}>
                {message.mentorName}
              </span>
            )}
            <span className="text-foreground">{cleanMarkdown(message.content)}</span>
          </div>
        </div>
      </motion.div>
    );
  }

  // Banter: WhatsApp zig-zag style
  if (isBanter && !isUser) {
    const isEven = index % 2 === 0;
    return (
      <motion.div
        className={cn("flex px-4 py-0.5", isEven ? "justify-start" : "justify-start pl-12")}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.2) }}
      >
        <div className="max-w-[75%]">
          {message.mentorName && (
            <span
              className="text-[10px] font-semibold block mb-0.5"
              style={{ color: hexColor || "hsl(var(--muted-foreground))" }}
            >
              {message.mentorName}
            </span>
          )}
          <div
            className="group/banter rounded-xl px-3 py-1.5 text-xs leading-relaxed text-foreground whitespace-pre-wrap"
            style={{
              borderLeft: `3px solid ${hexColor || "hsl(var(--muted-foreground))"}`,
              backgroundColor: hexColor ? `${hexColor}1F` : "hsl(var(--muted) / 0.7)",
            }}
          >
            {cleanMarkdown(message.content)}
            <InsightActionButton
              insightText={message.content}
              sourceType="council_banter"
              sourceMentor={message.mentorType}
              className="opacity-0 group-hover/banter:opacity-100 mt-1 -mb-0.5"
            />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn("flex px-4 py-1.5 group", isUser ? "justify-end" : "justify-start")}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
    >
      {!isUser && (
        <div className="flex items-start gap-2.5 max-w-[85%]">
          {message.mentorIcon && (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm mt-0.5"
              style={{ backgroundColor: hexColor ? `${hexColor}33` : "hsl(var(--primary) / 0.2)" }}
            >
              {message.mentorIcon}
            </div>
          )}
          <div className="space-y-1">
            {message.mentorName && (
              <span
                className="text-xs font-medium"
                style={{ color: hexColor || "hsl(var(--muted-foreground))" }}
              >
                {message.mentorName}
              </span>
            )}
            {message.card ? (
              <div>{message.card}</div>
            ) : (
              <div
                className="group/msg rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm leading-relaxed text-foreground whitespace-pre-wrap bg-muted"
                style={{ borderLeft: hexColor ? `3px solid ${hexColor}` : undefined }}
              >
                {cleanMarkdown(message.content)}
                <InsightActionButton
                  insightText={message.content}
                  sourceType={isPerspective ? "mentor_perspective" : "council_guidance"}
                  sourceMentor={message.mentorType}
                  className={isPerspective ? "opacity-40 hover:opacity-100 mt-1.5 -mb-0.5" : "opacity-0 group-hover/msg:opacity-100 mt-1.5 -mb-0.5"}
                  showTutorialArrow={showTutorialArrow}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {isUser && (
        <div className="max-w-[80%]">
          <div className="btn-gradient text-white border-0 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ChatBubble;