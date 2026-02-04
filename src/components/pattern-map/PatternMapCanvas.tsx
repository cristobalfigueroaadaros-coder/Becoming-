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
        {/* Improved gradient definitions for visibility */}
        <defs>
          {/* Warm violet background gradient */}
          <radialGradient id="bgGradient" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="hsl(280 70% 50% / 0.15)" />
            <stop offset="50%" stopColor="hsl(270 60% 40% / 0.08)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          
          {/* Outer ambient glow */}
          <radialGradient id="ambientGlow" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="transparent" />
            <stop offset="100%" stopColor="hsl(280 60% 60% / 0.1)" />
          </radialGradient>
          
          {/* Connection line gradient for filled nodes */}
          <linearGradient id="connectionGradientFilled" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(280 80% 65% / 0.8)" />
            <stop offset="100%" stopColor="hsl(270 70% 55% / 0.6)" />
          </linearGradient>
          
          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Stronger glow for center */}
          <filter id="centerGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Ambient outer glow ring */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius + 80}
          fill="url(#ambientGlow)"
        />
        
        {/* Background gradient */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius + 60}
          fill="url(#bgGradient)"
        />
        
        {/* Decorative orbit ring */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="hsl(280 60% 60% / 0.15)"
          strokeWidth="1"
          strokeDasharray="8 8"
        />

        {/* Connection lines with glow effect */}
        {nodes.map((node, index) => (
          <motion.line
            key={`line-${node.id}`}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
            x1={centerX}
            y1={centerY}
            x2={node.x}
            y2={node.y}
            stroke={node.content ? "url(#connectionGradientFilled)" : "hsl(280 30% 50% / 0.25)"}
            strokeWidth={node.content ? 2.5 : 1.5}
            strokeDasharray={node.content ? "none" : "6 6"}
            filter={node.content ? "url(#glow)" : "none"}
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
