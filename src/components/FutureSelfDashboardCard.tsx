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
        "bg-white/90 backdrop-blur-md border-2 border-primary/10 shadow-lg",
        onClick && "cursor-pointer hover:scale-[1.02] hover:border-primary/30 hover:shadow-2xl hover:bg-white",
        className
      )}
    >
      <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );
};

export default FutureSelfDashboardCard;
