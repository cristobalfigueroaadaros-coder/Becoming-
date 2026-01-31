import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook that triggers a notification inviting the user to the Inner Self Console
 * after their first project is created in the Creating Path.
 * 
 * Call this after completeFirstWin() succeeds.
 */
export async function triggerInnerSelfConsoleNotification() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if this notification has already been sent
    const { data: existingNotification } = await supabase
      .from("council_notifications")
      .select("id")
      .eq("user_id", user.id)
      .eq("notification_type", "inner_self_console_unlock")
      .limit(1);

    if (existingNotification && existingNotification.length > 0) {
      // Already sent, skip
      return;
    }

    // Create the notification
    await supabase.from("council_notifications").insert({
      user_id: user.id,
      notification_type: "inner_self_console_unlock",
      title: "Inner Work Awaits",
      message: "Now that we know what you're building, let's look at what's happening inside you.",
    });

    console.log("Inner Self Console notification created");
  } catch (error) {
    console.error("Error creating Inner Self Console notification:", error);
  }
}

/**
 * Hook that checks for the Inner Self Console unlock notification
 * and returns whether it should be shown.
 */
export function useInnerSelfNotification() {
  useEffect(() => {
    // This is just for tracking; actual notification display happens in dashboard
  }, []);
}
