import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Send, ChevronDown, ChevronUp, ImagePlus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { PostType } from "@/hooks/useCreatorPosts";

const POST_TYPES: { value: PostType; label: string; color: string }[] = [
  { value: "creating", label: "Creating something", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  { value: "working_on_self", label: "Working on myself", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  { value: "looking_for_help", label: "Looking for help", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  { value: "offering_help", label: "Offering help", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
];

const EXAMPLES = [
  "Starting a community project",
  "Building a purpose-driven business",
  "Helping families reconnect",
  "Working on healing myself",
  "Creating art that inspires people",
];

interface CreatePostFormProps {
  onSubmit: (post: { statement: string; post_type: PostType; goal?: string; next_step?: string; location?: string; image_url?: string }) => Promise<void>;
  isSubmitting: boolean;
}

export const CreatePostForm = ({ onSubmit, isSubmitting }: CreatePostFormProps) => {
  const [statement, setStatement] = useState("");
  const [postType, setPostType] = useState<PostType>("creating");
  const [goal, setGoal] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [location, setLocation] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showOptional, setShowOptional] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async () => {
    if (!statement.trim()) return;
    await onSubmit({
      statement: statement.trim(),
      post_type: postType,
      ...(goal.trim() && { goal: goal.trim() }),
      ...(nextStep.trim() && { next_step: nextStep.trim() }),
      ...(location.trim() && { location: location.trim() }),
      ...(imageUrl && { image_url: imageUrl }),
    });
    setStatement("");
    setGoal("");
    setNextStep("");
    setLocation("");
    setImageUrl("");
    setShowOptional(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("creator-images").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("creator-images").getPublicUrl(path);
      setImageUrl(urlData.publicUrl);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <p className="text-sm font-medium text-foreground">What are you creating for a better world?</p>

      <div className="flex flex-wrap gap-1.5">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => setStatement(ex)}
            className="text-[11px] px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
          >
            {ex}
          </button>
        ))}
      </div>

      <Textarea
        value={statement}
        onChange={(e) => setStatement(e.target.value)}
        placeholder="Share what you're creating..."
        className="min-h-[80px] resize-none"
        maxLength={500}
      />

      <div className="flex flex-wrap gap-1.5">
        {POST_TYPES.map((pt) => (
          <button
            key={pt.value}
            onClick={() => setPostType(pt.value)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full border transition-all",
              postType === pt.value ? pt.color : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {pt.label}
          </button>
        ))}
      </div>

      <button
        onClick={() => setShowOptional(!showOptional)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {showOptional ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {showOptional ? "Hide" : "Add"} goal, next step, location, or image
      </button>

      {showOptional && (
        <div className="space-y-2">
          <Input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Goal (e.g. Reach 100,000 parents)" maxLength={200} />
          <Input value={nextStep} onChange={(e) => setNextStep(e.target.value)} placeholder="Next step (e.g. Record the first episode)" maxLength={200} />
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location (optional)" maxLength={100} />
          
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground hover:text-foreground">
              <ImagePlus className="w-4 h-4" />
              {uploading ? "Uploading..." : "Add image"}
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
            </label>
            {imageUrl && (
              <div className="relative">
                <img src={imageUrl} alt="Preview" className="w-12 h-12 rounded-md object-cover" />
                <button onClick={() => setImageUrl("")} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <Button onClick={handleSubmit} disabled={!statement.trim() || isSubmitting} size="sm" className="w-full">
        <Send className="w-4 h-4 mr-1" />
        Share with the world
      </Button>
    </div>
  );
};
