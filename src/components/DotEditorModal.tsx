import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Link as LinkIcon, Sparkles, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface InsightDot {
  id: string;
  insight_text: string;
  core_theme: string;
  skill_tags: string[];
  emotional_tone: string | null;
  source_type: string;
  created_at: string;
}

interface DotConnection {
  id: string;
  dot_id_1: string;
  dot_id_2: string;
  connection_type: string;
  connection_insight: string;
}

interface DotEditorModalProps {
  dot: InsightDot | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  allDots: InsightDot[];
  existingConnections: DotConnection[];
}

export const DotEditorModal = ({ dot, isOpen, onClose, onSave, allDots, existingConnections }: DotEditorModalProps) => {
  const [insightText, setInsightText] = useState("");
  const [coreTheme, setCoreTheme] = useState("");
  const [skillTags, setSkillTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [linkedDots, setLinkedDots] = useState<string[]>([]);
  const [connectionInsight, setConnectionInsight] = useState("");
  const [selectedDotToLink, setSelectedDotToLink] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);

  useEffect(() => {
    if (dot) {
      setInsightText(dot.insight_text);
      setCoreTheme(dot.core_theme);
      setSkillTags(dot.skill_tags || []);
      
      // Load existing connections
      const connections = existingConnections.filter(
        conn => conn.dot_id_1 === dot.id || conn.dot_id_2 === dot.id
      );
      const connectedIds = connections.map(conn => 
        conn.dot_id_1 === dot.id ? conn.dot_id_2 : conn.dot_id_1
      );
      setLinkedDots(connectedIds);
    }
  }, [dot, existingConnections]);

  const handleAddTag = () => {
    if (newTag.trim() && !skillTags.includes(newTag.trim())) {
      setSkillTags([...skillTags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setSkillTags(skillTags.filter(tag => tag !== tagToRemove));
  };

  const handleGetAISuggestions = async () => {
    if (!dot) return;

    setIsLoadingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-dot-improvements", {
        body: { dotId: dot.id },
      });

      if (error) throw error;

      setAiSuggestions(data.suggestions);
      toast.success("AI suggestions generated!");
    } catch (error) {
      console.error("Error getting suggestions:", error);
      toast.error("Failed to generate suggestions");
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const applyAISuggestion = (type: "text" | "theme" | "tags") => {
    if (!aiSuggestions) return;

    if (type === "text") {
      setInsightText(aiSuggestions.refinedText);
    } else if (type === "theme" && aiSuggestions.suggestedThemes?.length > 0) {
      setCoreTheme(aiSuggestions.suggestedThemes[0]);
    } else if (type === "tags") {
      setSkillTags(aiSuggestions.recommendedTags || []);
    }

    toast.success("Applied suggestion");
  };

  const handleLinkDot = async () => {
    if (!selectedDotToLink || !connectionInsight.trim()) {
      toast.error("Please select a dot and provide connection insight");
      return;
    }

    if (!dot) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("dot_connections").insert({
      user_id: user.id,
      dot_id_1: dot.id,
      dot_id_2: selectedDotToLink,
      connection_type: "manual",
      connection_insight: connectionInsight,
      ai_generated: false,
    });

    if (error) {
      toast.error("Failed to link dots");
      return;
    }

    setLinkedDots([...linkedDots, selectedDotToLink]);
    setSelectedDotToLink("");
    setConnectionInsight("");
    toast.success("Dots linked successfully");
  };

  const handleSave = async () => {
    if (!dot) return;

    setIsSaving(true);

    const { error } = await supabase
      .from("insight_dots")
      .update({
        insight_text: insightText,
        core_theme: coreTheme,
        skill_tags: skillTags,
      })
      .eq("id", dot.id);

    setIsSaving(false);

    if (error) {
      toast.error("Failed to update dot");
      return;
    }

    toast.success("Dot updated successfully");
    onSave();
    onClose();
  };

  if (!dot) return null;

  const availableDotsToLink = allDots.filter(
    d => d.id !== dot.id && !linkedDots.includes(d.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Edit Insight Dot</span>
            <Button
              onClick={handleGetAISuggestions}
              disabled={isLoadingSuggestions}
              size="sm"
              variant="outline"
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {isLoadingSuggestions ? "Analyzing..." : "Get AI Suggestions"}
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {aiSuggestions && (
            <Alert className="bg-primary/5 border-primary/20">
              <Sparkles className="h-4 w-4" />
              <AlertDescription className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">Refined Text:</span>
                    <Button
                      onClick={() => applyAISuggestion("text")}
                      size="sm"
                      variant="ghost"
                      className="h-6 gap-1"
                    >
                      <Check className="h-3 w-3" />
                      Apply
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{aiSuggestions.refinedText}</p>
                </div>

                {aiSuggestions.suggestedThemes?.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm">Suggested Themes:</span>
                      <Button
                        onClick={() => applyAISuggestion("theme")}
                        size="sm"
                        variant="ghost"
                        className="h-6 gap-1"
                      >
                        <Check className="h-3 w-3" />
                        Apply First
                      </Button>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {aiSuggestions.suggestedThemes.map((theme: string) => (
                        <Badge key={theme} variant="secondary" className="text-xs">
                          {theme}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {aiSuggestions.recommendedTags?.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm">Recommended Tags:</span>
                      <Button
                        onClick={() => applyAISuggestion("tags")}
                        size="sm"
                        variant="ghost"
                        className="h-6 gap-1"
                      >
                        <Check className="h-3 w-3" />
                        Apply All
                      </Button>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {aiSuggestions.recommendedTags.map((tag: string) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {aiSuggestions.potentialConnections?.length > 0 && (
                  <div>
                    <span className="font-semibold text-sm">Potential Connections:</span>
                    <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                      {aiSuggestions.potentialConnections.map((conn: any, idx: number) => {
                        const connDot = allDots.find(d => d.id === conn.dotId);
                        return connDot ? (
                          <li key={idx}>→ {connDot.core_theme} ({conn.reason})</li>
                        ) : null;
                      })}
                    </ul>
                  </div>
                )}

                {aiSuggestions.improvementNotes && (
                  <p className="text-xs italic text-muted-foreground">
                    {aiSuggestions.improvementNotes}
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}
          <div>
            <Label htmlFor="insight-text">Insight Text</Label>
            <Textarea
              id="insight-text"
              value={insightText}
              onChange={(e) => setInsightText(e.target.value)}
              rows={4}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="core-theme">Core Theme</Label>
            <Input
              id="core-theme"
              value={coreTheme}
              onChange={(e) => setCoreTheme(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Skill Tags</Label>
            <div className="flex gap-2 mt-1 mb-2 flex-wrap">
              {skillTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleRemoveTag(tag)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                placeholder="Add a tag..."
              />
              <Button onClick={handleAddTag} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="border-t pt-4">
            <Label className="flex items-center gap-2 mb-3">
              <LinkIcon className="h-4 w-4" />
              Link Related Dots
            </Label>
            
            {linkedDots.length > 0 && (
              <div className="mb-3">
                <p className="text-sm text-muted-foreground mb-2">Connected to:</p>
                <div className="flex gap-2 flex-wrap">
                  {linkedDots.map((linkedId) => {
                    const linkedDot = allDots.find(d => d.id === linkedId);
                    return linkedDot ? (
                      <Badge key={linkedId} variant="outline">
                        {linkedDot.core_theme}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {availableDotsToLink.length > 0 && (
              <div className="space-y-2">
                <select
                  value={selectedDotToLink}
                  onChange={(e) => setSelectedDotToLink(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="">Select a dot to link...</option>
                  {availableDotsToLink.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.core_theme} - {d.source_type}
                    </option>
                  ))}
                </select>
                {selectedDotToLink && (
                  <>
                    <Textarea
                      value={connectionInsight}
                      onChange={(e) => setConnectionInsight(e.target.value)}
                      placeholder="Describe how these dots are connected..."
                      rows={2}
                    />
                    <Button onClick={handleLinkDot} size="sm" variant="outline">
                      Link Dots
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            <p><strong>Source:</strong> {dot.source_type}</p>
            <p><strong>Created:</strong> {new Date(dot.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
