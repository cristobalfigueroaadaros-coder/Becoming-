import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BlockConfig } from '@/hooks/useValueMap';
import { Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValueMapBlockEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: BlockConfig;
  initialContent: string;
  onSave: (content: string) => void;
}

const colorClasses = {
  violet: 'text-violet-500',
  blue: 'text-blue-500',
  emerald: 'text-emerald-500',
  amber: 'text-amber-500'
};

export const ValueMapBlockEditor = ({
  open,
  onOpenChange,
  config,
  initialContent,
  onSave
}: ValueMapBlockEditorProps) => {
  const [content, setContent] = useState(initialContent);
  const colors = colorClasses[config.color as keyof typeof colorClasses] || colorClasses.violet;

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent, open]);

  const handleSave = () => {
    if (content.trim()) {
      onSave(content.trim());
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className={cn('flex items-center gap-2', colors)}>
            {config.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Prompts */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Reflection Prompts
              </span>
            </div>
            <ul className="space-y-1">
              {config.prompts.map((prompt, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  • {prompt}
                </li>
              ))}
            </ul>
          </div>

          {/* Editor */}
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your thoughts here..."
            className="min-h-[150px] resize-none"
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!content.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
