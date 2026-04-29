import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Whisper {
  id: string;
  mentor_type: string;
  message: string;
  whisper_type?: string;
  trigger_reason?: string;
  created_at: string;
  read_at?: string;
}

export function useMentorWhisper() {
  const [latestWhisper, setLatestWhisper] = useState<Whisper | null>(null);
  const [unreadWhisper, setUnreadWhisper] = useState<Whisper | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasCheckedToday, setHasCheckedToday] = useState(false);

  // Load latest whisper
  const loadLatestWhisper = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Only fetch Future Self whispers - this channel is exclusive to Future Self
      const { data, error } = await supabase
        .from("daily_whispers")
        .select("*")
        .eq("user_id", user.id)
        .eq("mentor_type", "future_self")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setLatestWhisper(data as Whisper);
        // Check if unread
        if (!data.read_at) {
          setUnreadWhisper(data as Whisper);
        }
      }
      return data as Whisper | null;
    } catch (error) {
      console.error("Error loading whisper:", error);
      return null;
    }
  }, []);

  // Check if should generate new whisper
  const checkAndGenerateWhisper = useCallback(async () => {
    if (hasCheckedToday || loading) return;
    
    setLoading(true);
    setHasCheckedToday(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Call the edge function to potentially generate a whisper
      const { data, error } = await supabase.functions.invoke("generate-daily-whisper");

      if (error) {
        console.error("Error generating whisper:", error);
        return;
      }

      if (data?.whisper) {
        setLatestWhisper({
          ...data.whisper,
          created_at: new Date().toISOString()
        });
        setUnreadWhisper({
          ...data.whisper,
          created_at: new Date().toISOString()
        });
      } else {
        // Load existing whisper if not generated
        await loadLatestWhisper();
      }
    } catch (error) {
      console.error("Error checking whisper:", error);
    } finally {
      setLoading(false);
    }
  }, [hasCheckedToday, loading, loadLatestWhisper]);

  // Mark whisper as read
  const markAsRead = useCallback(async (whisperId: string) => {
    try {
      const { error } = await supabase
        .from("daily_whispers")
        .update({ read_at: new Date().toISOString() })
        .eq("id", whisperId);

      if (error) throw error;
      
      setUnreadWhisper(null);
      if (latestWhisper?.id === whisperId) {
        setLatestWhisper(prev => prev ? { ...prev, read_at: new Date().toISOString() } : null);
      }
    } catch (error) {
      console.error("Error marking whisper as read:", error);
    }
  }, [latestWhisper]);

  // Load whisper on mount
  useEffect(() => {
    loadLatestWhisper();
  }, [loadLatestWhisper]);

  return {
    latestWhisper,
    unreadWhisper,
    loading,
    checkAndGenerateWhisper,
    markAsRead,
    loadLatestWhisper
  };
}
