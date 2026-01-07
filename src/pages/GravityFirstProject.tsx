import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Mic, Square, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const GravityFirstProject = () => {
  const navigate = useNavigate();
  const [projectIdea, setProjectIdea] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload to storage
      const fileName = `${user.id}/project-idea-${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from('voice-notes')
        .upload(fileName, audioBlob);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('voice-notes')
        .getPublicUrl(fileName);

      // Transcribe
      const { data: transcription, error: transcribeError } = await supabase.functions.invoke('transcribe-audio', {
        body: { audioUrl: urlData.publicUrl }
      });

      if (transcribeError) throw transcribeError;

      if (transcription?.text) {
        setProjectIdea(prev => prev ? `${prev} ${transcription.text}` : transcription.text);
        toast.success("Voice transcribed!");
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      toast.error("Failed to process voice recording");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartBuilding = async () => {
    if (!projectIdea.trim()) {
      toast.error("Please share your idea first");
      return;
    }

    // Navigate to Council Meeting with the project idea pre-filled
    // The Council will interact with the user, narrow down the idea, and eventually create the project
    navigate('/council', { 
      state: { 
        prefilledQuestion: projectIdea,
        isFirstProjectFlow: true,
        openerType: 'gravity_first_project'
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-2xl w-full text-center space-y-8"
      >
        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-light text-foreground">
            We hear you.
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Is there an idea, a project, an experiment, or something unfinished
            that you'd like to bring to life?
          </p>
        </div>

        {/* Voice + Text Input */}
        <div className="space-y-4">
          {/* Voice Button */}
          <div className="flex justify-center">
            {isRecording ? (
              <Button
                onClick={stopRecording}
                size="lg"
                variant="destructive"
                className="rounded-full w-20 h-20 animate-pulse"
              >
                <Square className="h-8 w-8" />
              </Button>
            ) : isProcessing ? (
              <Button
                disabled
                size="lg"
                variant="outline"
                className="rounded-full w-20 h-20"
              >
                <Loader2 className="h-8 w-8 animate-spin" />
              </Button>
            ) : (
              <Button
                onClick={startRecording}
                size="lg"
                variant="outline"
                className="rounded-full w-20 h-20 border-2 hover:bg-primary/10 hover:border-primary transition-all"
              >
                <Mic className="h-8 w-8" />
              </Button>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground">
            {isRecording ? "Recording... tap to stop" : isProcessing ? "Transcribing..." : "Tap to speak your idea"}
          </p>

          {/* Or divider */}
          <div className="flex items-center gap-4 my-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-sm text-muted-foreground">or type below</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Text Input */}
          <Textarea
            value={projectIdea}
            onChange={(e) => setProjectIdea(e.target.value)}
            placeholder="Share your idea, project, or experiment..."
            className="min-h-[120px] text-base resize-none"
          />
        </div>

        {/* Continue Button */}
        <Button
          onClick={handleStartBuilding}
          disabled={!projectIdea.trim()}
          size="lg"
          className="gap-2"
        >
          Talk to the Council
          <ArrowRight className="h-4 w-4" />
        </Button>

        <p className="text-xs text-muted-foreground">
          The Council will help you clarify and shape this into something real.
        </p>
      </motion.div>
    </div>
  );
};

export default GravityFirstProject;
