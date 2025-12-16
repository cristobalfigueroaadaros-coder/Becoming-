import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ValueMapProgressProps {
  progress: number;
  filled: number;
  unlocked: number;
  total: number;
}

export const ValueMapProgress = ({ progress, filled, unlocked, total }: ValueMapProgressProps) => {
  const percentage = Math.round(progress * 100);

  return (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <div className="text-sm font-medium">{filled}/{total} filled</div>
        <div className="text-xs text-muted-foreground">{unlocked} unlocked</div>
      </div>
      <div className="w-32">
        <Progress 
          value={percentage} 
          className={cn(
            'h-2',
            percentage >= 75 ? 'bg-emerald-100' : 
            percentage >= 50 ? 'bg-blue-100' : 
            percentage >= 25 ? 'bg-amber-100' : 'bg-muted'
          )}
        />
        <div className="text-xs text-center mt-1 text-muted-foreground">
          {percentage}%
        </div>
      </div>
    </div>
  );
};
