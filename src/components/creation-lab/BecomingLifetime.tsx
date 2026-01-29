import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LifetimeMapTimeline,
  LifetimeEventEditModal,
  LifetimeEventDetailView,
} from "@/components/lifetime-map";
import type {
  LifetimeEvent,
  LifetimeEventInput,
  TimePeriod,
} from "@/hooks/useLifetimeEvents";
import { toast } from "sonner";
import type { BecomingMode } from "./BecomingModeSelector";

interface BecomingLifetimeProps {
  events: LifetimeEvent[];
  eventsByPeriod: Record<TimePeriod, LifetimeEvent[]>;
  onCreateEvent: (data: LifetimeEventInput) => Promise<LifetimeEvent | null>;
  onUpdateEvent: (id: string, data: Partial<LifetimeEventInput>) => Promise<boolean>;
  onDeleteEvent: (id: string) => Promise<boolean>;
  onModeChange: (mode: BecomingMode) => void;
  currentPatternId?: string | null;
}

export const BecomingLifetime = ({
  events,
  eventsByPeriod,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
  onModeChange,
  currentPatternId,
}: BecomingLifetimeProps) => {
  const navigate = useNavigate();

  const [editingEvent, setEditingEvent] = useState<LifetimeEvent | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [defaultTimePeriod, setDefaultTimePeriod] = useState<TimePeriod>("current");
  const [selectedEvent, setSelectedEvent] = useState<LifetimeEvent | null>(null);
  const [showDetailView, setShowDetailView] = useState(false);

  const handleEventClick = (event: LifetimeEvent) => {
    setSelectedEvent(event);
    setShowDetailView(true);
  };

  const handleAddEvent = (timePeriod: TimePeriod) => {
    setDefaultTimePeriod(timePeriod);
    setEditingEvent(null);
    setShowEditModal(true);
  };

  const handleEventSave = async (data: LifetimeEventInput) => {
    if (editingEvent) {
      await onUpdateEvent(editingEvent.id, data);
      toast.success("Event updated");
    } else {
      // Link to current pattern if one is selected
      const eventData = currentPatternId
        ? { ...data, pattern_id: currentPatternId }
        : data;
      await onCreateEvent(eventData);
      toast.success("Event added to your timeline");
    }
    setShowEditModal(false);
    setEditingEvent(null);
  };

  const handleEventDelete = async () => {
    if (editingEvent) {
      await onDeleteEvent(editingEvent.id);
      toast.success("Event removed");
      setShowEditModal(false);
      setEditingEvent(null);
    }
  };

  const handleGoToPatternMap = () => {
    setShowDetailView(false);
    onModeChange("pattern-map");
  };

  const handleGoToTransmutation = () => {
    setShowDetailView(false);
    onModeChange("transmutation");
  };

  const handleTalkToMentor = () => {
    setShowDetailView(false);
    navigate("/council?view=inner_clarity_mentor");
  };

  const handleEditEvent = () => {
    if (selectedEvent) {
      setEditingEvent(selectedEvent);
      setShowDetailView(false);
      setShowEditModal(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Lifetime Map Card */}
      <Card className="border-slate-500/20 bg-gradient-to-br from-slate-500/5 to-transparent overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Your Life Journey</CardTitle>
              <p className="text-sm text-muted-foreground">
                Every moment shaped who you're becoming
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <LifetimeMapTimeline
            events={events}
            eventsByPeriod={eventsByPeriod}
            onEventClick={handleEventClick}
            onAddEvent={handleAddEvent}
            currentPatternId={currentPatternId || undefined}
          />
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <LifetimeEventEditModal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingEvent(null);
        }}
        event={editingEvent}
        defaultTimePeriod={defaultTimePeriod}
        onSave={handleEventSave}
        onDelete={editingEvent ? handleEventDelete : undefined}
      />

      {/* Detail View */}
      {selectedEvent && (
        <LifetimeEventDetailView
          open={showDetailView}
          onClose={() => setShowDetailView(false)}
          event={selectedEvent}
          onGoToPatternMap={selectedEvent.pattern_id ? handleGoToPatternMap : undefined}
          onGoToTransmutation={selectedEvent.pattern_id ? handleGoToTransmutation : undefined}
          onTalkToMentor={handleTalkToMentor}
          onEdit={handleEditEvent}
        />
      )}
    </motion.div>
  );
};
