import { ReactNode } from "react";
import { BottomNavigation } from "./BottomNavigation";
import { JourneyPanel } from "./JourneyPanel";

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen pb-20">
      {children}
      <BottomNavigation />
      <JourneyPanel />
    </div>
  );
};
