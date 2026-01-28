import { motion } from "framer-motion";
import { TransmutationNode } from "./TransmutationNode";

export interface TransmutationData {
  shadow?: string;
  dark_night?: string;
  shift_moment?: string;
  protective_purpose?: string;
  lesson_learned?: string;
  gold_insight?: string;
  letter_to_self?: string;
  brave_step?: string;
  phase_completed?: 'black' | 'white' | 'gold';
  completed_at?: string;
}

interface TransmutationMapCanvasProps {
  patternName: string;
  transmutationData: TransmutationData;
  onNodeClick: (nodeId: string) => void;
  isCompleted?: boolean;
}

const NODE_DEFINITIONS = [
  // Black Phase
  { id: 'shadow', label: 'The Shadow', phase: 'black' as const, required: true, row: 0, col: 0 },
  { id: 'dark_night', label: 'Dark Night', phase: 'black' as const, required: false, row: 1, col: 0 },
  
  // White Phase
  { id: 'shift_moment', label: 'The Shift', phase: 'white' as const, required: true, row: 0, col: 1 },
  { id: 'protective_purpose', label: 'Protective Role', phase: 'white' as const, required: true, row: 1, col: 1 },
  { id: 'lesson_learned', label: 'The Lesson', phase: 'white' as const, required: true, row: 2, col: 1 },
  
  // Gold Phase
  { id: 'gold_insight', label: 'The Gold', phase: 'gold' as const, required: true, row: 0, col: 2 },
  { id: 'letter_to_self', label: 'To Younger Me', phase: 'gold' as const, required: true, row: 1, col: 2 },
  { id: 'brave_step', label: 'Brave Step', phase: 'gold' as const, required: false, row: 2, col: 2 },
];

const PHASE_LABELS = [
  { phase: 'black', label: 'BLACK PHASE', subtitle: 'Shadow' },
  { phase: 'white', label: 'WHITE PHASE', subtitle: 'Shift' },
  { phase: 'gold', label: 'GOLD PHASE', subtitle: 'Integration' },
];

export const TransmutationMapCanvas = ({
  patternName,
  transmutationData,
  onNodeClick,
  isCompleted = false,
}: TransmutationMapCanvasProps) => {
  const width = 340;
  const height = 380;
  const nodeSize = 55;
  const colWidth = 100;
  const rowHeight = 80;
  const startX = 60;
  const startY = 100;

  const getNodePosition = (row: number, col: number) => ({
    x: startX + col * colWidth,
    y: startY + row * rowHeight,
  });

  const getNodeContent = (nodeId: string): string | null => {
    return transmutationData[nodeId as keyof TransmutationData] as string | null;
  };

  // Calculate connections between nodes
  const connections: { from: { x: number; y: number }; to: { x: number; y: number }; phase: string }[] = [];
  
  // Main flow: shadow -> shift_moment -> gold_insight
  const mainFlow = [
    { from: getNodePosition(0, 0), to: getNodePosition(0, 1), phase: 'black-white' },
    { from: getNodePosition(0, 1), to: getNodePosition(0, 2), phase: 'white-gold' },
  ];

  return (
    <div className="relative">
      <svg 
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        style={{ maxHeight: '400px' }}
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <linearGradient id="goldGradientComplete" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fcd34d" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          
          {/* Background gradient for completed state */}
          {isCompleted && (
            <radialGradient id="completedBg" cx="50%" cy="50%" r="80%">
              <stop offset="0%" stopColor="rgba(251, 191, 36, 0.15)" />
              <stop offset="100%" stopColor="rgba(251, 191, 36, 0)" />
            </radialGradient>
          )}
        </defs>

        {/* Background */}
        <rect 
          width={width} 
          height={height} 
          fill={isCompleted ? "url(#completedBg)" : "transparent"}
          rx={12}
        />

        {/* Pattern name at top */}
        <motion.g
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <rect
            x={width / 2 - 80}
            y={15}
            width={160}
            height={36}
            rx={18}
            fill={isCompleted ? "url(#goldGradient)" : "#6366f1"}
            opacity={0.9}
          />
          <text
            x={width / 2}
            y={28}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize={9}
            fontWeight={500}
          >
            PATTERN
          </text>
          <text
            x={width / 2}
            y={40}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize={11}
            fontWeight={600}
          >
            {patternName.length > 22 ? patternName.substring(0, 20) + "..." : patternName}
          </text>
        </motion.g>

        {/* Phase labels */}
        {PHASE_LABELS.map((phase, index) => (
          <motion.g
            key={phase.phase}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 * index, duration: 0.3 }}
          >
            <text
              x={startX + index * colWidth}
              y={70}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={
                phase.phase === 'black' ? '#64748b' :
                phase.phase === 'white' ? '#94a3b8' :
                '#f59e0b'
              }
              fontSize={8}
              fontWeight={600}
              letterSpacing={1}
            >
              {phase.label}
            </text>
          </motion.g>
        ))}

        {/* Connection lines */}
        {mainFlow.map((conn, index) => (
          <motion.line
            key={index}
            x1={conn.from.x + nodeSize / 2}
            y1={conn.from.y}
            x2={conn.to.x - nodeSize / 2}
            y2={conn.to.y}
            stroke={
              conn.phase === 'black-white' ? '#64748b' :
              '#fbbf24'
            }
            strokeWidth={2}
            strokeDasharray="4 4"
            opacity={0.5}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          />
        ))}

        {/* Vertical connections within phases */}
        {/* Black phase vertical */}
        <motion.line
          x1={startX}
          y1={startY + nodeSize / 2}
          x2={startX}
          y2={startY + rowHeight - nodeSize / 2}
          stroke="#475569"
          strokeWidth={1}
          strokeDasharray="3 3"
          opacity={0.4}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        />
        
        {/* White phase vertical */}
        <motion.line
          x1={startX + colWidth}
          y1={startY + nodeSize / 2}
          x2={startX + colWidth}
          y2={startY + 2 * rowHeight - nodeSize / 2}
          stroke="#94a3b8"
          strokeWidth={1}
          strokeDasharray="3 3"
          opacity={0.4}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        />
        
        {/* Gold phase vertical */}
        <motion.line
          x1={startX + 2 * colWidth}
          y1={startY + nodeSize / 2}
          x2={startX + 2 * colWidth}
          y2={startY + 2 * rowHeight - nodeSize / 2}
          stroke="#fbbf24"
          strokeWidth={1}
          strokeDasharray="3 3"
          opacity={0.4}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
        />

        {/* Nodes */}
        {NODE_DEFINITIONS.map((node, index) => {
          const pos = getNodePosition(node.row, node.col);
          return (
            <TransmutationNode
              key={node.id}
              id={node.id}
              label={node.label}
              content={getNodeContent(node.id)}
              phase={node.phase}
              x={pos.x}
              y={pos.y}
              size={nodeSize}
              isCompleted={isCompleted}
              isOptional={!node.required}
              onClick={() => onNodeClick(node.id)}
              delay={0.1 + index * 0.05}
            />
          );
        })}
      </svg>
    </div>
  );
};
