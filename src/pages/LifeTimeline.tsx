import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Lightbulb, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LifetimeEventDetailView, LifetimeEventEditModal, LifetimeMapTimeline } from "@/components/lifetime-map";
import { useLifetimeEvents, type EventType, type LifetimeEvent, type LifetimeEventInput, type TimePeriod } from "@/hooks/useLifetimeEvents";
import { toast } from "sonner";

const QUICK_ADDS: Array<{ label: string; description: string; type: EventType; icon: typeof Plus }> = [
  { label: "Life event", description: "A moment that shaped you", type: "change", icon: Plus },
  { label: "Skill earned", description: "Something you learned to do", type: "work", icon: Sparkles },
  { label: "Realization", description: "Something you now understand", type: "identity", icon: Lightbulb },
];

const LifeTimeline = () => {
  const navigate = useNavigate();
  const { events, loading, createEvent, updateEvent, deleteEvent, getEventsByPeriod } = useLifetimeEvents();
  const [editingEvent, setEditingEvent] = useState<LifetimeEvent | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<LifetimeEvent | null>(null);
  const [defaultTimePeriod, setDefaultTimePeriod] = useState<TimePeriod>("current");
  const [defaultEventType, setDefaultEventType] = useState<EventType | undefined>();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const openNewEvent = (type?: EventType, period: TimePeriod = "current") => {
    setEditingEvent(null);
    setDefaultTimePeriod(period);
    setDefaultEventType(type);
    setIsEditorOpen(true);
  };

  const saveEvent = async (data: LifetimeEventInput) => {
    if (editingEvent) {
      if (await updateEvent(editingEvent.id, data)) toast.success("Timeline moment updated");
      return;
    }
    if (await createEvent(data)) toast.success("Added to your Life Timeline");
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
                <p className="mt-1 text-sm text-muted-foreground">Build the album of moments that shaped who you are becoming.</p>
              </div>
            </div>
          </div>
          <Button onClick={() => openNewEvent()} className="shrink-0 rounded-full gap-2"><Plus className="h-4 w-4" /> Add moment</Button>
        </div>

        <Card className="border-primary/20 bg-card/60 backdrop-blur-sm"><CardContent className="grid gap-3 p-4 sm:grid-cols-3">
          {QUICK_ADDS.map(({ label, description, type, icon: Icon }) => (
            <button key={label} onClick={() => openNewEvent(type)} className="rounded-xl border border-border/60 bg-background/30 p-4 text-left transition-colors hover:border-primary/45 hover:bg-primary/5">
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
        onClose={() => { setIsEditorOpen(false); setEditingEvent(null); setDefaultEventType(undefined); }}
        event={editingEvent}
        defaultTimePeriod={defaultTimePeriod}
        defaultEventType={defaultEventType}
        onSave={saveEvent}
        onDelete={editingEvent ? async () => { if (await deleteEvent(editingEvent.id)) toast.success("Timeline moment removed"); } : undefined}
      />
      <LifetimeEventDetailView
        event={selectedEvent}
        open={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedEvent(null); }}
        onGoToPatternMap={() => selectedEvent?.pattern_id && navigate(`/pattern-map/${selectedEvent.pattern_id}`)}
        onGoToTransmutation={() => navigate("/creation-lab?type=becoming")}
        onTalkToMentor={() => navigate("/council?view=future_self&source=life_timeline")}
        onEdit={() => { if (selectedEvent) { setEditingEvent(selectedEvent); setIsDetailOpen(false); setIsEditorOpen(true); } }}
      />
    </div>
  );
};

export default LifeTimeline;
