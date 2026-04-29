import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Compass, Edit2, Save, X, Loader2, ImageIcon, RefreshCw } from "lucide-react";
import { MicroGuide } from "@/components/MicroGuide";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LifeSnapshot {
  id: string;
  relationships: string | null;
  family: string | null;
  work: string | null;
  lifestyle: string | null;
  contribution: string | null;
  environment: string | null;
  generated_image_url: string | null;
}

const fields = [
  { key: "relationships", label: "Relationships", placeholder: "How do your relationships look?" },
  { key: "family", label: "Family", placeholder: "What does your family life look like?" },
  { key: "work", label: "Work", placeholder: "What work are you doing?" },
  { key: "lifestyle", label: "Lifestyle", placeholder: "How do you live day-to-day?" },
  { key: "contribution", label: "Contribution", placeholder: "How are you contributing to the world?" },
  { key: "environment", label: "Environment", placeholder: "Where are you living?" },
];

export const IdealLifeSnapshot = () => {
  const [snapshot, setSnapshot] = useState<LifeSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSnapshot();
  }, []);

  const loadSnapshot = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("ideal_life_snapshots")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setSnapshot(data);
        setFormData({
          relationships: data.relationships || "",
          family: data.family || "",
          work: data.work || "",
          lifestyle: data.lifestyle || "",
          contribution: data.contribution || "",
          environment: data.environment || "",
        });
      }
    } catch (error) {
      console.error("Error loading snapshot:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateVisualization = async (snapshotId: string) => {
    setGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-life-snapshot-image", {
        body: { snapshotId }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        // Update local state
        setSnapshot(prev => prev ? { ...prev, generated_image_url: data.imageUrl } : null);
        toast.success("Vision visualization created");
      }
    } catch (error: any) {
      console.error("Error generating visualization:", error);
      toast.error("Could not generate visualization");
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const payload = {
        user_id: user.id,
        relationships: formData.relationships || null,
        family: formData.family || null,
        work: formData.work || null,
        lifestyle: formData.lifestyle || null,
        contribution: formData.contribution || null,
        environment: formData.environment || null,
      };

      let savedId: string | null = null;

      if (snapshot) {
        const { error } = await supabase
          .from("ideal_life_snapshots")
          .update(payload)
          .eq("id", snapshot.id);
        if (error) throw error;
        savedId = snapshot.id;
      } else {
        const { data, error } = await supabase
          .from("ideal_life_snapshots")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        setSnapshot(data);
        savedId = data.id;
      }

      toast.success("Vision saved");
      setEditing(false);
      await loadSnapshot();

      // Generate visualization after saving if we have content
      const hasContent = Object.values(formData).some(v => v.trim());
      if (hasContent && savedId) {
        await generateVisualization(savedId);
      }
    } catch (error: any) {
      console.error("Error saving snapshot:", error);
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const hasContent = Object.values(formData).some(v => v.trim());

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-teal-500/20 bg-gradient-to-br from-teal-500/5 to-cyan-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Compass className="w-5 h-5 text-teal-500" />
            Ideal Life Snapshot
            <MicroGuide
              guideKey="ideal_life"
              title="Ideal Life Snapshot"
              description={"This exercise helps visualize the life you want to build.\n\nIt connects your present actions with your future direction."}
            />
          </CardTitle>
          {!editing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(true)}
              className="text-teal-500 hover:text-teal-600"
            >
              <Edit2 className="w-4 h-4 mr-1" />
              {snapshot ? "Edit" : "Create"}
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Your north star — the direction you're becoming toward
        </p>
      </CardHeader>
      <CardContent>
        {editing ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-xs font-medium">{field.label}</Label>
                  <Textarea
                    placeholder={field.placeholder}
                    value={formData[field.key] || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                    rows={2}
                    className="text-sm resize-none border-teal-500/20 focus:border-teal-500/50"
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditing(false);
                  if (snapshot) {
                    setFormData({
                      relationships: snapshot.relationships || "",
                      family: snapshot.family || "",
                      work: snapshot.work || "",
                      lifestyle: snapshot.lifestyle || "",
                      contribution: snapshot.contribution || "",
                      environment: snapshot.environment || "",
                    });
                  }
                }}
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="bg-teal-500 hover:bg-teal-600"
              >
                <Save className="w-4 h-4 mr-1" />
                {saving ? "Saving..." : "Save Vision"}
              </Button>
            </div>
          </motion.div>
        ) : hasContent ? (
          <div className="space-y-4">
            {/* Generated Visualization */}
            {snapshot?.generated_image_url ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative rounded-xl overflow-hidden"
              >
                <img 
                  src={snapshot.generated_image_url} 
                  alt="Your ideal life visualization"
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => snapshot?.id && generateVisualization(snapshot.id)}
                  disabled={generatingImage}
                  className="absolute bottom-2 right-2 text-white hover:bg-white/20"
                >
                  {generatingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
              </motion.div>
            ) : generatingImage ? (
              <div className="flex flex-col items-center justify-center py-8 rounded-xl bg-teal-500/5 border border-teal-500/10">
                <Loader2 className="w-8 h-8 animate-spin text-teal-500 mb-2" />
                <p className="text-sm text-muted-foreground">Creating your vision...</p>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => snapshot?.id && generateVisualization(snapshot.id)}
                className="w-full border-teal-500/20 text-teal-600 hover:bg-teal-500/10"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Generate Visualization
              </Button>
            )}

            {/* Text Content */}
            <div className="grid gap-3 sm:grid-cols-2">
              {fields.map((field) => {
                const value = formData[field.key];
                if (!value) return null;
                return (
                  <div
                    key={field.key}
                    className="p-3 rounded-lg bg-background/50 border border-teal-500/10"
                  >
                    <span className="text-xs font-medium text-teal-600 block mb-1">
                      {field.label}
                    </span>
                    <p className="text-sm">{value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <Compass className="w-10 h-10 mx-auto text-teal-500/30 mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              Describe the life you're becoming toward
            </p>
            <Button
              onClick={() => setEditing(true)}
              className="bg-teal-500 hover:bg-teal-600"
            >
              Create Your Vision
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};