import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Target, ArrowRight, UserPlus, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { SEED_POSTS } from "@/data/seedCreators";
import { StartChatModal } from "@/components/creators/StartChatModal";

const CreatorProfile = () => {
  const { creatorId } = useParams<{ creatorId: string }>();
  const navigate = useNavigate();
  const [chatModalOpen, setChatModalOpen] = useState(false);

  const isSeed = creatorId?.startsWith("seed-");
  const seedPost = isSeed ? SEED_POSTS.find(p => p.id === creatorId) : null;

  if (!seedPost && isSeed) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">Creator not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate("/creators")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Creators
        </Button>
      </div>
    );
  }

  // For now only seed data is supported
  const name = seedPost?.name || "Creator";
  const location = seedPost?.location || "";
  const statement = seedPost?.statement || "";
  const goal = seedPost?.goal || "";
  const nextStep = seedPost?.next_step || "";
  const emoji = seedPost?.emoji || "🌟";
  const gradient = seedPost?.gradient || { from: "#6366f1", to: "#a78bfa" };
  const category = seedPost?.category || "";

  const handleConnect = () => {
    if (isSeed) {
      toast({ title: "This is a demo creator", description: "Sign up and post to connect with real creators!" });
      return;
    }
  };

  const handleStartChat = () => {
    if (isSeed) {
      toast({ title: "This is a demo creator", description: "Sign up and post to connect with real creators!" });
      return;
    }
    setChatModalOpen(true);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate("/creators")} className="gap-1.5">
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>

      {/* Profile header */}
      <div className="text-center space-y-3">
        <div
          className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-4xl"
          style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
        >
          {emoji}
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">{name}</h1>
          <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" /> {location}
          </div>
          {category && (
            <Badge variant="secondary" className="mt-2 text-xs">
              {category}
            </Badge>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-3 pt-1">
          <Button variant="outline" size="sm" onClick={handleConnect} className="gap-1.5">
            <UserPlus className="w-3.5 h-3.5" /> Connect
          </Button>
          <Button size="sm" onClick={handleStartChat} className="gap-1.5">
            <MessageCircle className="w-3.5 h-3.5" /> Start Chat
          </Button>
        </div>
      </div>

      {/* What I'm creating */}
      <Card className="p-4 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">What I'm creating</h2>
        <p className="text-sm text-foreground/80 leading-relaxed">{statement}</p>
      </Card>

      {/* Goal */}
      {goal && (
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-1.5">
            <Target className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Goal</h2>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">{goal}</p>
        </Card>
      )}

      {/* Next step */}
      {nextStep && (
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-1.5">
            <ArrowRight className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Next step</h2>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">{nextStep}</p>
        </Card>
      )}

      {/* Gradient banner */}
      <div
        className="rounded-xl h-32 flex items-center justify-center text-5xl"
        style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
      >
        {emoji}
      </div>

      <div className="h-4" />

      {!isSeed && (
        <StartChatModal
          open={chatModalOpen}
          onOpenChange={setChatModalOpen}
          creatorName={name}
          receiverId={creatorId || ""}
        />
      )}
    </div>
  );
};

export default CreatorProfile;
