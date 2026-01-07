import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Mic, Square, Loader2 } from "lucide-react";

const GravityFirstProject = () => {
  const navigate = useNavigate();
  const [projectIdea, setProjectIdea] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
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
      toast.success("Recording started");
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
      // Convert blob to base64 for transcription
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        if (!base64Audio) {
          throw new Error("Failed to process audio");
        }

        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { audio: base64Audio }
        });

        if (error) throw error;

        if (data?.text) {
          setProjectIdea(prev => prev ? `${prev}\n\n${data.text}` : data.text);
          toast.success("Voice transcribed");
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

  const handleStartBuilding = async () => {
    if (!projectIdea.trim()) {
      toast.error("Please describe your idea or project");
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to continue");
        navigate('/');
        return;
      }

      // Call integrator-setup to create the first project
      const { data, error } = await supabase.functions.invoke('integrator-setup', {
        body: {
          projectTitle: "My First Project",
          projectDescription: projectIdea,
          timeframeDays: 14,
          whyThisMatters: "This is my first step toward becoming who I want to be."
        }
      });

      if (error) {
        console.error('Error creating project:', error);
        toast.error("Failed to create project. Please try again.");
        setIsLoading(false);
        return;
      }

      // Update profile with first project info
      await supabase
        .from('profiles')
        .update({ 
          first_project_created_at: new Date().toISOString(),
          first_project_id: data?.projectId || null,
          council_unlocked: true,
          council_unlocked_at: new Date().toISOString()
        })
        .eq('id', user.id);

      toast.success("Your journey begins now!");
      navigate('/dashboard');
    } catch (error) {
      console.error('Error in first project creation:', error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-2xl space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6 text-center"
        >
          <p className="text-lg text-muted-foreground">We hear you.</p>
          
          <div className="space-y-4">
            <p className="text-xl text-foreground/90 leading-relaxed">
              Becoming is here to support your growth, but growth happens through movement.
            </p>
            <p className="text-xl text-foreground leading-relaxed font-medium">
              We believe the fastest way to understand yourself is to work toward something real.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="space-y-6"
        >
          <div className="text-center space-y-2">
            <p className="text-lg text-foreground">Tell us:</p>
            <p className="text-xl text-foreground font-medium">
              Is there an idea, a project, an experiment, or something unfinished that you'd like to bring to life?
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-center">
              {!isRecording ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startRecording}
                  disabled={isProcessing}
                  className="gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Transcribing...
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      Speak your idea
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={stopRecording}
                  className="gap-2 animate-pulse"
                >
                  <Square className="w-4 h-4" />
                  Stop Recording
                </Button>
              )}
            </div>

            <Textarea
              value={projectIdea}
              onChange={(e) => setProjectIdea(e.target.value)}
              placeholder="Describe your idea, project, or something you want to explore..."
              className="min-h-[150px] text-lg p-4 resize-none"
            />
          </div>

          <p className="text-sm text-muted-foreground text-center">
            There are no expectations. Only movement.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="space-y-4"
        >
          <Button 
            size="lg" 
            onClick={handleStartBuilding}
            disabled={isLoading || !projectIdea.trim() || isRecording || isProcessing}
            className="w-full text-lg py-6"
          >
            {isLoading ? "Creating your project..." : "Start building"}
          </Button>
          
          <p className="text-sm text-muted-foreground text-center italic">
            If nothing comes to mind yet, you can start small. A habit, a question, or something you're curious to explore is enough.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default GravityFirstProject;
