import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  LifetimeEvent, 
  LifetimeEventInput,
  TimePeriod, 
  EventType,
  TIME_PERIODS,
  TIME_PERIOD_LABELS,
  EVENT_TYPES,
  EVENT_TYPE_CONFIG,
} from "@/hooks/useLifetimeEvents";
import { cn } from "@/lib/utils";
import { Trash2, Loader2 } from "lucide-react";

interface LifetimeEventEditModalProps {
  open: boolean;
  onClose: () => void;
  event?: LifetimeEvent | null;
  defaultTimePeriod?: TimePeriod;
  onSave: (data: LifetimeEventInput) => Promise<void>;
  onDelete?: () => Promise<void>;
}

const PLACEHOLDER_EXAMPLES = [
  "My parents separated",
  "I moved to a new country alone",
  "I had an injury that changed my life",
  "I lost someone I loved",
  "My first business failed",
  "A breakup that broke me",
  "I felt rejected and humiliated",
  "I lost trust in someone",
];

export const LifetimeEventEditModal = ({
  open,
  onClose,
  event,
  defaultTimePeriod = 'current',
  onSave,
  onDelete,
}: LifetimeEventEditModalProps) => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(defaultTimePeriod);
  const [eventLabel, setEventLabel] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isEditing = !!event;
  const randomPlaceholder = PLACEHOLDER_EXAMPLES[Math.floor(Math.random() * PLACEHOLDER_EXAMPLES.length)];

  useEffect(() => {
    if (event) {
      setTimePeriod(event.time_period);
      setEventLabel(event.event_label);
      setEventDescription(event.event_description || "");
      setEventType(event.event_type);
    } else {
      setTimePeriod(defaultTimePeriod);
      setEventLabel("");
      setEventDescription("");
      setEventType(null);
    }
    setShowDeleteConfirm(false);
  }, [event, defaultTimePeriod, open]);

  const handleSave = async () => {
    if (!eventLabel.trim()) return;

    setSaving(true);
    try {
      await onSave({
        time_period: timePeriod,
        event_label: eventLabel.trim(),
        event_description: eventDescription.trim() || undefined,
        event_type: eventType || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    setDeleting(true);
    try {
      await onDelete();
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Life Event" : "Add Life Event"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Time Period */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">When did this happen?</Label>
            <div className="flex flex-wrap gap-2">
              {TIME_PERIODS.map((period) => (
                <Button
                  key={period}
                  type="button"
                  variant={timePeriod === period ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "text-xs",
                    timePeriod === period && "bg-primary"
                  )}
                  onClick={() => setTimePeriod(period)}
                >
                  {TIME_PERIOD_LABELS[period]}
                </Button>
              ))}
            </div>
          </div>

          {/* Event Label */}
          <div className="space-y-2">
            <Label htmlFor="event-label" className="text-sm font-medium">
              What happened?
            </Label>
            <Input
              id="event-label"
              value={eventLabel}
              onChange={(e) => setEventLabel(e.target.value)}
              placeholder={randomPlaceholder}
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              A brief label for this life event
            </p>
          </div>

          {/* Event Type (Optional) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Category <span className="text-muted-foreground">(optional)</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map((type) => {
                const config = EVENT_TYPE_CONFIG[type];
                const isSelected = eventType === type;
                return (
                  <Badge
                    key={type}
                    variant={isSelected ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-all text-xs",
                      isSelected && "bg-primary border-primary"
                    )}
                    onClick={() => setEventType(isSelected ? null : type)}
                  >
                    {config.label}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Description (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              More details <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="description"
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder="Share as much or as little as you want..."
              className="text-sm min-h-[80px] resize-none"
            />
          </div>

          {/* Pattern info (read-only if linked) */}
          {event?.pattern_name && (
            <div className="bg-indigo-500/10 rounded-lg p-3 space-y-1">
              <p className="text-xs text-indigo-400 font-medium">Linked Pattern</p>
              <p className="text-sm font-medium">{event.pattern_name}</p>
            </div>
          )}

          {/* Gold outcome (read-only if transmuted) */}
          {event?.is_transmuted && event?.gold_outcome && (
            <div className="bg-amber-500/10 rounded-lg p-3 space-y-1">
              <p className="text-xs text-amber-400 font-medium">Gold Insight</p>
              <p className="text-sm italic">"{event.gold_outcome}"</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {isEditing && onDelete && !showDeleteConfirm && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}

            {showDeleteConfirm && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2"
              >
                <span className="text-xs text-destructive">Delete?</span>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={deleting}
                  onClick={handleDelete}
                >
                  {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Yes"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  No
                </Button>
              </motion.div>
            )}

            <div className="flex-1" />

            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!eventLabel.trim() || saving}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isEditing ? (
                "Save"
              ) : (
                "Add Event"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
