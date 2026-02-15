import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Send, Sparkles, MessageCircle, RefreshCw, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MentorLearningModule } from "@/components/MentorLearningModule";
import { HighlightedText } from "@/components/HighlightedText";
import { BreakthroughDetectedCard } from "@/components/BreakthroughDetectedCard";
import { useBreakthroughDetection } from "@/hooks/useBreakthroughDetection";
import { InsightActionButton } from "@/components/InsightActionButton";
import { ValueMapUnlockCelebration } from "@/components/ValueMapUnlockCelebration";
import { MentorTransitionCard } from "@/components/MentorTransitionCard";
import { FirstWinNamingCard, CoherenceType } from "@/components/FirstWinNamingCard";
import { FirstWinCelebration } from "@/components/FirstWinCelebration";
import { InlineProjectSuggestion } from "@/components/InlineProjectSuggestion";
import { KeywordHighlighter } from "@/components/KeywordHighlighter";
import { useMicroWins } from "@/hooks/useMicroWins";
import { PatternDiscoveryCard, PatternCelebration } from "@/components/pattern-map";
import { useInnerPatterns } from "@/hooks/useInnerPatterns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ValueMapDetection {
  blockKey: string;
  blockTitle: string;
  blockDescription: string;
  suggestedContent: string;
  confidence: number;
  reasoning: string;
  source: string;
  mentorType?: string;
}

interface SuggestedHandoff {
  shouldSuggest: boolean;
  targetMentor: string;
  reason: string;
}

interface ProjectCoherence {
  isCoherent: boolean;
  projectName: string;
  projectDescription: string;
  confidence: number;
  // PDR v2.2: Branch classification
  coherenceType?: CoherenceType;
  coreTheme?: string;
  spineId?: string;
  isEvolution?: boolean;
  evolutionInsight?: string;
  previousNodeTitle?: string;
}

interface Whisper {
  id: string;
  mentor_type: string;
  message: string;
  whisper_type?: string;
  created_at: string;
}

const mentorNames: Record<string, string> = {
  discipline_mentor: "The Discipline Mentor",
  strategist_mentor: "The Strategist Mentor",
  business_mentor: "The Business Mentor",
  creative_visionary: "The Creative Visionary",
  marketing_mentor: "The Marketing Mentor",
  quantum_inventor: "The Quantum Inventor",
  scientific_mentor: "The Scientific Mentor",
  mystic_mentor: "The Mystic Mentor",
  ancient_sage: "The Ancient Sage",
  alignment_mentor: "The Alignment Mentor",
  oracle_mother: "The Oracle Mother",
  heart_mentor: "The Heart Mentor",
  future_self: "Your Future Self",
};

interface ChatProps {
  mentorTypeOverride?: string;
  embedded?: boolean;
  locationState?: { 
    handoffId?: string; 
    voiceHandoffId?: string; 
    voiceContext?: string;
    problemClarificationMode?: boolean;
    projectId?: string;
    projectName?: string;
    transmutationContext?: {
      phase: 'white' | 'gold';
      patternId: string;
      patternName: string;
      patternDescription?: string;
      shadow: string;
      existingTransmutationData?: any;
      lifeEvents?: any;
    };
  } | null;
}

