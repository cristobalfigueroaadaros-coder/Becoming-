import { useLocation, useNavigate } from "react-router-dom";
import { LayoutGrid, Users, FlaskConical, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  matchPaths?: string[];
}

const navItems: NavItem[] = [
  {
    icon: LayoutGrid,
    label: "Home",
    path: "/dashboard",
    matchPaths: ["/dashboard"],
  },
  {
    icon: Users,
    label: "Council",
    path: "/council",
    matchPaths: ["/council", "/council-meeting", "/chat"],
  },
  {
    icon: FlaskConical,
    label: "Creation Lab",
    path: "/creation-lab",
    matchPaths: ["/creation-lab", "/future-self"],
  },
  {
    icon: User,
    label: "Profile",
    path: "/profile",
    matchPaths: ["/profile"],
  },
];

export const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (item: NavItem) => {
    const currentPath = location.pathname;
    
    // Check exact match first
    if (currentPath === item.path) return true;
    
    // Check if current path starts with any of the match paths
    if (item.matchPaths) {
      return item.matchPaths.some(path => currentPath.startsWith(path));
    }
    
    return false;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                active 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("w-6 h-6", active && "text-primary")} />
              <span className={cn(
                "text-xs font-medium",
                active && "text-primary"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
