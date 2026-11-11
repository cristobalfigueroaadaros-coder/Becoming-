import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VoiceRecorderProps {
  onTranscription: (text: string, audioUrl: string) => void;
  disabled?: boolean;
  idleLabel?: string;
  onStateChange?: (state: { isRecording: boolean; isProcessing: boolean }) => void;
}

export const VoiceRecorder = ({ onTranscription, disabled, idleLabel = "Record Voice Reply", onStateChange }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const getSupportedMimeType = () => {
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/ogg;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/wav",
    ];
    return candidates.find(type => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type));
  };

  const getFileExtension = (mimeType?: string) => {
    if (mimeType?.includes("wav")) return "wav";
    if (mimeType?.includes("mp4")) return "mp4";
    if (mimeType?.includes("ogg")) return "ogg";
    return "webm";
  };

  const getRecorderErrorMessage = (error: unknown) => {
    if (!(error instanceof DOMException)) return "Could not access microphone";

    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return "Microphone permission is blocked. Allow microphone access in the browser.";
    }

    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return "No microphone was found on this device.";
    }

    if (error.name === "NotReadableError" || error.name === "TrackStartError") {
      return "The microphone is busy or unavailable. Close other apps using it and try again.";
    }

    return "Could not access microphone";
  };

  const blobToBase64 = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to read audio"));
      reader.onloadend = () => {
        const base64Audio = reader.result?.toString().split(",")[1];
        if (!base64Audio) reject(new Error("Failed to process audio"));
        else resolve(base64Audio);
      };
      reader.readAsDataURL(blob);
    });

  const startRecording = async () => {
    try {
      if (disabled || isProcessing || isRecording) return;

      if (typeof window !== "undefined" && !window.isSecureContext && window.location.hostname !== "localhost") {
        toast.error("Voice recording needs a secure HTTPS connection.");
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        toast.error("Voice recording is not supported in this browser");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      chunksRef.current = [];
      streamRef.current = stream;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstart = () => {
        setIsRecording(true);
        onStateChange?.({ isRecording: true, isProcessing: false });
        toast.success("Recording started");
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        toast.error("Recording stopped unexpectedly");
        setIsRecording(false);
        onStateChange?.({ isRecording: false, isProcessing: false });
        mediaRecorderRef.current = null;
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      };

      mediaRecorder.onstop = async () => {
        const recordedType = mediaRecorder.mimeType || mimeType || chunksRef.current[0]?.type || "audio/webm";
        const audioBlob = new Blob(chunksRef.current, { type: recordedType });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        mediaRecorderRef.current = null;
        streamRef.current = null;
      };

      mediaRecorder.start(250);
      mediaRecorderRef.current = mediaRecorder;
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error(getRecorderErrorMessage(error));
      setIsRecording(false);
      onStateChange?.({ isRecording: false, isProcessing: false });
      mediaRecorderRef.current = null;
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (mediaRecorderRef.current.state === "recording") {
        try {
          mediaRecorderRef.current.requestData();
        } catch (error) {
          console.warn("Could not flush recorder data before stopping:", error);
        }
      }
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      onStateChange?.({ isRecording: false, isProcessing: true });
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    onStateChange?.({ isRecording: false, isProcessing: true });
    try {
      if (audioBlob.size === 0) throw new Error("No audio was captured");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let publicUrl = "";
      const fileName = `council-voice-${Date.now()}.${getFileExtension(audioBlob.type)}`;
      const upload = await supabase.storage
        .from("voice-notes")
        .upload(`${user.id}/${fileName}`, audioBlob);

      if (!upload.error) {
        const { data } = supabase.storage
          .from("voice-notes")
          .getPublicUrl(`${user.id}/${fileName}`);
        publicUrl = data.publicUrl;
      } else {
        console.warn("Voice upload skipped; continuing with transcription:", upload.error.message);
      }

      const base64Audio = await blobToBase64(audioBlob);
      const mimeType = audioBlob.type || "audio/webm";
      const { data, error } = await supabase.functions.invoke("transcribe-audio", {
        body: {
          audio: base64Audio,
          mimeType,
          fileName,
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.text) throw new Error("No transcription received");

      onTranscription(data.text, publicUrl);
      toast.success("Voice transcribed successfully");
    } catch (error: unknown) {
      console.error("Error processing audio:", error);
      toast.error(error instanceof Error ? error.message : "Failed to transcribe audio");
    } finally {
      setIsProcessing(false);
      onStateChange?.({ isRecording: false, isProcessing: false });
      streamRef.current?.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current = null;
      streamRef.current = null;
    }
  };

  return (
    <div className="flex items-center gap-2">
      {!isRecording ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={startRecording}
          disabled={disabled || isProcessing}
          className="gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              {idleLabel}
            </>
          )}
        </Button>
      ) : (
        <Button
          type="button"
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
  );
};
