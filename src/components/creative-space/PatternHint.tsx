import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Lightbulb, X, MessageCircle } from 'lucide-react';
import { CreativeSpacePattern, CreativeSpaceTile } from '@/hooks/useCreativeSpace';
import { useNavigate } from 'react-router-dom';

interface PatternHintProps {
  pattern: CreativeSpacePattern;
  tiles: CreativeSpaceTile[];
  onDismiss: () => void;
  onEngage: () => void;
}

export function PatternHint({ pattern, tiles, onDismiss, onEngage }: PatternHintProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const navigate = useNavigate();

  // Position hint near the first related tile
  const firstTile = tiles[0];
  if (!firstTile) return null;

  const handleAskCouncil = () => {
    onEngage();
    setIsOpen(false);
    // Navigate to council with pattern context
    navigate('/council-meeting', { 
      state: { 
        patternContext: pattern.pattern_description,
        relatedTiles: tiles.map(t => t.title)
      }
    });
  };

  return (
    <>
      {/* Floating lightbulb indicator */}
      <button
        onClick={() => setIsOpen(true)}
        className="absolute z-10 w-8 h-8 rounded-full bg-yellow-400 text-yellow-900 flex items-center justify-center shadow-lg animate-pulse hover:scale-110 transition-transform"
        style={{
          left: firstTile.position_x + 130,
          top: firstTile.position_y - 10
        }}
      >
        <Lightbulb className="w-4 h-4" />
      </button>

      {/* Pattern dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              Pattern Detected
            </DialogTitle>
            <DialogDescription>
              {pattern.pattern_description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Related tiles */}
            <div>
              <p className="text-sm font-medium mb-2">Related Ideas:</p>
              <div className="flex flex-wrap gap-2">
                {tiles.map(tile => (
                  <span
                    key={tile.id}
                    className="px-2 py-1 rounded text-xs text-white"
                    style={{ backgroundColor: tile.color }}
                  >
                    {tile.title}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  onDismiss();
                  setIsOpen(false);
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Dismiss
              </Button>
              <Button
                className="flex-1"
                onClick={handleAskCouncil}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Ask Council
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
