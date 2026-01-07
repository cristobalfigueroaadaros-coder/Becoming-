import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Mic, Square, Loader2, User, BookOpen, Heart, Sparkles } from "lucide-react";

const GravityCouncilIntro = () => {
  const navigate = useNavigate();
  const [story, setStory] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      toast.success("Recording started - speak your story");
    } catch (error) {
      console.error("Error starting recording:", error);
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

      // Upload audio to storage
      const fileName = `council-intro-${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from('voice-notes')
        .upload(`${user.id}/${fileName}`, audioBlob);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('voice-notes')
        .getPublicUrl(`${user.id}/${fileName}`);

      setAudioUrl(publicUrl);

      // Convert blob to base64 for transcription
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        if (!base64Audio) {
          throw new Error("Failed to process audio");
        }

        // Call transcription edge function
        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { audio: base64Audio }
        });

        if (error) throw error;

        if (data?.text) {
          setStory(prev => prev ? `${prev}\n\n${data.text}` : data.text);
          toast.success("Voice transcribed successfully");
        } else {
          throw new Error("No transcription received");
        }
        setIsProcessing(false);
      };
    } catch (error: any) {
      console.error("Error processing audio:", error);
      toast.error(error.message || "Failed to transcribe audio");
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (!story.trim()) {
      toast.error("Please share your story with us");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to continue");
        navigate('/');
        return;
      }

      // Process the user foundation story
      const { error } = await supabase.functions.invoke('process-user-foundation', {
        body: { 
          story: story,
          audioUrl: audioUrl
        }
      });

      if (error) {
        console.error('Error processing foundation:', error);
        toast.error("Failed to process your story. Please try again.");
        setIsSubmitting(false);
        return;
      }

      toast.success("The Council has heard you");
      navigate('/gravity/council-welcome');
    } catch (error) {
      console.error('Error in council intro:', error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const guidancePrompts = [
    { icon: User, label: "Who you are", description: "Your identity, values, background" },
    { icon: BookOpen, label: "Your story", description: "Where you've been, key experiences" },
    { icon: Heart, label: "Your struggles", description: "What holds you back, fears, patterns" },
    { icon: Sparkles, label: "Your dreams", description: "What you want to achieve, become" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-2xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6 text-center"
        >
          <p className="text-lg text-muted-foreground">Before we can guide you, we must know you.</p>
          
          <div className="space-y-4">
            <p className="text-xl text-foreground/90 leading-relaxed">
              Speak to us... tell us who you are, where you've been, what weighs on you, and what you dream of becoming.
            </p>
            <p className="text-lg text-muted-foreground italic">
              Share your story. We will listen.
            </p>
          </div>
        </motion.div>

        {/* Guidance Prompts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="grid grid-cols-2 gap-3"
        >
          {guidancePrompts.map((prompt, index) => (
            <div 
              key={index}
              className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-1"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <prompt.icon className="w-4 h-4 text-primary" />
                {prompt.label}
              </div>
              <p className="text-xs text-muted-foreground">{prompt.description}</p>
            </div>
          ))}
        </motion.div>

        {/* Voice Recording Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="flex flex-col items-center gap-4"
        >
          {!isRecording ? (
            <Button
              size="lg"
              onClick={startRecording}
              disabled={isProcessing}
              className="gap-3 text-lg py-6 px-8"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Transcribing...
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  Speak to the Council
                </>
              )}
            </Button>
          ) : (
            <Button
              size="lg"
              variant="destructive"
              onClick={stopRecording}
              className="gap-3 text-lg py-6 px-8 animate-pulse"
            >
              <Square className="w-5 h-5" />
              Stop Recording
            </Button>
          )}
          
          <p className="text-sm text-muted-foreground">Or type your introduction below</p>
        </motion.div>

        {/* Text Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
        >
          <Textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder="Tell the Council about yourself... who you are, what brings you here, what you struggle with, and what you hope to become..."
            className="min-h-[180px] text-base p-4 resize-none"
          />
        </motion.div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <Button 
            size="lg" 
            onClick={handleSubmit}
            disabled={isSubmitting || !story.trim() || isRecording || isProcessing}
            className="w-full text-lg py-6"
          >
            {isSubmitting ? "Processing your story..." : "Continue"}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default GravityCouncilIntro;
