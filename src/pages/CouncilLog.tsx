import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const CouncilLog = () => {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [whispers, setWhispers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load meetings
      const { data: meetingsData, error: meetingsError } = await supabase
        .from("council_meetings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (meetingsError) throw meetingsError;
      setMeetings(meetingsData || []);

      // Load whispers
      const { data: whispersData, error: whispersError } = await supabase
        .from("daily_whispers")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (whispersError) throw whispersError;
      setWhispers(whispersData || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading your history...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold">Council Log</h1>
            <p className="text-muted-foreground mt-2">Your journey with the council</p>
          </div>
        </div>

        <Tabs defaultValue="meetings" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="meetings">Council Meetings</TabsTrigger>
            <TabsTrigger value="whispers">Daily Whispers</TabsTrigger>
          </TabsList>

          <TabsContent value="meetings" className="space-y-4 mt-6">
            {meetings.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No council meetings yet. Start one from your dashboard!
                </CardContent>
              </Card>
            ) : (
              meetings.map((meeting) => (
                <Card key={meeting.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {new Date(meeting.created_at).toLocaleDateString()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="font-semibold mb-2">Question:</p>
                      <p className="text-muted-foreground">{meeting.question}</p>
                      {meeting.emotional_tone && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">Emotional Tone:</span>
                          <span className="text-xs capitalize px-2 py-0.5 rounded-full bg-muted">
                            {meeting.emotional_tone}
                          </span>
                        </div>
                      )}
                      {meeting.threshold_moment && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs font-semibold text-primary">✨ Threshold Moment</span>
                        </div>
                      )}
                      {meeting.pattern_detected && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs font-medium text-destructive">
                            🔄 Pattern: {meeting.pattern_detected.replace(/_/g, ' ')}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Mentor Responses */}
                    <div className="space-y-3">
                      <p className="font-semibold">Responses:</p>
                      {Object.entries(meeting.answers).map(([mentorType, answer]) => {
                        const answerObj = typeof answer === 'object' && answer !== null 
                          ? (answer as any) 
                          : { short: answer };
                        const displayText = answerObj.short || (typeof answer === 'string' ? answer : JSON.stringify(answer));
                        return (
                          <div key={mentorType} className="pl-4 border-l-2 border-primary/20">
                            <p className="text-sm font-medium text-primary mb-1">
                              {mentorNames[mentorType]}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {displayText}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Banter Section */}
                    {meeting.banter && (
                      <div className="space-y-2 pt-2">
                        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                        <p className="text-sm font-semibold text-muted-foreground">🗣️ Council Banter</p>
                        <div className="bg-muted/30 rounded-lg p-3">
                          <p className="text-xs leading-relaxed whitespace-pre-line italic">
                            {meeting.banter}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Resolution Section */}
                    {meeting.resolution && (
                      <div className="space-y-2 pt-2">
                        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                        <p className="text-sm font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                          ✨ Council Resolution
                        </p>
                        <div className="bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-lg p-3">
                          <p className="text-xs leading-relaxed font-medium">
                            {meeting.resolution}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="whispers" className="space-y-4 mt-6">
            {whispers.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No daily whispers yet. They'll appear here each morning!
                </CardContent>
              </Card>
            ) : (
              whispers.map((whisper) => (
                <Card key={whisper.id}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>{mentorNames[whisper.mentor_type]}</span>
                      <span className="text-sm text-muted-foreground font-normal">
                        {new Date(whisper.created_at).toLocaleDateString()}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="italic">{whisper.message}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CouncilLog;
