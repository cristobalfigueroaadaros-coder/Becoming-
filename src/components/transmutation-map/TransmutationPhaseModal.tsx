import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Flame, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import type { TransmutationData } from "@/hooks/useInnerPatterns";

interface TransmutationPhaseModalProps {
  open: boolean;
  onClose: () => void;
  phase: 'white' | 'gold';
  patternName: string;
  patternContext: string; // Shadow from Black phase
  existingData: TransmutationData;
  onPhaseComplete: (extractedData: Partial<TransmutationData>) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const TransmutationPhaseModal = ({
  open,
  onClose,
  phase,
  patternName,
  patternContext,
  existingData,
  onPhaseComplete,
}: TransmutationPhaseModalProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPhaseReady, setIsPhaseReady] = useState(false);
  const [extractedData, setExtractedData] = useState<Partial<TransmutationData>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const mentorType = phase === 'white' ? 'phoenix_mentor' : 'stoic_mentor';
  const mentorName = phase === 'white' ? 'Phoenix' : 'Stoic';
  const mentorIcon = phase === 'white' ? Flame : Shield;
  const MentorIcon = mentorIcon;

  // Send initial mentor message when modal opens
  useEffect(() => {
    if (open && messages.length === 0) {
      sendInitialMessage();
    }
  }, [open]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendInitialMessage = async () => {
    setIsLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const context = phase === 'white' 
        ? `You are now guiding the user through the WHITE PHASE of transmutation for their pattern "${patternName}".

The shadow/pain they've named: "${patternContext || patternName}"

WHITE PHASE TRANSMUTATION MODE:
1. You are guiding them through Shift → Rebirth
2. The Black phase (shadow/pain) has already been captured
3. Your job: Extract Shift Moment, Protective Purpose, and Lesson Learned

Start with acknowledgment and lead them gently through perspective shift.

Your opening: "You've named what hurt. That takes courage. Now let's find what this experience gave you. Looking back now, what shifted? Was there a moment, a conversation, a realization that changed how you saw this?"

During the conversation, naturally explore:
- Shift moment (perspective change, turning point)
- Protective purpose (what this pattern was trying to protect)
- Lesson learned (what they now understand)

When you detect 2+ of these are clearly expressed, propose completion with marker [WHITE_PHASE_READY] and include extracted data in this JSON format at the end:
{"shift_moment": "...", "protective_purpose": "...", "lesson_learned": "..."}`
        : `You are now guiding the user through the GOLD PHASE of transmutation for their pattern "${patternName}".

The shift and lesson from White phase:
- Shift: "${existingData.shift_moment || 'Not captured'}"
- Lesson: "${existingData.lesson_learned || 'Not captured'}"

GOLD PHASE TRANSMUTATION MODE:
1. You are guiding them through Integration → Power
2. White phase (shift, lesson) has been captured
3. Your job: Extract Gain, New Belief, and Strength/Creation

Start grounded and lead them to name their gains clearly.

Your opening: "The shift happened. The lesson is clear. Now let's turn this into something you carry forward. What did you actually gain from going through this? What's different about you now?"

During the conversation, naturally explore:
- What did you gain from this experience?
- What new belief did you choose?
- What strength did you discover, or what did you create because of this?

When you detect clarity on at least 2 of these, propose completion with marker [GOLD_PHASE_READY] and include extracted data in this JSON format at the end:
{"gold_insight": "...", "letter_to_self": "...", "brave_step": "..."}`;

      const response = await supabase.functions.invoke('chat-mentor', {
        body: {
          mentor_type: mentorType,
          message: "BEGIN_TRANSMUTATION_PHASE",
          context: {
            transmutationPhase: phase,
            patternName,
            patternContext,
            existingData,
            specialContext: context,
          },
          history: [],
        },
      });

      if (response.data?.response) {
        const cleanResponse = cleanExtractedData(response.data.response);
        setMessages([{ role: 'assistant', content: cleanResponse }]);
      }
    } catch (error) {
      console.error("Error sending initial message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const cleanExtractedData = (text: string): string => {
    // Remove JSON extraction blocks from display
    return text.replace(/\{[\s\S]*?"(shift_moment|gold_insight)"[\s\S]*?\}/g, '').trim();
  };

  const parseExtractedData = (text: string): Partial<TransmutationData> | null => {
    const jsonMatch = text.match(/\{[\s\S]*?"(shift_moment|gold_insight)"[\s\S]*?\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        return null;
      }
    }
    return null;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const phaseContext = phase === 'white'
        ? `Continue WHITE PHASE transmutation for "${patternName}". Look for shift moment, protective purpose, lesson learned. When 2+ are present, include [WHITE_PHASE_READY] and JSON extraction.`
        : `Continue GOLD PHASE transmutation for "${patternName}". Look for gain, new belief, strength/creation. When 2+ are present, include [GOLD_PHASE_READY] and JSON extraction.`;

      const response = await supabase.functions.invoke('chat-mentor', {
        body: {
          mentor_type: mentorType,
          message: userMessage,
          context: {
            transmutationPhase: phase,
            patternName,
            patternContext,
            existingData,
            specialContext: phaseContext,
          },
          history: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        },
      });

      if (response.data?.response) {
        const fullResponse = response.data.response;
        
        // Check for phase ready markers
        const whiteReady = fullResponse.includes('[WHITE_PHASE_READY]');
        const goldReady = fullResponse.includes('[GOLD_PHASE_READY]');
        
        if (whiteReady || goldReady) {
          setIsPhaseReady(true);
          const extracted = parseExtractedData(fullResponse);
          if (extracted) {
            setExtractedData(extracted);
          }
        }

        const cleanResponse = cleanExtractedData(
          fullResponse.replace('[WHITE_PHASE_READY]', '').replace('[GOLD_PHASE_READY]', '')
        );
        setMessages(prev => [...prev, { role: 'assistant', content: cleanResponse }]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPhase = () => {
    onPhaseComplete(extractedData);
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={`w-full max-w-lg max-h-[80vh] rounded-xl border shadow-2xl flex flex-col ${
            phase === 'white' 
              ? 'bg-gradient-to-br from-slate-50/95 to-white border-slate-300'
              : 'bg-gradient-to-br from-amber-50/95 to-white border-amber-300'
          }`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b ${
            phase === 'white' ? 'border-slate-200' : 'border-amber-200'
          }`}>
            <div className="flex items-center gap-3">
              <Avatar className={`w-10 h-10 ${
                phase === 'white' ? 'bg-slate-200' : 'bg-amber-200'
              }`}>
                <AvatarFallback>
                  <MentorIcon className={`w-5 h-5 ${
                    phase === 'white' ? 'text-slate-600' : 'text-amber-600'
                  }`} />
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-slate-900">
                  {phase === 'white' ? 'White Phase' : 'Gold Phase'} with {mentorName}
                </h3>
                <p className="text-xs text-slate-500">{patternName}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : phase === 'white'
                        ? 'bg-slate-100 text-slate-900'
                        : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className={`rounded-lg px-4 py-2 ${
                  phase === 'white' ? 'bg-slate-100' : 'bg-amber-100'
                }`}>
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Phase Ready Confirmation */}
          {isPhaseReady && (
            <div className={`p-4 border-t ${
              phase === 'white' ? 'bg-slate-50 border-slate-200' : 'bg-amber-50 border-amber-200'
            }`}>
              <Button
                onClick={handleConfirmPhase}
                className={`w-full ${
                  phase === 'white'
                    ? 'bg-slate-600 hover:bg-slate-700'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500'
                }`}
              >
                {phase === 'white' ? 'Confirm White Transmutation' : 'Finalize Gold Transmutation'}
              </Button>
            </div>
          )}

          {/* Input */}
          {!isPhaseReady && (
            <div className={`p-4 border-t ${
              phase === 'white' ? 'border-slate-200' : 'border-amber-200'
            }`}>
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="min-h-[60px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className={phase === 'white' ? 'bg-slate-600' : 'bg-amber-500'}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
