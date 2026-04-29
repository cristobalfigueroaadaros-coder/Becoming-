import { useNavigate } from "react-router-dom";
import { Compass, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAtlas } from "@/hooks/useAtlas";

const AtlasProgressCard = () => {
  const navigate = useNavigate();
  const { totalDots, clusters, isLoading } = useAtlas();

  if (isLoading) return null;

  const unlockedCount = clusters.filter(c => c.computedState !== "locked").length;

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
            onClick={() => navigate("/atlas")}
          >
            Explore <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AtlasProgressCard;
