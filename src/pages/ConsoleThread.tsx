import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ChatBubble, { type ChatMessage } from "@/components/console-thread/ChatBubble";
import TypingIndicator from "@/components/console-thread/TypingIndicator";
import MentorRevealCard from "@/components/console-thread/MentorRevealCard";
import ProjectCreationCard from "@/components/console-thread/ProjectCreationCard";
import confetti from "canvas-confetti";

// Mentor config (reused from Council.tsx)
const mentorConfig: Record<string, { name: string; color: string; icon: string }> = {
  discipline_mentor: { name: "Discipline Mentor", color: "bg-orange-500", icon: "🎯" },
  strategist_mentor: { name: "Strategist Mentor", color: "bg-blue-500", icon: "♟️" },
  creative_visionary: { name: "Creative Visionary", color: "bg-purple-500", icon: "🎨" },
  quantum_inventor: { name: "Quantum Inventor", color: "bg-cyan-500", icon: "⚡" },
  mystic_mentor: { name: "Mystic Mentor", color: "bg-indigo-500", icon: "🔮" },
  business_mentor: { name: "Business Mentor", color: "bg-green-500", icon: "📈" },
  marketing_mentor: { name: "Marketing Mentor", color: "bg-pink-500", icon: "📣" },
  scientific_mentor: { name: "Scientific Mentor", color: "bg-teal-500", icon: "🔬" },
  heart_mentor: { name: "Heart Mentor", color: "bg-rose-500", icon: "💗" },
  ancient_sage: { name: "Ancient Sage", color: "bg-amber-600", icon: "📜" },
  alignment_mentor: { name: "Alignment Mentor", color: "bg-emerald-500", icon: "🧭" },
  oracle_mother: { name: "Oracle Mother", color: "bg-violet-500", icon: "🌙" },
  future_self: { name: "Future Self", color: "bg-primary", icon: "✨" },
  perspective_mentor: { name: "Perspective Mentor", color: "bg-sky-500", icon: "🗺️" },
  challenger_mentor: { name: "Challenger Mentor", color: "bg-red-600", icon: "⚔️" },
  design_thinking_mentor: { name: "Design Thinking Mentor", color: "bg-lime-500", icon: "🧪" },
  problem_mentor: { name: "Problem Mentor", color: "bg-slate-600", icon: "🔍" },
  inner_clarity_mentor: { name: "Inner Clarity Mentor", color: "bg-indigo-600", icon: "🪞" },
  release_mentor: { name: "Release Mentor", color: "bg-teal-600", icon: "🌊" },
};

type Phase =
  | "intake_q1" | "intake_q2" | "intake_q3"
  | "processing"
  | "council_reveal" | "council_accepted"
  | "perspectives" | "banter"
  | "user_reply"
  | "handoff_offer" | "mentor_1to1"
  | "project_detected" | "complete";

const INTAKE_QUESTIONS = [
  "What is your work experience or background?",
  "Tell us about your story. Who are you becoming?",
  "What are you building or thinking about building?",
];

interface ConsoleThreadProps {
  embedded?: boolean;
}

