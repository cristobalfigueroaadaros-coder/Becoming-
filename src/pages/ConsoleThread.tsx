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
import { FirstWinNamingCard } from "@/components/FirstWinNamingCard";
import StarterQuestWinCard from "@/components/console-thread/StarterQuestWinCard";
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

// Extract bold keywords from mentor perspectives (text wrapped in **)
const extractBoldKeywords = (text: string): string[] => {
  const matches = text.match(/\*\*([^*]+)\*\*/g);
  if (!matches) return [];
  return matches.map(m => m.replace(/\*\*/g, '').trim().toLowerCase()).filter(k => k.length > 2 && k.length < 50);
};

// Save keywords from council perspectives to user_keywords table (non-blocking)
const saveCouncilKeywords = async (perspectives: Record<string, string>, userId: string) => {
  try {
    const allKeywords = new Set<string>();
    for (const text of Object.values(perspectives)) {
      for (const kw of extractBoldKeywords(text as string)) {
        allKeywords.add(kw);
      }
    }
    if (allKeywords.size === 0) return;

    for (const keyword of allKeywords) {
      const { data: existing } = await supabase
        .from("user_keywords")
        .select("id, frequency_count")
        .eq("user_id", userId)
        .eq("keyword", keyword)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("user_keywords")
          .update({ frequency_count: (existing.frequency_count || 1) + 1, last_seen_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await supabase.from("user_keywords").insert({
          user_id: userId,
          keyword,
          keyword_type: "concept",
          source: "council",
        });
      }
    }
  } catch (err) {
    console.error("Error saving council keywords (non-fatal):", err);
  }
};

type Phase =
  | "starter_q1" | "starter_q2" | "starter_q3" | "starter_processing" | "starter_win" | "starter_return"
  | "intake_q1" | "intake_q2" | "intake_q3"
  | "processing"
  | "council_reveal" | "council_accepted"
  | "perspectives" | "banter"
  | "user_reply"
  | "handoff_offer" | "mentor_1to1"
  | "project_detected" | "complete" | "post_project";

// Phase-aware intake labels for context sent to AI
const getIntakeLabels = (state: string): string[] => {
  if (state === "BUILD") return [
    "What they're building or working on",
    "Biggest challenge right now",
    "90-day progress goal",
  ];
  if (state === "GROW") return [
    "Their project idea",
    "The problem they're solving",
    "The impact they envision",
  ];
  return [
    "Background and experiences",
    "Problems and topics that pull their attention",
    "Five-year vision of meaningful work",
  ];
};

// Phase-aware intake questions
const getPhaseQuestions = (entryState: string): string[] => {
  if (entryState === "BUILD") return [
    "Let's get straight to it.\n\nWhat are you currently building or working on?",
    "What's the biggest challenge you're facing right now?",
    "If things went well in the next 90 days, what progress would you hope to see?",
  ];
  if (entryState === "GROW") return [
    "Tell me about the idea or project you've been thinking about building.",
    "What problem are you hoping to solve or improve for people?",
    "If this idea worked exactly the way you imagine, what kind of impact would it create?",
  ];
  // DISCOVER (default)
  return [
    "Tell me a little about your background and the experiences that shaped how you see the world.",
    "What kinds of problems, ideas, or topics naturally pull your attention or curiosity?",
    "If you imagine yourself five years from now doing meaningful work — what would you be doing?",
  ];
};

// Phase-aware intro messages for Future Self
const getPhaseIntroMessages = (state: string): string[] => {
  if (state === "BUILD") return [
    "It sounds like you're already building something.",
    "Before we dive in, I want to understand your project and where you are right now so I can assemble the right mentor council to help you move forward.",
    "I'll ask you three quick questions.",
  ];
  if (state === "GROW") return [
    "It sounds like you already have an idea or direction you're interested in exploring.",
    "Before we take the next step, I want to understand your idea a bit better so I can bring in the right mentors to help you develop it.",
    "I'll ask you three questions.",
  ];
  // DISCOVER
  return [
    "Right now it sounds like you're still exploring what direction might feel meaningful for you. That's completely fine.",
    "Before we decide what to build, I'd like to understand a bit more about you, your experiences, and what naturally interests you.",
    "I'll ask you three questions.",
  ];
};

const generateReflection = (answer: string): string | null => {
  const lower = answer.toLowerCase();
  const len = answer.length;

  // Too short to reflect on meaningfully
  if (len < 15) return null;

  // Pattern-match for common themes
  if (/build|creat|launch|start|mak/i.test(lower)) return "That creative drive says a lot about where you're headed.";
  if (/help|support|serv|communit|people/i.test(lower)) return "That kind of purpose — helping others — runs deep.";
  if (/design|art|music|writ|story/i.test(lower)) return "There's something powerful about channeling ideas into form.";
  if (/tech|code|engineer|develop|software/i.test(lower)) return "Sounds like you've built real depth in that space.";
  if (/teach|mentor|coach|educ/i.test(lower)) return "Guiding others is one of the most meaningful things you can do.";
  if (/heal|therap|psych|well|mind/i.test(lower)) return "Working with the inner world takes real courage and depth.";
  if (/travel|explor|discover|adventure/i.test(lower)) return "That kind of curiosity usually leads somewhere important.";
  if (/mean|purpose|impact|legacy|matter/i.test(lower)) return "Building something around meaning and purpose is powerful work.";
  if (/struggle|challeng|hard|difficult|stuck/i.test(lower)) return "Acknowledging that takes honesty — it's a sign of real self-awareness.";
  if (/dream|vision|imagin|future|hope/i.test(lower)) return "That vision is worth paying attention to.";
  if (/business|entrepreneur|company|startup/i.test(lower)) return "Building something of your own takes real conviction.";
  if (/grow|learn|improv|evolv|develop/i.test(lower)) return "That growth mindset is your biggest asset.";

  // Generic but warm fallbacks based on length
  if (len > 100) return "There's a lot of depth in what you just shared.";
  return "That's a meaningful starting point.";
};

interface ConsoleThreadProps {
  embedded?: boolean;
  onProjectNameChange?: (name: string) => void;
}

const ConsoleThread = ({ embedded = false, onProjectNameChange }: ConsoleThreadProps) => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("starter_q1");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState<{ name?: string; icon?: string; color?: string } | null>(null);
  const [intakeAnswers, setIntakeAnswers] = useState<string[]>([]);
  const [starterAnswers, setStarterAnswers] = useState<string[]>([]);
  const [starterCapabilities, setStarterCapabilities] = useState<any[]>([]);
  const [userMentors, setUserMentors] = useState<string[]>([]);
  const [entryState, setEntryState] = useState("DISCOVER");
  const [councilAccepted, setCouncilAccepted] = useState(false);
  const [councilMeetingRan, setCouncilMeetingRan] = useState(false);
  const [projectName, setProjectName] = useState("New Conversation");
  const [handoffMentor, setHandoffMentor] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [displayName, setDisplayName] = useState("friend");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

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
        .select("console_intake_completed, entry_state, console_thread_phase, display_name")
        .eq("id", user.id)
        .single();

      const name = (profile as any)?.display_name || "friend";
      setDisplayName(name);
      // Use profile entry_state, fall back to localStorage (set during onboarding step 2)
      const lsFocus = localStorage.getItem("onboarding_focus");
      const lsEntryState = lsFocus === "grow_purpose" ? "GROW" : lsFocus === "already_working" ? "BUILD" : lsFocus === "discover_purpose" ? "DISCOVER" : null;
      const resolvedEntryState = profile?.entry_state || lsEntryState || "DISCOVER";
      setEntryState(resolvedEntryState);

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
        const restored: ChatMessage[] = savedMessages.map((m: any) => ({
          id: m.id,
          role: m.role as "user" | "mentor" | "system",
          content: m.content,
          mentorName: m.mentor_name || undefined,
          mentorIcon: m.mentor_icon || undefined,
          mentorColor: m.mentor_color || undefined,
          card: m.card_type === "card" ? undefined : undefined,
        }));
        setMessages(restored);

        const savedPhase = (profile as any)?.console_thread_phase as Phase | null;
        if (savedPhase) {
          if (savedPhase === "starter_return" || savedPhase === "starter_win") {
            setPhase("starter_return");
            setTimeout(() => {
              transitionToIntake();
            }, 1500);
          } else {
            setPhase(savedPhase);
            // Restore answers by phase prefix to avoid mixing starter/intake
            const starterUserMsgs = savedMessages.filter((m: any) => m.role === "user" && m.phase?.startsWith("starter_"));
            const intakeUserMsgs = savedMessages.filter((m: any) => m.role === "user" && m.phase?.startsWith("intake_"));
            if (starterUserMsgs.length > 0) {
              setStarterAnswers(starterUserMsgs.map((m: any) => m.content));
            }
            if (intakeUserMsgs.length > 0) {
              setIntakeAnswers(intakeUserMsgs.map((m: any) => m.content));
            } else {
              // Fallback for older threads without phase tags
              const userMsgs = restored.filter(m => m.role === "user");
              setIntakeAnswers(userMsgs.slice(0, 3).map(m => m.content));
            }
          }
        }
      } else {
        // Check if starter quest already done (capabilities with onboarding_inferred exist)
        const { data: existingCaps } = await supabase
          .from("momentum_capabilities")
          .select("id")
          .eq("user_id", user.id)
          .eq("acquisition_channel", "onboarding_inferred")
          .limit(1);

        const starterDone = existingCaps && existingCaps.length > 0;

        if (starterDone) {
          // Skip starter quest, go straight to intake
          setPhase("intake_q1");
          await startIntakeFlow(name, resolvedEntryState);
        } else {
          // Start Starter Quest
          setPhase("starter_q1");
          await startStarterQuest(name);
        }
      }

      setInitialLoading(false);
    };
    init();
  }, []);

  const startStarterQuest = async (name: string) => {
    const openMsg: ChatMessage = {
      id: crypto.randomUUID(), role: "mentor", content: `Hey ${name} 👋`,
      mentorName: mentorConfig.future_self.name, mentorIcon: mentorConfig.future_self.icon, mentorColor: mentorConfig.future_self.color,
    };
    setMessages([openMsg]);
    persistMessage(openMsg, "starter_q1");

    await showTyping("future_self", 1500);
    addSystemMessage("Before we begin building something meaningful, I want to understand how you naturally think and solve problems.", "future_self", "starter_q1");

    await showTyping("future_self", 1500);
    addSystemMessage("It only takes a moment, and it helps me personalize the experience for you.", "future_self", "starter_q1");

    await showTyping("future_self", 1200);
    addSystemMessage("What kind of problems do you naturally enjoy solving?\n\nFor example: helping people, building projects, creative ideas, technical problems, or organizing systems.", "future_self", "starter_q1");
  };

  const startIntakeFlow = async (name: string, state: string) => {
    const openMsg1: ChatMessage = {
      id: crypto.randomUUID(), role: "mentor", content: `Hey ${name} 👋`,
      mentorName: mentorConfig.future_self.name, mentorIcon: mentorConfig.future_self.icon, mentorColor: mentorConfig.future_self.color,
    };
    setMessages([openMsg1]);
    persistMessage(openMsg1, "intake_q1");

    const introMsgs = getPhaseIntroMessages(state);
    for (const msg of introMsgs) {
      await showTyping("future_self", 1500);
      addSystemMessage(msg, "future_self", "intake_q1");
    }

    await showTyping("future_self", 1200);
    addSystemMessage(getPhaseQuestions(state)[0], "future_self", "intake_q1");
  };

  const addSystemMessage = (content: string, mentorType?: string, phaseForPersist?: Phase, messageType?: "perspective" | "banter" | "standard" | "notification") => {
    const config = mentorType ? mentorConfig[mentorType] : undefined;
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "mentor",
      content,
      mentorName: config?.name,
      mentorIcon: config?.icon,
      mentorColor: config?.color,
      messageType,
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

    if (phase === "starter_q1") {
      const newAnswers = [...starterAnswers, text];
      setStarterAnswers(newAnswers);
      setPhase("starter_q2");
      persistPhase("starter_q2");
      await showTyping("future_self", 1500);
      const reflection = generateReflection(text);
      if (reflection) {
        addSystemMessage(reflection, "future_self", "starter_q2");
        await showTyping("future_self", 1200);
      }
      addSystemMessage("What do people usually come to you for help with?\n\nFor example: advice, ideas, solving problems, leadership, or listening and understanding.", "future_self", "starter_q2");
    } else if (phase === "starter_q2") {
      const newAnswers = [...starterAnswers, text];
      setStarterAnswers(newAnswers);
      setPhase("starter_q3");
      persistPhase("starter_q3");
      await showTyping("future_self", 1500);
      const reflection = generateReflection(text);
      if (reflection) {
        addSystemMessage(reflection, "future_self", "starter_q3");
        await showTyping("future_self", 1200);
      }
      addSystemMessage("When you're working on something exciting, what role do you naturally take?\n\nFor example: the builder who executes, the strategist, the creative, the problem solver, or the connector.", "future_self", "starter_q3");
    } else if (phase === "starter_q3") {
      const newAnswers = [...starterAnswers, text];
      setStarterAnswers(newAnswers);
      setPhase("starter_processing");
      persistPhase("starter_processing");
      await processStarterQuest(newAnswers);
    } else if (phase === "starter_return") {
      // User typed something after the win card — transition to intake
      await transitionToIntake();
    } else if (phase === "intake_q1") {
      const newAnswers = [...intakeAnswers, text];
      setIntakeAnswers(newAnswers);
      const nextPhase: Phase = "intake_q2";
      setPhase(nextPhase);
      persistPhase(nextPhase);
      // Reflection on answer
      await showTyping("future_self", 1500);
      const reflection = generateReflection(text);
      if (reflection) {
        addSystemMessage(reflection, "future_self", nextPhase);
        await showTyping("future_self", 1200);
      }
      addSystemMessage(getPhaseQuestions(entryState)[1], "future_self", nextPhase);
    } else if (phase === "intake_q2") {
      const newAnswers = [...intakeAnswers, text];
      setIntakeAnswers(newAnswers);
      const nextPhase: Phase = "intake_q3";
      setPhase(nextPhase);
      persistPhase(nextPhase);
      // Reflection on answer
      await showTyping("future_self", 1500);
      const reflection = generateReflection(text);
      if (reflection) {
        addSystemMessage(reflection, "future_self", nextPhase);
        await showTyping("future_self", 1200);
      }
      addSystemMessage(getPhaseQuestions(entryState)[2], "future_self", nextPhase);
    } else if (phase === "intake_q3") {
      const newAnswers = [...intakeAnswers, text];
      setIntakeAnswers(newAnswers);
      setPhase("processing");
      persistPhase("processing");
      await processIntake(newAnswers);
    } else if (phase === "user_reply" && councilAccepted && !councilMeetingRan) {
      // First "let's go" after council reveal — run initial council meeting
      setCouncilMeetingRan(true);
      await runCouncilMeeting();
    } else if (phase === "user_reply") {
      await handleUserReply(text);
    } else if (phase === "handoff_offer") {
      await handleHandoffResponse(text);
    } else if (phase === "mentor_1to1") {
      await handleMentor1to1(text);
    } else if (phase === "post_project") {
      await handlePostProjectMessage(text);
    }
  };

  const processStarterQuest = async (answers: string[]) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Reflection on final answer
      await showTyping("future_self", 1500);
      const reflection = generateReflection(answers[2]);
      if (reflection) {
        addSystemMessage(reflection, "future_self", "starter_processing");
        await showTyping("future_self", 1000);
      }

      addSystemMessage("Interesting.", "future_self", "starter_processing");
      await showTyping("future_self", 1200);

      // Build a brief reflection referencing answers
      const q1Hint = answers[0]?.substring(0, 60) || "those problems";
      const q2Hint = answers[1]?.substring(0, 60) || "that kind of help";
      addSystemMessage(`You mentioned enjoying ${q1Hint.toLowerCase()} and that people often come to you for ${q2Hint.toLowerCase()}.\n\nThat combination usually creates strong builders.`, "future_self", "starter_processing");

      await showTyping("future_self", 2000);

      // Call seed-initial-capabilities
      const { data, error } = await supabase.functions.invoke("seed-initial-capabilities", {
        body: {
          intakeAnswers: answers,
          workContext: entryState,
        },
      });

      if (error) throw error;

      const caps = (data?.capabilities || []).slice(0, 2);
      setStarterCapabilities(caps);

      addSystemMessage("✨ Starter Quest Complete\n\nBased on what you shared, I can already see a few natural capabilities.", "future_self", "starter_win");

      const winPhase: Phase = "starter_win";
      setPhase(winPhase);
      persistPhase(winPhase);

      confetti({ particleCount: 60, spread: 50, origin: { y: 0.7 } });

      addCardMessage(
        <StarterQuestWinCard
          capabilities={caps.map((c: any) => ({
            capability_name: c.capability_name,
            category: c.category || "execution",
            description: c.description,
          }))}
          onContinue={() => transitionToIntake()}
        />,
        "future_self",
        winPhase
      );

      setPhase("starter_return");
      persistPhase("starter_return");
    } catch (error: any) {
      console.error("Starter quest error:", error);
      toast.error("Something went wrong. Let's continue.");
      await transitionToIntake();
    } finally {
      setLoading(false);
    }
  };

  const transitionToIntake = async () => {
    const intakePhase: Phase = "intake_q1";
    setPhase(intakePhase);
    persistPhase(intakePhase);

    await showTyping("future_self", 1500);
    addSystemMessage("Now that I understand your strengths, let's build something meaningful around them.", "future_self", intakePhase);

    const introMsgs = getPhaseIntroMessages(entryState);
    for (const msg of introMsgs) {
      await showTyping("future_self", 1500);
      addSystemMessage(msg, "future_self", intakePhase);
    }

    await showTyping("future_self", 1200);
    addSystemMessage(getPhaseQuestions(entryState)[0], "future_self", intakePhase);
  };

  const processIntake = async (answers: string[]) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("profiles").update({
        work_context: answers[0],
      }).eq("id", user.id);

      const intakeLabels = getIntakeLabels(entryState);
      const storyText = `${intakeLabels[0]}: ${answers[0]}\n\n${intakeLabels[1]}: ${answers[1]}\n\n${intakeLabels[2]}: ${answers[2]}`;
      await supabase.functions.invoke("process-user-foundation", {
        body: { storyText },
      });

      // Reflection after final answer
      await showTyping("future_self", 1500);
      const reflection = generateReflection(answers[2]);
      if (reflection) {
        addSystemMessage(reflection, "future_self", "processing");
        await showTyping("future_self", 1200);
      }

      addSystemMessage("Thanks for sharing that.", "future_self", "processing");
      await showTyping("future_self", 1500);
      addSystemMessage("It helps me understand your journey and what you're trying to build.", "future_self", "processing");
      await showTyping("future_self", 2000);
      addSystemMessage("Give me a moment to assemble the mentors who can help you move forward.", "future_self", "processing");

      await showTyping("future_self", 2500);

      // Explain the council
      addSystemMessage("Inside Becoming, you'll work with a small council of mentors.", "future_self", "council_reveal");
      await showTyping("future_self", 1800);
      addSystemMessage("Each mentor brings a different perspective — strategy, creativity, philosophy, psychology, and real-world experience.", "future_self", "council_reveal");
      await showTyping("future_self", 1800);
      addSystemMessage("They will challenge your thinking, help you see blind spots, and guide you as you define your project.", "future_self", "council_reveal");

      await showTyping("future_self", 2000);

      // Council assembly message
      addSystemMessage(
        "Based on what you shared — your background, your story, and where you're going — I've assembled a mentor council for you.\n\nThey're here to help you think clearly and move forward with intention.",
        "future_self",
        "council_reveal"
      );

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
              onAccept={() => { }}
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

    // Multi-message handoff
    await showTyping("future_self", 1200);
    addSystemMessage(
      "Now you're going to interact with your mentor council.",
      "future_self",
      nextPhase
    );
    await showTyping("future_self", 1500);
    addSystemMessage(
      "They'll help you define a project to work on and guide your next steps.",
      "future_self",
      nextPhase
    );
    await showTyping("future_self", 1200);
    addSystemMessage(
      `Write "let's go" when you're ready.`,
      "future_self",
      nextPhase
    );
    setPhase("user_reply");
    persistPhase("user_reply");
  };

  const runCouncilMeeting = async () => {
    setLoading(true);
    try {
      const projectIdea = intakeAnswers[2] || "I want to build something meaningful";

      // Use module-scope getIntakeLabels
      const labels = getIntakeLabels(entryState);
      const fullIntakeContext = `${labels[0]}: ${intakeAnswers[0] || "Not shared"}\n\n${labels[1]}: ${intakeAnswers[1] || "Not shared"}\n\n${labels[2]}: ${intakeAnswers[2] || projectIdea}`;

      // Pass EMPTY conversationHistory for first council call so edge function treats as Q1
      // This ensures suggestedNextQuestion is generated (isQ1 = true)
      const { data, error } = await supabase.functions.invoke("council-meeting", {
        body: {
          question: fullIntakeContext,
          mentorTypes: [...userMentors, "future_self"],
          conversationHistory: [],
          entryState,
        },
      });

      if (error) throw error;

      const perspectives = data.mentorPerspectives || {};
      const perspPhase: Phase = "perspectives";
      setPhase(perspPhase);
      persistPhase(perspPhase);

    for (const [mentorType, perspective] of Object.entries(perspectives)) {
        await showTyping(mentorType, 5000 + Math.random() * 15000);
        addSystemMessage(perspective as string, mentorType, perspPhase, "perspective");
      }

      // Save bold keywords from perspectives to user_keywords (non-blocking)
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) saveCouncilKeywords(perspectives, user.id);
      });

      const banterLines = data.banterLines || [];
      if (banterLines.length > 0) {
        const banterPhase: Phase = "banter";
        setPhase(banterPhase);
        persistPhase(banterPhase);
        for (const line of banterLines) {
          await showTyping(line.mentor, 4000 + Math.random() * 10000);
          addSystemMessage(line.text, line.mentor, banterPhase, "banter");
        }
      }

      const clarityQ = data.clarityQuestion || data.suggestedNextQuestion;
      if (clarityQ) {
        await showTyping("future_self", 600);
        addSystemMessage(clarityQ, "future_self", "user_reply");
      }

      // DON'T set handoffMentor from first council call — defer to 2nd round

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
          `I think you're ready to work 1-to-1 with ${config?.name || handoffMentor}.\\\\n\\\\nIf you're ready, type "let's go".`,
          "future_self",
          "handoff_offer"
        );
        setPhase("handoff_offer");
        persistPhase("handoff_offer");
      } else {
        // 2nd round: pass single user msg so questionNumber=2 (triggers mentor routing)
        const { data, error } = await supabase.functions.invoke("council-meeting", {
          body: {
            question: text,
            mentorTypes: [...userMentors, "future_self"],
            conversationHistory: [{
              role: "user",
              content: intakeAnswers.join("\\\n"),
            }],
            entryState,
          },
        });

        if (error) throw error;

        const perspectives = data.mentorPerspectives || {};
      for (const [mentorType, perspective] of Object.entries(perspectives)) {
          await showTyping(mentorType, 5000 + Math.random() * 12000);
          addSystemMessage(perspective as string, mentorType, "user_reply", "perspective");
        }

        // Save bold keywords from 2nd round perspectives (non-blocking)
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) saveCouncilKeywords(perspectives, user.id);
        });

        if (data.banterLines?.length > 0) {
          for (const line of data.banterLines) {
            await showTyping(line.mentor, 4000 + Math.random() * 10000);
            addSystemMessage(line.text, line.mentor, "user_reply", "banter");
          }
        }

        // 2nd round: NOW set handoff mentor (entry-state-aware from edge function)
        if (data.suggestedMentorFor1to1) {
          setHandoffMentor(data.suggestedMentorFor1to1.mentorType);
        }

        // Council-meeting doesn't return projectCoherence — run a lightweight
        // chat-mentor call with the strategist to detect if a project name
        // was proposed and agreed upon during council perspectives.
        let coherenceResult = data.projectCoherence;
        if (!coherenceResult?.isCoherent) {
          try {
            const allPerspectives = Object.values(perspectives).join("\n");
            const recentContext = [
              ...intakeAnswers.map(a => ({ role: "user" as const, content: a })),
              { role: "user" as const, content: text },
              { role: "assistant" as const, content: allPerspectives },
            ];
            const { data: coherenceCheck } = await supabase.functions.invoke("chat-mentor", {
              body: {
                mentorType: data.suggestedMentorFor1to1?.mentorType || "strategist_mentor",
                message: text,
                conversationHistory: recentContext,
                coherenceCheckOnly: true,
              },
            });
            if (coherenceCheck?.projectCoherence?.isCoherent) {
              coherenceResult = coherenceCheck.projectCoherence;
            }
          } catch (e) {
            console.error("Coherence check failed (non-blocking):", e);
          }
        }

        if (coherenceResult?.isCoherent) {
          // Validate project name — reject generic placeholders
          const genericNames = ["project name", "untitled", "new project", "my project", "unnamed"];
          let finalProjectName = data.projectCoherence.projectName || "";
          if (!finalProjectName.trim() || genericNames.some(g => finalProjectName.toLowerCase().trim() === g)) {
            // Derive from intake Q3 (project idea)
            const idea = intakeAnswers[2] || "";
            finalProjectName = idea.length > 5 && idea.length < 60 ? idea : "My First Project";
          }

          setPhase("project_detected");
          persistPhase("project_detected");
          await showTyping("future_self", 1000);
          addSystemMessage("Something is coming together here... I can feel it ✨", "future_self", "project_detected");
          addCardMessage(
            <FirstWinNamingCard
              proposedName={finalProjectName}
              description={data.projectCoherence.projectDescription}
              onAccept={(name) => handleFirstWinAccept(name, data.projectCoherence.projectDescription)}
              onKeepExploring={() => {
                setPhase("user_reply");
                persistPhase("user_reply");
              }}
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

          // If handoff mentor was set from this round, offer it after showing perspectives
          if (data.suggestedMentorFor1to1) {
            const config = mentorConfig[data.suggestedMentorFor1to1.mentorType];
            await showTyping("future_self", 800);
            addSystemMessage(
              `I think you're ready to work 1-to-1 with ${config?.name || data.suggestedMentorFor1to1.mentorName}.\\\\n\\\\nIf you're ready, type "let's go".`,
              "future_self",
              "handoff_offer"
            );
            setPhase("handoff_offer");
            persistPhase("handoff_offer");
          } else {
            setPhase("user_reply");
            persistPhase("user_reply");
          }
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
        await showTyping("future_self", 1000);
        addSystemMessage("Something is coming together here... I can feel it ✨", "future_self", "project_detected");
        addCardMessage(
          <FirstWinNamingCard
            proposedName={data.projectCoherence.projectName}
            description={data.projectCoherence.projectDescription}
            onAccept={(name) => handleFirstWinAccept(name, data.projectCoherence.projectDescription)}
            onKeepExploring={() => {
              setPhase("user_reply");
              persistPhase("user_reply");
            }}
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

  const handleFirstWinAccept = async (name: string, description: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      await supabase
        .from("profiles")
        .update({
          first_project_created_at: new Date().toISOString(),
          console_intake_completed: true,
        } as any)
        .eq("id", user.id);

      // Seed initial capabilities in background (non-blocking)
      supabase.functions.invoke("seed-initial-capabilities", {
        body: {
          intakeAnswers,
          workContext: entryState,
        },
      }).then(({ error }) => {
        if (error) console.error("Capability seeding failed:", error);
      });

      navigate("/creation-lab", {
        state: { projectName: name, projectDescription: description },
      });
    } catch (error: any) {
      console.error("Error navigating to creation lab:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handlePostProjectMessage = async (text: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("council-meeting", {
        body: {
          question: text,
          mentorTypes: [...userMentors, "future_self"],
          conversationHistory: messages.slice(-15).map(m => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.content,
          })),
          entryState,
          projectContext: projectName,
        },
      });

      if (error) throw error;

      const perspectives = data.mentorPerspectives || {};
      for (const [mentorType, perspective] of Object.entries(perspectives)) {
        await showTyping(mentorType, 5000 + Math.random() * 12000);
        addSystemMessage(perspective as string, mentorType, "post_project", "perspective");
      }

      if (data.banterLines?.length > 0) {
        for (const line of data.banterLines) {
          await showTyping(line.mentor, 4000 + Math.random() * 10000);
          addSystemMessage(line.text, line.mentor, "post_project", "banter");
        }
      }

      const nextQ = data.clarityQuestion || data.suggestedNextQuestion;
      if (nextQ) {
        await showTyping("future_self", 1000);
        addSystemMessage(nextQ, "future_self", "post_project");
      }
    } catch (error: any) {
      console.error("Error in post-project conversation:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreated = (projectId: string, name: string) => {
    setProjectName(name);
    onProjectNameChange?.(name);
    setPhase("post_project");
    persistPhase("post_project");
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ console_intake_completed: true } as any).eq("id", user.id);
      }
    })();

    setTimeout(() => {
      addSystemMessage(`Your project "${name}" has been created! You can find it in your Creation Lab.\n\nBut don't leave yet — your Council is here to help you sharpen the idea. Keep talking.`, "future_self", "post_project");
    }, 500);

    // Schedule a delayed notification from a random mentor
    setTimeout(() => {
      const availableMentors = userMentors.filter(m => m !== "future_self");
      const randomMentor = availableMentors[Math.floor(Math.random() * availableMentors.length)] || "strategist_mentor";
      const config = mentorConfig[randomMentor];
      addSystemMessage(
        `💬 ${config?.name || "A mentor"} wants to explore a different angle on "${name}" with you. Reply to start the conversation.`,
        randomMentor,
        "post_project",
        "notification"
      );
    }, 8000 + Math.random() * 12000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isInputDisabled = loading || phase === "processing" || phase === "starter_processing" || phase === "council_reveal" || phase === "perspectives" || phase === "banter";
  const showPlusButton = phase === "complete" || phase === "post_project";

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
          {showPlusButton && (
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
        {messages.map((msg, i) => {
          // Count perspective messages up to this point for tutorial arrow
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
