import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { TransmutationNode } from "./TransmutationNode";
import { isWhitePhaseComplete, isRedPhaseComplete } from "@/lib/goldenSummaryGenerator";
import { toast } from "sonner";

export interface TransmutationData {
  shadow?: string;
  dark_night?: string;
  shift_moment?: string;
  protective_purpose?: string;
  lesson_learned?: string;
  release_burden?: string;
  release_belief?: string;
  release_cost?: string;
  red_completed_at?: string;
  gold_insight?: string;
  letter_to_self?: string;
  brave_step?: string;
  phase_completed?: 'black' | 'white' | 'red' | 'gold';
  white_completed_at?: string;
  gold_completed_at?: string;
  golden_summary?: string;
  completed_at?: string;
}

interface TransmutationMapCanvasProps {
  patternName: string;
  transmutationData: TransmutationData;
  onNodeClick: (nodeId: string, phase: 'black' | 'white' | 'red' | 'gold') => void;
  isCompleted?: boolean;
}

const NODE_DEFINITIONS = [
  // Black Phase
  { id: 'shadow', label: 'The Shadow', phase: 'black' as const, required: true, row: 0, col: 0 },
  { id: 'dark_night', label: 'Dark Night', phase: 'black' as const, required: false, row: 1, col: 0 },
  
  // White Phase
  { id: 'shift_moment', label: 'The Shift', phase: 'white' as const, required: true, row: 0, col: 1 },
  { id: 'protective_purpose', label: 'Protective Role', phase: 'white' as const, required: false, row: 1, col: 1 },
  { id: 'lesson_learned', label: 'The Lesson', phase: 'white' as const, required: true, row: 2, col: 1 },
  
  // Red Phase
  { id: 'release_burden', label: 'Stop Carrying', phase: 'red' as const, required: true, row: 0, col: 2 },
  { id: 'release_belief', label: 'Let Go', phase: 'red' as const, required: true, row: 1, col: 2 },
  { id: 'release_cost', label: 'The Cost', phase: 'red' as const, required: true, row: 2, col: 2 },
  
  // Gold Phase
  { id: 'gold_insight', label: 'The Gold', phase: 'gold' as const, required: true, row: 0, col: 3 },
  { id: 'letter_to_self', label: 'To Younger Me', phase: 'gold' as const, required: false, row: 1, col: 3 },
  { id: 'brave_step', label: 'Brave Step', phase: 'gold' as const, required: false, row: 2, col: 3 },
];

const PHASE_LABELS = [
  { phase: 'black', label: 'BLACK PHASE', subtitle: 'Shadow' },
  { phase: 'white', label: 'WHITE PHASE', subtitle: 'Shift' },
  { phase: 'red', label: 'RED PHASE', subtitle: 'Release' },
  { phase: 'gold', label: 'GOLD PHASE', subtitle: 'Integration' },
];

