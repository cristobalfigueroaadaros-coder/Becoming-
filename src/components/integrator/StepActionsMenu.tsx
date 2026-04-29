import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MoreVertical, Pencil, SkipForward, CalendarIcon } from "lucide-react";
import { format, parseISO, addDays } from "date-fns";

interface StepActionsMenuProps {
  stepId: string;
  stepTitle: string;
  stepDescription: string;
  scheduledDate: string;
  onEdit: (stepId: string, title: string, description: string) => Promise<void>;
  onSkip: (stepId: string, reason?: string) => Promise<void>;
  onReschedule: (stepId: string, newDate: Date) => Promise<void>;
}

export function StepActionsMenu({
  stepId,
  stepTitle,
  stepDescription,
  scheduledDate,
  onEdit,
  onSkip,
  onReschedule
}: StepActionsMenuProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [editedTitle, setEditedTitle] = useState(stepTitle);
  const [editedDescription, setEditedDescription] = useState(stepDescription);
  const [skipReason, setSkipReason] = useState("");
  const [newDate, setNewDate] = useState<Date | undefined>(addDays(parseISO(scheduledDate), 1));
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = async () => {
    setIsLoading(true);
    try {
      await onEdit(stepId, editedTitle, editedDescription);
      setShowEditDialog(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    setIsLoading(true);
    try {
      await onSkip(stepId, skipReason);
      setShowSkipDialog(false);
      setSkipReason("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!newDate) return;
    setIsLoading(true);
    try {
      await onReschedule(stepId, newDate);
      setShowRescheduleDialog(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
            <Pencil className="w-4 h-4 mr-2" />
            Edit Step
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowSkipDialog(true)}>
            <SkipForward className="w-4 h-4 mr-2" />
            Skip Today
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowRescheduleDialog(true)}>
            <CalendarIcon className="w-4 h-4 mr-2" />
            Reschedule
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Step</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder="Step title"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="What to do..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Skip Dialog */}
      <Dialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Skip Today's Step</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              It's okay to skip sometimes. This won't break your momentum.
            </p>
            <div>
              <label className="text-sm font-medium">Reason (optional)</label>
              <Textarea
                value={skipReason}
                onChange={(e) => setSkipReason(e.target.value)}
                placeholder="Why are you skipping today? This helps you reflect later..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSkipDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSkip} disabled={isLoading}>
              {isLoading ? 'Skipping...' : 'Skip Step'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Step</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Move this step to a different day.
            </p>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newDate ? format(newDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={newDate}
                  onSelect={setNewDate}
                  disabled={(date) => date <= new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRescheduleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleReschedule} disabled={isLoading || !newDate}>
              {isLoading ? 'Rescheduling...' : 'Reschedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
