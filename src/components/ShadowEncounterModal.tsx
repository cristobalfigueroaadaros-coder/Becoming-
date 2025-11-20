import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mic, Square, Sparkles } from "lucide-react";

interface ShadowEncounterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  encounterId: string;
  shadowName: string;
  shadowStatement: string;
  reflectionPrompts: string[];
  taskDescription: string;
  mentorType?: string;
  xpReward: number;
  onComplete: () => void;
}

export const ShadowEncounterModal = ({
  open,
  onOpenChange,
  encounterId,
  shadowName,
  shadowStatement,
  reflectionPrompts,
  taskDescription,
  mentorType,
  xpReward,
  onComplete,
}: ShadowEncounterModalProps) => {
  const [integrationInsight, setIntegrationInsight] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        setAudioChunks(chunks);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      toast.info("Recording started...");
    } catch (error) {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      toast.success("Recording saved");
    }
  };

  const handleComplete = async () => {
    if (!integrationInsight.trim()) {
      toast.error("Please share your integration insight");
      return;
    }

    setIsCompleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload voice note if recorded
      let voiceNoteUrl = null;
      if (audioChunks.length > 0) {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        const fileName = `shadow-${encounterId}-${Date.now()}.webm`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("voice-notes")
          .upload(fileName, audioBlob);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from("voice-notes")
          .getPublicUrl(fileName);
        
        voiceNoteUrl = publicUrl;
      }

      // Update encounter
      const { error: updateError } = await supabase
        .from("shadow_encounters")
        .update({
          status: "completed",
          integration_insight: integrationInsight,
          voice_note_url: voiceNoteUrl,
          completed_at: new Date().toISOString(),
        })
        .eq("id", encounterId);

      if (updateError) throw updateError;

      // Update shadow progress
      const { data: progressData } = await supabase
        .from("shadow_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("shadow_name", shadowName)
        .single();

      if (progressData) {
        await supabase
          .from("shadow_progress")
          .update({
            encounters: progressData.encounters + 1,
            integrations: progressData.integrations + 1,
            last_triggered_at: new Date().toISOString(),
          })
          .eq("id", progressData.id);
      } else {
        await supabase.from("shadow_progress").insert({
          user_id: user.id,
          shadow_name: shadowName,
          encounters: 1,
          integrations: 1,
          last_triggered_at: new Date().toISOString(),
        });
      }

      // Award XP
      const { data: futureProgress } = await supabase
        .from("future_self_progress")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (futureProgress) {
        await supabase
          .from("future_self_progress")
          .update({
            global_xp: futureProgress.global_xp + xpReward,
          })
          .eq("id", futureProgress.id);
      }

      toast.success(`Shadow integrated! +${xpReward} XP`);
      onComplete();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to complete encounter");
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-background via-background to-muted/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-destructive to-destructive/60 bg-clip-text text-transparent">
            ⚡ Shadow Encounter: {shadowName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Shadow Statement */}
          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
            <p className="text-lg font-medium leading-relaxed italic text-foreground">
              "{shadowStatement}"
            </p>
          </div>

          {/* Mentor Appearance */}
          {mentorType && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              <span className="font-semibold">{mentorType}</span> appears to guide you
            </div>
          )}

          {/* Reflection Prompts */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Reflect
            </h3>
            {reflectionPrompts.map((prompt, idx) => (
              <div key={idx} className="pl-4 border-l-2 border-primary/50">
                <p className="text-sm leading-relaxed">{prompt}</p>
              </div>
            ))}
          </div>

          {/* Task */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Your Task
            </h3>
            <p className="text-sm bg-muted/30 p-3 rounded-lg">{taskDescription}</p>
          </div>

          {/* Voice Recording */}
          <div className="space-y-2">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              variant={isRecording ? "destructive" : "outline"}
              size="sm"
              className="w-full"
            >
              {isRecording ? (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Record Voice Note (Optional)
                </>
              )}
            </Button>
            {audioChunks.length > 0 && !isRecording && (
              <p className="text-xs text-center text-muted-foreground">Voice note recorded ✓</p>
            )}
          </div>

          {/* Integration Insight */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">
              Integration Insight <span className="text-destructive">*</span>
            </label>
            <Textarea
              placeholder="What did you learn? How will you move forward?"
              value={integrationInsight}
              onChange={(e) => setIntegrationInsight(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isCompleting}
            >
              Later
            </Button>
            <Button
              onClick={handleComplete}
              disabled={isCompleting || !integrationInsight.trim()}
              className="flex-1 bg-gradient-to-r from-primary to-accent"
            >
              {isCompleting ? "Integrating..." : `Complete (+${xpReward} XP)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
