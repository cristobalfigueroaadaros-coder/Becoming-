import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Unlock, Sparkles, Check, X, Edit3, GitBranch } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BlockConfig, ValueMapBlock as ValueMapBlockType, ValueMapSuggestion } from '@/hooks/useValueMap';
import { ValueMapBlockEditor } from './ValueMapBlockEditor';
import { cn } from '@/lib/utils';

function getSuggestionSourceLabel(suggestion: ValueMapSuggestion): string {
  if (suggestion.source_type === 'design_thinking') {
    const ctx = suggestion.source_context as any;
    return ctx?.phaseLabel ? `Design Thinking · ${ctx.phaseLabel}` : 'Design Thinking';
  }
  if (suggestion.source_type === 'focus_mode') return 'Focus Mode';
  if (suggestion.source_type === 'profile') return 'Your Profile';
  if (suggestion.source_type === 'mentor') return 'Mentor Session';
  return suggestion.source_type;
}

function SuggestionSourceBadge({ suggestion }: { suggestion: ValueMapSuggestion }) {
  const isDT = suggestion.source_type === 'design_thinking';
  return (
    <div className="flex items-center gap-1.5 mt-3">
      {isDT && <GitBranch className="w-3 h-3 text-emerald-400" />}
      {!isDT && <Sparkles className="w-3 h-3 text-muted-foreground" />}
      <span className="text-xs text-muted-foreground">
        {getSuggestionSourceLabel(suggestion)}
      </span>
    </div>
  );
}

interface ValueMapBlockProps {
  config: BlockConfig;
  block?: ValueMapBlockType;
  suggestions: ValueMapSuggestion[];
  onUnlock: () => void;
  onUpdate: (content: string) => void;
  onAcceptSuggestion: (id: string, editedText?: string) => void;
  onDiscardSuggestion: (id: string) => void;
}

const colorClasses = {
  violet: {
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    borderActive: 'border-violet-500',
    text: 'text-violet-500',
    glow: 'shadow-violet-500/20'
  },
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    borderActive: 'border-blue-500',
    text: 'text-blue-500',
    glow: 'shadow-blue-500/20'
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    borderActive: 'border-emerald-500',
    text: 'text-emerald-500',
    glow: 'shadow-emerald-500/20'
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    borderActive: 'border-amber-500',
    text: 'text-amber-500',
    glow: 'shadow-amber-500/20'
  }
};

export const ValueMapBlock = ({
  config,
  block,
  suggestions,
  onUnlock,
  onUpdate,
  onAcceptSuggestion,
  onDiscardSuggestion
}: ValueMapBlockProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);

  const isUnlocked = block?.is_unlocked || false;
  const hasContent = !!block?.content;
  const hasSuggestions = suggestions.length > 0;
  const colors = colorClasses[config.color as keyof typeof colorClasses] || colorClasses.violet;

  const handleStartEditing = () => {
    if (!isUnlocked) {
      onUnlock();
    }
    setIsEditing(true);
  };

  return (
    <>
      <motion.div
        whileHover={{ scale: isUnlocked ? 1.02 : 1 }}
        transition={{ duration: 0.2 }}
      >
        <Card
          className={cn(
            'relative cursor-pointer transition-all duration-300 min-h-[140px]',
            isUnlocked ? colors.bg : 'bg-muted/30',
            isUnlocked ? colors.borderActive : colors.border,
            isUnlocked && hasContent && `shadow-lg ${colors.glow}`,
            !isUnlocked && 'border-dashed opacity-60'
          )}
          onClick={handleStartEditing}
        >
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {isUnlocked ? (
                  <Unlock className={cn('w-4 h-4', colors.text)} />
                ) : (
                  <Lock className="w-4 h-4 text-muted-foreground" />
                )}
                <h4 className={cn(
                  'font-medium text-sm',
                  isUnlocked ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {config.title}
                </h4>
              </div>
              
              {hasSuggestions && (
                <Badge 
                  variant="secondary" 
                  className={cn('text-xs', colors.bg, colors.text)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSuggestion(true);
                  }}
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  {suggestions.length}
                </Badge>
              )}
            </div>

            {/* Content */}
            <div className="min-h-[60px]">
              {hasContent ? (
                <p className="text-sm text-foreground/80 line-clamp-3">
                  {block.content}
                </p>
              ) : isUnlocked ? (
                <p className="text-sm text-muted-foreground italic">
                  Click to add your thoughts...
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {config.unlockHint}
                </p>
              )}
            </div>

            {/* Action hint */}
            {!isUnlocked && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onUnlock();
                }}
              >
                <Unlock className="w-3 h-3 mr-1" />
                Unlock manually
              </Button>
            )}

            {isUnlocked && hasContent && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-7 text-xs absolute bottom-2 right-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
              >
                <Edit3 className="w-3 h-3" />
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Suggestion Popup */}
        <AnimatePresence>
          {showSuggestion && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 mt-2 w-full"
            >
              <Card className="border-2 border-primary/20 shadow-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">AI Suggestion</span>
                  </div>
                  <p className="text-sm text-foreground/80 mb-4">
                    {suggestions[0].suggestion_text}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAcceptSuggestion(suggestions[0].id);
                        setShowSuggestion(false);
                      }}
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAcceptSuggestion(suggestions[0].id, suggestions[0].suggestion_text);
                        setIsEditing(true);
                        setShowSuggestion(false);
                      }}
                    >
                      <Edit3 className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDiscardSuggestion(suggestions[0].id);
                        setShowSuggestion(false);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <SuggestionSourceBadge suggestion={suggestions[0]} />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Editor Modal */}
      <ValueMapBlockEditor
        open={isEditing}
        onOpenChange={setIsEditing}
        config={config}
        initialContent={block?.content || ''}
        onSave={(content) => {
          onUpdate(content);
          setIsEditing(false);
        }}
      />
    </>
  );
};
