import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertCircle, Edit2, Save, X } from "lucide-react";

const CHALLENGE_TYPES = [
  "Fear",
  "Confidence",
  "Money",
  "Direction",
  "Discipline",
  "Relationships",
  "Health",
  "Creativity",
  "Other"
];

export const CurrentChallengeCard = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentChallenge, setCurrentChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");

  useEffect(() => {
    loadChallenge();
  }, []);

  const loadChallenge = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("current_challenge")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading challenge:", error);
        return;
      }

      if (data) {
        setCurrentChallenge(data);
        setTitle(data.challenge_title);
        setDescription(data.challenge_description);
        setType(data.challenge_type);
      } else {
        setIsEditing(true);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !description.trim() || !type) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const challengeData = {
        user_id: user.id,
        challenge_title: title.trim(),
        challenge_description: description.trim(),
        challenge_type: type
      };

      if (currentChallenge) {
        const { error } = await supabase
          .from("current_challenge")
          .update(challengeData)
          .eq("id", currentChallenge.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("current_challenge")
          .insert(challengeData);

        if (error) throw error;
      }

      toast.success("Challenge updated");
      setIsEditing(false);
      loadChallenge();
    } catch (error) {
      console.error("Error saving challenge:", error);
      toast.error("Failed to save challenge");
    }
  };

  const handleCancel = () => {
    if (currentChallenge) {
      setTitle(currentChallenge.challenge_title);
      setDescription(currentChallenge.challenge_description);
      setType(currentChallenge.challenge_type);
      setIsEditing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              Current Challenge
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              What feels hardest right now?
            </p>
          </div>
          {!isEditing && currentChallenge && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Challenge Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Starting my business"
                maxLength={100}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what makes this challenging for you (1-3 sentences)"
                rows={3}
                maxLength={300}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Challenge Type</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {CHALLENGE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Save Challenge
              </Button>
              {currentChallenge && (
                <Button onClick={handleCancel} variant="outline">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        ) : currentChallenge ? (
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-lg">{currentChallenge.challenge_title}</h4>
              <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs rounded-full mt-1">
                {currentChallenge.challenge_type}
              </span>
            </div>
            <p className="text-muted-foreground">{currentChallenge.challenge_description}</p>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-4">
            No current challenge set
          </div>
        )}
      </CardContent>
    </Card>
  );
};