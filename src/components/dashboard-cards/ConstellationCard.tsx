const nodes = [
  { x: 60, y: 40, color: "hsl(30 80% 60%)" },
  { x: 100, y: 30, color: "hsl(50 70% 55%)" },
  { x: 140, y: 50, color: "hsl(180 60% 50%)" },
  { x: 40, y: 80, color: "hsl(140 50% 50%)" },
  { x: 90, y: 70, color: "hsl(200 70% 55%)" },
  { x: 130, y: 90, color: "hsl(30 80% 60%)" },
  { x: 70, y: 110, color: "hsl(270 60% 55%)" },
  { x: 110, y: 120, color: "hsl(180 60% 50%)" },
  { x: 150, y: 110, color: "hsl(50 70% 55%)" },
];

const connections = [
  [0, 1], [1, 2], [0, 3], [1, 4], [2, 5],
  [3, 6], [4, 6], [4, 7], [5, 7], [5, 8]
];

const ConstellationCard = () => {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <svg viewBox="0 0 180 150" className="w-full max-w-[200px]">
        {/* Connection lines */}
        {connections.map(([from, to], i) => (
          <line
            key={i}
            x1={nodes[from].x}
            y1={nodes[from].y}
            x2={nodes[to].x}
            y2={nodes[to].y}
            stroke="hsl(var(--muted-foreground) / 0.3)"
            strokeWidth="2"
          />
        ))}

        {/* Nodes */}
        {nodes.map((node, i) => (
          <circle
            key={i}
            cx={node.x}
            cy={node.y}
            r="8"
            fill={node.color}
            stroke="white"
            strokeWidth="2"
          />
        ))}
      </svg>
    </div>
  );
};

export default ConstellationCard;
