import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Zap, Star, Shield, Brain, Sparkles, Target, Eye, Layers, Check } from "lucide-react";
import { subDays } from "date-fns";
import type { Capability } from "@/hooks/useMomentumData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CapabilityMapTabProps {
  capabilities: Capability[];
  selfDeclaredSuggestions?: { name: string; category: string }[];
  userName?: string;
  onCapabilitiesChanged?: () => void;
}

const LEVEL_LABELS = ["Recognized", "Activated", "Strengthening", "Established", "Dominant"];

const CATEGORY_CONFIG: Record<string, { icon: typeof Zap; color: string }> = {
  execution: { icon: Target, color: "text-orange-500" },
  reflection: { icon: Eye, color: "text-blue-500" },
  strategy: { icon: Brain, color: "text-emerald-500" },
  creativity: { icon: Sparkles, color: "text-purple-500" },
  identity: { icon: Shield, color: "text-amber-500" },
};

const CHANNEL_LABELS: Record<string, string> = {
  onboarding_inferred: "System Inferred",
  self_declared: "Self-Declared",
  behavioral_detected: "Behavioral",
  compound_unlock: "Compound",
};

function computeLevel(cap: Capability): number {
  const count = cap.activation_count || 0;
  if (count >= 25) return 5;
  if (count >= 15) return 4;
  if (count >= 8) return 3;
  if (count >= 3) return 2;
  return 1;
}

function LevelDots({ level }: { level: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            i <= level ? "bg-primary" : "bg-muted"
          }`}
        />
      ))}
    </div>
  );
}

function CapabilityNode({ cap }: { cap: Capability & { computedLevel: number } }) {
  const category = (cap as any).category || "execution";
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.execution;
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card/50">
      <div className={`${config.color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{cap.capability_name}</p>
        {(cap as any).description && (
          <p className="text-xs text-muted-foreground truncate">{(cap as any).description}</p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1">
        <LevelDots level={cap.computedLevel} />
        <span className="text-[10px] text-muted-foreground">
          {LEVEL_LABELS[cap.computedLevel - 1]}
        </span>
      </div>
    </div>
  );
}

export function CapabilityMapTab({
  capabilities,
  selfDeclaredSuggestions,
  userName,
  onCapabilitiesChanged,
}: CapabilityMapTabProps) {
  const [showDeclareModal, setShowDeclareModal] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const twoWeeksAgo = subDays(new Date(), 14).toISOString();

  const enriched = useMemo(
    () =>
      capabilities.map((cap) => ({
        ...cap,
        computedLevel: computeLevel(cap),
      })),
    [capabilities]
  );

  const grouped = useMemo(() => {
    const groups: Record<string, (Capability & { computedLevel: number })[]> = {
      onboarding_inferred: [],
      self_declared: [],
      behavioral_detected: [],
      compound_unlock: [],
    };
    for (const cap of enriched) {
      const channel = (cap as any).acquisition_channel || "behavioral_detected";
      if (!groups[channel]) groups[channel] = [];
      groups[channel].push(cap);
    }
    return groups;
  }, [enriched]);

  // Determine stats
  const mostActivated = useMemo(
    () => [...enriched].sort((a, b) => b.activation_count - a.activation_count).slice(0, 3),
    [enriched]
  );

  const newlyEmerging = useMemo(
    () => enriched.filter((c) => c.first_activated_at >= twoWeeksAgo),
    [enriched, twoWeeksAgo]
  );

  const hasSelfDeclared = grouped.self_declared.length > 0;
  const showSuggestButton =
    !hasSelfDeclared && selfDeclaredSuggestions && selfDeclaredSuggestions.length > 0;

  const handleSaveDeclared = async () => {
    if (selected.size === 0) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const rows = Array.from(selected).map((name) => {
        const suggestion = selfDeclaredSuggestions?.find((s) => s.name === name);
        return {
          user_id: user.id,
          capability_name: name,
          source_type: "self_declared",
          activation_count: 1,
          level: 1,
          acquisition_channel: "self_declared",
          category: suggestion?.category || "execution",
        };
      });

      const { error } = await supabase.from("momentum_capabilities").insert(rows as any);
      if (error) throw error;

      toast.success("Capabilities added!");
      setShowDeclareModal(false);
      setSelected(new Set());
      onCapabilitiesChanged?.();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save capabilities");
    } finally {
      setSaving(false);
    }
  };

  const initials = userName
    ? userName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "ME";

  if (capabilities.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Layers className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            Capabilities appear as you complete tasks and capture insights.
          </p>
          <p className="text-sm text-muted-foreground mt-1">Each action activates skills.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Identity Center */}
      <div className="flex flex-col items-center gap-3 py-4">
        <Avatar className="h-16 w-16 border-2 border-primary/30">
          <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="text-center">
          <p className="text-sm font-medium">{enriched.length} Capabilities</p>
          <p className="text-xs text-muted-foreground">
            {mostActivated.length > 0 && `Strongest: ${mostActivated[0].capability_name}`}
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3 text-center">
          <p className="text-lg font-bold">{enriched.length}</p>
          <p className="text-[10px] text-muted-foreground">Total</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-lg font-bold">{newlyEmerging.length}</p>
          <p className="text-[10px] text-muted-foreground">New (2wk)</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-lg font-bold">
            {enriched.filter((c) => c.computedLevel >= 3).length}
          </p>
          <p className="text-[10px] text-muted-foreground">Level 3+</p>
        </Card>
      </div>

      {/* Self-declare button */}
      {showSuggestButton && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setShowDeclareModal(true)}
        >
          <Star className="h-4 w-4 mr-2" /> Declare Your Strengths
        </Button>
      )}

      {/* Grouped sections */}
      {Object.entries(grouped).map(([channel, caps]) => {
        if (caps.length === 0) return null;
        return (
          <Card key={channel}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {CHANNEL_LABELS[channel] || channel}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {caps.map((cap) => (
                <CapabilityNode key={cap.id} cap={cap} />
              ))}
            </CardContent>
          </Card>
        );
      })}

      {/* Self-declaration modal */}
      <Dialog open={showDeclareModal} onOpenChange={setShowDeclareModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Declare Your Strengths</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-3">
            Select 2-3 capabilities you identify with.
          </p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {selfDeclaredSuggestions?.map((s) => {
              const isSelected = selected.has(s.name);
              return (
                <button
                  key={s.name}
                  onClick={() => {
                    const next = new Set(selected);
                    if (isSelected) next.delete(s.name);
                    else if (next.size < 3) next.add(s.name);
                    setSelected(next);
                  }}
                  className={`w-full flex items-center gap-2 p-2.5 rounded-lg border text-left transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <span className="text-sm">{s.name}</span>
                  <Badge variant="outline" className="ml-auto text-[10px]">
                    {s.category}
                  </Badge>
                </button>
              );
            })}
          </div>
          <Button
            onClick={handleSaveDeclared}
            disabled={selected.size === 0 || saving}
            className="w-full mt-2"
          >
            {saving ? "Saving..." : `Add ${selected.size} Capabilities`}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
