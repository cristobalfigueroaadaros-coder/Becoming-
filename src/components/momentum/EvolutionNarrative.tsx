import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface EvolutionNarrativeProps {
  narrative: string | null;
  loading?: boolean;
}

export function EvolutionNarrative({ narrative, loading }: EvolutionNarrativeProps) {
  if (loading) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-6 flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          <p className="text-sm text-muted-foreground animate-pulse">Generating your evolution narrative...</p>
        </CardContent>
      </Card>
    );
  }

  if (!narrative) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="py-5 flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <p className="text-sm leading-relaxed">{narrative}</p>
      </CardContent>
    </Card>
  );
}
