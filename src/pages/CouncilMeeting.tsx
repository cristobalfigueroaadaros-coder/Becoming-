import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { useShadowEncounters } from "@/hooks/useShadowEncounters";
import { motion, AnimatePresence } from "framer-motion";

const mentorNames: Record<string, string> = {
  mamba_mentor: "Mamba Mentor",
  creative_visionary: "Creative Visionary",
  quantum_inventor: "Quantum Inventor",
  ancient_sage: "Ancient Sage",
  compassionate_elder: "Compassionate Elder",
  future_self: "Future Self",
  business_mentor: "Business Mentor",
  creator_mentor: "Creator Mentor",
  mystic_mentor: "Mystic Mentor",
  heart_mentor: "Heart Mentor",
  strategist_mentor: "Strategist Mentor",
  explorer_mentor: "Explorer Mentor",
};

const CouncilMeeting = () => {
  const navigate = useNavigate();
  const { refetch } = useShadowEncounters();
  const [question, setQuestion] = useState("");
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [expandedMentors, setExpandedMentors] = useState<Set<string>>(new Set());
  const [banter, setBanter] = useState("");
  const [shadowInterruption, setShadowInterruption] = useState("");
  const [resolution, setResolution] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleExpand = (mentorType: string) => {
    setExpandedMentors((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(mentorType)) {
        newSet.delete(mentorType);
      } else {
        newSet.add(mentorType);
      }
      return newSet;
    });
  };

  const handleAsk = async () => {
    if (!question.trim() || loading) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get user's mentors
      const { data: mentors, error: mentorsError } = await supabase
        .from("user_mentors")
        .select("mentor_type")
        .eq("user_id", user.id);

      if (mentorsError) throw mentorsError;

      // Call council meeting function
      const { data, error } = await supabase.functions.invoke("council-meeting", {
        body: {
          question: question.trim(),
          mentorTypes: [...mentors.map(m => m.mentor_type), "future_self"],
        },
      });

      if (error) throw error;

      setAnswers(data.answers);
      setBanter(data.banter || "");
      setShadowInterruption(data.shadowInterruption || "");
      setResolution(data.resolution || "");

      // Save meeting with banter and resolution
      await supabase.from("council_meetings").insert({
        user_id: user.id,
        question: question.trim(),
        answers: data.answers,
        banter: data.banter || null,
        resolution: data.resolution || null,
        shadow_triggers: data.shadowTriggers || {},
      });

      toast.success("Council has responded!");
      
      // Immediately check for shadow encounters
      refetch();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold">Council Meeting</h1>
            <p className="text-muted-foreground mt-2">Ask one question, hear from all mentors</p>
          </div>
        </div>

        {/* Question Input */}
        <Card>
          <CardHeader>
            <CardTitle>Your Question</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="What question would you like to ask your council?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={4}
              disabled={loading || Object.keys(answers).length > 0}
            />
            <Button
              onClick={handleAsk}
              disabled={loading || !question.trim() || Object.keys(answers).length > 0}
              className="w-full"
              size="lg"
            >
              {loading ? "Consulting the council..." : "Ask the Council"}
            </Button>
          </CardContent>
        </Card>

        {/* Answers */}
        {Object.keys(answers).length > 0 && (
          <div className="space-y-6">
            {/* Mentor Responses */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Council Responses
              </h2>
              {Object.entries(answers).map(([mentorType, answer]) => {
                const isExpanded = expandedMentors.has(mentorType);
                const answerObj = typeof answer === 'object' ? answer : { short: answer, expanded: answer };
                
                return (
                  <Card key={mentorType} className="border-l-4 border-l-primary/50 overflow-hidden">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        {mentorNames[mentorType]}
                        {answerObj.coreTheme && (
                          <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded-full">
                            {answerObj.coreTheme}
                          </span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Short Response */}
                      <p className="text-sm sm:text-base leading-relaxed font-medium">
                        {answerObj.short}
                      </p>
                      
                      {/* Expanded Response */}
                      <AnimatePresence>
                        {isExpanded && answerObj.expanded !== answerObj.short && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                          >
                            <div className="pt-3 border-t border-border/50">
                              <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                                {answerObj.expanded}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      {/* Expand Button */}
                      {answerObj.expanded !== answerObj.short && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand(mentorType)}
                          className="w-full text-xs hover:bg-primary/10"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-3 h-3 mr-1" />
                              Show less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3 h-3 mr-1" />
                              Expand for deeper insight
                            </>
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Banter Section */}
            {banter && (
              <div className="space-y-3">
                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-muted-foreground">
                    🗣️ Council Banter
                  </h3>
                  <Card className="bg-muted/30">
                    <CardContent className="pt-4">
                      <p className="text-sm leading-relaxed whitespace-pre-line italic">
                        {banter}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Shadow Interruption */}
            {shadowInterruption && (
              <div className="space-y-3">
                <div className="h-px bg-gradient-to-r from-transparent via-destructive to-transparent opacity-50" />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-destructive">
                    👤 Shadow Intrudes
                  </h3>
                  <Card className="border-destructive/50 bg-destructive/5">
                    <CardContent className="pt-4">
                      <p className="text-sm leading-relaxed font-medium text-destructive">
                        {shadowInterruption}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Resolution Section */}
            {resolution && (
              <div className="space-y-3">
                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    ✨ Council Resolution
                  </h3>
                  <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
                    <CardContent className="pt-4">
                      <p className="text-sm sm:text-base leading-relaxed font-medium">
                        {resolution}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={() => navigate("/my-tasks")}
                className="flex-1"
                size="lg"
              >
                View Tasks
              </Button>
              <Button
                onClick={() => {
                  setQuestion("");
                  setAnswers({});
                  setBanter("");
                  setShadowInterruption("");
                  setResolution("");
                }}
                variant="outline"
                className="flex-1"
              >
                Ask Another Question
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CouncilMeeting;
