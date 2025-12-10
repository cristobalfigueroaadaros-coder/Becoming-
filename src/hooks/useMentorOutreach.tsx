import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MentorOutreach {
  id: string;
  mentor_type: string;
  message: string;
  message_type: string;
  context_source: string | null;
  context_data: Record<string, unknown>;
  read_at: string | null;
  responded: boolean;
  created_at: string;
}

export const useMentorOutreach = () => {
  const [outreach, setOutreach] = useState<MentorOutreach | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTodaysOutreach = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      
      // Get today's unread outreach message
      const { data, error } = await supabase
        .from("mentor_daily_outreach")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", today)
        .is("read_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setOutreach(data as MentorOutreach | null);
    } catch (error) {
      console.error("Error loading mentor outreach:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateOutreach = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke("generate-daily-mentor-outreach", {
        body: { forceGenerate: false }
      });
      
      if (error) throw error;
      
      if (data.outreach) {
        setOutreach(data.outreach as MentorOutreach);
      }
      
      return data;
    } catch (error) {
      console.error("Error generating outreach:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    if (!outreach) return;
    
    try {
      await supabase
        .from("mentor_daily_outreach")
        .update({ read_at: new Date().toISOString() })
        .eq("id", outreach.id);
      
      setOutreach(prev => prev ? { ...prev, read_at: new Date().toISOString() } : null);
    } catch (error) {
      console.error("Error marking outreach as read:", error);
    }
  };

  const markAsResponded = async () => {
    if (!outreach) return;
    
    try {
      await supabase
        .from("mentor_daily_outreach")
        .update({ 
          responded: true,
          read_at: outreach.read_at || new Date().toISOString()
        })
        .eq("id", outreach.id);
      
      setOutreach(null);
    } catch (error) {
      console.error("Error marking outreach as responded:", error);
    }
  };

  const dismissOutreach = () => {
    markAsRead();
    setOutreach(null);
  };

  useEffect(() => {
    loadTodaysOutreach();
  }, []);

  return {
    outreach,
    loading,
    generateOutreach,
    markAsRead,
    markAsResponded,
    dismissOutreach,
    refreshOutreach: loadTodaysOutreach
  };
};
