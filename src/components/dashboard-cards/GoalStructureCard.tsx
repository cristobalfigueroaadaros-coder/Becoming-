const GoalStructureCard = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-4">
      <svg viewBox="0 0 200 120" className="w-full max-w-[200px]">
        {/* Three upward arrows */}
        <g opacity="0.6">
          <path
            d="M 40 100 L 40 50 L 30 60 M 40 50 L 50 60"
            stroke="hsl(var(--primary))"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        
        <g opacity="0.8">
          <path
            d="M 100 100 L 100 35 L 90 45 M 100 35 L 110 45"
            stroke="hsl(var(--primary))"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        <g>
          <path
            d="M 160 100 L 160 20 L 150 30 M 160 20 L 170 30"
            stroke="hsl(var(--primary))"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>

      <div className="flex gap-6 text-sm">
        <span className="text-muted-foreground">Weekly</span>
        <span className="text-muted-foreground">Monthly</span>
        <span className="text-foreground font-semibold">Yearly</span>
      </div>
    </div>
  );
};

export default GoalStructureCard;
