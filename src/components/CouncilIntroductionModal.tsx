import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Square, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface CouncilIntroductionModalProps {
  open: boolean;
  onComplete: () => void;
}

export const CouncilIntroductionModal = ({ open, onComplete }: CouncilIntroductionModalProps) => {
  const [story, setStory] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  const wordCount = story.trim().split(/\s+/).filter(Boolean).length;
  const minWords = 50;
  const canSubmit = wordCount >= minWords;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      setIsRecording(true);
      toast.success("Recording... Speak your story to the Council");
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload to storage
      const fileName = `foundation-story-${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from('voice-notes')
        .upload(`${user.id}/${fileName}`, audioBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('voice-notes')
        .getPublicUrl(`${user.id}/${fileName}`);
      
      setAudioUrl(publicUrl);

      // Transcribe
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        if (!base64Audio) throw new Error("Failed to process audio");

        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { audio: base64Audio }
        });

        if (error) throw error;
        if (data?.text) {
          setStory(prev => prev ? `${prev}\n\n${data.text}` : data.text);
          toast.success("Voice transcribed - review and add more if you like");
        }
      };
    } catch (error: any) {
      console.error("Error processing audio:", error);
      toast.error(error.message || "Failed to transcribe");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.error(`Please share at least ${minWords} words with the Council`);
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-user-foundation', {
        body: { 
          story,
          audioUrl
        }
      });

      if (error) throw error;

      toast.success("The Council has received your story. Your journey begins.");
      onComplete();
    } catch (error: any) {
      console.error("Error submitting foundation:", error);
      toast.error(error.message || "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-accent" />
            Council Introduction
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Ceremonial Introduction */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg bg-gradient-to-br from-accent/10 to-primary/10 border border-accent/20"
          >
            <p className="text-sm leading-relaxed text-foreground/90 italic">
              "Before we can guide you, we must know you. Speak to us... tell us who you are, 
              where you've been, what weighs on you, and what you dream of becoming. 
              Share your story, your struggles, your aspirations. We will listen."
            </p>
          </motion.div>

          {/* Voice Recording - Primary Action */}
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-sm text-muted-foreground">Speak freely. We will listen.</p>
            
            {!isRecording ? (
              <Button
                size="lg"
                onClick={startRecording}
                disabled={isProcessing || isSubmitting}
                className="gap-3 px-8 py-6 text-lg bg-gradient-to-r from-accent to-primary hover:opacity-90"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Transcribing...
                  </>
                ) : (
                  <>
                    <Mic className="w-6 h-6" />
                    Speak to the Council
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="lg"
                variant="destructive"
                onClick={stopRecording}
                className="gap-3 px-8 py-6 text-lg animate-pulse"
              >
                <Square className="w-6 h-6" />
                Stop Recording
              </Button>
            )}

            {audioUrl && (
              <p className="text-xs text-muted-foreground">
                ✓ Voice note saved
              </p>
            )}
          </div>

          {/* Text Area for Story */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Or type your introduction:</p>
              <span className={`text-xs ${canSubmit ? 'text-accent' : 'text-muted-foreground'}`}>
                {wordCount} / {minWords} words minimum
              </span>
            </div>
            <Textarea
              placeholder="Tell the Council about yourself... Who are you? What's your background? What challenges are you facing? What do you hope to achieve?"
              value={story}
              onChange={(e) => setStory(e.target.value)}
              rows={8}
              className="resize-none"
              disabled={isRecording || isProcessing || isSubmitting}
            />
          </div>

          {/* Guidance Prompts */}
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="p-2 rounded bg-muted/30">
              <strong>Who you are:</strong> Your identity, values, background
            </div>
            <div className="p-2 rounded bg-muted/30">
              <strong>Your story:</strong> Where you've been, key experiences
            </div>
            <div className="p-2 rounded bg-muted/30">
              <strong>Your struggles:</strong> What holds you back, fears, patterns
            </div>
            <div className="p-2 rounded bg-muted/30">
              <strong>Your dreams:</strong> What you want to achieve, become
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isRecording || isProcessing || isSubmitting}
            className="w-full py-6 text-lg"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                The Council is receiving your story...
              </>
            ) : (
              "Begin My Journey with the Council"
            )}
          </Button>

          {!canSubmit && (
            <p className="text-xs text-center text-muted-foreground">
              Share at least {minWords} words to help the Council understand you better
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};