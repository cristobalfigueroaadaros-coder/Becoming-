import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useFutureSelfOmnipresence } from "@/hooks/useFutureSelfOmnipresence";

interface FutureSelfTriggerButtonProps {
  context?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function FutureSelfTriggerButton({ 
  context, 
  variant = "outline", 
  size = "default",
  className 
}: FutureSelfTriggerButtonProps) {
  const { manualTrigger } = useFutureSelfOmnipresence();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => manualTrigger(context)}
      className={className}
    >
      <Sparkles className="w-4 h-4 mr-2" />
      Ask Future Self
    </Button>
  );
}
