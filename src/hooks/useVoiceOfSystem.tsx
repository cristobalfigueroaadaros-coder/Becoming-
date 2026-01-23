import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface VoiceGuidance {
  blockerType: string;
  blockerMessage: string;
  targetType: 'mentor' | 'phase' | 'task' | 'becoming';
  targetId: string;
  actionExplanation: string;
  ctaLabel: string;
  handoffContext: string;
  userInput: string;
}

export const useVoiceOfSystem = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [guidance, setGuidance] = useState<VoiceGuidance | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeAndGuide = async (userInput: string): Promise<VoiceGuidance | null> => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke("voice-of-system", {
        body: { userInput }
      });
      
      if (fnError) throw fnError;
      
      if (!data.success) {
        throw new Error(data.error || "Failed to analyze your situation");
      }
      
      const guidanceData: VoiceGuidance = {
        blockerType: data.blockerType,
        blockerMessage: data.blockerMessage,
        targetType: data.targetType,
        targetId: data.targetId,
        actionExplanation: data.actionExplanation,
        ctaLabel: data.ctaLabel,
        handoffContext: data.handoffContext,
        userInput,
      };
      
      setGuidance(guidanceData);
      return guidanceData;
    } catch (err: any) {
      console.error("Voice of System error:", err);
      setError(err.message || "Something went wrong");
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const executeHandoff = async (guidanceData: VoiceGuidance): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to continue");
        navigate("/auth");
        return;
      }

      if (guidanceData.targetType === 'mentor') {
        // Create handoff record with voice context
        const { data: handoff, error: handoffError } = await supabase
          .from('conversation_handoffs')
          .insert({
            user_id: user.id,
            source_mentor_type: 'voice_system',
            target_mentor_type: guidanceData.targetId,
            source_messages: [],
            voice_context: {
              blockerType: guidanceData.blockerType,
              userInput: guidanceData.userInput,
              handoffContext: guidanceData.handoffContext,
              blockerMessage: guidanceData.blockerMessage,
            },
            initiated_by: 'voice_system',
          })
          .select()
          .single();

        if (handoffError) throw handoffError;

        toast.success(`Connecting you with the right mentor...`);
        navigate(`/chat/${guidanceData.targetId}`, { 
          state: { voiceHandoffId: handoff.id, voiceContext: guidanceData.handoffContext } 
        });
      } else if (guidanceData.targetType === 'phase') {
        // Navigate to Creation Lab with target phase
        navigate('/creation-lab', {
          state: { targetPhase: guidanceData.targetId, voiceContext: guidanceData.handoffContext }
        });
      } else if (guidanceData.targetType === 'becoming') {
        // Navigate to becoming section
        navigate('/becoming', {
          state: { voiceContext: guidanceData.handoffContext }
        });
      } else {
        // Default: navigate to creation lab
        navigate('/creation-lab');
      }
    } catch (err: any) {
      console.error("Handoff execution error:", err);
      toast.error("Failed to connect you. Please try again.");
    }
  };

  const reset = () => {
    setGuidance(null);
    setError(null);
    setIsProcessing(false);
  };

  return { 
    analyzeAndGuide, 
    executeHandoff, 
    isProcessing, 
    guidance, 
    error,
    reset 
  };
};
