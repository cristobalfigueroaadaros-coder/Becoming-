import { supabase } from "@/integrations/supabase/client";

/**
 * Trigger notification when a pattern is ready for transmutation
 */
export async function triggerTransmutationReadyNotification(
  patternId: string,
  patternName: string
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Insert into council_notifications with transmutation_ready type
    const { error } = await supabase
      .from('council_notifications')
      .insert({
        user_id: user.id,
        notification_type: 'transmutation_ready',
        title: 'Transmutation is ready',
        message: `Transform "${patternName}" into gold. Your journey from pain to power awaits.`,
        context_data: {
          pattern_id: patternId,
          pattern_name: patternName,
          action: 'open_transmutation',
        },
      });

    if (error) {
      console.error("Error creating transmutation ready notification:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Error in triggerTransmutationReadyNotification:", err);
    return false;
  }
}

/**
 * Trigger notification when gold phase is complete
 */
export async function triggerGoldCompleteNotification(
  patternId: string,
  patternName: string,
  goldenSummary: string
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Insert into council_notifications with gold_complete type
    const { error } = await supabase
      .from('council_notifications')
      .insert({
        user_id: user.id,
        notification_type: 'gold_complete',
        title: 'Your gold is now part of your story',
        message: `"${patternName}" has been transmuted. View your Golden Nugget in the Lifetime Map.`,
        context_data: {
          pattern_id: patternId,
          pattern_name: patternName,
          golden_summary: goldenSummary,
          action: 'open_lifetime',
        },
      });

    if (error) {
      console.error("Error creating gold complete notification:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Error in triggerGoldCompleteNotification:", err);
    return false;
  }
}
