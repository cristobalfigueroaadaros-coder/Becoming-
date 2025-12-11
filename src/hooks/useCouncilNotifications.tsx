import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CouncilNotification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  context_data?: any;
  breakthrough_id?: string;
  read_at?: string;
  dismissed: boolean;
  created_at: string;
}

export const useCouncilNotifications = () => {
  const [notifications, setNotifications] = useState<CouncilNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("council_notifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("dismissed", false)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error loading council notifications:", error);
        return;
      }

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read_at).length || 0);
    } catch (error) {
      console.error("Error loading council notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await supabase
        .from("council_notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", notificationId);

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  const dismissNotification = useCallback(async (notificationId: string) => {
    try {
      await supabase
        .from("council_notifications")
        .update({ dismissed: true })
        .eq("id", notificationId);

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const wasDismissed = notifications.find(n => n.id === notificationId);
        return wasDismissed && !wasDismissed.read_at ? Math.max(0, prev - 1) : prev;
      });
    } catch (error) {
      console.error("Error dismissing notification:", error);
    }
  }, [notifications]);

  useEffect(() => {
    loadNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel("council-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "council_notifications",
        },
        (payload) => {
          setNotifications(prev => [payload.new as CouncilNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    dismissNotification,
    refresh: loadNotifications,
  };
};
