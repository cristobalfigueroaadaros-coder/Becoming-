import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

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
  const [question, setQuestion] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

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

      // Save meeting
      await supabase.from("council_meetings").insert({
        user_id: user.id,
        question: question.trim(),
        answers: data.answers,
      });

      toast.success("Council has responded!");
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
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Council Responses</h2>
            {Object.entries(answers).map(([mentorType, answer]) => (
              <Card key={mentorType}>
                <CardHeader>
                  <CardTitle className="text-lg">{mentorNames[mentorType]}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{answer}</p>
                </CardContent>
              </Card>
            ))}
            <div className="flex flex-col sm:flex-row gap-3">
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
