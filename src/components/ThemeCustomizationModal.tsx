import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Palette, Sparkles } from "lucide-react";

interface ThemePreferences {
  theme_color: string;
  background_style: string;
  card_style: string;
  accent_color: string;
  show_stats_publicly: boolean;
  show_timeline_publicly: boolean;
  show_achievements_publicly: boolean;
}

interface ThemeCustomizationModalProps {
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const themeColors = [
  { name: "Purple", value: "purple", gradient: "from-purple-500 to-purple-700" },
  { name: "Blue", value: "blue", gradient: "from-blue-500 to-blue-700" },
  { name: "Green", value: "green", gradient: "from-green-500 to-green-700" },
  { name: "Orange", value: "orange", gradient: "from-orange-500 to-orange-700" },
  { name: "Pink", value: "pink", gradient: "from-pink-500 to-pink-700" },
  { name: "Teal", value: "teal", gradient: "from-teal-500 to-teal-700" },
];

const accentColors = [
  { name: "Blue", value: "blue", color: "bg-blue-500" },
  { name: "Cyan", value: "cyan", color: "bg-cyan-500" },
  { name: "Yellow", value: "yellow", color: "bg-yellow-500" },
  { name: "Red", value: "red", color: "bg-red-500" },
  { name: "Emerald", value: "emerald", color: "bg-emerald-500" },
  { name: "Violet", value: "violet", color: "bg-violet-500" },
];

const backgroundStyles = [
  { name: "Gradient", value: "gradient" },
  { name: "Solid", value: "solid" },
  { name: "Pattern", value: "pattern" },
  { name: "Minimal", value: "minimal" },
];

const cardStyles = [
  { name: "Default", value: "default" },
  { name: "Elevated", value: "elevated" },
  { name: "Bordered", value: "bordered" },
  { name: "Glass", value: "glass" },
];

export const ThemeCustomizationModal = ({ open, onClose, onUpdate }: ThemeCustomizationModalProps) => {
  const [preferences, setPreferences] = useState<ThemePreferences>({
    theme_color: "purple",
    background_style: "gradient",
    card_style: "default",
    accent_color: "blue",
    show_stats_publicly: true,
    show_timeline_publicly: false,
    show_achievements_publicly: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadPreferences();
    }
  }, [open]);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_theme_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setPreferences({
          theme_color: data.theme_color,
          background_style: data.background_style,
          card_style: data.card_style,
          accent_color: data.accent_color,
          show_stats_publicly: data.show_stats_publicly,
          show_timeline_publicly: data.show_timeline_publicly,
          show_achievements_publicly: data.show_achievements_publicly,
        });
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
  };

  const savePreferences = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_theme_preferences")
        .upsert({
          user_id: user.id,
          ...preferences,
        });

      if (error) throw error;

      toast.success("Theme updated!", {
        description: "Your profile theme has been customized."
      });
      
      onUpdate();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Customize Your Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Theme Color */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Theme Color</Label>
            <div className="grid grid-cols-3 gap-3">
              {themeColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setPreferences({ ...preferences, theme_color: color.value })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    preferences.theme_color === color.value
                      ? "border-primary scale-105"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className={`w-full h-12 rounded bg-gradient-to-r ${color.gradient} mb-2`} />
                  <p className="text-sm font-medium">{color.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Accent Color */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Accent Color</Label>
            <div className="grid grid-cols-6 gap-2">
              {accentColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setPreferences({ ...preferences, accent_color: color.value })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    preferences.accent_color === color.value
                      ? "border-primary scale-110"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className={`w-full h-8 rounded ${color.color}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Background Style */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Background Style</Label>
            <div className="grid grid-cols-2 gap-3">
              {backgroundStyles.map((style) => (
                <button
                  key={style.value}
                  onClick={() => setPreferences({ ...preferences, background_style: style.value })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    preferences.background_style === style.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="text-sm font-medium">{style.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Card Style */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Card Style</Label>
            <div className="grid grid-cols-2 gap-3">
              {cardStyles.map((style) => (
                <button
                  key={style.value}
                  onClick={() => setPreferences({ ...preferences, card_style: style.value })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    preferences.card_style === style.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="text-sm font-medium">{style.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="space-y-4 pt-4 border-t">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Privacy Settings
            </Label>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="show-stats">Show stats publicly</Label>
                  <p className="text-xs text-muted-foreground">Others can see your XP, level, and task counts</p>
                </div>
                <Switch
                  id="show-stats"
                  checked={preferences.show_stats_publicly}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, show_stats_publicly: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="show-achievements">Show achievements publicly</Label>
                  <p className="text-xs text-muted-foreground">Others can see your unlocked badges</p>
                </div>
                <Switch
                  id="show-achievements"
                  checked={preferences.show_achievements_publicly}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, show_achievements_publicly: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="show-timeline">Show timeline publicly</Label>
                  <p className="text-xs text-muted-foreground">Others can see your transformation journey</p>
                </div>
                <Switch
                  id="show-timeline"
                  checked={preferences.show_timeline_publicly}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, show_timeline_publicly: checked })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={savePreferences} disabled={loading}>
            Save Theme
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
