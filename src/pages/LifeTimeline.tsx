import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, CalendarDays, Lightbulb, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LifetimeEventDetailView, LifetimeEventEditModal, LifetimeMapTimeline } from "@/components/lifetime-map";
import { TIME_PERIOD_LABELS, useLifetimeEvents, type EventType, type LifetimeEvent, type LifetimeEventCandidate, type LifetimeEventInput, type TimePeriod } from "@/hooks/useLifetimeEvents";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type MomentKind = "event" | "skill" | "realization" | "creation";

const QUICK_ADDS: Array<{ label: string; description: string; type: EventType; icon: typeof Plus; kind: MomentKind }> = [
  { label: "Life event", description: "A moment that shaped you", type: "change", icon: Plus, kind: "event" },
  { label: "Creation moment", description: "Something you are building now", type: "work", icon: Sparkles, kind: "creation" },
  { label: "Skill earned", description: "Something you learned to do", type: "work", icon: Sparkles, kind: "skill" },
  { label: "Realization", description: "Something you now understand", type: "identity", icon: Lightbulb, kind: "realization" },
];

const LifeTimeline = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { events, candidates, loading, createEvent, updateEvent, deleteEvent, markCandidateAdded, getEventsByPeriod } = useLifetimeEvents();
  const [editingEvent, setEditingEvent] = useState<LifetimeEvent | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<LifetimeEvent | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<LifetimeEventCandidate | null>(null);
  const [defaultTimePeriod, setDefaultTimePeriod] = useState<TimePeriod>("current");
  const [defaultEventType, setDefaultEventType] = useState<EventType | undefined>();
  const [defaultMomentKind, setDefaultMomentKind] = useState<MomentKind | undefined>();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [autoOpenHandled, setAutoOpenHandled] = useState(false);
  const mentorUnlockBridge = searchParams.get("unlock") === "mentor";
  const discoveryBridge = searchParams.get("unlock") === "discovery";
  const shouldAutoOpen = searchParams.get("new") === "1";
  const requestedEventId = searchParams.get("event");

  useEffect(() => {
    if (loading || !requestedEventId) return;
    const event = events.find((item) => item.id === requestedEventId);
    if (!event) return;
    setSelectedEvent(event);
    setIsDetailOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete("event");
    setSearchParams(next, { replace: true });
  }, [events, loading, requestedEventId, searchParams, setSearchParams]);

  const openNewEvent = (type?: EventType, period: TimePeriod = "current", kind?: MomentKind) => {
    setEditingEvent(null);
    setSelectedCandidate(null);
    setDefaultTimePeriod(period);
    setDefaultEventType(type);
    setDefaultMomentKind(kind);
    setIsEditorOpen(true);
  };

  const openCandidate = (candidate: LifetimeEventCandidate) => {
    setEditingEvent(null);
    setSelectedCandidate(candidate);
    setDefaultTimePeriod(candidate.suggested_time_period);
    setDefaultEventType(candidate.suggested_event_type || undefined);
    setDefaultMomentKind("event");
    setIsEditorOpen(true);
  };

  useEffect(() => {
    if (loading || autoOpenHandled || !shouldAutoOpen) return;
    setAutoOpenHandled(true);
    openNewEvent(discoveryBridge ? "change" : undefined, "current", discoveryBridge ? "event" : undefined);
  }, [autoOpenHandled, discoveryBridge, loading, shouldAutoOpen]);

  const syncAtlasDot = async (timelineEvent: LifetimeEvent) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: cluster } = await supabase
      .from("atlas_clusters")
      .select("id")
      .eq("slug", "life-events")
      .maybeSingle();
    if (!cluster) return;

    const dot = {
      cluster_id: cluster.id,
      title: timelineEvent.event_label,
      original_title: timelineEvent.event_label,
      short_description: timelineEvent.event_description || "Added from your Life Timeline.",
      original_description: timelineEvent.event_description || "Added from your Life Timeline.",
      dot_type: "timeline_moment",
      dot_category: "life_imprint",
      source_system: "life_timeline",
      origin: "user",
      confidence_score: 1,
      signal_strength: 1,
      user_validated: true,
      user_edited: false,
      signal_tags: { timeline_event_id: timelineEvent.id, event_type: timelineEvent.event_type },
    };

    const { data: existingDot } = await supabase
      .from("atlas_dots")
      .select("id")
      .eq("user_id", user.id)
      .eq("source_system", "life_timeline")
      .contains("signal_tags", { timeline_event_id: timelineEvent.id })
      .maybeSingle();

    if (existingDot) {
      await supabase.from("atlas_dots").update(dot as any).eq("id", existingDot.id);
    } else {
      await supabase.from("atlas_dots").insert({ ...dot, user_id: user.id } as any);
    }
    queryClient.invalidateQueries({ queryKey: ["atlas-dots"] });
  };

  const removeAtlasDot = async (timelineEventId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("atlas_dots")
      .delete()
      .eq("user_id", user.id)
      .eq("source_system", "life_timeline")
      .contains("signal_tags", { timeline_event_id: timelineEventId });
    queryClient.invalidateQueries({ queryKey: ["atlas-dots"] });
  };

  const saveEvent = async (data: LifetimeEventInput) => {
    if (editingEvent) {
      if (await updateEvent(editingEvent.id, data)) {
        await syncAtlasDot({ ...editingEvent, ...data, updated_at: new Date().toISOString() });
        toast.success("Timeline moment updated in your Atlas");
      }
      return;
    }
    const newEvent = await createEvent(data);
    if (newEvent) {
      await syncAtlasDot(newEvent);
      if (selectedCandidate) {
        await markCandidateAdded(selectedCandidate.id);
      }
      toast.success("Added to your Life Timeline and Atlas");
      if (discoveryBridge) {
        navigate("/atlas?intro=founder&next=quest", { replace: true });
      } else if (mentorUnlockBridge) {
        navigate("/council?view=intake", { replace: true });
      }
    }
  };

  if (loading) return <div className="min-h-screen bg-cosmic flex items-center justify-center text-sm text-muted-foreground">Loading your Life Timeline…</div>;

  return (
    <div className="min-h-screen bg-cosmic px-5 py-6 pb-28">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <button onClick={() => navigate("/atlas")} className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Atlas
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-[0_0_22px_hsl(265_90%_62%/0.24)]"><BookOpen className="h-5 w-5" /></div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Your Life Timeline</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {mentorUnlockBridge
                    ? "Save one meaningful anchor so your mentors can understand where your story is starting from."
                    : discoveryBridge
                    ? "Place one real moment so your Atlas starts connecting answers to your actual life."
                    : "Build the album of moments that shaped who you are becoming."}
                </p>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <Button onClick={() => openNewEvent()} variant={searchParams.get("from") === "onboarding" ? "outline" : "default"} className="rounded-full gap-2"><Plus className="h-4 w-4" /> Add moment</Button>
            {searchParams.get("from") === "onboarding" && (
              <Button onClick={() => navigate(`/future-self/discovery?mode=next&fresh=${Date.now()}`)}>
                Continue with Future Self
              </Button>
            )}
          </div>
        </div>

        {candidates.some((candidate) => candidate.status !== "dismissed") && (
          <Card className="border-primary/20 bg-primary/5 backdrop-blur-sm">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Moments Future Self noticed</p>
              <p className="mt-1 text-sm text-muted-foreground">Your conversations surfaced possible chapters for your personal album.</p>
              <div className="mt-4 space-y-2">
                {candidates
                  .filter((candidate) => candidate.status !== "dismissed")
                  .map((candidate) => {
                    const isAvailable = candidate.status === "available";
                    const isAdded = candidate.status === "added";
                    return (
                      <div key={candidate.id} className={`flex items-start justify-between gap-3 rounded-lg border p-3 ${isAvailable ? "border-primary/35 bg-background/50" : "border-border/50 bg-background/20 opacity-75"}`}>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{candidate.event_label}</p>
                          <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-primary">
                            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                            {TIME_PERIOD_LABELS[candidate.suggested_time_period]}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{candidate.event_description}</p>
                        </div>
                        {isAdded ? (
                          <span className="shrink-0 text-xs text-primary">Added</span>
                        ) : isAvailable ? (
                          <Button type="button" size="sm" className="shrink-0" onClick={() => openCandidate(candidate)}>
                            Add
                          </Button>
                        ) : (
                          <span className="shrink-0 text-xs text-muted-foreground">Locked</span>
                        )}
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}

        {(mentorUnlockBridge || discoveryBridge) && (
          <Card className="border-primary/25 bg-primary/5 backdrop-blur-sm">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                {discoveryBridge ? "Discovery bridge" : "Council bridge"}
              </p>
              <h2 className="mt-1 text-base font-semibold text-foreground">
                {discoveryBridge ? "Choose the moment your Atlas should anchor to" : "Choose the anchor your mentors should start from"}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {discoveryBridge
                  ? "It can be small: a move, a conversation, a childhood memory, a turning point, or a moment that explains why this matters."
                  : "It can be a life moment from the past, or a creation moment from what you are building now."}
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="border-primary/20 bg-card/60 backdrop-blur-sm"><CardContent className="grid gap-3 p-4 sm:grid-cols-4">
          {QUICK_ADDS.map(({ label, description, type, icon: Icon, kind }) => (
            <button key={label} onClick={() => openNewEvent(type, "current", kind)} className="rounded-xl border border-border/60 bg-background/30 p-4 text-left transition-colors hover:border-primary/45 hover:bg-primary/5">
              <Icon className="mb-2 h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Add a {label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            </button>
          ))}
        </CardContent></Card>

        <Card className="overflow-hidden border-slate-500/20 bg-gradient-to-br from-slate-500/10 via-card/70 to-transparent"><CardContent className="p-4 sm:p-6">
          <LifetimeMapTimeline
            events={events}
            eventsByPeriod={getEventsByPeriod()}
            onEventClick={(event) => { setSelectedEvent(event); setIsDetailOpen(true); }}
            onAddEvent={(period) => openNewEvent(undefined, period)}
          />
        </CardContent></Card>

        <p className="mx-auto max-w-2xl text-center text-xs leading-relaxed text-muted-foreground">Your timeline is private. Hard moments can stay unfinished; there is no pressure to turn them into a lesson. When you are ready, they can become part of a deeper reflection.</p>
      </div>

      <LifetimeEventEditModal
        open={isEditorOpen}
        onClose={() => { setIsEditorOpen(false); setEditingEvent(null); setSelectedCandidate(null); setDefaultEventType(undefined); setDefaultMomentKind(undefined); }}
        event={editingEvent}
        defaultTimePeriod={defaultTimePeriod}
        defaultEventType={selectedCandidate?.suggested_event_type || defaultEventType}
        defaultEventLabel={selectedCandidate?.event_label}
        defaultEventDescription={selectedCandidate?.event_description || undefined}
        momentKindOverride={selectedCandidate ? "event" : defaultMomentKind}
        onSave={saveEvent}
        onDelete={editingEvent ? async () => {
          if (await deleteEvent(editingEvent.id)) {
            await removeAtlasDot(editingEvent.id);
            toast.success("Timeline moment removed from your Atlas");
          }
        } : undefined}
      />
      <LifetimeEventDetailView
        event={selectedEvent}
        open={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedEvent(null); }}
        onGoToPatternMap={() => selectedEvent?.pattern_id && navigate(`/pattern-map/${selectedEvent.pattern_id}`)}
        onGoToTransmutation={() => navigate("/creation-lab?type=becoming")}
        onTalkToMentor={() => navigate(`/council?view=intake&source=life_timeline${selectedEvent ? `&event=${selectedEvent.id}` : ""}`)}
        onEdit={() => { if (selectedEvent) { setEditingEvent(selectedEvent); setIsDetailOpen(false); setIsEditorOpen(true); } }}
      />
    </div>
  );
};

export default LifeTimeline;
