import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import type { WeeklyData } from "@/hooks/useMomentumData";
import type { StructuredAnswers } from "./StructuredQuestions";

interface SprintConsoleProps {
  weeklyData: WeeklyData;
  answers: StructuredAnswers;
  onDirectionDecided: (direction: string) => void;
}

interface Message {
  role: "user" | "council";
  content: string;
}

const DIRECTION_OPTIONS = [
  "Continue and deepen",
  "Narrow scope",
  "Adjust intensity",
  "Simplify structure",
  "Test adjacent variation",
  "Pivot",
];

export function SprintConsole({ weeklyData, answers, onDirectionDecided }: SprintConsoleProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [directionProposed, setDirectionProposed] = useState<string | null>(null);
  const [initialSent, setInitialSent] = useState(false);

  const sendMessage = useCallback(async (userMessage: string) => {
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const conversationHistory = newMessages.map((m) => ({
        role: m.role === "council" ? "assistant" : "user",
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke("council-meeting", {
        body: {
          question: userMessage,
          mentorTypes: ["strategist_mentor", "creative_visionary", "business_mentor"],
          conversationHistory,
          councilType: "project",
          sprintReviewContext: {
            momentumScore: weeklyData.momentumScore,
            completionRate: weeklyData.completionRate,
            frictionType: answers.frictionType,
            directionConfidence: answers.directionConfidence,
            usefulnessRating: answers.usefulness,
            biggestWin: answers.biggestWin,
            topWins: weeklyData.topWins,
            frictionPoints: weeklyData.frictionPoints,
            activeDays: weeklyData.activeDays,
            reflectionRate: weeklyData.reflectionRate,
          },
        },
      });

      if (error) throw error;

      const councilText = data?.councilInsight || data?.councilOpener || "Let's refine your direction for next week.";
      setMessages((prev) => [...prev, { role: "council", content: councilText }]);
      
      const newCount = exchangeCount + 1;
      setExchangeCount(newCount);

      // After 3+ exchanges, propose a direction
      if (newCount >= 3 && !directionProposed) {
        // Determine direction from confidence + data
        let suggested = "Continue and deepen";
        if (answers.directionConfidence <= 3) suggested = "Pivot";
        else if (answers.directionConfidence <= 5) suggested = "Narrow scope";
        else if (answers.frictionType === "Overwhelm") suggested = "Simplify structure";
        else if (answers.frictionType === "Task too complex") suggested = "Adjust intensity";
        setDirectionProposed(suggested);
      }
    } catch (err) {
      console.error("Sprint console error:", err);
      setMessages((prev) => [...prev, { role: "council", content: "Let's keep refining. What feels most important for next week?" }]);
    } finally {
      setLoading(false);
    }
  }, [messages, weeklyData, answers, exchangeCount, directionProposed]);

  // Auto-send initial message
  if (!initialSent) {
    setInitialSent(true);
    setTimeout(() => sendMessage("Sprint Review Check-in"), 100);
  }

  return (
    <div className="space-y-3">
      <ScrollArea className="h-[240px] border rounded-lg p-3">
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`text-sm ${msg.role === "council" ? "text-foreground" : "text-muted-foreground italic"}`}>
              <span className="font-medium text-xs uppercase text-muted-foreground">
                {msg.role === "council" ? "Council" : "You"}
              </span>
              <p className="mt-0.5">{msg.content}</p>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Council is thinking...
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input area */}
      {!directionProposed && exchangeCount < 5 && (
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Share your thoughts..."
            onKeyDown={(e) => e.key === "Enter" && input.trim() && !loading && sendMessage(input.trim())}
            disabled={loading}
          />
          <Button size="icon" disabled={!input.trim() || loading} onClick={() => sendMessage(input.trim())}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Direction selection */}
      {(directionProposed || exchangeCount >= 5) && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Choose your sprint direction:</p>
          <div className="grid grid-cols-2 gap-2">
            {DIRECTION_OPTIONS.map((dir) => (
              <Button
                key={dir}
                variant={dir === directionProposed ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={() => onDirectionDecided(dir)}
              >
                {dir}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
