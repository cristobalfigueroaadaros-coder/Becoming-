import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

interface BodygraphData {
  type: string;
  strategy: string;
  authority: string;
  profile: string;
  defined_centers: string[];
  undefined_centers: string[];
  key_gates?: Array<{ gate: number; description: string }>;
}

interface BodygraphChartProps {
  data: BodygraphData;
  showLabels?: boolean;
}

// Center positions (x, y, width, height)
const centerShapes = {
  "Head": { x: 150, y: 20, shape: "triangle", size: 50 },
  "Ajna": { x: 150, y: 90, shape: "triangle", size: 50 },
  "Throat": { x: 150, y: 160, shape: "square", size: 50 },
  "G Center": { x: 150, y: 280, shape: "diamond", size: 45 },
  "Heart/Ego": { x: 80, y: 220, shape: "triangle", size: 40 },
  "Sacral": { x: 150, y: 360, shape: "square", size: 60 },
  "Solar Plexus": { x: 220, y: 280, shape: "triangle", size: 50 },
  "Spleen": { x: 80, y: 320, shape: "triangle", size: 40 },
  "Root": { x: 150, y: 450, shape: "square", size: 50 },
};

// Channel connections between centers
const channels = [
  { from: "Head", to: "Ajna", path: "M 175 60 L 175 100" },
  { from: "Ajna", to: "Throat", path: "M 175 130 L 175 170" },
  { from: "Throat", to: "G Center", path: "M 175 200 L 175 270" },
  { from: "Throat", to: "Heart/Ego", path: "M 160 185 L 110 230" },
  { from: "Throat", to: "Solar Plexus", path: "M 190 185 L 235 270" },
  { from: "G Center", to: "Sacral", path: "M 175 315 L 175 370" },
  { from: "Heart/Ego", to: "G Center", path: "M 110 250 L 160 290" },
  { from: "Solar Plexus", to: "Sacral", path: "M 235 320 L 195 370" },
  { from: "Spleen", to: "Sacral", path: "M 105 350 L 160 375" },
  { from: "Sacral", to: "Root", path: "M 175 410 L 175 460" },
];

const centerDescriptions: Record<string, string> = {
  "Head": "Mental pressure and inspiration. Questions and mental energy.",
  "Ajna": "Mental awareness and conceptualization. Processing thoughts and ideas.",
  "Throat": "Communication and manifestation. Speaking your truth and taking action.",
  "G Center": "Identity and direction. Your sense of self and life purpose.",
  "Heart/Ego": "Willpower and self-worth. Material world and personal power.",
  "Sacral": "Life force energy. Response and work capacity.",
  "Solar Plexus": "Emotional awareness and depth. Emotional wave and sensitivity.",
  "Spleen": "Intuition and survival instincts. In-the-moment awareness.",
  "Root": "Adrenaline and pressure. Drive to get things done.",
};

