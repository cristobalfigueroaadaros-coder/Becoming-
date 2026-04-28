import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, ArrowLeft, Plus, ArrowRight, Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ChatBubble, { type ChatMessage } from "@/components/console-thread/ChatBubble";
import TypingIndicator from "@/components/console-thread/TypingIndicator";
import MentorRevealCard from "@/components/console-thread/MentorRevealCard";
import { FirstWinNamingCard } from "@/components/FirstWinNamingCard";
import StarterQuestWinCard from "@/components/console-thread/StarterQuestWinCard";
import ProjectCreationCard from "@/components/console-thread/ProjectCreationCard";
import { PaymentModal } from "@/components/PaymentModal";
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
  | "atlas_reflection" | "atlas_confirmation"
  | "intake_q1" | "intake_q2" | "intake_q3"
  | "processing"
  | "council_reveal" | "council_accepted"
  | "perspectives" | "banter"
  | "user_reply"
  | "handoff_offer" | "mentor_1to1"
  | "project_detected" | "complete" | "post_project"
  | "return_greeting";

// Phase-aware intake labels for context sent to AI
const getIntakeLabels = (state: string): string[] => {
  if (state === "BUILD") return [
    "Project or business name, what they're building or offering, and what's working",
    "Main growth constraint or blocker",
    "30-day win definition",
  ];
  if (state === "GROW") return [
    "What they're building and current progress level",
    "Main blocker or unclear area",
    "7-day progress goal",
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
    "What's the name of your project or business — and what are you currently building or offering, and what's working so far?",
    "What is the one thing limiting your growth the most right now?",
    "What would a meaningful win look like in the next 30 days?",
  ];
  if (entryState === "GROW") return [
    "Tell me what you're building or working on, and where you are with it right now.",
    "What part of this feels most stuck or unclear?",
    "What would feel like real progress for you in the next 7 days?",
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
    "You're already in the game. Three quick questions so I know exactly where you are — then I'll bring in the right mentors.",
  ];
  if (state === "GROW") return [
    "You've got something brewing. Let me understand where you are so I can bring in the right mentors — three questions.",
  ];
  // DISCOVER
  return [
    "I'd like to understand you better before I assemble the right mentors. Three questions.",
  ];
};

