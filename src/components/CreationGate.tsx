import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Share2, MessageCircle, Gift, Sparkles, Upload, Link, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CreationGateProps {
  path: "create_share" | "test_idea" | "offer_something";
  onComplete: () => void;
  onCancel?: () => void;
}

const pathConfig = {
  create_share: {
    title: "Create & Share",
    icon: Share2,
    color: "from-purple-500 to-pink-500",
    description: "Share proof of what you created",
    prompts: [
      "What did you create?",
      "Where did you share it?",
      "How did it feel to put it out there?"
    ]
  },
  test_idea: {
    title: "Test an Idea",
    icon: MessageCircle,
    color: "from-blue-500 to-cyan-500",
    description: "Tell us about your conversation",
    prompts: [
      "Who did you talk to?",
      "What did you ask them?",
      "What did you learn?"
    ]
  },
  offer_something: {
    title: "Offer Something",
    icon: Gift,
    color: "from-emerald-500 to-teal-500",
    description: "Describe what you offered",
    prompts: [
      "What did you offer?",
      "Who did you offer it to?",
      "What was the response?"
    ]
  }
};

export const CreationGate = ({ path, onComplete, onCancel }: CreationGateProps) => {
  const [proofType, setProofType] = useState<"link" | "text" | "description">("description");
  const [linkValue, setLinkValue] = useState("");
  const [textValue, setTextValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const config = pathConfig[path];
  const Icon = config.icon;

  const hasValidProof = () => {
    if (proofType === "link") return linkValue.trim().length > 0;
    if (proofType === "text" || proofType === "description") return textValue.trim().length > 20;
    return false;
  };

  const handleSubmit = async () => {
    if (!hasValidProof()) {
      toast.error("Please provide more detail about what you did");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const proofContent = proofType === "link" ? linkValue : textValue;

      // Save proof to first_win_proofs table
      const { error: proofError } = await supabase
        .from("first_win_proofs")
        .insert({
          user_id: user.id,
          path_type: path,
          proof_type: proofType,
          proof_content: proofContent
        });

      if (proofError) throw proofError;

      // Update profile with creation gate completion
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_win_path: path,
          first_win_proof_text: proofType !== "link" ? proofContent : null,
          first_win_proof_url: proofType === "link" ? linkValue : null,
          creation_gate_passed_at: new Date().toISOString(),
          first_win_completed_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      toast.success("🎉 You did it! Your first win is complete!");
      onComplete();
    } catch (error: any) {
      console.error("Error saving proof:", error);
      toast.error(error.message || "Failed to save your proof");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-2xl space-y-6 my-8"
      >
        {/* Header */}
        <div className="text-center space-y-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className={cn(
              "w-20 h-20 rounded-3xl flex items-center justify-center mx-auto bg-gradient-to-br",
              config.color
            )}
          >
            <Icon className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold">Creation Gate</h1>
          <p className="text-muted-foreground">
            This is your rite of passage. Share proof of your first external action.
          </p>
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 max-w-md mx-auto">
            <p className="text-sm text-primary font-medium italic">
              "This is not who you are forever. This is who you are becoming right now."
            </p>
          </div>
        </div>

        {/* Main Card */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {config.description}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Proof Type Selection */}
            <div className="space-y-3">
              <Label>How would you like to share your proof?</Label>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={proofType === "description" ? "default" : "outline"}
                  onClick={() => setProofType("description")}
                  className="flex flex-col items-center gap-2 h-auto py-4"
                >
                  <FileText className="w-5 h-5" />
                  <span className="text-xs">Describe It</span>
                </Button>
                <Button
                  variant={proofType === "link" ? "default" : "outline"}
                  onClick={() => setProofType("link")}
                  className="flex flex-col items-center gap-2 h-auto py-4"
                >
                  <Link className="w-5 h-5" />
                  <span className="text-xs">Share Link</span>
                </Button>
                <Button
                  variant={proofType === "text" ? "default" : "outline"}
                  onClick={() => setProofType("text")}
                  className="flex flex-col items-center gap-2 h-auto py-4"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-xs">Paste Text</span>
                </Button>
              </div>
            </div>

            {/* Proof Input */}
            <div className="space-y-3">
              {proofType === "link" && (
                <div className="space-y-2">
                  <Label>Link to your creation</Label>
                  <Input
                    placeholder="https://..."
                    value={linkValue}
                    onChange={(e) => setLinkValue(e.target.value)}
                    className="text-lg"
                  />
                  <p className="text-xs text-muted-foreground">
                    Share a link to your post, message, or offer
                  </p>
                </div>
              )}

              {(proofType === "text" || proofType === "description") && (
                <div className="space-y-2">
                  <Label>
                    {proofType === "description" 
                      ? "Describe what you did" 
                      : "Paste the content you shared"}
                  </Label>
                  <Textarea
                    placeholder={
                      proofType === "description"
                        ? `${config.prompts.join("\n")}`
                        : "Paste the actual content here..."
                    }
                    value={textValue}
                    onChange={(e) => setTextValue(e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    {proofType === "description"
                      ? "Be specific about what you created, who you shared it with, and how it felt"
                      : "Copy and paste the actual content you shared"}
                  </p>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="space-y-3 pt-4">
              <Button
                onClick={handleSubmit}
                disabled={!hasValidProof() || submitting}
                className="w-full text-lg py-6"
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Completing your First Win...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    I've Done It
                  </>
                )}
              </Button>

              {onCancel && (
                <Button
                  variant="ghost"
                  onClick={onCancel}
                  className="w-full text-muted-foreground"
                  disabled={submitting}
                >
                  I haven't done it yet
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Encouragement */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-muted-foreground"
        >
          Remember: Small imperfect action beats endless reflection.
          <br />
          You're not committing to forever — you're proving to yourself that you can move.
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

export default CreationGate;
