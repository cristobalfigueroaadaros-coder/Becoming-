import { useMemo } from "react";
import { motion } from "framer-motion";
import { PatternMapNode } from "./PatternMapNode";

interface PatternNodeData {
  trigger_event?: string;
  old_story?: string;
  mental_loop?: string;
  cost?: string;
  protective_role?: string;
  life_event?: string;
  life_event_age_category?: string;
}

interface PatternMapCanvasProps {
  patternName: string;
  nodeData: PatternNodeData;
  onNodeClick: (nodeType: string) => void;
}

const NODE_TYPES = [
  { id: 'trigger_event', label: 'Trigger', angle: -90 },
  { id: 'old_story', label: 'Old Story', angle: -30 },
  { id: 'mental_loop', label: 'Mental Loop', angle: 30 },
  { id: 'cost', label: 'Cost', angle: 90 },
  { id: 'protective_role', label: 'Protective Role', angle: 150 },
  { id: 'life_event', label: 'Life Event', angle: 210 },
];

export const PatternMapCanvas = ({
  patternName,
  nodeData,
  onNodeClick,
}: PatternMapCanvasProps) => {
  const dimensions = useMemo(() => {
    const width = 360;
    const height = 400;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 120;
    const centerSize = 45;
    const nodeSize = 28;
    
    return { width, height, centerX, centerY, radius, centerSize, nodeSize };
  }, []);

  const { width, height, centerX, centerY, radius, centerSize, nodeSize } = dimensions;

  // Calculate node positions
  const nodes = useMemo(() => {
    return NODE_TYPES.map((node, index) => {
      const angleRad = (node.angle * Math.PI) / 180;
      const x = centerX + radius * Math.cos(angleRad);
      const y = centerY + radius * Math.sin(angleRad);
      
      return {
        ...node,
        x,
        y,
        content: nodeData[node.id as keyof PatternNodeData] || null,
      };
    });
  }, [centerX, centerY, radius, nodeData]);

  return (
    <div className="w-full flex justify-center">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-[360px] h-auto"
        style={{ minHeight: '300px' }}
      >
        {/* Background gradient */}
        <defs>
          <radialGradient id="bgGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--indigo-500) / 0.1)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <circle
          cx={centerX}
          cy={centerY}
          r={radius + 60}
          fill="url(#bgGradient)"
        />

        {/* Connection lines */}
        {nodes.map((node, index) => (
          <motion.line
            key={`line-${node.id}`}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.4 }}
            transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
            x1={centerX}
            y1={centerY}
            x2={node.x}
            y2={node.y}
            className={node.content ? "stroke-purple-500/60" : "stroke-muted-foreground/20"}
            strokeWidth={node.content ? 2 : 1}
            strokeDasharray={node.content ? "none" : "4 4"}
          />
        ))}

        {/* Peripheral nodes */}
        {nodes.map((node, index) => (
          <PatternMapNode
            key={node.id}
            id={node.id}
            label={node.label}
            content={node.content}
            x={node.x}
            y={node.y}
            size={nodeSize}
            onClick={() => onNodeClick(node.id)}
            delay={0.4 + index * 0.1}
          />
        ))}

        {/* Center node (Pattern Name) */}
        <PatternMapNode
          id="center"
          label="Pattern"
          content={patternName}
          x={centerX}
          y={centerY}
          size={centerSize}
          isCenter
          onClick={() => {}}
          delay={0.2}
        />
      </svg>
    </div>
  );
};
