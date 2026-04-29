import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Star, Zap, Compass, User, Brain, Circle } from "lucide-react";

interface HumanDesignData {
  type: string;
  strategy: string;
  authority: string;
  profile: string;
  defined_centers: string[];
  undefined_centers: string[];
  incarnation_cross?: string;
  key_gates: Array<{ gate: number; description: string }>;
  is_approximate: boolean;
}

interface HumanDesignCardProps {
  data: HumanDesignData;
}

const typeColors: Record<string, string> = {
  Generator: "bg-green-500",
  "Manifesting Generator": "bg-emerald-500",
  Manifestor: "bg-red-500",
  Projector: "bg-blue-500",
  Reflector: "bg-purple-500",
};

const typeDescriptions: Record<string, string> = {
  Generator: "You're here to respond to life and find satisfaction through what lights you up. Your energy is consistent and powerful when aligned with your passion.",
  "Manifesting Generator": "A multi-passionate powerhouse who responds quickly and efficiently. You're designed to skip steps and innovate once you find your spark.",
  Manifestor: "You're here to initiate and make things happen. Your power lies in informing others before you act, creating flow and reducing resistance.",
  Projector: "You're a natural guide and leader who sees systems and people deeply. Your gift activates when you're recognized and invited.",
  Reflector: "You're a mirror to your community, sampling and reflecting the health of your environment. Wisdom comes through patience and lunar cycles.",
};

export const HumanDesignCard = ({ data }: HumanDesignCardProps) => {
  return (
    <div className="space-y-6">
      {/* Header with Type */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                <Star className="w-6 h-6 text-primary" />
                Your Human Design
              </CardTitle>
              <CardDescription>
                Understand your unique energetic blueprint
              </CardDescription>
            </div>
            {data.is_approximate && (
              <Badge variant="secondary" className="text-xs">
                Approximate (noon chart)
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Type */}
          <div>
            <HoverCard>
              <HoverCardTrigger asChild>
                <div className="cursor-help">
                  <p className="text-sm text-muted-foreground mb-2">Your Type</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${typeColors[data.type]}`} />
                    <h3 className="text-2xl font-bold">{data.type}</h3>
                  </div>
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <p className="text-sm">{typeDescriptions[data.type]}</p>
              </HoverCardContent>
            </HoverCard>
          </div>

          {/* Strategy & Authority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <HoverCard>
              <HoverCardTrigger asChild>
                <div className="p-4 bg-primary/5 rounded-lg cursor-help border border-primary/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Strategy</p>
                  </div>
                  <p className="font-medium">{data.strategy}</p>
                </div>
              </HoverCardTrigger>
              <HoverCardContent>
                <p className="text-sm">
                  Your strategy is how you're designed to interact with the world and make decisions that align with your true self.
                </p>
              </HoverCardContent>
            </HoverCard>

            <HoverCard>
              <HoverCardTrigger asChild>
                <div className="p-4 bg-accent/5 rounded-lg cursor-help border border-accent/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Compass className="w-4 h-4 text-accent" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Authority</p>
                  </div>
                  <p className="font-medium">{data.authority}</p>
                </div>
              </HoverCardTrigger>
              <HoverCardContent>
                <p className="text-sm">
                  Your authority is your inner compass for making correct decisions. Trust this part of yourself above all else.
                </p>
              </HoverCardContent>
            </HoverCard>
          </div>

          {/* Profile */}
          <HoverCard>
            <HoverCardTrigger asChild>
              <div className="p-4 bg-secondary/5 rounded-lg cursor-help border border-secondary/10">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-secondary" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Profile</p>
                </div>
                <p className="text-lg font-medium">{data.profile}</p>
              </div>
            </HoverCardTrigger>
            <HoverCardContent>
              <p className="text-sm">
                Your profile describes your life theme and how you're designed to interact with others and learn.
              </p>
            </HoverCardContent>
          </HoverCard>

          {/* Centers */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold uppercase text-muted-foreground">Energy Centers</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <p className="text-xs font-medium text-green-600">Defined (Consistent Energy)</p>
                {data.defined_centers.map((center) => (
                  <HoverCard key={center}>
                    <HoverCardTrigger asChild>
                      <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded border border-green-500/20 cursor-help">
                        <Circle className="w-3 h-3 fill-green-500 text-green-500" />
                        <span className="text-sm">{center}</span>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent>
                      <p className="text-sm">
                        This center is defined in your chart, meaning you have consistent, reliable energy in this area.
                      </p>
                    </HoverCardContent>
                  </HoverCard>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-orange-600">Undefined (Wisdom Areas)</p>
                {data.undefined_centers.map((center) => (
                  <HoverCard key={center}>
                    <HoverCardTrigger asChild>
                      <div className="flex items-center gap-2 p-2 bg-orange-500/10 rounded border border-orange-500/20 cursor-help">
                        <Circle className="w-3 h-3 text-orange-500" />
                        <span className="text-sm">{center}</span>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent>
                      <p className="text-sm">
                        This center is open, making you wise about it through experiencing it in others. Be aware of conditioning here.
                      </p>
                    </HoverCardContent>
                  </HoverCard>
                ))}
              </div>
            </div>
          </div>

          {/* Key Gates */}
          {data.key_gates.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold uppercase text-muted-foreground mb-3">Key Gates</h4>
              <div className="space-y-2">
                {data.key_gates.map((gate) => (
                  <div key={gate.gate} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs">
                        Gate {gate.gate}
                      </Badge>
                      <p className="text-sm text-muted-foreground flex-1">{gate.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Incarnation Cross */}
          {data.incarnation_cross && (
            <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20">
              <h4 className="text-sm font-semibold uppercase text-muted-foreground mb-2">Incarnation Cross</h4>
              <p className="font-medium">{data.incarnation_cross}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Your life's purpose and the unique contribution you're here to make
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};