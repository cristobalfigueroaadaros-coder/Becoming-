import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Link2, Trash2, Palette, Check, X } from 'lucide-react';
import { CreativeSpaceTile } from '@/hooks/useCreativeSpace';
import { cn } from '@/lib/utils';

interface NoteTileProps {
  tile: CreativeSpaceTile;
  isConnecting: boolean;
  onConnect: () => void;
  onDragStart: () => void;
  onDragEnd: (e: React.DragEvent) => void;
  onUpdateContent: (title: string, content?: string) => void;
  onUpdateColor: (color: string) => void;
  onDelete: () => void;
}

const TILE_COLORS = [
  '#fbbf24', // Yellow
  '#60a5fa', // Blue
  '#34d399', // Green
  '#f87171', // Red
  '#a78bfa', // Purple
  '#fb923c', // Orange
  '#f472b6', // Pink
  '#94a3b8', // Gray
];

export function NoteTile({
  tile,
  isConnecting,
  onConnect,
  onDragStart,
  onDragEnd,
  onUpdateContent,
  onUpdateColor,
  onDelete
}: NoteTileProps) {
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(tile.title);
  const [editContent, setEditContent] = useState(tile.content || '');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    onUpdateContent(editTitle || 'Note', editContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(tile.title);
    setEditContent(tile.content || '');
    setIsEditing(false);
  };

  return (
    <div
      draggable={!isEditing}
      onDragStart={(e) => {
        if (isEditing) {
          e.preventDefault();
          return;
        }
        e.dataTransfer.effectAllowed = 'move';
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onDoubleClick={() => !isEditing && setIsEditing(true)}
      className={cn(
        "absolute cursor-grab active:cursor-grabbing",
        "w-[150px] rounded-lg p-3 shadow-lg transition-all duration-200",
        "border-2 border-black/10",
        isEditing && "cursor-auto ring-2 ring-primary",
        isConnecting && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
      style={{
        left: tile.position_x,
        top: tile.position_y,
        backgroundColor: tile.color,
      }}
    >
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            ref={inputRef}
            value={editContent || editTitle}
            onChange={(e) => {
              const val = e.target.value;
              setEditTitle(val.split('\n')[0] || 'Note');
              setEditContent(val);
            }}
            className="w-full bg-transparent text-sm text-black/80 resize-none outline-none placeholder:text-black/40"
            placeholder="Write your thoughts..."
            rows={4}
          />
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleCancel}
            >
              <X className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleSave}
            >
              <Check className="w-3 h-3" />
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm font-medium text-black/80 leading-tight line-clamp-2">
            {tile.title}
          </p>
          {tile.content && tile.content !== tile.title && (
            <p className="text-xs text-black/60 mt-1 line-clamp-2">
              {tile.content}
            </p>
          )}
          <p className="text-[10px] text-black/40 mt-2">Double-click to edit</p>
        </>
      )}

      {/* Action buttons */}
      {showActions && !isEditing && (
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-1 bg-background rounded-full px-2 py-1 shadow-md border">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onConnect();
            }}
          >
            <Link2 className="w-3 h-3" />
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Palette className="w-3 h-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="center">
              <div className="flex gap-1">
                {TILE_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => onUpdateColor(color)}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110",
                      tile.color === color ? "border-white" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
