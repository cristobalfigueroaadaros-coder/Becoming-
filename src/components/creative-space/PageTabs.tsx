import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, Check } from 'lucide-react';
import { CreativeSpacePage } from '@/hooks/useCreativeSpace';
import { cn } from '@/lib/utils';

interface PageTabsProps {
  pages: CreativeSpacePage[];
  currentPage: CreativeSpacePage | null;
  onSelectPage: (pageId: string) => void;
  onAddPage: () => void;
  onRenamePage: (pageId: string, name: string) => void;
  onDeletePage: (pageId: string) => void;
}

export function PageTabs({
  pages,
  currentPage,
  onSelectPage,
  onAddPage,
  onRenamePage,
  onDeletePage
}: PageTabsProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleStartEdit = (page: CreativeSpacePage) => {
    setEditingId(page.id);
    setEditValue(page.page_name);
  };

  const handleSaveEdit = () => {
    if (editingId && editValue.trim()) {
      onRenamePage(editingId, editValue.trim());
    }
    setEditingId(null);
    setEditValue('');
  };

  return (
    <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border/50 overflow-x-auto pb-1">
      {pages.map(page => (
        <div
          key={page.id}
          className={cn(
            "group relative flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors",
            currentPage?.id === page.id
              ? "bg-primary/10 text-primary"
              : "hover:bg-muted text-muted-foreground"
          )}
        >
          {editingId === page.id ? (
            <div className="flex items-center gap-1">
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                className="h-6 w-20 text-xs px-1"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={handleSaveEdit}
              >
                <Check className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <>
              <button
                onClick={() => onSelectPage(page.id)}
                onDoubleClick={() => handleStartEdit(page)}
                className="whitespace-nowrap"
                title="Double-click to rename"
              >
                {page.page_name}
              </button>
              {pages.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePage(page.id);
                  }}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </>
          )}
        </div>
      ))}
      
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2"
        onClick={onAddPage}
      >
        <Plus className="w-3 h-3" />
      </Button>
    </div>
  );
}