export const TransmutationMapCanvas = ({
  patternName,
  transmutationData,
  onNodeClick,
  isCompleted = false,
}: TransmutationMapCanvasProps) => {
  const whiteComplete = isWhitePhaseComplete(transmutationData);
  const redComplete = isRedPhaseComplete(transmutationData);

  const handleNodeClick = (nodeId: string, phase: 'black' | 'white' | 'red' | 'gold') => {
    if (phase === 'black') {
      toast.info("The shadow is already captured from your pattern");
      return;
    }
    
    // Red phase locked until White is complete
    const phaseFlag = transmutationData.phase_completed;
    if (phase === 'red' && !whiteComplete && phaseFlag !== 'white' && phaseFlag !== 'red' && phaseFlag !== 'gold') {
      toast.info("Complete the White phase first to unlock Red");
      return;
    }
    
    // Gold phase locked until Red is complete
    if (phase === 'gold' && !redComplete && phaseFlag !== 'red' && phaseFlag !== 'gold') {
      toast.info("Complete the Red phase first to unlock Gold");
      return;
    }
    
    onNodeClick(nodeId, phase);
  };

  const width = 440;
  const height = 380;
  const nodeSize = 50;
  const colWidth = 95;
  const rowHeight = 80;
  const startX = 55;
  const startY = 100;

  const getNodePosition = (row: number, col: number) => ({
    x: startX + col * colWidth,
    y: startY + row * rowHeight,
  });

  const getNodeContent = (nodeId: string): string | null => {
    return transmutationData[nodeId as keyof TransmutationData] as string | null;
  };

  // Main flow connections
  const mainFlow = [
    { from: getNodePosition(0, 0), to: getNodePosition(0, 1), phase: 'black-white' },
    { from: getNodePosition(0, 1), to: getNodePosition(0, 2), phase: 'white-red' },
    { from: getNodePosition(0, 2), to: getNodePosition(0, 3), phase: 'red-gold' },
  ];

  return (
    <div className="relative">
      <svg 
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        style={{ maxHeight: '400px' }}
      >
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <linearGradient id="goldGradientComplete" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fcd34d" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
          
          {isCompleted && (
            <radialGradient id="completedBg" cx="50%" cy="50%" r="80%">
              <stop offset="0%" stopColor="rgba(251, 191, 36, 0.15)" />
              <stop offset="100%" stopColor="rgba(251, 191, 36, 0)" />
            </radialGradient>
          )}
        </defs>

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
          <text x={width / 2} y={28} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={9} fontWeight={500}>
            PATTERN
          </text>
          <text x={width / 2} y={40} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={11} fontWeight={600}>
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
                phase.phase === 'red' ? '#ef4444' :
                '#f59e0b'
              }
              fontSize={7}
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
              conn.phase === 'white-red' ? '#ef4444' :
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
        {[0, 1, 2, 3].map((col) => {
          const maxRow = NODE_DEFINITIONS.filter(n => n.col === col).reduce((max, n) => Math.max(max, n.row), 0);
          if (maxRow === 0) return null;
          const colors = ['#475569', '#94a3b8', '#ef4444', '#fbbf24'];
          return (
            <motion.line
              key={`vert-${col}`}
              x1={startX + col * colWidth}
              y1={startY + nodeSize / 2}
              x2={startX + col * colWidth}
              y2={startY + maxRow * rowHeight - nodeSize / 2}
              stroke={colors[col]}
              strokeWidth={1}
              strokeDasharray="3 3"
              opacity={0.4}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.4 + col * 0.1, duration: 0.3 }}
            />
          );
        })}

        {/* Nodes */}
        {NODE_DEFINITIONS.map((node, index) => {
          const pos = getNodePosition(node.row, node.col);
          const phaseFlag = transmutationData.phase_completed;
          const isRedLocked = node.phase === 'red' && !whiteComplete && phaseFlag !== 'white' && phaseFlag !== 'red' && phaseFlag !== 'gold';
          const isGoldLocked = node.phase === 'gold' && !redComplete && phaseFlag !== 'red' && phaseFlag !== 'gold';
          const isLocked = isRedLocked || isGoldLocked;
          
          return (
            <g key={node.id}>
              <TransmutationNode
                id={node.id}
                label={node.label}
                content={getNodeContent(node.id)}
                phase={node.phase}
                x={pos.x}
                y={pos.y}
                size={nodeSize}
                isCompleted={isCompleted}
                isOptional={!node.required}
                isLocked={isLocked}
                onClick={() => handleNodeClick(node.id, node.phase)}
                delay={0.1 + index * 0.05}
              />
              {isLocked && (
                <g opacity={0.7}>
                  <circle cx={pos.x} cy={pos.y} r={nodeSize / 2} fill="rgba(0,0,0,0.3)" />
                  <foreignObject x={pos.x - 8} y={pos.y - 8} width={16} height={16}>
                    <Lock className="w-4 h-4 text-amber-400" />
                  </foreignObject>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};