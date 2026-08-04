import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, MessageSquare, Zap, CheckCircle, PenLine, RefreshCw, Sparkles, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { PhaseType, PhaseContentData, PhaseNote } from './types';
import { PHASE_CONFIG, PHASE_PLACEHOLDERS } from './constants';
import { DefinePhaseClarificationPrompt } from './DefinePhaseClarificationPrompt';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { canonicalizeMentorType } from '@/lib/mentorTypes';

interface PhaseContentProps {
  phase: PhaseType;
  content: PhaseContentData;
  needsProblemClarification?: boolean;
  projectId?: string;
  projectName?: string;
  isCurrentIterationActive?: boolean;
  onClose: () => void;
  onAddNote: (note: string) => Promise<void>;
  onUpdateReflection: (response: string) => Promise<void>;
  onCompleteIteration?: () => Promise<void>;
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
  needsProblemClarification = false,
  projectId,
  projectName,
  isCurrentIterationActive = true,
  onClose,
  onAddNote,
  onUpdateReflection,
  onCompleteIteration,
}) => {
  const config = PHASE_CONFIG[phase];
  const Icon = config.icon;
  const navigate = useNavigate();

  const [newNote, setNewNote] = useState('');
  const [reflection, setReflection] = useState(content.reflectionResponse || '');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isSavingReflection, setIsSavingReflection] = useState(false);
  const [isCompletingIteration, setIsCompletingIteration] = useState(false);
  const [iterationCompleted, setIterationCompleted] = useState(false);

  // CRITICAL: Define phase + first-time = special read-only UI with clarification prompt
  if (phase === 'define' && needsProblemClarification) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="absolute inset-0 z-20 bg-background/98 backdrop-blur-lg rounded-2xl border border-border overflow-hidden"
      >
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
              <h2 className="font-semibold capitalize" style={{ color: config.color }}>Define</h2>
              <p className="text-xs text-muted-foreground">Design Thinking Phase</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <ScrollArea className="h-[calc(100%-64px)]">
          <div className="p-4">
            <DefinePhaseClarificationPrompt
              projectName={projectName || 'your project'}
              onStartClarification={() => {
                navigate('/chat/business_mentor', {
                  state: { problemClarificationMode: true, projectId, projectName }
                });
                onClose();
              }}
            />
          </div>
        </ScrollArea>
      </motion.div>
    );
  }

  const allNotes = [...content.notes, ...content.autoPopulatedItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleAddNote = async () => {
    if (!newNote.trim() || !isCurrentIterationActive) return;
    setIsAddingNote(true);
    await onAddNote(newNote.trim());
    setNewNote('');
    setIsAddingNote(false);
  };

  const handleSaveReflection = async () => {
    if (!isCurrentIterationActive) return;
    setIsSavingReflection(true);
    await onUpdateReflection(reflection);
    setIsSavingReflection(false);
  };

  const handleMentorClick = async () => {
    const mentorType = canonicalizeMentorType(config.mentorType);
    if (!mentorType) return;

    const handoffContext = [
      `The user is working in the ${phase} phase of their project${projectName ? `, ${projectName}` : ''}.`,
      `The current question is: ${config.coreQuestion}`,
      reflection.trim() ? `Their reflection so far: ${reflection.trim()}` : null,
      allNotes.length > 0 ? `Relevant working notes: ${allNotes.slice(0, 3).map((note) => note.text).join(' | ')}` : null,
    ].filter(Boolean).join('\n');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No signed-in user');

      const { data: handoff, error } = await supabase
        .from('conversation_handoffs')
        .insert({
          user_id: user.id,
          source_mentor_type: 'design_thinking_lab',
          target_mentor_type: mentorType,
          source_messages: [],
          voice_context: {
            source: 'design_thinking_lab',
            phase,
            projectId,
            projectName,
            handoffContext,
          },
          initiated_by: 'design_thinking_lab',
        })
        .select()
        .single();
      if (error) throw error;

      navigate(`/council?view=${mentorType}`, {
        state: { voiceHandoffId: handoff.id, voiceContext: handoffContext },
      });
    } catch (error) {
      console.error('[design-thinking mentor handoff]', error);
      navigate(`/council?view=${mentorType}`);
    }
    onClose();
  };

  const handleCompleteIteration = async () => {
    if (!onCompleteIteration) return;
    setIsCompletingIteration(true);
    await onCompleteIteration();
    setIterationCompleted(true);
    setIsCompletingIteration(false);
    // Close after short delay so user sees feedback
    setTimeout(onClose, 1200);
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
          {/* Read-only notice for past iterations */}
          {!isCurrentIterationActive && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/40 border border-border/40">
              <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">This is a completed iteration — content is read-only.</p>
            </div>
          )}

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

            {isCurrentIterationActive && (
              <div className="flex gap-2">
                <Input
                  placeholder={PHASE_PLACEHOLDERS[phase]}
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
            )}

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {allNotes.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    No content yet in this phase.
                  </p>
                  {isCurrentIterationActive && (
                    <Button
                      variant="outline"
                      onClick={handleMentorClick}
                      className="gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Start a conversation
                    </Button>
                  )}
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
              disabled={!isCurrentIterationActive}
              className="min-h-[80px] resize-none"
            />
            {isCurrentIterationActive && reflection !== content.reflectionResponse && (
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
          {isCurrentIterationActive && (
            <Button
              variant="outline"
              className="w-full justify-center gap-2"
              style={{ borderColor: config.borderColor, color: config.color }}
              onClick={handleMentorClick}
            >
              <MessageSquare className="w-4 h-4" />
              {config.mentorLabel}
            </Button>
          )}

          {/* Complete Iteration CTA — only on Iterate phase, active iteration */}
          {phase === 'iterate' && isCurrentIterationActive && (
            <div
              className="rounded-xl p-4 space-y-3 border"
              style={{ borderColor: config.borderColor, background: config.bgColor }}
            >
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" style={{ color: config.color }} />
                <h3 className="text-sm font-semibold" style={{ color: config.color }}>
                  Complete this iteration
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                When you've applied your learnings and are ready to start a new cycle, complete this iteration.
                An AI summary will be generated and the next iteration will unlock.
              </p>
              {iterationCompleted ? (
                <div className="flex items-center gap-2 text-green-500 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Iteration complete! Unlocking next cycle...
                </div>
              ) : (
                <Button
                  className="w-full gap-2"
                  onClick={handleCompleteIteration}
                  disabled={isCompletingIteration}
                  style={{ background: config.color, color: 'hsl(var(--background))' }}
                >
                  {isCompletingIteration ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      Generating summary...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Complete Iteration & Start Next
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </motion.div>
  );
};
