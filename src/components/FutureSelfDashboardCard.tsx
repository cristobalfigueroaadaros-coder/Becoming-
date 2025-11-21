import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FutureSelfDashboardCardProps {
  title: string;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

const FutureSelfDashboardCard = ({ 
  title, 
  children, 
  onClick,
  className 
}: FutureSelfDashboardCardProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative rounded-2xl p-6 transition-all duration-300",
        "bg-card/30 backdrop-blur-sm border border-border/30",
        onClick && "cursor-pointer hover:scale-[1.02] hover:bg-card/40 hover:shadow-xl",
        className
      )}
    >
      <h3 className="text-2xl font-bold text-foreground mb-4">{title}</h3>
      {children}
    </div>
  );
};

export default FutureSelfDashboardCard;