const Chat = ({ mentorTypeOverride, embedded = false, locationState: propState }: ChatProps) => {
  const { mentorType: mentorTypeParam } = useParams<{ mentorType: string }>();
  const mentorType = mentorTypeOverride || mentorTypeParam;
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const fromCouncil = searchParams.get('fromCouncil') === 'true';
  const questType = searchParams.get('quest');
  
  const [messages, setMessages] = useState<any[]>([]);
  const [whispers, setWhispers] = useState<Whisper[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLearningModule, setShowLearningModule] = useState(false);
  const [learningModuleData, setLearningModuleData] = useState<any>(null);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [isHandoffProcessed, setIsHandoffProcessed] = useState(false);
  const [valueMapDetection, setValueMapDetection] = useState<ValueMapDetection | null>(null);
  const [suggestedHandoff, setSuggestedHandoff] = useState<SuggestedHandoff | null>(null);
  const [userMentors, setUserMentors] = useState<string[]>([]);
  const [showFirstWinNaming, setShowFirstWinNaming] = useState(false);
  const [showFirstWinCelebration, setShowFirstWinCelebration] = useState(false);
  const [firstWinConceptName, setFirstWinConceptName] = useState("");
  const [projectCoherence, setProjectCoherence] = useState<ProjectCoherence | null>(null);
  const [showCommitmentCard, setShowCommitmentCard] = useState(false);
  const [questInitialized, setQuestInitialized] = useState(false);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [conversationSummary, setConversationSummary] = useState<string | null>(null);
  const [isVoiceHandoffProcessed, setIsVoiceHandoffProcessed] = useState(false);
  const [isProblemClarificationProcessed, setIsProblemClarificationProcessed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Micro wins for post-first-win celebrations
  const { triggerMicroWin } = useMicroWins();
  
  // Inner patterns hook for pattern creation
  const { createPattern } = useInnerPatterns();
  
  // Pattern detection state (Inner Work Lab)
  const [patternDetection, setPatternDetection] = useState<any>(null);
  const [showPatternCard, setShowPatternCard] = useState(false);
  const [showPatternCelebration, setShowPatternCelebration] = useState(false);
  const [createdPatternId, setCreatedPatternId] = useState<string | null>(null);
  
  // Breakthrough detection
  const {
    latestBreakthrough,
    isFirstSession,
    checkForBreakthrough,
    dismissBreakthrough,
    clearBreakthrough,
    completeFirstWin,
  } = useBreakthroughDetection(mentorType);

  // Load user's selected mentors
  useEffect(() => {
    const loadUserMentors = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase
        .from("user_mentors")
        .select("mentor_type")
        .eq("user_id", user.id);
      
      if (data) {
        const mentors = data.map(m => m.mentor_type).filter(m => m !== mentorType);
        setUserMentors(mentors);
      }
    };
    loadUserMentors();
  }, [mentorType]);

  // Check for handoff state on mount - use prop state if provided (embedded mode)
  useEffect(() => {
    const handoffState = (propState || location.state) as { 
      handoffId?: string; 
      voiceHandoffId?: string; 
      voiceContext?: string;
      problemClarificationMode?: boolean;
      projectId?: string;
      projectName?: string;
      transmutationContext?: any;
    } | null;
    
    console.log('[Chat] Checking handoff state:', { 
      handoffState, 
      mentorType, 
      isHandoffProcessed, 
      isVoiceHandoffProcessed, 
      isProblemClarificationProcessed,
      hasHandoffId: !!handoffState?.handoffId,
      hasTransmutationContext: !!handoffState?.transmutationContext
    });
    
    // Standard handoff (from mentor switching, transmutation map, etc.)
    if (handoffState?.handoffId && !isHandoffProcessed) {
      console.log('[Chat] Processing handoff:', handoffState.handoffId);
      processHandoff(handoffState.handoffId);
    }
    // Voice of System handoff
    if (handoffState?.voiceHandoffId && !isVoiceHandoffProcessed) {
      processVoiceHandoff(handoffState.voiceHandoffId);
    }
    // Problem Clarification mode (Design Thinking Define phase)
    if (handoffState?.problemClarificationMode && mentorType === 'business_mentor' && !isProblemClarificationProcessed) {
      processProblemClarification(handoffState.projectId, handoffState.projectName);
    }
  }, [propState, location.state, mentorType, isHandoffProcessed, isVoiceHandoffProcessed, isProblemClarificationProcessed]);

  const processHandoff = async (handoffId: string) => {
    console.log('[Chat] processHandoff called with:', { handoffId, mentorType });
    setLoading(true);
    setIsHandoffProcessed(true); // Set immediately to prevent re-triggering
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('[Chat] No user found during handoff');
        return;
      }

      console.log('[Chat] Invoking chat-mentor with handoffId:', handoffId);
      const { data, error } = await supabase.functions.invoke("chat-mentor", {
        body: { mentorType, message: "__HANDOFF_INIT__", handoffId },
      });

      if (error) {
        console.error('[Chat] chat-mentor error:', error);
        throw error;
      }

      console.log('[Chat] chat-mentor response:', data);

      if (data?.response) {
        const { data: welcomeMsgData, error: insertError } = await supabase.from("chats").insert({
          user_id: user.id,
          mentor_type: mentorType as any,
          role: "assistant",
          content: data.response,
        }).select().single();

        if (insertError) {
          console.error('[Chat] Error inserting message:', insertError);
        } else if (welcomeMsgData) {
          console.log('[Chat] Message inserted successfully');
          setMessages((prev) => [...prev, welcomeMsgData]);
        }
      } else {
        console.error('[Chat] No response from chat-mentor');
      }

      await supabase.from("conversation_handoffs").update({ processed: true }).eq("id", handoffId);
      
      // Clear navigation state but stay on the page
      navigate(location.pathname + location.search, { replace: true, state: {} });
    } catch (error: any) {
      console.error("Error processing handoff:", error);
      toast.error("Failed to process handoff");
      setIsHandoffProcessed(false); // Allow retry on error
    } finally {
      setLoading(false);
    }
  };

  // Voice of System handoff processing
  const processVoiceHandoff = async (voiceHandoffId: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get the voice handoff record
      const { data: handoffRecord, error: handoffError } = await supabase
        .from("conversation_handoffs")
        .select("voice_context")
        .eq("id", voiceHandoffId)
        .single();

      if (handoffError || !handoffRecord?.voice_context) {
        console.error("Failed to get voice handoff record:", handoffError);
        setIsVoiceHandoffProcessed(true);
        return;
      }

      const voiceContext = handoffRecord.voice_context as any;

      // Invoke chat-mentor with __VOICE_INIT__ to get proactive opening
      const { data, error } = await supabase.functions.invoke("chat-mentor", {
        body: { 
          mentorType, 
          message: `__VOICE_INIT__:${JSON.stringify(voiceContext)}` 
        },
      });

      if (error) throw error;

      // Save the AI opening message
      const { data: welcomeMsgData } = await supabase.from("chats").insert({
        user_id: user.id,
        mentor_type: mentorType as any,
        role: "assistant",
        content: data.response,
      }).select().single();

      if (welcomeMsgData) {
        setMessages((prev) => [...prev, welcomeMsgData]);
      }

      // Mark handoff as processed
      await supabase.from("conversation_handoffs").update({ processed: true }).eq("id", voiceHandoffId);
      setIsVoiceHandoffProcessed(true);
      navigate(location.pathname, { replace: true, state: {} });
    } catch (error: any) {
      console.error("Error processing voice handoff:", error);
      toast.error("Failed to start guided conversation");
    } finally {
      setLoading(false);
    }
  };

  // Problem Clarification processing (Design Thinking Define phase)
  const processProblemClarification = async (projectId?: string, projectName?: string) => {
    setLoading(true);
    setIsProblemClarificationProcessed(true); // Mark immediately to prevent double-fire
    
    console.log('[Chat] Processing problem clarification init:', { projectId, projectName, mentorType });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Invoke chat-mentor with __PROBLEM_CLARIFICATION_INIT__ to get proactive opening
      const { data, error } = await supabase.functions.invoke("chat-mentor", {
        body: { 
          mentorType: 'business_mentor', 
          message: `__PROBLEM_CLARIFICATION_INIT__:${JSON.stringify({ projectId, projectName })}` 
        },
      });

      if (error) throw error;

      // Save the AI opening message
      const { data: welcomeMsgData } = await supabase.from("chats").insert({
        user_id: user.id,
        mentor_type: 'business_mentor',
        role: "assistant",
        content: data.response,
      }).select().single();

      if (welcomeMsgData) {
        setMessages((prev) => [...prev, welcomeMsgData]);
      }

      // Clear navigation state to prevent re-triggering on refresh
      navigate(location.pathname + location.search, { replace: true, state: {} });
    } catch (error: any) {
      console.error("Error processing problem clarification:", error);
      toast.error("Failed to start problem clarification");
      setIsProblemClarificationProcessed(false); // Allow retry on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    loadWhispers();
    const unsubscribe = subscribeToMessages();
    return () => { unsubscribe(); };
  }, [mentorType]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Quest initialization - send opening message for quest context
  useEffect(() => {
    const initializeQuest = async () => {
      if (questType && mentorType === 'future_self' && !questInitialized && messages.length === 0) {
        setQuestInitialized(true);
        setLoading(true);
        
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          // Send quest init message to get contextual opening
          const { data, error } = await supabase.functions.invoke("chat-mentor", {
            body: { mentorType: 'future_self', message: `__QUEST_INIT__:${questType}` },
          });

          if (error) throw error;

          // Save the AI opening message
          const { data: assistantMsgData } = await supabase.from("chats").insert({
            user_id: user.id,
            mentor_type: 'future_self',
            role: "assistant",
            content: data.response,
          }).select().single();

          if (assistantMsgData) {
            setMessages([assistantMsgData]);
          }
        } catch (error: any) {
          console.error("Error initializing quest:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    // Only initialize after messages are loaded
    if (!loading) {
      initializeQuest();
    }
  }, [questType, mentorType, questInitialized, messages.length, loading]);

  const loadMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("chats")
        .select("*")
        .eq("user_id", user.id)
        .eq("mentor_type", mentorType as any)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      const userMessageCount = data?.filter((m: any) => m.role === "user").length || 0;
      setExchangeCount(userMessageCount);
      
      // If there are existing messages and we have a quest param, mark as initialized
      if (data && data.length > 0 && questType) {
        setQuestInitialized(true);
      }

      // Show "welcome back" summary if user has previous conversation history (>= 4 exchanges)
      if (data && data.length >= 4) {
        // Get last few topics discussed
        const recentUserMessages = data
          .filter((m: any) => m.role === "user")
          .slice(-3)
          .map((m: any) => m.content.substring(0, 50));
        
        if (recentUserMessages.length > 0) {
          setConversationSummary(`We discussed: ${recentUserMessages.join("... / ")}...`);
          setShowWelcomeBack(true);
        }
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const loadWhispers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("daily_whispers")
        .select("*")
        .eq("user_id", user.id)
        .eq("mentor_type", mentorType as any)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setWhispers((data || []) as Whisper[]);
    } catch (error: any) {
      console.error("Error loading whispers:", error);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`chats-${mentorType}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chats", filter: `mentor_type=eq.${mentorType}` },
        async (payload) => {
          const { data: { user } } = await supabase.auth.getUser();
          if (payload.new.mentor_type === mentorType && payload.new.user_id === user?.id) {
            setMessages((prev) => prev.some(m => m.id === payload.new.id) ? prev : [...prev, payload.new]);
          }
        }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  };

  const handleHandoff = async (targetMentor: string) => {
    if (messages.length < 2) {
      toast.error("Have a conversation first before switching perspectives");
      return;
    }

    setLoading(true);
    setSuggestedHandoff(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const recentMessages = messages.slice(-20).map(m => ({ role: m.role, content: m.content, created_at: m.created_at }));

      const { data: existingChainHandoff } = await supabase
        .from("conversation_handoffs")
        .select("handoff_chain_id, chain_position, journey_topic")
        .eq("user_id", user.id)
        .eq("target_mentor_type", mentorType)
        .eq("processed", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const firstUserMessage = messages.find(m => m.role === "user");
      const journeyTopic = existingChainHandoff?.journey_topic || (firstUserMessage?.content?.substring(0, 100) + "...");

      const { data: handoff, error } = await supabase
        .from("conversation_handoffs")
        .insert({
          user_id: user.id,
          source_mentor_type: mentorType,
          target_mentor_type: targetMentor,
          source_messages: recentMessages,
          handoff_chain_id: existingChainHandoff?.handoff_chain_id || undefined,
          chain_position: (existingChainHandoff?.chain_position || 0) + 1,
          journey_topic: journeyTopic,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Getting fresh perspective from ${mentorNames[targetMentor]}...`);
      navigate(`/chat/${targetMentor}`, { state: { handoffId: handoff.id } });
    } catch (error: any) {
      console.error("Error creating handoff:", error);
      toast.error("Failed to handoff conversation");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    try {
      // Use session-first auth check with retry capability
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Your session has expired. Please sign in again.");
        navigate("/");
        return;
      }
      const user = session.user;

      const { data: userMsgData } = await supabase.from("chats").insert({
        user_id: user.id,
        mentor_type: mentorType as any,
        role: "user",
        content: userMessage,
      }).select().single();
      
      if (userMsgData) setMessages((prev) => [...prev, userMsgData]);

      // Invoke chat-mentor with retry on auth failure
      let data, error;
      ({ data, error } = await supabase.functions.invoke("chat-mentor", {
        body: { mentorType, message: userMessage },
      }));

      // If auth error, try refreshing session and retry once
      if (error?.message?.includes("Not authenticated") || error?.message?.includes("401")) {
        console.log("Auth error, attempting session refresh...");
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          toast.error("Your session has expired. Please sign in again.");
          navigate("/");
          return;
        }
        // Retry the request
        ({ data, error } = await supabase.functions.invoke("chat-mentor", {
          body: { mentorType, message: userMessage },
        }));
      }

      if (error) throw error;

      const { data: assistantMsgData } = await supabase.from("chats").insert({
        user_id: user.id,
        mentor_type: mentorType as any,
        role: "assistant",
        content: data.response,
      }).select().single();

      if (assistantMsgData) setMessages((prev) => [...prev, assistantMsgData]);

      // Handle Value Map detection
      if (data.valueMapDetection) setValueMapDetection(data.valueMapDetection);

      // Handle suggested handoff
      if (data.suggestedHandoff?.shouldSuggest) setSuggestedHandoff(data.suggestedHandoff);

      // Handle pattern detection (Inner Clarity Mentor)
      if (data.patternDetection) {
        console.log('[Chat] Pattern detection received:', data.patternDetection?.patternName);
        setPatternDetection(data.patternDetection);
        setShowPatternCard(true);
      }

      // Handle transmutation phase completion - navigate back to originating page
      if (data.transmutationPhaseComplete) {
        console.log('[Chat] Transmutation phase complete:', data.transmutationPhaseComplete);
        const locState = propState || location.state;
        const txContext = locState?.transmutationContext;
        const patternId = txContext?.patternId;

        // Auto-populate lifetime event when gold phase completes
        if (data.transmutationPhaseComplete.phase === 'gold' && patternId) {
          try {
            // Get pattern data to create lifetime event
            const { data: patternData } = await supabase
              .from("inner_patterns")
              .select("pattern_name, pattern_type, trigger_context, life_events, transmutation_data")
              .eq("id", patternId)
              .single();

            if (patternData) {
              const lifeEvents = patternData.life_events as any;
              const txData = patternData.transmutation_data as any;
              const eventLabel = patternData.trigger_context || patternData.pattern_name || "Transmuted experience";
              const goldOutcome = data.transmutationPhaseComplete.gold_insight || txData?.gold_insight || "";
              
              // Check if a lifetime event already exists for this pattern
              const { data: existingEvent } = await supabase
                .from("lifetime_events")
                .select("id")
                .eq("user_id", user.id)
                .eq("pattern_id", patternId)
                .maybeSingle();

              if (!existingEvent) {
                // Determine time period from life_events data or default to current
                const timePeriod = lifeEvents?.timePeriod || lifeEvents?.age_category || 'current';
                const validPeriods = ['childhood', 'teen', 'early_20s', 'mid_20s', 'late_20s', '30s', 'current'];
                const safePeriod = validPeriods.includes(timePeriod) ? timePeriod : 'current';

                await supabase.from("lifetime_events").insert({
                  user_id: user.id,
                  time_period: safePeriod,
                  event_label: eventLabel,
                  event_description: `${patternData.pattern_name}: ${goldOutcome}`.substring(0, 500),
                  event_type: 'identity',
                  pattern_id: patternId,
                  pattern_name: patternData.pattern_name,
                  gold_outcome: goldOutcome,
                  is_transmuted: true,
                });
                console.log('[Chat] Auto-created lifetime event for transmuted pattern:', patternId);
              }
            }
          } catch (err) {
            console.error('[Chat] Failed to auto-create lifetime event:', err);
          }
        }

        const returnPath = patternId 
          ? `/pattern-map/${patternId}`
          : '/creation-lab?type=becoming&bmode=transmutation';
        navigate(returnPath, {
          state: {
            transmutationComplete: data.transmutationPhaseComplete
          }
        });
      }

      // PDR v2.1: Handle project coherence detection (Commitment Card trigger)
      if (data.projectCoherence?.isCoherent) {
        setProjectCoherence(data.projectCoherence);
        setShowCommitmentCard(true);
      }

      // Save extracted keywords to database
      if (data.extractedKeywords && data.extractedKeywords.length > 0) {
        try {
          for (const keyword of data.extractedKeywords) {
            // Check if keyword already exists
            const { data: existing } = await supabase
              .from("user_keywords")
              .select("id, frequency_count")
              .eq("user_id", user.id)
              .eq("keyword", keyword.toLowerCase())
              .maybeSingle();

            if (existing) {
              // Update frequency count
              await supabase
                .from("user_keywords")
                .update({ 
                  frequency_count: (existing.frequency_count || 1) + 1,
                  last_seen_at: new Date().toISOString()
                })
                .eq("id", existing.id);
            } else {
              // Insert new keyword
              await supabase.from("user_keywords").insert({
                user_id: user.id,
                keyword: keyword.toLowerCase(),
                keyword_type: "concept",
                source: "mentor_chat",
                source_id: assistantMsgData?.id || null,
                context: userMessage.substring(0, 200),
              });
            }
          }
        } catch (kwError) {
          console.error("Error saving keywords (non-fatal):", kwError);
        }
      }

      const newExchangeCount = exchangeCount + 1;
      setExchangeCount(newExchangeCount);
      
      // Check for breakthrough with proper timing (adaptive detection)
      // Skip if we already detected coherence (PDR v2.1 takes precedence)
      if (mentorType && isFirstSession && newExchangeCount >= 6 && !data.projectCoherence?.isCoherent) {
        const allMessages = [...messages, { role: "user", content: userMessage }, { role: "assistant", content: data.response }];
        const breakthrough = await checkForBreakthrough(
          allMessages.map(m => ({ role: m.role, content: m.content })),
          mentorType,
          false,
          'mentor'
        );
        
        if (breakthrough) {
          setShowFirstWinNaming(true);
        }
      }

      // Detect quest progress for Future Self conversations (identity discovery)
      if (mentorType === 'future_self' && newExchangeCount % 5 === 0) {
        const recentMessages = [...messages.slice(-10), { role: "user", content: userMessage }, { role: "assistant", content: data.response }];
        supabase.functions.invoke('detect-quest-progress', {
          body: {
            messages: recentMessages.map(m => ({ role: m.role, content: m.content })),
            questType: questType || null
          }
        }).catch(err => console.error("Quest detection error (non-fatal):", err));
      }
    } catch (error: any) {
      toast.error(error.message);
      await loadMessages();
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptFirstWin = async (conceptName: string) => {
    setFirstWinConceptName(conceptName);
    setShowFirstWinNaming(false);
    await completeFirstWin();
    triggerMicroWin('naming');
    setShowFirstWinCelebration(true);
  };

  // Pattern acceptance handler (Inner Work Lab)
  const handlePatternAccept = async (patternName: string) => {
    if (!patternDetection) return;
    
    try {
      // Map the extracted data to life_events format for Pattern Map nodes
      const lifeEventsData = {
        trigger_event: patternDetection.triggerEvent || '',
        old_story: patternDetection.oldStory || '',
        mental_loop: patternDetection.mentalLoop || '',
        cost: patternDetection.cost || '',
        protective_role: patternDetection.protectiveRole || '',
        life_event: patternDetection.lifeEvent || '',
        life_event_age_category: patternDetection.lifeEventAgeCategory || '',
      };
      
      // Map to transmutation_data for Black Phase (shadow is the old story or trigger)
      const transmutationData = {
        shadow: patternDetection.oldStory || patternDetection.triggerEvent || '',
      };
      
      const pattern = await createPattern({
        pattern_name: patternName,
        pattern_type: patternDetection.patternType || 'life_event',
        pattern_description: patternDetection.lifeEvent || '',
        trigger_context: patternDetection.triggerEvent || '',
        primary_emotion: patternDetection.primaryEmotion || '',
        related_emotions: patternDetection.relatedEmotions || [],
        body_sensation: patternDetection.bodySensation || '',
        source_mentor: mentorType || 'inner_clarity_mentor',
        life_events: lifeEventsData,
        transmutation_data: transmutationData,
      });
      
      if (pattern) {
        setCreatedPatternId(pattern.id);
        setShowPatternCard(false);
        setShowPatternCelebration(true);
      }
    } catch (error) {
      console.error("Failed to create pattern:", error);
      toast.error("Failed to save pattern");
    }
  };

  const handlePatternCelebrationContinue = () => {
    setShowPatternCelebration(false);
    if (createdPatternId) {
      navigate(`/pattern-map/${createdPatternId}`);
    }
  };

  // PDR v2.2: Handle Commitment Card acceptance (First Win moment) with branch support
  const handleCommitmentAccept = async (projectName: string) => {
    setShowCommitmentCard(false);
    
    const coherenceType = projectCoherence?.coherenceType || 'NEW_CORE_PROJECT';
    
    if (coherenceType === 'BRANCH_ADDITION' && projectCoherence?.spineId) {
      // Add as a branch instead of creating new project
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");
        
        await supabase.from("project_branches").insert({
          user_id: user.id,
          spine_id: projectCoherence.spineId,
          branch_title: projectName,
          branch_description: projectCoherence.projectDescription || '',
          branch_type: 'tactic',
          status: 'active'
        });
        
        triggerMicroWin('naming');
        toast.success(`"${projectName}" added to your project!`);
      } catch (error) {
        console.error("Error adding branch:", error);
        toast.error("Failed to add branch");
      }
    } else {
      // Original flow for new project or evolution
      await completeFirstWin();
      triggerMicroWin('naming');
      
      // Navigate to Creation Lab with project info
      navigate('/creation-lab', {
        state: {
          projectName,
          projectDescription: projectCoherence?.projectDescription || '',
          isEvolution: coherenceType === 'CORE_EVOLUTION'
        }
      });
    }
  };

  const handleStartLearningModule = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-learning-module", {
        body: { chatHistory: messages, mentorType },
      });
      if (error) throw error;
      setLearningModuleData(data.module);
      setShowLearningModule(true);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Use user's selected mentors, fallback to some defaults
  const availableHandoffs = userMentors.length > 0 ? userMentors : [];

  return (
    <div className={cn(
      "bg-gradient-to-br from-primary/5 via-background to-accent/5 flex flex-col",
      embedded ? "h-full" : "min-h-screen pb-24"
    )}>
      {/* Header - hide when embedded (Council provides header) */}
      {!embedded && (
        <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto p-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{mentorNames[mentorType || ""]}</h1>
              <p className="text-sm text-muted-foreground">
                {fromCouncil ? "Shaping session" : "Your personal mentor"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {availableHandoffs.length > 0 && messages.length >= 2 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled={loading} className="gap-2">
                      <RefreshCw className="w-4 h-4" />
                      <span className="hidden sm:inline">Switch Mentor</span>
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-popover z-50">
                    <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">
                      Switch to another mentor
                    </div>
                    {availableHandoffs.map((mentor) => (
                      <DropdownMenuItem key={mentor} onClick={() => handleHandoff(mentor)} className="cursor-pointer">
                        <div className="flex flex-col">
                          <span className="font-medium">{mentorNames[mentor]}</span>
                          <span className="text-xs text-muted-foreground">Continue your conversation</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              {exchangeCount >= 3 && (
                <Button variant="outline" size="sm" onClick={handleStartLearningModule} disabled={loading} className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Take Quiz</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Proactive Mentor Transition Suggestion */}
          {suggestedHandoff && (
            <MentorTransitionCard
              currentMentor={mentorType || ""}
              suggestedMentor={suggestedHandoff.targetMentor}
              suggestedMentorName={mentorNames[suggestedHandoff.targetMentor]}
              reason={suggestedHandoff.reason}
              onAccept={() => handleHandoff(suggestedHandoff.targetMentor)}
              onDismiss={() => setSuggestedHandoff(null)}
            />
          )}

          {/* Breakthrough Detection Card */}
          {latestBreakthrough && !showFirstWinNaming && (
            <BreakthroughDetectedCard
              breakthrough={latestBreakthrough}
              onDismiss={dismissBreakthrough}
              onConvertToGoal={clearBreakthrough}
            />
          )}

          {/* Messages continue below - Commitment Card is now a fixed overlay */}

          {/* First Win Naming Card (legacy - for breakthrough detection) */}
          {showFirstWinNaming && latestBreakthrough && !showCommitmentCard && (
            <FirstWinNamingCard
              proposedName={latestBreakthrough.breakthrough_title}
              description={latestBreakthrough.breakthrough_description}
              onAccept={handleAcceptFirstWin}
              onKeepExploring={() => {
                setShowFirstWinNaming(false);
                dismissBreakthrough();
              }}
            />
          )}

          {/* Welcome Back - Conversation Memory Card */}
          {showWelcomeBack && conversationSummary && (
            <Card className="p-4 bg-gradient-to-br from-accent/20 to-primary/10 border-accent/30">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-accent-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm mb-1">Welcome back! I remember you.</p>
                  <p className="text-xs text-muted-foreground mb-2">{conversationSummary}</p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowWelcomeBack(false)}
                      className="text-xs"
                    >
                      Continue where we left off
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Whispers */}
          {whispers.length > 0 && (
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MessageCircle className="w-3 h-3" />
                <span>Recent Private Whispers</span>
              </div>
              {whispers.slice(0, 2).map((whisper) => (
                <Card key={whisper.id} className="p-3 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground mb-1">
                          {whisper.whisper_type ? `${whisper.whisper_type} whisper` : 'whisper'}
                        </p>
                        <InsightActionButton insightText={whisper.message} sourceType="mentor_whisper" sourceMentor={whisper.mentor_type} sourceContext={{ whisperId: whisper.id }} />
                      </div>
                      <p className="text-sm italic">{whisper.message}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
              <Card className={cn("max-w-[80%] p-4", message.role === "user" ? "bg-primary text-primary-foreground" : "bg-card")}>
                {message.role === "user" ? (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <KeywordHighlighter sourceType="mentor_chat" sourceId={message.id}>
                    <div className="space-y-2">
                      <HighlightedText text={message.content} />
                      <div className="flex justify-end pt-1">
                        <InsightActionButton insightText={message.content} sourceType="mentor_message" sourceMentor={mentorType} sourceContext={{ messageId: message.id }} />
                      </div>
                    </div>
                  </KeywordHighlighter>
                )}
              </Card>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <Card className="max-w-[80%] p-4 bg-card">
                <p className="text-muted-foreground italic">Thinking...</p>
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-card/80 backdrop-blur-sm sticky bottom-0">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex gap-2">
            <Input placeholder="Ask your mentor..." value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === "Enter" && handleSend()} disabled={loading} />
            <Button onClick={handleSend} disabled={loading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Learning Module Modal */}
      {showLearningModule && learningModuleData && (
        <MentorLearningModule mentorType={mentorType || ""} mentorName={mentorNames[mentorType || ""]} moduleData={learningModuleData} onComplete={() => { setShowLearningModule(false); setLearningModuleData(null); }} onClose={() => { setShowLearningModule(false); setLearningModuleData(null); }} />
      )}

      {/* Value Map Unlock Celebration */}
      {valueMapDetection && (
        <ValueMapUnlockCelebration
          detection={valueMapDetection}
          onAccept={async (blockKey, content) => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) throw new Error("Not authenticated");
              await supabase.from("value_map_blocks").upsert({ user_id: user.id, block_key: blockKey, content, is_unlocked: true, unlocked_at: new Date().toISOString(), unlock_source: "mentor_chat" }, { onConflict: "user_id,block_key" });
              await supabase.from("future_self_messages").insert({ user_id: user.id, message: `You just unlocked "${valueMapDetection.blockTitle}" in your Value Map. This clarity is building something real.`, trigger_reason: "value_map_unlock" });
              setValueMapDetection(null);
            } catch (error) {
              console.error("Error saving value map block:", error);
              throw error;
            }
          }}
          onDismiss={() => setValueMapDetection(null)}
        />
      )}

      {/* First Win Celebration */}
      {showFirstWinCelebration && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <FirstWinCelebration conceptName={firstWinConceptName} onContinue={() => setShowFirstWinCelebration(false)} />
        </div>
      )}

      {/* Pattern Discovery Card (Inner Work Lab) */}
      {showPatternCard && patternDetection && (
        <PatternDiscoveryCard
          proposedName={patternDetection.patternName || "Unnamed Pattern"}
          patternType={patternDetection.patternType || "life_event"}
          triggerContext={patternDetection.triggerEvent || ""}
          primaryEmotion={patternDetection.primaryEmotion || ""}
          summary={patternDetection.lifeEvent || ""}
          reframe={patternDetection.protectiveRole || ""}
          onAccept={handlePatternAccept}
          onKeepExploring={() => {
            setShowPatternCard(false);
            setPatternDetection(null);
          }}
        />
      )}

      {/* Pattern Celebration (Inner Work Lab) */}
      {showPatternCelebration && createdPatternId && (
        <PatternCelebration
          patternName={patternDetection?.patternName || "Your Pattern"}
          onContinue={handlePatternCelebrationContinue}
        />
      )}

      {/* PDR v2.2: Commitment Card as FIXED OVERLAY with context-aware copy */}
      {showCommitmentCard && projectCoherence && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto py-8 px-4 pb-28">
          <FirstWinNamingCard
            proposedName={projectCoherence.projectName}
            description={projectCoherence.projectDescription}
            onAccept={handleCommitmentAccept}
            onKeepExploring={() => {
              setShowCommitmentCard(false);
              setProjectCoherence(null);
            }}
            coherenceType={projectCoherence.coherenceType || 'NEW_CORE_PROJECT'}
            coreTheme={projectCoherence.coreTheme}
            isEvolution={projectCoherence.isEvolution}
            previousNodeTitle={projectCoherence.previousNodeTitle}
            evolutionInsight={projectCoherence.evolutionInsight}
          />
        </div>
      )}
    </div>
  );
};

export default Chat;
