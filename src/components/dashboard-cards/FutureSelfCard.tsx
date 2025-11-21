import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const FutureSelfCard = () => {
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("future_self_progress")
      .select("evolution_level, global_xp")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setLevel(data.evolution_level);
      setXp(data.global_xp);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px]">
      <svg viewBox="0 0 180 200" className="w-full max-w-[160px]">
        {/* Head */}
        <circle cx="90" cy="45" r="22" fill="hsl(30 50% 65%)" />
        
        {/* Hair */}
        <path
          d="M 68 40 Q 68 22 90 22 Q 112 22 112 40"
          fill="hsl(0 0% 35%)"
        />
        
        {/* Eyes */}
        <circle cx="82" cy="43" r="2" fill="hsl(0 0% 20%)" />
        <circle cx="98" cy="43" r="2" fill="hsl(0 0% 20%)" />
        
        {/* Smile */}
        <path
          d="M 80 52 Q 90 56 100 52"
          fill="none"
          stroke="hsl(0 0% 20%)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Torso (teal shirt with text) */}
        <rect x="68" y="67" width="44" height="50" rx="4" fill="hsl(180 50% 40%)" />
        
        {/* "Future Self" text on shirt */}
        <text x="90" y="88" fontSize="10" fontWeight="bold" fill="white" textAnchor="middle">
          Future
        </text>
        <text x="90" y="100" fontSize="10" fontWeight="bold" fill="white" textAnchor="middle">
          Self
        </text>

        {/* Arms */}
        <rect x="50" y="75" width="12" height="35" rx="6" fill="hsl(30 50% 65%)" />
        <rect x="118" y="75" width="12" height="35" rx="6" fill="hsl(30 50% 65%)" />

        {/* Legs */}
        <rect x="75" y="117" width="12" height="40" rx="6" fill="hsl(200 40% 30%)" />
        <rect x="93" y="117" width="12" height="40" rx="6" fill="hsl(200 40% 30%)" />

        {/* Level badge */}
        <circle cx="130" cy="50" r="18" fill="hsl(var(--primary))" />
        <text x="130" y="48" fontSize="10" fontWeight="bold" fill="white" textAnchor="middle">
          LVL
        </text>
        <text x="130" y="58" fontSize="12" fontWeight="bold" fill="white" textAnchor="middle">
          {level}
        </text>
      </svg>
      
      <div className="mt-4 text-center">
        <p className="text-sm text-muted-foreground">{xp} XP</p>
      </div>
    </div>
  );
};

export default FutureSelfCard;
