import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Compass, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAtlas } from "@/hooks/useAtlas";
import { supabase } from "@/integrations/supabase/client";

const AtlasProgressCard = () => {
  const navigate = useNavigate();
  const { totalDots, clusters, isLoading } = useAtlas();
  const [atlasOnboardingDone, setAtlasOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("atlas_onboarding_completed" as any)
        .eq("id", user.id)
        .maybeSingle();
      if (!cancelled) setAtlasOnboardingDone(!!(data as any)?.atlas_onboarding_completed);
    })();
    return () => { cancelled = true; };
  }, []);

  if (isLoading) return null;

  const unlockedCount = clusters.filter(c => c.computedState !== "locked").length;

  const handleOpen = () => {
    // First-time users always go through the Cris's Map / founder intro path.
    if (atlasOnboardingDone === false) {
      navigate("/atlas?intro=founder");
    } else {
      navigate("/atlas");
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Compass className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Your Atlas</h3>
              <p className="text-xs text-muted-foreground">
                {totalDots} {totalDots === 1 ? "discovery" : "discoveries"} · {unlockedCount} areas
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="gap-1 text-primary"
            onClick={handleOpen}
          >
            {atlasOnboardingDone === false ? "Open Atlas" : "Explore"}
            <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AtlasProgressCard;
