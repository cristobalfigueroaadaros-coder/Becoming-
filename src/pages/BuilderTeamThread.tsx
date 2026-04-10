import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ChatBubble, { type ChatMessage } from "@/components/console-thread/ChatBubble";
import TypingIndicator from "@/components/console-thread/TypingIndicator";

// Builder Team mentors
const BUILDER_TEAM_MENTORS = [
  "design_thinking_mentor",
  "ux_mentor",
  "gamification_mentor",
  "problem_mentor",
  "perspective_mentor",
];

const mentorConfig: Record<string, { name: string; color: string; icon: string }> = {
  design_thinking_mentor: { name: "Design Thinking Mentor", color: "bg-lime-500", icon: "🧪" },
  ux_mentor: { name: "UX Mentor", color: "bg-fuchsia-500", icon: "💜" },
  gamification_mentor: { name: "Gamification Mentor", color: "bg-yellow-500", icon: "🎮" },
  problem_mentor: { name: "Problem Mentor", color: "bg-slate-600", icon: "🔍" },
  perspective_mentor: { name: "Perspective Mentor", color: "bg-sky-500", icon: "🗺️" },
  future_self: { name: "Future Self", color: "bg-primary", icon: "✨" },
};

type Phase =
  | "bt_intro"
  | "bt_q1" | "bt_q2" | "bt_q3"
  | "bt_processing"
  | "bt_waiting_activation"
  | "bt_perspectives" | "bt_banter"
  | "bt_followup"
  | "bt_perspectives_2" | "bt_banter_2"
  | "bt_handoff_offer"
  | "bt_mentor_1to1";

const BT_QUESTIONS = [
  "What part of the project would you like to improve or work on today?",
  "What challenge or difficulty are you facing with this part of the project?",
  "If this worked exactly the way you imagine, what would the experience feel like for the user?",
];

const generateReflection = (answer: string): string | null => {
  const lower = answer.toLowerCase();
  if (answer.length < 15) return null;

  if (/experience|interact|engag|fun|play/i.test(lower)) return "Making the experience more engaging could transform the whole project.";
  if (/design|visual|look|feel|style/i.test(lower)) return "Design shapes how people feel before they even read a word.";
  if (/game|reward|point|progress|level/i.test(lower)) return "Smart gamification can make the difference between a one-time visit and a habit.";
  if (/user|people|audience|customer/i.test(lower)) return "Thinking about the user first is always the right starting point.";
  if (/problem|challeng|stuck|difficult|hard/i.test(lower)) return "Naming the challenge clearly is already half the solution.";
  if (/story|narrative|journey|flow/i.test(lower)) return "Great products always have a compelling narrative at their core.";
  if (/simple|clear|easy|intuitive/i.test(lower)) return "Simplicity is the ultimate sophistication — and the hardest to achieve.";
  if (/emotion|feel|joy|delight|surprise/i.test(lower)) return "Emotional design is what turns a product into an experience.";
  if (/connect|communit|togeth|social/i.test(lower)) return "Building connection is one of the most powerful things a product can do.";
  if (answer.length > 100) return "There's a lot of depth in what you just shared.";
  return "That's a great starting point to work with.";
};

interface BuilderTeamThreadProps {
  embedded?: boolean;
}

