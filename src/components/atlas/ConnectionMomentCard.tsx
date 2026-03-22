import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface ConnectionMomentCardProps {
  questIndex: number; // 0-based (2, 5, 8, 12)
  userDots: { title: string; dot_category?: string; cluster_id?: string }[];
  onContinue: () => void;
  isIdentityMoment?: boolean; // quest 13 (index 12)
}

export const ConnectionMomentCard = ({ questIndex, userDots, onContinue, isIdentityMoment }: ConnectionMomentCardProps) => {
  const [reflection, setReflection] = useState<string | null>(null);
  const [identityStatement, setIdentityStatement] = useState<string | null>(null);
  const [supportingLines, setSupportingLines] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReflection = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("generate-atlas-dot", {
          body: {
            mode: "connection_moment",
            questIndex,
            recentDots: userDots.map(d => ({ title: d.title, dotCategory: d.dot_category || "strength" })),
            isIdentityMoment: !!isIdentityMoment,
          },
        });
        if (error) throw error;
        if (data?.reflection) setReflection(data.reflection);
        if (data?.identityStatement) setIdentityStatement(data.identityStatement);
        if (data?.supportingLines) setSupportingLines(data.supportingLines);
      } catch (err) {
        console.error("Connection moment generation failed:", err);
        setReflection("Your discoveries are forming a pattern. Each one reveals more about who you are.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchReflection();
  }, [questIndex, isIdentityMoment]);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Connecting your discoveries…</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm mx-auto flex flex-col items-center gap-5 px-4"
    >
      <div className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(40 80% 55% / 0.3))" }}
      >
        <Sparkles className="w-6 h-6 text-primary" />
      </div>

      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {isIdentityMoment ? "Your Identity Direction" : "Connection Moment"}
      </p>

      {/* Referenced dots */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {userDots.slice(-3).map((dot, i) => (
          <span
            key={i}
            className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
          >
            {dot.title}
          </span>
        ))}
      </div>

      {/* Reflection text */}
      {reflection && (
        <p className="text-sm text-foreground leading-relaxed text-center italic">
          {reflection}
        </p>
      )}

      {/* Identity statement (quest 13 only) */}
      {isIdentityMoment && identityStatement && (
        <div className="mt-2 p-4 rounded-xl border border-primary/20"
          style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.05), hsl(40 80% 55% / 0.05))" }}
        >
          <p className="text-sm font-semibold text-foreground text-center leading-relaxed">
            {identityStatement}
          </p>
        </div>
      )}

      {/* Supporting lines */}
      {supportingLines.length > 0 && (
        <div className="space-y-1.5 w-full">
          {supportingLines.map((line, i) => (
            <p key={i} className="text-xs text-muted-foreground text-center">{line}</p>
          ))}
        </div>
      )}

      <Button onClick={onContinue} className="mt-3 gap-2" size="sm">
        {isIdentityMoment ? "See Your Atlas" : "Continue"}
        <ArrowRight className="w-4 h-4" />
      </Button>
    </motion.div>
  );
};
