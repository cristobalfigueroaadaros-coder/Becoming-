import { motion } from "framer-motion";
import { BookOpen, Map, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type AtlasJourneyPromptProps = {
  type: "lifetime_event" | "founder_journey";
  onAccept: () => void;
};

const CONTENT = {
  lifetime_event: {
    icon: BookOpen,
    eyebrow: "Your story has another layer",
    title: "Add a Life Event",
    body: "Your first two quests revealed what you can do and what gives you energy. Now add one moment that shaped you, so you can see it become part of your Atlas.",
    action: "Add a Life Event",
  },
  founder_journey: {
    icon: Map,
    eyebrow: "A map built from a life",
    title: "I’m Cris. This is my map.",
    body: "It shows the experiences, experiments, skills, and realizations that shaped my life until they connected into Bcoming. Explore it from the beginning as an example of how your own dots can become a direction.",
    action: "See Cris’s journey",
  },
} as const;

export const AtlasJourneyPrompt = ({ type, onAccept }: AtlasJourneyPromptProps) => {
  const content = CONTENT[type];
  const Icon = content.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-5 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 24 }}
        className="w-full max-w-sm"
      >
        <Card className="border-primary/30 bg-card/95 shadow-[0_0_42px_hsl(265_90%_62%/0.24)]">
          <CardContent className="p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Icon className="h-7 w-7" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">{content.eyebrow}</p>
            <h2 className="mt-2 text-2xl font-bold text-foreground">{content.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{content.body}</p>
            <Button onClick={onAccept} size="lg" className="mt-6 w-full gap-2">
              {content.action}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};