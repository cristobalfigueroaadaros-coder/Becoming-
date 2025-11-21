import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ritualSteps = [
  "Daily Journal",
  "Meditation",
  "Visualization",
  "Set Daily Goal"
];

const DailyRitualCard = () => {
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    checkRitualStatus();
  }, []);

  const checkRitualStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from("daily_rituals")
      .select("completed_at")
      .eq("user_id", user.id)
      .gte("completed_at", today.toISOString())
      .limit(1);

    setCompleted(data && data.length > 0);
  };

  return (
    <div className="space-y-3">
      {ritualSteps.map((step, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
            completed 
              ? "bg-primary border-primary" 
              : "border-muted-foreground/30"
          }`}>
            {completed && <Check className="w-4 h-4 text-primary-foreground" />}
          </div>
          <span className={completed ? "text-foreground" : "text-muted-foreground"}>
            {step}
          </span>
        </div>
      ))}
    </div>
  );
};

export default DailyRitualCard;
