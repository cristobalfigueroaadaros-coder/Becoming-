import { ReactNode } from "react";
import { BottomNavigation } from "./BottomNavigation";
import { BecomingGuide } from "../BecomingGuide";

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen pb-20">
      {children}
      <BottomNavigation />
      <BecomingGuide />
    </div>
  );
};
