import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, MessageSquare, Zap, CheckCircle, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { PhaseType, PhaseContentData, PhaseNote } from './types';
import { PHASE_CONFIG } from './constants';
import { useNavigate } from 'react-router-dom';

interface PhaseContentProps {
  phase: PhaseType;
  content: PhaseContentData;
  onClose: () => void;
  onAddNote: (note: string) => Promise<void>;
  onUpdateReflection: (response: string) => Promise<void>;
}

const SOURCE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  manual: PenLine,
  task: CheckCircle,
  mentor: MessageSquare,
  feedback: Zap,
  name_evolution: Zap,
};

const SOURCE_COLORS: Record<string, string> = {
  manual: 'bg-blue-500/20 text-blue-400',
  task: 'bg-green-500/20 text-green-400',
  mentor: 'bg-purple-500/20 text-purple-400',
  feedback: 'bg-amber-500/20 text-amber-400',
  name_evolution: 'bg-orange-500/20 text-orange-400',
};

export const PhaseContent: React.FC<PhaseContentProps> = ({
  phase,
  content,
  onClose,
  onAddNote,
  onUpdateReflection,
}) => {
  const config = PHASE_CONFIG[phase];
  const Icon = config.icon;
  const navigate = useNavigate();
  
  const [newNote, setNewNote] = useState('');
  const [reflection, setReflection] = useState(content.reflectionResponse || '');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isSavingReflection, setIsSavingReflection] = useState(false);

  const allNotes = [...content.notes, ...content.autoPopulatedItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setIsAddingNote(true);
    await onAddNote(newNote.trim());
    setNewNote('');
    setIsAddingNote(false);
  };

  const handleSaveReflection = async () => {
    setIsSavingReflection(true);
    await onUpdateReflection(reflection);
    setIsSavingReflection(false);
  };

  const handleMentorClick = () => {
    navigate(`/chat?mentor=${config.mentorType}`);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute inset-0 z-20 bg-background/98 backdrop-blur-lg rounded-2xl border border-border overflow-hidden"
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 border-b border-border"
        style={{ borderColor: config.borderColor }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: config.bgColor }}
          >
            <Icon className="w-5 h-5" style={{ color: config.color }} />
          </div>
          <div>
            <h2 className="font-semibold capitalize" style={{ color: config.color }}>
              {phase}
            </h2>
            <p className="text-xs text-muted-foreground">Design Thinking Phase</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100%-64px)]">
        <div className="p-4 space-y-6">
          {/* Core Question */}
          <div 
            className="p-4 rounded-xl"
            style={{ background: config.bgColor }}
          >
            <p className="text-sm font-medium" style={{ color: config.color }}>
              {config.coreQuestion}
            </p>
          </div>

          {/* Working Space */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">Working Space</h3>
              <Badge variant="outline" className="text-xs">
                {allNotes.length} items
              </Badge>
            </div>
            
            {/* Add note input */}
            <div className="flex gap-2">
              <Input
                placeholder="Add an observation or note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                className="flex-1"
              />
              <Button 
                size="icon" 
                onClick={handleAddNote}
                disabled={isAddingNote || !newNote.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Notes list */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {allNotes.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    No content yet in this phase.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={handleMentorClick}
                    className="gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Start a conversation
                  </Button>
                </div>
              ) : (
                allNotes.map((note) => {
                  const SourceIcon = SOURCE_ICONS[note.source] || Zap;
                  return (
                    <div 
                      key={note.id}
                      className="flex items-start gap-2 p-3 rounded-lg bg-muted/50"
                    >
                      <Badge className={`${SOURCE_COLORS[note.source] || 'bg-muted text-muted-foreground'} text-xs px-1.5`}>
                        <SourceIcon className="w-3 h-3" />
                      </Badge>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{note.text}</p>
                        {note.sourceContext && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            via {note.sourceContext}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Reflection Prompt */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Reflection</h3>
            <p className="text-xs text-muted-foreground italic">
              {config.reflectionPrompt}
            </p>
            <Textarea
              placeholder="Your thoughts..."
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              className="min-h-[80px] resize-none"
            />
            {reflection !== content.reflectionResponse && (
              <Button 
                size="sm" 
                onClick={handleSaveReflection}
                disabled={isSavingReflection}
              >
                {isSavingReflection ? 'Saving...' : 'Save Reflection'}
              </Button>
            )}
          </div>

          {/* Mentor Shortcut */}
          <Button 
            variant="outline" 
            className="w-full justify-center gap-2"
            style={{ 
              borderColor: config.borderColor,
              color: config.color,
            }}
            onClick={handleMentorClick}
          >
            <MessageSquare className="w-4 h-4" />
            {config.mentorLabel}
          </Button>
        </div>
      </ScrollArea>
    </motion.div>
  );
};
