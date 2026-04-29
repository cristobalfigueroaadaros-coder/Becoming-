import { ProfileBadge } from "./ProfileBadge";

interface Badge {
  badge_key: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  priority: number;
}

interface ProfileBadgesProps {
  badges: Badge[];
  maxDisplay?: number;
  size?: "small" | "medium";
}

export const ProfileBadges = ({ badges, maxDisplay = 3, size = "small" }: ProfileBadgesProps) => {
  if (!badges || badges.length === 0) return null;

  // Sort by priority (highest first)
  const sortedBadges = [...badges].sort((a, b) => b.priority - a.priority);
  const displayBadges = sortedBadges.slice(0, maxDisplay);
  const remainingCount = sortedBadges.length - maxDisplay;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {displayBadges.map((badge) => (
        <ProfileBadge
          key={badge.badge_key}
          badge_key={badge.badge_key}
          name={badge.name}
          description={badge.description}
          icon={badge.icon}
          color={badge.color}
          size={size}
        />
      ))}
      {remainingCount > 0 && (
        <span className="text-xs text-muted-foreground ml-1">
          +{remainingCount} more
        </span>
      )}
    </div>
  );
};