const BuilderTeamThread = ({ embedded = false }: BuilderTeamThreadProps) => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("bt_intro");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState<{ name?: string; icon?: string; color?: string } | null>(null);
  const [intakeAnswers, setIntakeAnswers] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState("friend");
  const [projectName, setProjectName] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [handoffMentor, setHandoffMentor] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [councilRoundCount, setCouncilRoundCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const addSystemMessage = useCallback((content: string, mentorType?: string, messageType?: "perspective" | "banter" | "standard" | "notification") => {
    const config = mentorType ? mentorConfig[mentorType] : undefined;
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "mentor",
      content,
      mentorName: config?.name,
      mentorType,
      mentorIcon: config?.icon,
      mentorColor: config?.color,
      messageType,
    };
    setMessages(prev => [...prev, msg]);
  }, []);

  const addUserMessage = useCallback((content: string) => {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };
    setMessages(prev => [...prev, msg]);
  }, []);

  const showTyping = useCallback((mentorType?: string, durationMs = 1200) => {
    const config = mentorType ? mentorConfig[mentorType] : undefined;
    setTyping({ name: config?.name, icon: config?.icon, color: config?.color });
    return new Promise<void>(resolve => setTimeout(() => { setTyping(null); resolve(); }, durationMs));
  }, []);

  // Init: load profile + project, then show opening messages
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (!embedded) navigate("/"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, first_project_id")
        .eq("id", user.id)
        .single();

      const name = (profile as any)?.display_name || "friend";
      setDisplayName(name);

      // Load current project
      let pName = "your project";
      const fpId = (profile as any)?.first_project_id;
      if (fpId) {
        setProjectId(fpId);
        const { data: proj } = await supabase
          .from("integrator_projects")
          .select("project_title")
          .eq("id", fpId)
          .single();
        if (proj?.project_title) {
          pName = proj.project_title;
          setProjectName(proj.project_title);
        }
      }

      // Opening messages from Future Self
      const msg1: ChatMessage = {
        id: crypto.randomUUID(), role: "mentor", content: `Hey ${name} 👋`,
        mentorName: mentorConfig.future_self.name, mentorIcon: mentorConfig.future_self.icon, mentorColor: mentorConfig.future_self.color,
      };
      setMessages([msg1]);

      await showTyping("future_self", 1500);
      addSystemMessage(`I see you're working on ${pName}.`, "future_self");

      await showTyping("future_self", 1800);
      addSystemMessage("If you'd like, we can bring in the Builder Team to help improve or iterate the project.", "future_self");

      await showTyping("future_self", 2000);
      addSystemMessage("They'll help you think about the experience, the engagement, the design, and the core problem you're solving.", "future_self");

      await showTyping("future_self", 1200);
      addSystemMessage(BT_QUESTIONS[0], "future_self");

      setPhase("bt_q1");
      setInitialLoading(false);
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    addUserMessage(text);

    if (phase === "bt_q1") {
      const newAnswers = [text];
      setIntakeAnswers(newAnswers);
      setPhase("bt_q2");
      await showTyping("future_self", 1500);
      const reflection = generateReflection(text);
      if (reflection) {
        addSystemMessage(reflection, "future_self");
        await showTyping("future_self", 1200);
      }
      addSystemMessage(BT_QUESTIONS[1], "future_self");
    } else if (phase === "bt_q2") {
      const newAnswers = [...intakeAnswers, text];
      setIntakeAnswers(newAnswers);
      setPhase("bt_q3");
      await showTyping("future_self", 1500);
      const reflection = generateReflection(text);
      if (reflection) {
        addSystemMessage(reflection, "future_self");
        await showTyping("future_self", 1200);
      }
      addSystemMessage(BT_QUESTIONS[2], "future_self");
    } else if (phase === "bt_q3") {
      const newAnswers = [...intakeAnswers, text];
      setIntakeAnswers(newAnswers);
      setPhase("bt_processing");
      await processBuilderIntake(newAnswers);
    } else if (phase === "bt_waiting_activation") {
      const affirmative = /^(let'?s?\s*go|yes|yeah|yep|sure|ready|ok|okay|absolutely|do it|go)/i.test(text);
      if (affirmative) {
        await runBuilderTeamMeeting(intakeAnswers);
      } else {
        // Treat as additional context, re-prompt
        addSystemMessage('Write "let\'s go" when you\'re ready to see your Builder Team.', "future_self");
      }
    } else if (phase === "bt_followup") {
      await handleFollowupReply(text);
    } else if (phase === "bt_handoff_offer") {
      await handleHandoffResponse(text);
    } else if (phase === "bt_mentor_1to1") {
      await handleMentor1to1(text);
    }
  };

  const processBuilderIntake = async (answers: string[]) => {
    // Reflection after final answer
    await showTyping("future_self", 1500);
    const reflection = generateReflection(answers[2]);
    if (reflection) {
      addSystemMessage(reflection, "future_self");
      await showTyping("future_self", 1200);
    }

    addSystemMessage("Thanks for sharing that.", "future_self");
    await showTyping("future_self", 1500);
    addSystemMessage(`I think I understand what you're trying to improve in ${projectName || "your project"}.`, "future_self");

    await showTyping("future_self", 1800);
    addSystemMessage("Let me bring in the Builder Team to explore this with you.", "future_self");
    await showTyping("future_self", 1500);
    addSystemMessage("They'll help you think about the design, the user experience, the engagement, and the core problem you're solving.", "future_self");

    await showTyping("future_self", 1200);
    addSystemMessage('Write "let\'s go" to see your Builder Team.', "future_self");
    setPhase("bt_waiting_activation");
  };

  const runBuilderTeamMeeting = async (answers: string[]) => {
    setLoading(true);
    try {
      const fullContext = `Project: ${projectName}\n\nWhat they want to improve: ${answers[0]}\n\nChallenge: ${answers[1]}\n\nIdeal experience: ${answers[2]}`;

      const { data, error } = await supabase.functions.invoke("council-meeting", {
        body: {
          question: fullContext,
          mentorTypes: BUILDER_TEAM_MENTORS,
          conversationHistory: [],
          entryState: "BUILD",
          projectContext: projectName,
        },
      });

      if (error) throw error;

      const perspectives = data.mentorPerspectives || {};
      setPhase("bt_perspectives");

      for (const [mentorType, perspective] of Object.entries(perspectives)) {
        if (mentorConfig[mentorType]) {
          await showTyping(mentorType, 5000 + Math.random() * 15000);
          addSystemMessage(perspective as string, mentorType, "perspective");
        }
      }

      const banterLines = data.banterLines || [];
      if (banterLines.length > 0) {
        setPhase("bt_banter");
        for (const line of banterLines) {
          if (mentorConfig[line.mentor]) {
            await showTyping(line.mentor, 4000 + Math.random() * 10000);
            addSystemMessage(line.text, line.mentor, "banter");
          }
        }
      }

      // Future Self follow-up question
      const followupQ = data.clarityQuestion || data.suggestedNextQuestion;
      if (followupQ) {
        await showTyping("future_self", 800);
        addSystemMessage(followupQ, "future_self");
      }

      setCouncilRoundCount(1);
      setPhase("bt_followup");

      // Save design thinking insights in background
      saveDesignThinkingInsights(perspectives, answers);
    } catch (error: any) {
      console.error("Error in builder team meeting:", error);
      toast.error("Something went wrong. Please try again.");
      setPhase("bt_waiting_activation");
    } finally {
      setLoading(false);
    }
  };

  const handleFollowupReply = async (text: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("council-meeting", {
        body: {
          question: text,
          mentorTypes: BUILDER_TEAM_MENTORS,
          conversationHistory: [{
            role: "user",
            content: intakeAnswers.join("\n"),
          }],
          entryState: "BUILD",
          projectContext: projectName,
        },
      });

      if (error) throw error;

      const perspectives = data.mentorPerspectives || {};
      setPhase("bt_perspectives_2");

      for (const [mentorType, perspective] of Object.entries(perspectives)) {
        if (mentorConfig[mentorType]) {
          await showTyping(mentorType, 5000 + Math.random() * 12000);
          addSystemMessage(perspective as string, mentorType, "perspective");
        }
      }

      if (data.banterLines?.length > 0) {
        setPhase("bt_banter_2");
        for (const line of data.banterLines) {
          if (mentorConfig[line.mentor]) {
            await showTyping(line.mentor, 4000 + Math.random() * 10000);
            addSystemMessage(line.text, line.mentor, "banter");
          }
        }
      }

      // Save more design thinking insights
      saveDesignThinkingInsights(perspectives, intakeAnswers);

      // Suggest 1-to-1 handoff
      const suggestedMentor = data.suggestedMentorFor1to1;
      if (suggestedMentor && mentorConfig[suggestedMentor.mentorType]) {
        setHandoffMentor(suggestedMentor.mentorType);
        const config = mentorConfig[suggestedMentor.mentorType];
        await showTyping("future_self", 800);
        addSystemMessage(
          `It might be helpful to go deeper on this with ${config.name}.\n\nLet's explore that together. Type "let's go" when you're ready.`,
          "future_self"
        );
        setPhase("bt_handoff_offer");
      } else {
        // Default: pick the most relevant mentor
        const defaultMentor = "design_thinking_mentor";
        setHandoffMentor(defaultMentor);
        const config = mentorConfig[defaultMentor];
        await showTyping("future_self", 800);
        addSystemMessage(
          `It might be helpful to go deeper on this with ${config.name}.\n\nLet's explore that together. Type "let's go" when you're ready.`,
          "future_self"
        );
        setPhase("bt_handoff_offer");
      }

      setCouncilRoundCount(prev => prev + 1);
    } catch (error: any) {
      console.error("Error in followup:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleHandoffResponse = async (text: string) => {
    const affirmative = /^(let'?s?\s*go|yes|yeah|yep|sure|ready|ok|okay|absolutely|do it|go)/i.test(text);
    if (!affirmative) {
      // User wants to keep exploring in the group
      setPhase("bt_followup");
      await handleFollowupReply(text);
      return;
    }

    if (!handoffMentor) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const sourceMessages = messages.slice(-20).map(m => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      }));

      const { data: handoff, error: handoffError } = await supabase
        .from("conversation_handoffs")
        .insert({
          user_id: user.id,
          source_mentor_type: "builders_team",
          target_mentor_type: handoffMentor,
          source_messages: sourceMessages,
          journey_topic: `Builder Team: improving ${projectName}`,
          processed: false,
        })
        .select()
        .single();

      if (handoffError) throw handoffError;

      const { data, error } = await supabase.functions.invoke("chat-mentor", {
        body: { mentorType: handoffMentor, message: "__HANDOFF_INIT__", handoffId: handoff.id },
      });

      if (error) throw error;

      await supabase.from("conversation_handoffs").update({ processed: true }).eq("id", handoff.id);

      await showTyping(handoffMentor, 1000);
      addSystemMessage(data.response, handoffMentor);

      await supabase.from("chats").insert({
        user_id: user.id,
        mentor_type: handoffMentor as any,
        role: "assistant",
        content: data.response,
      });

      setPhase("bt_mentor_1to1");
    } catch (error: any) {
      console.error("Error in handoff:", error);
      toast.error("Handoff failed");
    } finally {
      setLoading(false);
    }
  };

  const handleMentor1to1 = async (text: string) => {
    if (!handoffMentor) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("chats").insert({
        user_id: user.id,
        mentor_type: handoffMentor as any,
        role: "user",
        content: text,
      });

      await showTyping(handoffMentor, 800 + Math.random() * 800);

      const { data, error } = await supabase.functions.invoke("chat-mentor", {
        body: { mentorType: handoffMentor, message: text },
      });

      if (error) throw error;

      await supabase.from("chats").insert({
        user_id: user.id,
        mentor_type: handoffMentor as any,
        role: "assistant",
        content: data.response,
      });

      addSystemMessage(data.response, handoffMentor);
    } catch (error: any) {
      console.error("Error in 1-to-1:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Save structured insights to design thinking content
  const saveDesignThinkingInsights = async (perspectives: Record<string, unknown>, answers: string[]) => {
    if (!projectId) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Extract structured insights from perspectives
      const insightEntries = Object.entries(perspectives).map(([mentor, text]) => ({
        mentor: mentorConfig[mentor]?.name || mentor,
        insight: (text as string).substring(0, 300),
        context: answers[0] || "",
      }));

      // Save to design_thinking_content as empathize/ideate phase entries
      const phases = ["empathize", "ideate"];
      for (const phase of phases) {
        const { data: existing } = await supabase
          .from("design_thinking_content")
          .select("id, content")
          .eq("project_id", projectId)
          .eq("user_id", user.id)
          .eq("phase", phase)
          .single();

        if (existing) {
          // Append insights
          const currentContent = (existing.content as any) || {};
          const updatedContent = {
            ...currentContent,
            builderTeamInsights: [
              ...((currentContent as any)?.builderTeamInsights || []),
              ...insightEntries,
            ],
          };
          await supabase
            .from("design_thinking_content")
            .update({ content: updatedContent })
            .eq("id", existing.id);
        } else {
          await supabase
            .from("design_thinking_content")
            .insert({
              project_id: projectId,
              user_id: user.id,
              phase,
              content: { builderTeamInsights: insightEntries },
            });
        }
      }
    } catch (e) {
      console.error("Failed to save design thinking insights:", e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isInputDisabled = loading || phase === "bt_intro" || phase === "bt_processing" || phase === "bt_perspectives" || phase === "bt_banter" || phase === "bt_perspectives_2" || phase === "bt_banter_2";

  const threadTitle = projectName ? `${projectName} — Builder Team` : "Builder Team";

  if (initialLoading) {
    return (
      <div className={cn("flex items-center justify-center", embedded ? "h-full" : "h-screen")}>
        <p className="text-muted-foreground">Loading conversation...</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col bg-background", embedded ? "h-full" : "h-screen")}>
      {/* Header - only show when NOT embedded */}
      {!embedded && (
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background/95 backdrop-blur-sm">
          <Button variant="ghost" size="icon" onClick={() => navigate("/council")} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-foreground truncate flex-1">{threadTitle}</h1>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-1">
        {messages.map((msg, i) => {
          const perspectiveIndex = msg.messageType === "perspective"
            ? messages.slice(0, i + 1).filter(m => m.messageType === "perspective").length
            : undefined;
          return (
            <ChatBubble key={msg.id} message={msg} index={i} perspectiveIndex={perspectiveIndex} />
          );
        })}
        {typing && (
          <TypingIndicator
            mentorName={typing.name}
            mentorIcon={typing.icon}
            mentorColor={typing.color}
          />
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border bg-background/95 backdrop-blur-sm">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              phase === "bt_waiting_activation" ? 'Type "let\'s go" to begin...'
              : phase === "bt_handoff_offer" ? 'Type "let\'s go" or reply...'
              : "Type your message..."
            }
            disabled={isInputDisabled}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isInputDisabled}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BuilderTeamThread;