export const BodygraphChart = ({ data, showLabels = true }: BodygraphChartProps) => {
  const isDefined = (centerName: string) => {
    return data.defined_centers?.includes(centerName) || false;
  };

  const getCenterColor = (centerName: string) => {
    if (!isDefined(centerName)) return "fill-background stroke-primary/30";
    
    // Color mapping for defined centers
    const colorMap: Record<string, string> = {
      "Head": "fill-purple-500/80 stroke-purple-600",
      "Ajna": "fill-green-500/80 stroke-green-600",
      "Throat": "fill-amber-500/80 stroke-amber-600",
      "G Center": "fill-yellow-400/80 stroke-yellow-500",
      "Heart/Ego": "fill-red-500/80 stroke-red-600",
      "Sacral": "fill-orange-500/80 stroke-orange-600",
      "Solar Plexus": "fill-amber-600/80 stroke-amber-700",
      "Spleen": "fill-emerald-500/80 stroke-emerald-600",
      "Root": "fill-rose-500/80 stroke-rose-600",
    };
    return colorMap[centerName] || "fill-primary/80 stroke-primary";
  };

  const getChannelOpacity = (from: string, to: string) => {
    return isDefined(from) && isDefined(to) ? "opacity-100" : "opacity-20";
  };

  const renderCenter = (centerName: string) => {
    const center = centerShapes[centerName as keyof typeof centerShapes];
    if (!center) return null;

    const { x, y, shape, size } = center;
    const colorClass = getCenterColor(centerName);
    const defined = isDefined(centerName);

    let shapeElement;
    switch (shape) {
      case "triangle":
        shapeElement = (
          <polygon
            points={`${x},${y} ${x - size/2},${y + size} ${x + size/2},${y + size}`}
            className={cn(colorClass, "transition-all duration-300")}
            strokeWidth="2"
          />
        );
        break;
      case "square":
        shapeElement = (
          <rect
            x={x - size/2}
            y={y}
            width={size}
            height={size}
            className={cn(colorClass, "transition-all duration-300")}
            strokeWidth="2"
          />
        );
        break;
      case "diamond":
        shapeElement = (
          <polygon
            points={`${x},${y - size/2} ${x + size/2},${y} ${x},${y + size/2} ${x - size/2},${y}`}
            className={cn(colorClass, "transition-all duration-300")}
            strokeWidth="2"
          />
        );
        break;
    }

    return (
      <HoverCard key={centerName}>
        <HoverCardTrigger asChild>
          <g className="cursor-pointer hover:opacity-90 transition-opacity">
            {shapeElement}
            {showLabels && (
              <text
                x={x}
                y={y + size + 15}
                textAnchor="middle"
                className="text-xs fill-foreground font-medium"
              >
                {centerName}
              </text>
            )}
          </g>
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">{centerName}</h4>
              <Badge variant={defined ? "default" : "outline"}>
                {defined ? "Defined" : "Undefined"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {centerDescriptions[centerName]}
            </p>
            {defined && (
              <p className="text-xs text-primary">
                ✓ Consistent and reliable energy in this area
              </p>
            )}
            {!defined && (
              <p className="text-xs text-muted-foreground">
                ○ Open to conditioning and wisdom from others
              </p>
            )}
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Your Bodygraph</CardTitle>
            <CardDescription>
              Visual representation of your Human Design chart
            </CardDescription>
          </div>
          <div className="flex flex-col gap-1 text-right">
            <Badge variant="default" className="justify-end">
              {data.type}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {data.profile} Profile
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* SVG Bodygraph */}
          <div className="flex justify-center">
            <svg
              viewBox="0 0 350 540"
              className="w-full max-w-md"
              style={{ maxHeight: "600px" }}
            >
              {/* Background */}
              <rect width="350" height="540" fill="transparent" />

              {/* Channels */}
              <g className="channels">
                {channels.map((channel, i) => (
                  <path
                    key={i}
                    d={channel.path}
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    className={cn(
                      "text-primary transition-opacity duration-300",
                      getChannelOpacity(channel.from, channel.to)
                    )}
                  />
                ))}
              </g>

              {/* Centers */}
              <g className="centers">
                {Object.keys(centerShapes).map((centerName) =>
                  renderCenter(centerName)
                )}
              </g>
            </svg>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Defined Centers</h4>
              <div className="space-y-1">
                {data.defined_centers.map((center) => (
                  <div key={center} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-primary"></div>
                    <span className="text-xs">{center}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Undefined Centers</h4>
              <div className="space-y-1">
                {data.undefined_centers.map((center) => (
                  <div key={center} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm border-2 border-primary/30 bg-background"></div>
                    <span className="text-xs">{center}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Key Gates */}
          {data.key_gates && data.key_gates.length > 0 && (
            <div className="pt-4 border-t border-border space-y-3">
              <h4 className="font-semibold text-sm">Key Gates</h4>
              <div className="grid grid-cols-1 gap-2">
                {data.key_gates.map((gate) => (
                  <div
                    key={gate.gate}
                    className="flex items-start gap-2 p-2 rounded-lg bg-primary/5"
                  >
                    <Badge variant="outline" className="flex-shrink-0">
                      {gate.gate}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {gate.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