const ConsoleThread = ({ embedded = false }: ConsoleThreadProps) => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("intake_q1");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState<{ name?: string; icon?: string; color?: string } | null>(null);
  const [intakeAnswers, setIntakeAnswers] = useState<string[]>([]);
  const [userMentors, setUserMentors] = useState<string[]>([]);
  const [entryState, setEntryState] = useState("DISCOVER");
  const [councilAccepted, setCouncilAccepted] = useState(false);
  const [projectName, setProjectName] = useState("New Conversation");
  const [handoffMentor, setHandoffMentor] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // Persist a message to DB
  const persistMessage = async (msg: ChatMessage, currentPhase: Phase) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("console_thread_messages").insert({
        user_id: user.id,
        role: msg.role,
        content: msg.content,
        mentor_type: msg.mentorName ? Object.entries(mentorConfig).find(([_, v]) => v.name === msg.mentorName)?.[0] : null,
        mentor_name: msg.mentorName || null,
        mentor_icon: msg.mentorIcon || null,
        mentor_color: msg.mentorColor || null,
        card_type: msg.card ? "card" : null,
        phase: currentPhase,
      } as any);
    } catch (e) {
      console.error("Failed to persist message:", e);
    }
  };

  // Persist phase to profile
  const persistPhase = async (newPhase: Phase) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("profiles").update({ console_thread_phase: newPhase } as any).eq("id", user.id);
    } catch (e) {
      console.error("Failed to persist phase:", e);
    }
  };

  // Load existing messages from DB on init
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (!embedded) navigate("/"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("console_intake_completed, entry_state, console_thread_phase")
        .eq("id", user.id)
        .single();

      setEntryState(profile?.entry_state || "DISCOVER");

      // Load mentors
      const { data: mentors } = await supabase
        .from("user_mentors")
        .select("mentor_type")
        .eq("user_id", user.id);
      if (mentors) setUserMentors(mentors.map(m => m.mentor_type));

      // Try to restore existing thread messages
      const { data: savedMessages } = await supabase
        .from("console_thread_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (savedMessages && savedMessages.length > 0) {
        // Restore messages
        const restored: ChatMessage[] = savedMessages.map((m: any) => ({
          id: m.id,
          role: m.role as "user" | "mentor" | "system",
          content: m.content,
          mentorName: m.mentor_name || undefined,
          mentorIcon: m.mentor_icon || undefined,
          mentorColor: m.mentor_color || undefined,
          // Cards are not restorable as React nodes; show text instead
          card: m.card_type === "card" ? undefined : undefined,
        }));
        setMessages(restored);

        // Restore phase
        const savedPhase = (profile as any)?.console_thread_phase as Phase | null;
        if (savedPhase) {
          setPhase(savedPhase);
          // Restore intake answers from user messages
          const userMsgs = restored.filter(m => m.role === "user");
          setIntakeAnswers(userMsgs.slice(0, 3).map(m => m.content));
        }
      } else {
        // Fresh thread — add first question from Future Self
        addSystemMessage(INTAKE_QUESTIONS[0], "future_self", "intake_q1");
      }

      setInitialLoading(false);
    };
    init();
  }, []);

  const addSystemMessage = (content: string, mentorType?: string, phaseForPersist?: Phase) => {
    const config = mentorType ? mentorConfig[mentorType] : undefined;
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "mentor",
      content,
      mentorName: config?.name,
      mentorIcon: config?.icon,
      mentorColor: config?.color,
    };
    setMessages(prev => [...prev, msg]);
    persistMessage(msg, phaseForPersist || phase);
  };

  const addUserMessage = (content: string, phaseForPersist?: Phase) => {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };
    setMessages(prev => [...prev, msg]);
    persistMessage(msg, phaseForPersist || phase);
  };

  const addCardMessage = (card: React.ReactNode, mentorType?: string, phaseForPersist?: Phase) => {
    const config = mentorType ? mentorConfig[mentorType] : undefined;
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "system",
      content: "",
      mentorName: config?.name,
      mentorIcon: config?.icon,
      mentorColor: config?.color,
      card,
    };
    setMessages(prev => [...prev, msg]);
    persistMessage(msg, phaseForPersist || phase);
  };

  const showTyping = (mentorType?: string, durationMs = 1200) => {
    const config = mentorType ? mentorConfig[mentorType] : undefined;
    setTyping({ name: config?.name, icon: config?.icon, color: config?.color });
    return new Promise<void>(resolve => setTimeout(() => { setTyping(null); resolve(); }, durationMs));
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    addUserMessage(text);

    if (phase === "intake_q1") {
      const newAnswers = [...intakeAnswers, text];
      setIntakeAnswers(newAnswers);
      const nextPhase: Phase = "intake_q2";
      setPhase(nextPhase);
      persistPhase(nextPhase);
      await showTyping("future_self", 800);
      addSystemMessage(INTAKE_QUESTIONS[1], "future_self", nextPhase);
    } else if (phase === "intake_q2") {
      const newAnswers = [...intakeAnswers, text];
      setIntakeAnswers(newAnswers);
      const nextPhase: Phase = "intake_q3";
      setPhase(nextPhase);
      persistPhase(nextPhase);
      await showTyping("future_self", 800);
      addSystemMessage(INTAKE_QUESTIONS[2], "future_self", nextPhase);
    } else if (phase === "intake_q3") {
      const newAnswers = [...intakeAnswers, text];
      setIntakeAnswers(newAnswers);
      setPhase("processing");
      persistPhase("processing");
      await processIntake(newAnswers);
    } else if (phase === "user_reply") {
      await handleUserReply(text);
    } else if (phase === "handoff_offer") {
      await handleHandoffResponse(text);
    } else if (phase === "mentor_1to1") {
      await handleMentor1to1(text);
    }
  };

  const processIntake = async (answers: string[]) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await showTyping("future_self", 1500);
      addSystemMessage("Processing your answers... Let me assemble your Council.", "future_self", "processing");

      await supabase.from("profiles").update({
        work_context: answers[0],
      }).eq("id", user.id);

      const storyText = `Work background: ${answers[0]}\n\nMy story: ${answers[1]}\n\nWhat I'm building: ${answers[2]}`;
      await supabase.functions.invoke("process-user-foundation", {
        body: { storyText },
      });

      await showTyping(undefined, 1000);
      addSystemMessage("Based on your answers, this will be your Council.", "future_self", "council_reveal");

      const nextPhase: Phase = "council_reveal";
      setPhase(nextPhase);
      persistPhase(nextPhase);
      addCardMessage(
        <MentorRevealCard
          mentors={userMentors}
          entryState={entryState}
          onAccept={handleCouncilAccept}
          accepted={false}
        />,
        undefined,
        nextPhase
      );
    } catch (error: any) {
      console.error("Error processing intake:", error);
      toast.error("Something went wrong. Please try again.");
      setPhase("intake_q1");
      persistPhase("intake_q1");
    } finally {
      setLoading(false);
    }
  };

  const handleCouncilAccept = async () => {
    setCouncilAccepted(true);
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });

    setMessages(prev => {
      const updated = [...prev];
      let cardIdx = -1;
      for (let i = updated.length - 1; i >= 0; i--) {
        if (updated[i].card) { cardIdx = i; break; }
      }
      if (cardIdx >= 0) {
        updated[cardIdx] = {
          ...updated[cardIdx],
          card: (
            <MentorRevealCard
              mentors={userMentors}
              entryState={entryState}
              onAccept={() => {}}
              accepted={true}
            />
          ),
        };
      }
      return updated;
    });

    const nextPhase: Phase = "council_accepted";
    setPhase(nextPhase);
    persistPhase(nextPhase);

    await runCouncilMeeting();
  };

  const runCouncilMeeting = async () => {
    setLoading(true);
    try {
      const projectIdea = intakeAnswers[2] || "I want to build something meaningful";

      const { data, error } = await supabase.functions.invoke("council-meeting", {
        body: {
          question: projectIdea,
          mentorTypes: [...userMentors, "future_self"],
          conversationHistory: [],
        },
      });

      if (error) throw error;

      const perspectives = data.mentorPerspectives || {};
      const perspPhase: Phase = "perspectives";
      setPhase(perspPhase);
      persistPhase(perspPhase);

      for (const [mentorType, perspective] of Object.entries(perspectives)) {
        await showTyping(mentorType, 600 + Math.random() * 600);
        addSystemMessage(perspective as string, mentorType, perspPhase);
      }

      const banterLines = data.banterLines || [];
      if (banterLines.length > 0) {
        const banterPhase: Phase = "banter";
        setPhase(banterPhase);
        persistPhase(banterPhase);
        for (const line of banterLines) {
          await showTyping(line.mentor, 400 + Math.random() * 400);
          addSystemMessage(line.text, line.mentor, banterPhase);
        }
      }

      const clarityQ = data.clarityQuestion || data.suggestedNextQuestion;
      if (clarityQ) {
        await showTyping("future_self", 600);
        addSystemMessage(clarityQ, "future_self", "user_reply");
      }

      if (data.suggestedMentorFor1to1) {
        setHandoffMentor(data.suggestedMentorFor1to1.mentorType);
      }

      const nextPhase: Phase = "user_reply";
      setPhase(nextPhase);
      persistPhase(nextPhase);
    } catch (error: any) {
      console.error("Error in council meeting:", error);
      toast.error("Council meeting failed");
    } finally {
      setLoading(false);
    }
  };

  const handleUserReply = async (text: string) => {
    setLoading(true);
    try {
      if (handoffMentor) {
        const config = mentorConfig[handoffMentor];
        await showTyping("future_self", 800);
        addSystemMessage(
          `I think you're ready to work 1-to-1 with ${config?.name || handoffMentor}.\n\nIf you're ready, type "let's go".`,
          "future_self",
          "handoff_offer"
        );
        setPhase("handoff_offer");
        persistPhase("handoff_offer");
      } else {
        const { data, error } = await supabase.functions.invoke("council-meeting", {
          body: {
            question: text,
            mentorTypes: [...userMentors, "future_self"],
            conversationHistory: messages.map(m => ({
              role: m.role === "user" ? "user" : "council",
              content: m.content,
            })),
          },
        });

        if (error) throw error;

        const perspectives = data.mentorPerspectives || {};
        for (const [mentorType, perspective] of Object.entries(perspectives)) {
          await showTyping(mentorType, 500 + Math.random() * 500);
          addSystemMessage(perspective as string, mentorType, "user_reply");
        }

        if (data.banterLines?.length > 0) {
          for (const line of data.banterLines) {
            await showTyping(line.mentor, 300 + Math.random() * 300);
            addSystemMessage(line.text, line.mentor, "user_reply");
          }
        }

        if (data.suggestedMentorFor1to1) {
          setHandoffMentor(data.suggestedMentorFor1to1.mentorType);
        }

        if (data.projectCoherence?.isCoherent) {
          setPhase("project_detected");
          persistPhase("project_detected");
          await showTyping("future_self", 600);
          addSystemMessage("I see a clear project forming here.", "future_self", "project_detected");
          addCardMessage(
            <ProjectCreationCard
              projectName={data.projectCoherence.projectName}
              projectDescription={data.projectCoherence.projectDescription}
              onProjectCreated={handleProjectCreated}
            />,
            undefined,
            "project_detected"
          );
        } else {
          const nextQ = data.clarityQuestion || data.suggestedNextQuestion;
          if (nextQ) {
            await showTyping("future_self", 500);
            addSystemMessage(nextQ, "future_self", "user_reply");
          }
          setPhase("user_reply");
          persistPhase("user_reply");
        }
      }
    } catch (error: any) {
      console.error("Error in user reply:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleHandoffResponse = async (text: string) => {
    const affirmative = /^(let'?s?\s*go|yes|yeah|yep|sure|ready|ok|okay|absolutely|do it|go)/i.test(text);
    if (!affirmative) {
      setPhase("user_reply");
      persistPhase("user_reply");
      await handleUserReply(text);
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
          source_mentor_type: "council",
          target_mentor_type: handoffMentor,
          source_messages: sourceMessages,
          journey_topic: intakeAnswers[2] || "Project exploration",
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
      addSystemMessage(data.response, handoffMentor, "mentor_1to1");

      await supabase.from("chats").insert({
        user_id: user.id,
        mentor_type: handoffMentor as any,
        role: "assistant",
        content: data.response,
      });

      setPhase("mentor_1to1");
      persistPhase("mentor_1to1");
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

      addSystemMessage(data.response, handoffMentor, "mentor_1to1");

      if (data.projectCoherence?.isCoherent) {
        setPhase("project_detected");
        persistPhase("project_detected");
        await showTyping("future_self", 600);
        addSystemMessage("I see a clear project forming here.", "future_self", "project_detected");
        addCardMessage(
          <ProjectCreationCard
            projectName={data.projectCoherence.projectName}
            projectDescription={data.projectCoherence.projectDescription}
            onProjectCreated={handleProjectCreated}
          />,
          undefined,
          "project_detected"
        );
      }
    } catch (error: any) {
      console.error("Error in 1-to-1:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreated = (projectId: string, name: string) => {
    setProjectName(name);
    setPhase("complete");
    persistPhase("complete");
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    
    // Mark intake as completed
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ console_intake_completed: true } as any).eq("id", user.id);
      }
    })();

    setTimeout(() => {
      addSystemMessage(`Your project "${name}" has been created. You can now find it in your Creation Lab.\n\nGood luck — your Council is behind you.`, "future_self", "complete");
    }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isInputDisabled = loading || phase === "processing" || phase === "council_reveal" || phase === "perspectives" || phase === "banter";

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
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-foreground truncate flex-1">{projectName}</h1>
          {phase === "complete" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/council")}
              className="shrink-0"
              title="Talk to Another Mentor"
            >
              <Plus className="w-5 h-5" />
            </Button>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-1">
        {messages.map((msg, i) => (
          <ChatBubble key={msg.id} message={msg} index={i} />
        ))}
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
              phase === "council_reveal" ? "Accept your Council above..."
              : phase === "handoff_offer" ? "Type 'let's go' or reply..."
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

export default ConsoleThread;