const generateReflection = (answer: string, questionIndex: number = 0, phase: string = "DISCOVER"): string | null => {
  const lower = answer.toLowerCase();
  const len = answer.length;

  if (len < 15) return null;

  if (phase === "BUILD") {
    if (questionIndex === 0) {
      if (/service|consult|coach|freelanc/i.test(lower)) return "You've got a service — that's already more than most.";
      if (/product|app|platform|tool|course/i.test(lower)) return "Having something tangible is a strong starting point.";
      if (/sell|offer|client|customer/i.test(lower)) return "You're already in the market. That matters.";
      if (len > 80) return "There's real substance in what you're offering.";
      return "Good — let's build on what you have.";
    }
    if (questionIndex === 1) {
      if (/time|busy|overwhelm|too much/i.test(lower)) return "Time is usually the real bottleneck. Let's work with what you have.";
      if (/money|fund|budget|cost/i.test(lower)) return "Financial constraints force creative solutions — that's not always bad.";
      if (/skill|know.*how|learn|technical/i.test(lower)) return "Skill gaps are solvable. Let's find the fastest path.";
      if (/focus|direction|clarity|confus/i.test(lower)) return "Clarity is the first thing we'll fix together.";
      if (/audience|market|customer|who/i.test(lower)) return "Knowing exactly who you're building for unlocks everything else.";
      if (len > 80) return "Now I know what's in the way. Let's work around it.";
      return "Understanding the constraint is where the strategy starts.";
    }
    if (/revenue|money|income|sale|€|\$/i.test(lower)) return "A clear financial outcome — that's what moves the needle.";
    if (/user|client|customer|subscriber/i.test(lower)) return "User growth is one of the best signals to aim for.";
    if (/launch|release|ship|live/i.test(lower)) return "Getting it out there — that's the right priority.";
    if (len > 80) return "That's specific enough to build a plan around.";
    return "30 days is enough time to make something real happen.";
  }

  if (phase === "GROW") {
    if (questionIndex === 0) {
      if (/nothing|just.*idea|haven.*start|thinking/i.test(lower)) return "Starting from an idea is perfectly valid. Let's make it real.";
      if (/prototype|test|tried|built|started/i.test(lower)) return "You've already taken action — that puts you ahead.";
      if (/partial|some|bit|draft/i.test(lower)) return "Even a partial version gives us something to build on.";
      if (/service|consult|coach|freelanc/i.test(lower)) return "You've got a service — now it's about getting it in front of the right people.";
      if (/product|app|platform|course/i.test(lower)) return "Having something built gives us a real foundation to work from.";
      if (len > 80) return "That's more progress than you might think.";
      return "Good — now let's figure out what's in the way.";
    }
    if (questionIndex === 1) {
      if (/confus|unclear|don.*know|not.*sure/i.test(lower)) return "That fog usually lifts once we name the real question underneath it.";
      if (/time|busy|overwhelm/i.test(lower)) return "Constraint shapes creativity — let's find what's actually movable.";
      if (/audience|who|customer|market/i.test(lower)) return "Clarity on who you're for changes everything else.";
      if (/money|fund|cost|resource/i.test(lower)) return "Resource constraints force smart choices. That's not a bad place to be.";
      if (len > 80) return "That friction is telling you something useful.";
      return "Naming what's stuck is the first step to getting unstuck.";
    }
    if (/week|days|soon|next/i.test(lower)) return "That's a concrete target — let's build toward it.";
    if (/launch|test|publish|share|send/i.test(lower)) return "Action-oriented thinking. That's exactly the right instinct.";
    if (/learn|understand|figure out|know/i.test(lower)) return "Clarity first, then movement. That's the right sequence.";
    if (len > 80) return "That gives us a clear direction to work from.";
    return "Progress defined is progress possible.";
  }

  // DISCOVER (default)
  if (questionIndex === 0) {
    if (/travel|explor|world|cultur|country|abroad/i.test(lower)) return "That kind of exposure shapes how you see problems differently from most people.";
    if (/build|creat|launch|start|mak/i.test(lower)) return "That drive to build things — it's in how you see the world.";
    if (/help|support|serv|communit|people/i.test(lower)) return "That instinct to serve others usually comes from somewhere real.";
    if (/design|art|music|writ|story/i.test(lower)) return "There's something powerful about channeling ideas into form.";
    if (/tech|code|engineer|develop|software/i.test(lower)) return "Sounds like you've built real depth in that space.";
    if (/teach|mentor|coach|educ/i.test(lower)) return "Guiding others is one of the most meaningful things you can do.";
    if (/heal|therap|psych|well|mind/i.test(lower)) return "Working with the inner world takes real courage and depth.";
    if (/business|entrepreneur|company|startup/i.test(lower)) return "Building something of your own takes real conviction.";
    if (len > 100) return "There's a lot of texture in what you just described.";
    return "That background has shaped you in ways you probably don't fully see yet.";
  }

  if (questionIndex === 1) {
    if (/authentic|honest|real|genuine|truth/i.test(lower)) return "That pull toward truth — most people avoid it. You're drawn to it.";
    if (/connect|relationship|belong|community|together/i.test(lower)) return "Connection is one of the deepest human needs. You already know that.";
    if (/justice|fair|equal|right|wrong/i.test(lower)) return "People who are moved by injustice usually end up doing something about it.";
    if (/creat|innovat|new|idea|imagin/i.test(lower)) return "Curiosity about what's possible — that's where things start.";
    if (/mind|conscious|aware|grow|learn/i.test(lower)) return "Questions about human potential don't let you go easily.";
    if (/problem|solv|fix|broken|better/i.test(lower)) return "That itch to fix what's broken — that's where builders come from.";
    if (len > 100) return "There's specificity in what you care about. That's rare.";
    return "What pulls your attention usually points to what you're meant to work on.";
  }

  if (/impact|change|difference|transform/i.test(lower)) return "Impact at that scale starts with one person whose life shifts because of you.";
  if (/help|people|others|serve|support/i.test(lower)) return "That clarity about wanting to help — hold onto that when things get hard.";
  if (/lead|build|creat|found|own/i.test(lower)) return "The version of you that built that is closer than you think.";
  if (/free|independ|own.*time|flexib/i.test(lower)) return "Freedom built through purpose is different from freedom built by accident.";
  if (/mean|fulfil|purposeful|alive|love/i.test(lower)) return "Meaningful work and good work tend to be the same work — you already know that.";
  if (len > 100) return "That vision is concrete enough to build toward.";
  return "Five years is closer than it sounds. Let's make it count.";
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
  const [atlasSignals, setAtlasSignals] = useState<any>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const returnFlowStartedRef = useRef(false); // guard against double startReturnFlow call
  const discoveredProjectTypeRef = useRef<string>("experience"); // set when DISCOVER project is detected
  // Refs so runCouncilMeeting always reads the latest values regardless of which render's closure calls it
  const intakeAnswersRef = useRef<string[]>([]);
  const userMentorsRef = useRef<string[]>([]);
  const atlasSignalsRef = useRef<any>(null);
  const entryStateRef = useRef<string>("DISCOVER");

  // Keep refs in sync with state (runs after every render where these change)
  useEffect(() => { intakeAnswersRef.current = intakeAnswers; }, [intakeAnswers]);
  useEffect(() => { userMentorsRef.current = userMentors; }, [userMentors]);
  useEffect(() => { atlasSignalsRef.current = atlasSignals; }, [atlasSignals]);
  useEffect(() => { entryStateRef.current = entryState; }, [entryState]);

  // Persist handoffMentor to localStorage so it survives page reloads
  const persistHandoffMentor = (mentor: string | null, userId?: string) => {
    setHandoffMentor(mentor);
    const key = `becoming_handoff_mentor_${userId || "local"}`;
    if (mentor) localStorage.setItem(key, mentor);
    else localStorage.removeItem(key);
  };

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);


  // "Go deeper later" saves to mentor_daily_outreach and shows a toast confirmation.
  // Follow-up is delivered in the individual mentor chat, not injected here.

  const persistMessage = async (msg: ChatMessage, currentPhase: Phase) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("console_thread_messages").insert({
        user_id: user.id,
        role: msg.role,
        content: msg.content,
        mentor_type: msg.mentorType || (msg.mentorName ? Object.entries(mentorConfig).find(([_, v]) => v.name === msg.mentorName)?.[0] : null),
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
      try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (!embedded) navigate("/"); setInitialLoading(false); return; }

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
      const { data: rawSavedMessages } = await supabase
        .from("console_thread_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      // If intake not yet completed AND user already has atlas discoveries,
      // clear any stale pre-atlas messages so the atlas-linked intake flow
      // always starts fresh instead of restoring an old starter-quest session.
      const intakeAlreadyDone = !!(profile as any)?.console_intake_completed;
      let savedMessages = rawSavedMessages;
      if (!intakeAlreadyDone && rawSavedMessages && rawSavedMessages.length > 0) {
        const { data: atlasDots } = await supabase
          .from("atlas_dots")
          .select("id")
          .eq("user_id", user.id)
          .limit(2);
        if (atlasDots && atlasDots.length >= 2) {
          // Clear stale messages so the atlas-aware intake starts clean
          await supabase.from("console_thread_messages").delete().eq("user_id", user.id);
          await supabase.from("profiles").update({ console_thread_phase: null } as any).eq("id", user.id);
          savedMessages = null;
        }
      }

      // DB fetches complete — show the chat UI now so typing indicators are visible
      setInitialLoading(false);

      if (savedMessages && savedMessages.length > 0) {
        const restored: ChatMessage[] = savedMessages.map((m: any) => ({
          id: m.id,
          role: m.role as "user" | "mentor" | "system",
          content: m.content,
          mentorName: m.mentor_name || undefined,
          mentorType: m.mentor_type || undefined,
          mentorIcon: m.mentor_icon || undefined,
          mentorColor: m.mentor_color || undefined,
          card: undefined, // cards are ephemeral UI — they don't restore from DB
        }));
        setMessages(restored);

        const savedPhase = (profile as any)?.console_thread_phase as Phase | null;

        // Restore handoffMentor from localStorage
        const storedMentor = localStorage.getItem(`becoming_handoff_mentor_${user.id}`);
        if (storedMentor) setHandoffMentor(storedMentor);

        if (savedPhase) {
          if (savedPhase === "starter_return" || savedPhase === "starter_win") {
            setPhase("starter_return");
            setTimeout(() => {
              transitionToIntake();
            }, 1500);
          } else if (savedPhase === "handoff_offer") {
            // User was mid-handoff — re-surface the offer with the right mentor
            setPhase("handoff_offer");
            const profileName = (profile as any)?.display_name || "there";
            const restoredMentor = storedMentor;
            const mentorCfg = restoredMentor ? mentorConfig[restoredMentor] : null;
            const mentorLabel = mentorCfg?.name || "your mentor";
            if (!returnFlowStartedRef.current) {
              returnFlowStartedRef.current = true;
              setTimeout(async () => {
                await showTyping("future_self", 1200);
                addSystemMessage(
                  `Welcome back. You were about to connect with ${mentorLabel}.`,
                  "future_self",
                  "handoff_offer"
                );
              }, 1500);
            }
          } else if (
            savedPhase === "post_project" ||
            savedPhase === "complete" ||
            savedPhase === "mentor_1to1" ||
            savedPhase === "user_reply" ||
            savedPhase === "return_greeting"
          ) {
            // User has an active project — greet them on return
            setPhase(savedPhase);
            const profileName = (profile as any)?.display_name || "there";
            if (!returnFlowStartedRef.current) {
              returnFlowStartedRef.current = true;
              setTimeout(() => {
                startReturnFlow(profileName);
              }, 500);
            }
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
        // Fresh conversation — show Future Self typing while we fetch context
        setTyping({ name: mentorConfig.future_self.name, icon: mentorConfig.future_self.icon, color: mentorConfig.future_self.color });

        // Check if Atlas signals are available — if so, skip starter quest
        let hasAtlasSignals = false;
        try {
          const { data: atlasData, error: atlasError } = await supabase.functions.invoke("extract-atlas-signals", {
            body: { mode: "generateReflectionMessages" },
          });
          setTyping(null);
          if (!atlasError && atlasData && atlasData.identitySignals?.length >= 2) {
            hasAtlasSignals = true;
            setAtlasSignals(atlasData);
            // Start Atlas reflection flow
            setPhase("atlas_reflection");
            await startAtlasReflection(name, atlasData);
          }
        } catch (e) {
          setTyping(null);
          console.error("Atlas signal extraction failed (non-fatal):", e);
        }

        if (!hasAtlasSignals) {
          // Fallback: check if user has atlas dots directly (discovery quests completed)
          // If they have dots, skip the starter quest entirely — atlas data IS their foundation
          const { data: atlasDots } = await supabase
            .from("atlas_dots")
            .select("id")
            .eq("user_id", user.id)
            .limit(3);

          const hasAtlasDots = atlasDots && atlasDots.length >= 2;

          if (hasAtlasDots) {
            // User completed Atlas discovery — skip starter quest, go to intake
            setTyping(null);
            setPhase("intake_q1");
            await startIntakeFlow(name, resolvedEntryState);
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
              setTyping(null);
              setPhase("intake_q1");
              await startIntakeFlow(name, resolvedEntryState);
            } else {
              setTyping(null);
              setPhase("starter_q1");
              await startStarterQuest(name);
            }
          }
        }
      }
      } catch (err) {
        console.error("ConsoleThread init failed:", err);
        setInitialLoading(false);
      }
    };
    init();
  }, []);

  const startAtlasReflection = async (name: string, signals: any) => {
    const openMsg: ChatMessage = {
      id: crypto.randomUUID(), role: "mentor", content: `Hey ${name} 👋`,
      mentorName: mentorConfig.future_self.name, mentorIcon: mentorConfig.future_self.icon, mentorColor: mentorConfig.future_self.color,
    };
    setMessages([openMsg]);
    persistMessage(openMsg, "atlas_reflection");

    // Send pre-generated reflection messages with human-like typing delays
    const reflectionMsgs: string[] = signals.reflectionMessages || [];
    for (const msg of reflectionMsgs) {
      await showTyping("future_self", 2200 + Math.random() * 1200 + msg.length * 15);
      addSystemMessage(msg, "future_self", "atlas_reflection");
    }

    // If no AI-generated messages, use fallback
    if (reflectionMsgs.length === 0) {
      await showTyping("future_self", 2500 + Math.random() * 800);
      addSystemMessage("I've been watching what you've been sharing...", "future_self", "atlas_reflection");
      await showTyping("future_self", 2800 + Math.random() * 1000);
      addSystemMessage("I'm starting to see something interesting about how you operate.", "future_self", "atlas_reflection");
      if (signals.identitySignals?.length > 0) {
        await showTyping("future_self", 2500 + Math.random() * 800);
        addSystemMessage(`You seem to be someone who ${signals.identitySignals.slice(0, 2).join(" and ").toLowerCase()}.`, "future_self", "atlas_reflection");
      }
    }

    // Only add the confirmation question if the AI didn't already end with it
    const lastReflection = (reflectionMsgs[reflectionMsgs.length - 1] || "").toLowerCase();
    if (!lastReflection.includes("feel right") && !lastReflection.includes("resonate") && !lastReflection.includes("does that")) {
      await showTyping("future_self", 2000 + Math.random() * 600);
      addSystemMessage("Does that feel right to you?", "future_self", "atlas_reflection");
    }

    setPhase("atlas_confirmation");
    persistPhase("atlas_confirmation");
  };

  const startStarterQuest = async (name: string) => {
    const openMsg: ChatMessage = {
      id: crypto.randomUUID(), role: "mentor", content: `Hey ${name} 👋`,
      mentorName: mentorConfig.future_self.name, mentorIcon: mentorConfig.future_self.icon, mentorColor: mentorConfig.future_self.color,
    };
    setMessages([openMsg]);
    persistMessage(openMsg, "starter_q1");

    await showTyping("future_self", 2200 + Math.random() * 800);
    addSystemMessage("Before we begin building something meaningful, I want to understand how you naturally think and solve problems.", "future_self", "starter_q1");

    await showTyping("future_self", 2500 + Math.random() * 1000);
    addSystemMessage("It only takes a moment, and it helps me personalize the experience for you.", "future_self", "starter_q1");

    await showTyping("future_self", 3000 + Math.random() * 800);
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
    for (let i = 0; i < introMsgs.length; i++) {
      await showTyping("future_self", 2200 + Math.random() * 1200 + introMsgs[i].length * 15);
      addSystemMessage(introMsgs[i], "future_self", "intake_q1");
    }

    const firstQ = getPhaseQuestions(state)[0];
    await showTyping("future_self", 2800 + Math.random() * 800 + firstQ.length * 12);
    addSystemMessage(firstQ, "future_self", "intake_q1");
  };

  const startReturnFlow = async (userName: string) => {
    // Fetch active project for context
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: project } = await supabase
        .from("integrator_projects")
        .select("project_title")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const activeProjectName = (project as any)?.project_title || projectName;

      await showTyping("future_self", 700);
      if (activeProjectName) {
        addSystemMessage(`Hey ${userName}! 👋 Welcome back. How are things going with "${activeProjectName}"?`, "future_self", "return_greeting");
      } else {
        addSystemMessage(`Hey ${userName}! 👋 Welcome back. What's on your mind today?`, "future_self", "return_greeting");
      }

      await showTyping("future_self", 900);
      addSystemMessage(
        `What would you like to do right now?\n\n• Keep working on the project with the Strategist\n• Talk to the Council about something new\n• I'm stuck and need guidance`,
        "future_self",
        "return_greeting"
      );

      setPhase("return_greeting");
      persistPhase("return_greeting");
    } catch (err) {
      console.error("Return flow error:", err);
    }
  };

  const addSystemMessage = (content: string, mentorType?: string, phaseForPersist?: Phase, messageType?: "perspective" | "banter" | "standard" | "notification") => {
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

  const toggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice input not supported in this browser. Try Chrome.");
      return;
    }
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join("");
      setInput(transcript);
    };
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    addUserMessage(text);

    if (phase === "atlas_confirmation") {
      // Handle Atlas reflection confirmation
      const lower = text.toLowerCase();
      const isConfirm = /^(yes|yeah|yep|exactly|right|that's me|that's right|feels right|correct|absolutely|spot on|definitely|true)/i.test(lower);
      const isReject = /^(no|not really|off|wrong|doesn't feel|that's not|nope|nah)/i.test(lower);

      if (isConfirm) {
        await showTyping("future_self", 1200);
        addSystemMessage("Got it. That helps me see it more clearly.", "future_self", "atlas_confirmation");
        await showTyping("future_self", 1000);
        // Transition to intake
        await transitionToIntake();
      } else if (isReject) {
        await showTyping("future_self", 1200);
        addSystemMessage("Tell me more. What feels off?", "future_self", "atlas_confirmation");
        // Stay in atlas_confirmation — next message will be treated as new info
      } else {
        // New info provided
        await showTyping("future_self", 1200);
        addSystemMessage("That's useful. I'm keeping that in mind.", "future_self", "atlas_confirmation");
        await showTyping("future_self", 1000);
        await transitionToIntake();
      }
    } else if (phase === "starter_q1") {
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
      await showTyping("future_self", 1500);
      const reflection = generateReflection(text, 0, entryState);
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
      await showTyping("future_self", 1500);
      const reflection = generateReflection(text, 1, entryState);
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
    } else if (phase === "council_accepted") {
      // Retry path: previous council meeting failed (returned 0 perspectives).
      // Any user message here re-runs the meeting.
      setCouncilMeetingRan(true);
      await runCouncilMeeting();
    } else if (phase === "user_reply") {
      await handleUserReply(text);
    } else if (phase === "handoff_offer") {
      await handleHandoffResponse(text);
    } else if (phase === "mentor_1to1") {
      await handleMentor1to1(text);
    } else if (phase === "return_greeting") {
      setLoading(true);
      try {
        const lower = text.toLowerCase();
        const wantsProject = /strateg|project|keep|continu|working on|next step/i.test(lower);
        const wantsCouncil = /council|new|different|something else|explore/i.test(lower);
        const wantsHelp = /stuck|lost|help|struggling|don.t know|unclear|confused/i.test(lower);

        if (wantsProject) {
          // Use the mentor assigned by the council — fall back to strategist only if none saved
          const targetMentor = handoffMentor || "strategist_mentor";
          if (!handoffMentor) persistHandoffMentor("strategist_mentor");
          const mentorLabel = mentorConfig[targetMentor]?.name || "the Strategist";
          await showTyping("future_self", 1200);
          addSystemMessage(
            `Let's pick up where you left off. ${mentorLabel} will continue from here.`,
            "future_self", "return_greeting"
          );
          setPhase("mentor_1to1");
          persistPhase("mentor_1to1");
        } else if (wantsCouncil) {
          await showTyping("future_self", 1200);
          addSystemMessage(
            `Got it. What do you want to bring to the Council today? Give me a quick topic or question.`,
            "future_self", "return_greeting"
          );
          setPhase("user_reply");
          persistPhase("user_reply");
        } else if (wantsHelp) {
          await showTyping("future_self", 1500);
          addSystemMessage(
            `Tell me more — what specifically feels stuck right now? Is it knowing what to do next, motivation, clarity on the direction, or something else?`,
            "future_self", "return_greeting"
          );
          // Stay in return_greeting — next reply routes them
        } else {
          // Generic — use saved mentor if available, fall back to strategist
          const targetMentor = handoffMentor || "strategist_mentor";
          if (!handoffMentor) persistHandoffMentor("strategist_mentor");
          const mentorLabel = mentorConfig[targetMentor]?.name || "the Strategist";
          await showTyping("future_self", 1200);
          addSystemMessage(
            `Got it. ${mentorLabel} will help you move that forward — just continue the conversation.`,
            "future_self", "return_greeting"
          );
          setPhase("mentor_1to1");
          persistPhase("mentor_1to1");
        }
      } finally {
        setLoading(false);
      }
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
      const story = `${intakeLabels[0]}: ${answers[0]}\n\n${intakeLabels[1]}: ${answers[1]}\n\n${intakeLabels[2]}: ${answers[2]}`;
      await supabase.functions.invoke("process-user-foundation", {
        body: { story },
      });

      // Refresh user mentors in case process-user-foundation assigned them
      try {
        const { data: { user: u } } = await supabase.auth.getUser();
        if (u) {
          const { data: freshMentors } = await supabase.from("user_mentors").select("mentor_type").eq("user_id", u.id);
          if (freshMentors && freshMentors.length > 0) {
            const mentorList = freshMentors.map((m: any) => m.mentor_type);
            setUserMentors(mentorList);
            userMentorsRef.current = mentorList;
          }
        }
      } catch (e) {
        console.error("Failed to refresh mentors (non-fatal):", e);
      }

      // Reflection after final answer
      await showTyping("future_self", 1500);
      const reflection = generateReflection(answers[2], 2);
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

      // Explain the council — one message instead of three
      addSystemMessage("Inside Becoming, you work with a small mentor council — each one a different lens: strategy, creativity, philosophy, psychology, and real-world experience. They'll challenge your thinking, surface blind spots, and help you define your path.", "future_self", "council_reveal");

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

    // Brief confirmation then auto-trigger council meeting
    await showTyping("future_self", 1200);
    addSystemMessage(
      `Your council is ready. Let me bring them in now...`,
      "future_self",
      nextPhase
    );

    // Auto-trigger council meeting — no need to ask user to type "let's go"
    setCouncilMeetingRan(true);
    setPhase("user_reply");
    persistPhase("user_reply");
    setTimeout(() => {
      runCouncilMeeting();
    }, 1500);
  };

  const runCouncilMeeting = async () => {
    setLoading(true);

    // Immediately cycle typing indicators through all mentors so user sees activity
    // right after "let's go" — before the API even returns.
    let typingCancelled = false;
    // Always read from refs so we get the latest state regardless of which closure called us
    const freshAnswers = intakeAnswersRef.current;
    const freshMentors = userMentorsRef.current;
    const freshEntryState = entryStateRef.current;
    const freshAtlasSignals = atlasSignalsRef.current;

    const allMentorTypes = [...new Set([...freshMentors, "future_self"])];
    const cycleTypingWhileWaiting = async () => {
      let i = 0;
      while (!typingCancelled) {
        const mt = allMentorTypes[i % allMentorTypes.length];
        const cfg = mentorConfig[mt];
        setTyping({ name: cfg?.name, icon: cfg?.icon, color: cfg?.color });
        await new Promise<void>(r => setTimeout(r, 1100));
        i++;
      }
      setTyping(null);
    };
    cycleTypingWhileWaiting();

    try {
      const projectIdea = freshAnswers[2] || "I want to build something meaningful";

      const labels = getIntakeLabels(freshEntryState);
      const fullIntakeContext = `${labels[0]}: ${freshAnswers[0] || "Not shared"}\n\n${labels[1]}: ${freshAnswers[1] || "Not shared"}\n\n${labels[2]}: ${freshAnswers[2] || projectIdea}`;

      // Pass EMPTY conversationHistory for first council call so edge function treats as Q1
      const { data, error } = await supabase.functions.invoke("council-meeting", {
        body: {
          question: fullIntakeContext,
          mentorTypes: allMentorTypes,
          conversationHistory: [],
          entryState: freshEntryState,
          atlasSignals: freshAtlasSignals,
        },
      });

      typingCancelled = true; // stop the cycling loop
      if (error) throw error;

      const perspectives = data.mentorPerspectives || {};
      const perspectiveCount = Object.keys(perspectives).length;

      // SAFETY NET: if AI Gateway calls all failed (rate-limit / credits / network),
      // perspectives is empty and the user would see nothing after "Your council is ready".
      // Surface a clear retry path instead of leaving them stuck.
      if (perspectiveCount === 0) {
        console.error("Council meeting returned 0 perspectives — AI gateway likely failed for all mentors", { data });
        toast.error("The council had trouble loading. Tap retry to try again.");
        await showTyping("future_self", 800);
        addSystemMessage(
          "The council had trouble gathering. Type \"retry\" and I'll bring them in again.",
          "future_self",
          "council_accepted"
        );
        // Reset so the user can retry: keep councilAccepted=true, but flip councilMeetingRan
        // back to false so the next message re-runs the meeting.
        setCouncilMeetingRan(false);
        const retryPhase: Phase = "council_accepted";
        setPhase(retryPhase);
        persistPhase(retryPhase);
        return;
      }

      const perspPhase: Phase = "perspectives";
      setPhase(perspPhase);
      persistPhase(perspPhase);

      // Staggered reveal — one mentor at a time, reading gap between each
      const perspEntries1 = Object.entries(perspectives);

      // Fallback: if edge function returned nothing, show a graceful recovery message
      if (perspEntries1.length === 0) {
        await showTyping("future_self", 1200);
        addSystemMessage("The mentors are here. What would you like to explore first?", "future_self", "user_reply");
        setPhase("user_reply");
        persistPhase("user_reply");
        return;
      }

      for (let i = 0; i < perspEntries1.length; i++) {
        const [mentorType, perspective] = perspEntries1[i];
        await showTyping(mentorType, 900 + Math.random() * 700);
        addSystemMessage(perspective as string, mentorType, perspPhase, "perspective");
        if (i < perspEntries1.length - 1) {
          await new Promise(r => setTimeout(r, 2500 + Math.random() * 800));
        }
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
          await showTyping(line.mentor, 700 + Math.random() * 600);
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
      typingCancelled = true;
      console.error("Error in council meeting:", error);
      toast.error("Council meeting failed");
    } finally {
      setLoading(false);
    }
  };

  const handleUserReply = async (text: string) => {
    setLoading(true);
    // Show typing immediately while we wait for the API — keeps the user oriented
    let userReplyTypingCancelled = false;
    const cycleUserReplyTyping = async () => {
      const pool = handoffMentor ? [handoffMentor] : [...userMentors, "future_self"];
      let i = 0;
      while (!userReplyTypingCancelled) {
        const mt = pool[i % pool.length];
        const cfg = mentorConfig[mt];
        setTyping({ name: cfg?.name, icon: cfg?.icon, color: cfg?.color });
        await new Promise<void>(r => setTimeout(r, 1100));
        i++;
      }
      setTyping(null);
    };
    cycleUserReplyTyping();
    try {
      if (handoffMentor) {
        const config = mentorConfig[handoffMentor];
        userReplyTypingCancelled = true;
        await showTyping("future_self", 800);
        addSystemMessage(
          `I think you're ready to work 1-to-1 with ${config?.name || handoffMentor}.\n\nIf you're ready, type "let's go".`,
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
            mentorTypes: [...new Set([...userMentorsRef.current, "future_self"])],
            conversationHistory: [{
              role: "user",
              content: intakeAnswersRef.current.join("\n"),
            }],
            entryState: entryStateRef.current,
            atlasSignals: atlasSignalsRef.current,
          },
        });

        if (error) throw error;

        const perspectives = data.mentorPerspectives || {};
        userReplyTypingCancelled = true;
        const perspEntries2 = Object.entries(perspectives);
        for (let i = 0; i < perspEntries2.length; i++) {
          const [mentorType, perspective] = perspEntries2[i];
          await showTyping(mentorType, 900 + Math.random() * 700);
          addSystemMessage(perspective as string, mentorType, "user_reply", "perspective");
          if (i < perspEntries2.length - 1) {
            await new Promise(r => setTimeout(r, 4000 + Math.random() * 1000));
          }
        }

        // Save bold keywords from 2nd round perspectives (non-blocking)
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) saveCouncilKeywords(perspectives, user.id);
        });

        if (data.banterLines?.length > 0) {
          for (const line of data.banterLines) {
            await showTyping(line.mentor, 700 + Math.random() * 600);
            addSystemMessage(line.text, line.mentor, "user_reply", "banter");
          }
        }

        // 2nd round: NOW set handoff mentor (entry-state-aware from edge function) — persist so it survives reload
        if (data.suggestedMentorFor1to1) {
          const { data: { user: u } } = await supabase.auth.getUser();
          persistHandoffMentor(data.suggestedMentorFor1to1.mentorType, u?.id);
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
          let finalProjectName = coherenceResult.projectName || "";
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
              description={coherenceResult.projectDescription}
              onAccept={(name) => handleFirstWinAccept(name, coherenceResult.projectDescription)}
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
              `I think you're ready to work 1-to-1 with ${config?.name || data.suggestedMentorFor1to1.mentorName}.`,
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
      userReplyTypingCancelled = true;
      console.error("Error in user reply:", error);
      toast.error("Something went wrong");
    } finally {
      userReplyTypingCancelled = true;
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

    // Show typing immediately — user already said "let's go"
    let handoffTypingCancelled = false;
    const cycleHandoffTyping = async () => {
      while (!handoffTypingCancelled) {
        const cfg = mentorConfig[handoffMentor];
        setTyping({ name: cfg?.name, icon: cfg?.icon, color: cfg?.color });
        await new Promise<void>(r => setTimeout(r, 1100));
      }
      setTyping(null);
    };
    cycleHandoffTyping();

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

      handoffTypingCancelled = true;
      if (error) throw error;

      await supabase.from("conversation_handoffs").update({ processed: true }).eq("id", handoff.id);

      await showTyping(handoffMentor, 600);
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
      handoffTypingCancelled = true;
      console.error("Error in handoff:", error);
      toast.error("Handoff failed");
    } finally {
      setLoading(false);
    }
  };

  const handleMentor1to1 = async (text: string) => {
    if (!handoffMentor) return;
    setLoading(true);

    // Show typing immediately and keep it visible through the entire API call
    let mentor1to1TypingCancelled = false;
    const cycleMentor1to1Typing = async () => {
      while (!mentor1to1TypingCancelled) {
        const cfg = mentorConfig[handoffMentor];
        setTyping({ name: cfg?.name, icon: cfg?.icon, color: cfg?.color });
        await new Promise<void>(r => setTimeout(r, 1100));
      }
      setTyping(null);
    };
    cycleMentor1to1Typing();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("chats").insert({
        user_id: user.id,
        mentor_type: handoffMentor as any,
        role: "user",
        content: text,
      });

      // Build conversation history from the 1-to-1 session so chat-mentor can
      // detect project coherence and avoid looping questions forever.
      const chatHistory = messages
        .slice(-20)
        .filter(m => !m.card && m.content && (m.role === "user" || m.mentorType === handoffMentor))
        .map(m => ({
          role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
          content: m.content,
        }));

      const { data, error } = await supabase.functions.invoke("chat-mentor", {
        body: { mentorType: handoffMentor, message: text, entryState, conversationHistory: chatHistory },
      });

      mentor1to1TypingCancelled = true;
      if (error) throw error;

      if (data.projectCoherence?.isCoherent) {
        // Project detected — skip the mentor's follow-up question and go straight to the card
        if (data.projectCoherence.projectType) {
          discoveredProjectTypeRef.current = data.projectCoherence.projectType;
        }

        await supabase.from("chats").insert({
          user_id: user.id,
          mentor_type: handoffMentor as any,
          role: "assistant",
          content: data.response,
        });

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
      } else {
        await supabase.from("chats").insert({
          user_id: user.id,
          mentor_type: handoffMentor as any,
          role: "assistant",
          content: data.response,
        });

        await showTyping(handoffMentor, 500);
        addSystemMessage(data.response, handoffMentor, "mentor_1to1");
      }
    } catch (error: any) {
      mentor1to1TypingCancelled = true;
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

      // --- Step 1: Show intro message ---
      await showTyping("future_self", 1000);
      addSystemMessage("Perfect. Let's break this into parts so you can start building it.", "future_self", "project_detected");

      const mk = () => Math.random().toString(36).slice(2, 10);

      // For BUILD: start API immediately, show tailored blocks after it resolves.
      // For DISCOVER/GROW: show template immediately (fast), API runs in parallel.
      const projectCreationPromise = supabase.functions.invoke("integrator-setup", {
        body: { projectTitle: name, projectDescription: description, timeframeDays: 30, entryState, intakeAnswers, projectType: discoveredProjectTypeRef.current },
      });

      let projectStructure: any[] = [];

      if (entryState === "BUILD") {
        // Keep typing indicator alive while we fetch tailored blocks from API
        const fsConfig = mentorConfig["future_self"];
        setTyping({ name: fsConfig?.name, icon: fsConfig?.icon, color: fsConfig?.color });

        const { data: projectData, error: projectError } = await projectCreationPromise;
        setTyping(null);

        if (projectError || !projectData) {
          toast.error("Failed to create project");
          setLoading(false);
          return;
        }

        // Use AI-tailored blocks or fall back to a lean BUILD template
        if (projectData.proposedBlocks?.length > 0) {
          projectStructure = projectData.proposedBlocks;
        } else {
          projectStructure = [
            { id: mk(), title: "Marketing & Outreach", status: "not_started", importance: "high", children: [
              { id: mk(), title: "Identify your top 3 distribution channels", status: "not_started", importance: "high", children: [] },
              { id: mk(), title: "Draft your core outreach message", status: "not_started", importance: "medium", children: [] },
              { id: mk(), title: "Reach out to 5 potential partners or communities", status: "not_started", importance: "medium", children: [] },
            ]},
            { id: mk(), title: "Content Creation", status: "not_started", importance: "high", children: [
              { id: mk(), title: "Create one piece of content that shows real results", status: "not_started", importance: "high", children: [] },
              { id: mk(), title: "Write your core message in one sentence", status: "not_started", importance: "medium", children: [] },
              { id: mk(), title: "Post once to your primary channel this week", status: "not_started", importance: "medium", children: [] },
            ]},
            { id: mk(), title: "Sales & Conversion", status: "not_started", importance: "high", children: [
              { id: mk(), title: "Define exactly what you're offering and at what price", status: "not_started", importance: "high", children: [] },
              { id: mk(), title: "Make 3 direct asks this week", status: "not_started", importance: "medium", children: [] },
              { id: mk(), title: "Add one testimonial or social proof to your offer", status: "not_started", importance: "medium", children: [] },
            ]},
            { id: mk(), title: "30-Day Milestone", status: "not_started", importance: "medium", children: [
              { id: mk(), title: "Name the one metric that defines success", status: "not_started", importance: "high", children: [] },
              { id: mk(), title: "Identify what you will NOT do this month", status: "not_started", importance: "medium", children: [] },
              { id: mk(), title: "Set a weekly check-in to measure progress", status: "not_started", importance: "medium", children: [] },
            ]},
          ];
        }

        // Build and show structure text
        let structureText = `**${name}**\n\nStructure:\n`;
        projectStructure.forEach((block: any) => {
          structureText += `\n● **${block.title}**`;
          if (block.children?.length > 0) {
            block.children.forEach((child: any) => { structureText += `\n  · ${child.title}`; });
          }
        });

        await showTyping("future_self", 800);
        addSystemMessage(structureText, "future_self", "project_detected");

        // Payment is shown by ProjectEngine once the user opens the project

        const fsConfig2 = mentorConfig["future_self"];
        setTyping({ name: fsConfig2?.name, icon: fsConfig2?.icon, color: fsConfig2?.color });

        let projectId = projectData?.project?.id || projectData?.projectId;
        if (!projectId) {
          setTyping(null);
          toast.error("Failed to create project");
          setLoading(false);
          return;
        }

        // Await structure save so ProjectEngine always loads with data
        await Promise.all([
          supabase.from("integrator_projects").update({ project_structure: projectStructure, project_brief: description } as any).eq("id", projectId),
          supabase.from("profiles").update({ first_project_created_at: new Date().toISOString(), first_project_id: projectId, console_intake_completed: true } as any).eq("id", user.id),
        ]).catch(e => console.error("Project DB writes failed:", e));

        // Fire-and-forget: atlas cluster + capability seeding (non-blocking)
        (async () => {
          try {
            const projectSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
            const { data: projectNode } = await supabase.from("atlas_project_nodes").insert({ user_id: user.id, title: name, description }).select("id").single();
            if (projectNode) {
              const { data: newCluster } = await supabase.from("atlas_clusters").insert({ name, slug: `project-${projectSlug}`, cluster_category: "project", state: "active", sort_order: 100, description: description || `Project: ${name}` }).select("id").single();
              if (newCluster) await supabase.from("atlas_cluster_project_connections").insert({ cluster_id: newCluster.id, project_id: projectNode.id });
            }
          } catch (clusterErr) { console.error("Project cluster creation failed:", clusterErr); }
        })();

        supabase.functions.invoke("seed-initial-capabilities", { body: { intakeAnswers, workContext: entryState } }).catch(e => console.error("Capability seeding failed:", e));

        setTyping(null);
        setPhase("post_project");
        persistPhase("post_project");
        setProjectName(name);
        onProjectNameChange?.(name);
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });

        const buildStructureBlocks = projectStructure.map((b: any) => ({
          title: b.title,
          activities: (b.children || []).map((c: any) => c.title),
        }));

        addCardMessage(
          <ProjectCreationCard
            projectName={name}
            projectDescription={description}
            alreadyCreatedId={projectId}
            structureBlocks={buildStructureBlocks}
            onProjectCreated={() => { navigate(`/project/${projectId}`); }}
          />,
          undefined,
          "post_project"
        );

        setLoading(false);
        return;
      }

      // DISCOVER: wait for API (AI-tailored blocks). GROW: show template immediately.
      if (entryState === "DISCOVER") {
        // Set rich fallback immediately — AI blocks from integrator-setup will override if available
        projectStructure = [
          { id: mk(), title: "Project Identity", status: "not_started", importance: "high", children: [
            { id: mk(), title: "Write the name and one clear sentence that explains what this is", status: "not_started", importance: "high", children: [] },
            { id: mk(), title: "Define the core purpose — what this changes or creates", status: "not_started", importance: "high", children: [] },
            { id: mk(), title: "Describe the format — what form does this take?", status: "not_started", importance: "medium", children: [] },
          ]},
          { id: mk(), title: "Transformation", status: "not_started", importance: "high", children: [
            { id: mk(), title: "Before — how does someone feel before they experience this?", status: "not_started", importance: "high", children: [] },
            { id: mk(), title: "During — what shifts while they are inside this experience?", status: "not_started", importance: "high", children: [] },
            { id: mk(), title: "After — what can they do or feel that they could not before?", status: "not_started", importance: "high", children: [] },
          ]},
          { id: mk(), title: "Ideal User", status: "not_started", importance: "high", children: [
            { id: mk(), title: "Who is this person? Write a real profile", status: "not_started", importance: "high", children: [] },
            { id: mk(), title: "What are they struggling with right now?", status: "not_started", importance: "high", children: [] },
            { id: mk(), title: "What do they want more than anything?", status: "not_started", importance: "medium", children: [] },
            { id: mk(), title: "Why would they pay for this?", status: "not_started", importance: "medium", children: [] },
          ]},
          { id: mk(), title: "Core Journey", status: "not_started", importance: "high", children: [
            { id: mk(), title: "What is the first moment? How does it begin?", status: "not_started", importance: "high", children: [] },
            { id: mk(), title: "What is the turning point — when something shifts?", status: "not_started", importance: "high", children: [] },
            { id: mk(), title: "What is the peak moment — the most powerful point?", status: "not_started", importance: "medium", children: [] },
            { id: mk(), title: "How does it end? What do they carry away?", status: "not_started", importance: "medium", children: [] },
          ]},
          { id: mk(), title: "System Mechanics", status: "not_started", importance: "high", children: [
            { id: mk(), title: "What are the core components or elements?", status: "not_started", importance: "high", children: [] },
            { id: mk(), title: "How do the components connect and flow?", status: "not_started", importance: "high", children: [] },
            { id: mk(), title: "What rules or structure make it work?", status: "not_started", importance: "medium", children: [] },
          ]},
          { id: mk(), title: "Interaction Design", status: "not_started", importance: "medium", children: [
            { id: mk(), title: "What is the tone? (playful, serious, gentle, bold...)", status: "not_started", importance: "medium", children: [] },
            { id: mk(), title: "What energy should someone feel while using this?", status: "not_started", importance: "medium", children: [] },
            { id: mk(), title: "What makes this feel different from anything else?", status: "not_started", importance: "medium", children: [] },
          ]},
          { id: mk(), title: "Project System Design", status: "not_started", importance: "medium", children: [
            { id: mk(), title: "Map the full path from A to B", status: "not_started", importance: "high", children: [] },
            { id: mk(), title: "What enables each step of the journey?", status: "not_started", importance: "medium", children: [] },
            { id: mk(), title: "How does everything connect into one system?", status: "not_started", importance: "medium", children: [] },
          ]},
        ];

        const fsConfig = mentorConfig["future_self"];
        setTyping({ name: fsConfig?.name, icon: fsConfig?.icon, color: fsConfig?.color });

        const { data: projectData, error: projectError } = await projectCreationPromise;
        setTyping(null);

        if (projectError || !projectData) {
          toast.error("Failed to create project");
          setLoading(false);
          return;
        }

        // Override fallback with AI-tailored blocks if available
        if (projectData.proposedBlocks?.length > 0) {
          projectStructure = projectData.proposedBlocks;
        }

        const projectId = projectData?.project?.id || projectData?.projectId;
        if (!projectId) {
          toast.error("Failed to create project");
          setLoading(false);
          return;
        }

        // Show structure in chat
        let structureText = `**${name}**\n\nStructure:\n`;
        projectStructure.forEach((block: any) => {
          structureText += `\n● **${block.title}**`;
          if (block.children?.length > 0) {
            block.children.forEach((child: any) => { structureText += `\n  · ${child.title}`; });
          }
        });
        await showTyping("future_self", 1200);
        addSystemMessage(structureText, "future_self", "project_detected");

        await Promise.all([
          supabase.from("integrator_projects").update({ project_structure: projectStructure, project_brief: description } as any).eq("id", projectId),
          supabase.from("profiles").update({ first_project_created_at: new Date().toISOString(), first_project_id: projectId, console_intake_completed: true } as any).eq("id", user.id),
        ]).catch(e => console.error("Project DB writes failed:", e));

        supabase.functions.invoke("seed-initial-capabilities", { body: { intakeAnswers, workContext: entryState } }).catch(e => console.error("Capability seeding failed:", e));

        setTyping(null);
        setPhase("post_project");
        persistPhase("post_project");
        setProjectName(name);
        onProjectNameChange?.(name);

        const discoverProjectId = projectId;
        const discoverStructureBlocks = projectStructure.map((b: any) => ({
          title: b.title,
          activities: (b.children || []).map((c: any) => c.title),
        }));
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        addCardMessage(
          <ProjectCreationCard
            projectName={name}
            projectDescription={description}
            alreadyCreatedId={discoverProjectId}
            structureBlocks={discoverStructureBlocks}
            onProjectCreated={() => { navigate(`/project/${discoverProjectId}`); }}
          />,
          undefined,
          "post_project"
        );

        setLoading(false);
        return;
      }

      if (entryState === "GROW") {
        projectStructure = [
          { id: mk(), title: "MVP Design", status: "not_started", importance: "high", children: [
            { id: mk(), title: "Define the core experience", status: "not_started", importance: "high", children: [] },
            { id: mk(), title: "Strip it to the minimum", status: "not_started", importance: "medium", children: [] },
            { id: mk(), title: "Decide what to build first", status: "not_started", importance: "medium", children: [] },
          ]},
          { id: mk(), title: "Ideal User", status: "not_started", importance: "high", children: [
            { id: mk(), title: "Write one real person's profile", status: "not_started", importance: "high", children: [] },
            { id: mk(), title: "Name their exact pain point", status: "not_started", importance: "medium", children: [] },
            { id: mk(), title: "Describe what they want to become", status: "not_started", importance: "medium", children: [] },
          ]},
          { id: mk(), title: "Validation Experiments", status: "not_started", importance: "medium", children: [
            { id: mk(), title: "Design one small test", status: "not_started", importance: "high", children: [] },
            { id: mk(), title: "Find 3 people to try it", status: "not_started", importance: "medium", children: [] },
            { id: mk(), title: "Define what a pass looks like", status: "not_started", importance: "medium", children: [] },
          ]},
          { id: mk(), title: "Real Feedback", status: "not_started", importance: "medium", children: [
            { id: mk(), title: "Run the test and listen", status: "not_started", importance: "high", children: [] },
            { id: mk(), title: "Write down the honest reactions", status: "not_started", importance: "medium", children: [] },
            { id: mk(), title: "Find the one thing that surprised you", status: "not_started", importance: "medium", children: [] },
          ]},
          { id: mk(), title: "Iteration", status: "not_started", importance: "medium", children: [
            { id: mk(), title: "Decide what to keep", status: "not_started", importance: "high", children: [] },
            { id: mk(), title: "Decide what to cut", status: "not_started", importance: "medium", children: [] },
            { id: mk(), title: "Make one clear improvement", status: "not_started", importance: "medium", children: [] },
          ]},
          { id: mk(), title: "Path to First Revenue", status: "not_started", importance: "medium", children: [
            { id: mk(), title: "Name your first offer and price", status: "not_started", importance: "high", children: [] },
            { id: mk(), title: "Identify who would pay first", status: "not_started", importance: "medium", children: [] },
            { id: mk(), title: "Make your first ask", status: "not_started", importance: "medium", children: [] },
          ]},
        ];
      }

      // --- Step 2: Show structure in chat --- (GROW only — DISCOVER returns early above)
      let structureText = `**${name}**\n\nStructure:\n`;
      projectStructure.forEach((block: any) => {
        structureText += `\n● **${block.title}**`;
        if (block.children && block.children.length > 0) {
          block.children.forEach((child: any) => {
            structureText += `\n  · ${child.title}`;
          });
        }
      });

      await showTyping("future_self", 1200);
      addSystemMessage(structureText, "future_self", "project_detected");

      // Payment is shown by ProjectEngine once the user opens the project

      // Keep typing indicator alive while we wait — user sees Future Self is "working"
      const fsConfig = mentorConfig["future_self"];
      setTyping({ name: fsConfig?.name, icon: fsConfig?.icon, color: fsConfig?.color });

      // --- Step 3: Await project creation result ---
      const { data: projectData, error: projectError } = await projectCreationPromise;

      let projectId = projectData?.project?.id || projectData?.projectId;

      if (projectError || !projectId) {
        setTyping(null);
        console.error("Project creation failed:", projectError);
        toast.error("Failed to create project");
        setLoading(false);
        return;
      }

      // Await structure save so ProjectEngine always loads with data
      await Promise.all([
        supabase
          .from("integrator_projects")
          .update({
            project_structure: projectStructure,
            project_brief: description,
          } as any)
          .eq("id", projectId),
        supabase
          .from("profiles")
          .update({
            first_project_created_at: new Date().toISOString(),
            first_project_id: projectId,
            console_intake_completed: true,
          } as any)
          .eq("id", user.id),
      ]).catch(e => console.error("Project DB writes failed:", e));

      // Atlas cluster creation — fully fire-and-forget
      (async () => {
        try {
          const projectSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
          const { data: projectNode } = await supabase
            .from("atlas_project_nodes")
            .insert({ user_id: user.id, title: name, description })
            .select("id")
            .single();

          if (projectNode) {
            const { data: newCluster } = await supabase
              .from("atlas_clusters")
              .insert({
                name,
                slug: `project-${projectSlug}`,
                cluster_category: "project",
                state: "active",
                sort_order: 100,
                description: description || `Project: ${name}`,
              })
              .select("id")
              .single();

            if (newCluster) {
              await supabase
                .from("atlas_cluster_project_connections")
                .insert({ cluster_id: newCluster.id, project_id: projectNode.id });
            }
          }
        } catch (clusterErr) {
          console.error("Project cluster creation failed:", clusterErr);
        }
      })();

      // Seed capabilities (non-blocking)
      supabase.functions.invoke("seed-initial-capabilities", {
        body: { intakeAnswers, workContext: entryState },
      }).catch(e => console.error("Capability seeding failed:", e));

      // --- Step 4: Show Project Card with "Open Project" ---
      const finalProjectId = projectId;
      setTyping(null);
      
      setPhase("post_project");
      persistPhase("post_project");
      setProjectName(name);
      onProjectNameChange?.(name);

      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });

      const structureBlocks = projectStructure.map((b: any) => ({
        title: b.title,
        activities: (b.children || []).map((c: any) => c.title),
      }));

      addCardMessage(
        <ProjectCreationCard
          projectName={name}
          projectDescription={description}
          alreadyCreatedId={finalProjectId}
          structureBlocks={structureBlocks}
          onProjectCreated={() => {
            navigate(`/project/${finalProjectId}`);
          }}
        />,
        undefined,
        "post_project"
      );
    } catch (error: any) {
      console.error("Error in project structuring:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handlePostProjectMessage = async (text: string) => {
    setLoading(true);
    // Show typing indicator immediately — before the API call starts
    const firstMentor = userMentors[0] || "future_self";
    setTyping({ name: mentorConfig[firstMentor]?.name, icon: mentorConfig[firstMentor]?.icon, color: mentorConfig[firstMentor]?.color });
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

      setTyping(null);
      if (error) throw error;

      const perspectives = data.mentorPerspectives || {};
      const perspEntries3 = Object.entries(perspectives);
      for (let i = 0; i < perspEntries3.length; i++) {
        const [mentorType, perspective] = perspEntries3[i];
        await showTyping(mentorType, 900 + Math.random() * 700);
        addSystemMessage(perspective as string, mentorType, "post_project", "perspective");
        if (i < perspEntries3.length - 1) {
          await new Promise(r => setTimeout(r, 2000 + Math.random() * 600));
        }
      }

      if (data.banterLines?.length > 0) {
        for (const line of data.banterLines) {
          await showTyping(line.mentor, 600 + Math.random() * 400);
          addSystemMessage(line.text, line.mentor, "post_project", "banter");
          await new Promise(r => setTimeout(r, 1500));
        }
      }

      const nextQ = data.clarityQuestion || data.suggestedNextQuestion;
      if (nextQ) {
        await showTyping("future_self", 1000);
        addSystemMessage(nextQ, "future_self", "post_project");
      }
    } catch (error: any) {
      setTyping(null);
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
    <>
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

      {/* Onboarding step indicator */}
      {(() => {
        const stepMap: Record<string, { label: string; step: number }> = {
          starter_q1: { label: "Getting started", step: 1 },
          starter_q2: { label: "Getting started", step: 2 },
          starter_q3: { label: "Getting started", step: 3 },
          intake_q1:  { label: "Your context", step: 1 },
          intake_q2:  { label: "Your context", step: 2 },
          intake_q3:  { label: "Your context", step: 3 },
        };
        const info = stepMap[phase];
        if (!info) return null;
        return (
          <div className="px-4 py-2 border-b border-border/40 bg-background/60">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              <span className="text-[11px] text-muted-foreground font-medium tracking-wide uppercase">
                {info.label}
              </span>
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      className={cn(
                        "rounded-full transition-all duration-300",
                        i < info.step  ? "w-4 h-1.5 bg-primary" :
                        i === info.step ? "w-4 h-1.5 bg-primary" :
                                         "w-1.5 h-1.5 bg-muted-foreground/30"
                      )}
                    />
                  ))}
                </div>
                <span className="text-[11px] text-muted-foreground">{info.step} / 3</span>
              </div>
            </div>
          </div>
        );
      })()}

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

      {/* Handoff connect button */}
      {phase === "handoff_offer" && handoffMentor && mentorConfig[handoffMentor] && (
        <div className="px-3 pt-2 pb-0 max-w-3xl mx-auto w-full">
          <button
            onClick={() => handleHandoffResponse("let's go")}
            disabled={loading}
            className={cn(
              "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl",
              "border border-primary/30 bg-primary/10 hover:bg-primary/20",
              "text-sm font-medium text-foreground transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{mentorConfig[handoffMentor].icon}</span>
              <span>Connect with {mentorConfig[handoffMentor].name}</span>
            </div>
            <ArrowRight className="w-4 h-4 text-primary shrink-0" />
          </button>
        </div>
      )}

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
              : phase === "handoff_offer" ? "Or type a reply..."
              : "Type your message..."
            }
            disabled={isInputDisabled}
            className="flex-1"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={toggleVoice}
            disabled={isInputDisabled}
            className={cn(isRecording && "border-red-500 text-red-500 animate-pulse")}
            title={isRecording ? "Stop recording" : "Speak your message"}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
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

    <PaymentModal open={showPayment} onClose={() => setShowPayment(false)} />
    </>
  );
};

export default ConsoleThread;
