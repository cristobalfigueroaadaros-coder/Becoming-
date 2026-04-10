import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Link2, Trash2, Palette, Sparkles, Users, X } from 'lucide-react';
import { CreativeSpaceTile } from '@/hooks/useCreativeSpace';
import { cn } from '@/lib/utils';

interface InsightTileProps {
  tile: CreativeSpaceTile;
  isConnecting: boolean;
  onConnect: () => void;
  onDragStart: () => void;
  onDragEnd: (e: React.DragEvent) => void;
  onUpdateColor: (color: string) => void;
  onDelete: () => void;
}

const TILE_COLORS = [
  '#60a5fa', // Blue
  '#34d399', // Green
  '#fbbf24', // Yellow
  '#f87171', // Red
  '#a78bfa', // Purple
  '#fb923c', // Orange
  '#f472b6', // Pink
  '#94a3b8', // Gray
];

export function InsightTile({
  tile,
  isConnecting,
  onConnect,
  onDragStart,
  onDragEnd,
  onUpdateColor,
  onDelete
}: InsightTileProps) {
  const [showActions, setShowActions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const SourceIcon = tile.source_type === 'council' ? Users : Sparkles;

  return (
    <div
      draggable={!isExpanded}
      onDragStart={(e) => {
        if (isExpanded) { e.preventDefault(); return; }
        e.dataTransfer.effectAllowed = 'move';
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onDoubleClick={() => setIsExpanded(true)}
      className={cn(
        "absolute cursor-grab active:cursor-grabbing",
        "rounded-lg p-3 shadow-lg transition-all duration-200",
        "border-2 border-white/20",
        isExpanded ? "w-[280px] cursor-auto z-30" : "w-[150px]",
        isConnecting && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
      style={{
        left: tile.position_x,
        top: tile.position_y,
        backgroundColor: tile.color,
      }}
    >
      {/* Source badge */}
      {tile.source_label && (
        <Badge
          variant="secondary"
          className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0 bg-background/90 border"
        >
          <SourceIcon className="w-2.5 h-2.5 mr-1" />
          {tile.source_label}
        </Badge>
      )}

      {isExpanded ? (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 h-5 w-5 text-white/70 hover:text-white hover:bg-white/20"
            onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
          >
            <X className="w-3 h-3" />
          </Button>
          <p className="text-sm font-semibold text-white leading-tight mb-2 pr-6">
            {tile.title}
          </p>
          {tile.content && (
            <p className="text-xs text-white/85 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
              {tile.content}
            </p>
          )}
        </>
      ) : (
        <>
          {/* Title */}
          <p className="text-sm font-medium text-white leading-tight line-clamp-3">
            {tile.title}
          </p>
          <p className="text-[10px] text-white/50 mt-1.5">Double-click to expand</p>
        </>
      )}

      {/* Action buttons */}
      {showActions && !isExpanded && (
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
