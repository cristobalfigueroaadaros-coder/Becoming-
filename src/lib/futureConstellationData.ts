// Sample data for the "Future Self" constellation view - an aspirational example
// This represents what a fully-populated constellation looks like after months of use

export interface FutureDot {
  id: string;
  cluster: 'skills_learning' | 'outputs_projects' | 'values_insights' | 'self_discovery' | 'bridge' | 'insight_seeds';
  label: string;
  connections: number; // Number of connections determines size
}

export interface FutureConnection {
  from: string;
  to: string;
  type: 'neural' | 'bridge' | 'cluster';
}

// Cluster definitions with positions and colors
export const CLUSTER_CONFIG = {
  skills_learning: {
    label: 'Skills & Learning',
    position: { angle: 200, radiusMultiplier: 1.2 }, // Left side
    color: 'hsl(30 85% 55%)', // Warm orange
    bgColor: 'hsl(30 85% 55% / 0.15)',
  },
  outputs_projects: {
    label: 'Outputs & Projects',
    position: { angle: 240, radiusMultiplier: 1.4 }, // Lower-left
    color: 'hsl(45 90% 50%)', // Amber
    bgColor: 'hsl(45 90% 50% / 0.15)',
  },
  values_insights: {
    label: 'Values & Insights',
    position: { angle: -20, radiusMultiplier: 1.2 }, // Right side
    color: 'hsl(200 80% 55%)', // Cyan blue
    bgColor: 'hsl(200 80% 55% / 0.15)',
  },
  self_discovery: {
    label: 'Self Discovery',
    position: { angle: 20, radiusMultiplier: 1.4 }, // Upper-right
    color: 'hsl(190 75% 60%)', // Light teal
    bgColor: 'hsl(190 75% 60% / 0.15)',
  },
  bridge: {
    label: 'Bridge Insights',
    position: { angle: 90, radiusMultiplier: 1.0 }, // Top center
    color: 'hsl(270 70% 60%)', // Violet
    bgColor: 'hsl(270 70% 60% / 0.15)',
  },
  insight_seeds: {
    label: 'Insight Seeds',
    position: { angle: 270, radiusMultiplier: 1.0 }, // Bottom center
    color: 'hsl(80 70% 50%)', // Yellow-green
    bgColor: 'hsl(80 70% 50% / 0.15)',
  },
};

// Sample dots for the future vision
export const FUTURE_DOTS: FutureDot[] = [
  // Skills & Learning cluster (left side - Creation)
  { id: 'sk1', cluster: 'skills_learning', label: 'Deep Work Mastery', connections: 8 },
  { id: 'sk2', cluster: 'skills_learning', label: 'Strategic Thinking', connections: 6 },
  { id: 'sk3', cluster: 'skills_learning', label: 'Systems Design', connections: 5 },
  { id: 'sk4', cluster: 'skills_learning', label: 'Effective Communication', connections: 7 },
  { id: 'sk5', cluster: 'skills_learning', label: 'Rapid Prototyping', connections: 4 },
  { id: 'sk6', cluster: 'skills_learning', label: 'Pattern Recognition', connections: 9 },
  { id: 'sk7', cluster: 'skills_learning', label: 'Creative Problem Solving', connections: 6 },
  
  // Outputs & Projects cluster (lower-left)
  { id: 'op1', cluster: 'outputs_projects', label: 'First Product Launch', connections: 10 },
  { id: 'op2', cluster: 'outputs_projects', label: 'Community Built', connections: 7 },
  { id: 'op3', cluster: 'outputs_projects', label: 'Book Draft Complete', connections: 5 },
  { id: 'op4', cluster: 'outputs_projects', label: 'Mentor 10 People', connections: 6 },
  { id: 'op5', cluster: 'outputs_projects', label: 'Side Business Revenue', connections: 8 },
  { id: 'op6', cluster: 'outputs_projects', label: 'Speaking Engagement', connections: 4 },
  
  // Values & Insights cluster (right side - Becoming)
  { id: 'vi1', cluster: 'values_insights', label: 'Authenticity Above All', connections: 9 },
  { id: 'vi2', cluster: 'values_insights', label: 'Growth Through Discomfort', connections: 7 },
  { id: 'vi3', cluster: 'values_insights', label: 'Impact Over Income', connections: 6 },
  { id: 'vi4', cluster: 'values_insights', label: 'Deep Connection Matters', connections: 8 },
  { id: 'vi5', cluster: 'values_insights', label: 'Simplicity Is Power', connections: 5 },
  { id: 'vi6', cluster: 'values_insights', label: 'Trust the Process', connections: 7 },
  { id: 'vi7', cluster: 'values_insights', label: 'Rest Is Productive', connections: 4 },
  
  // Self Discovery cluster (upper-right)
  { id: 'sd1', cluster: 'self_discovery', label: 'My Shadow: Perfectionism', connections: 8 },
  { id: 'sd2', cluster: 'self_discovery', label: 'Core Strength: Vision', connections: 7 },
  { id: 'sd3', cluster: 'self_discovery', label: 'Fear Pattern Dissolved', connections: 6 },
  { id: 'sd4', cluster: 'self_discovery', label: 'Ikigai Clarity', connections: 9 },
  { id: 'sd5', cluster: 'self_discovery', label: 'Emotional Intelligence', connections: 5 },
  { id: 'sd6', cluster: 'self_discovery', label: 'Inner Critic Befriended', connections: 6 },
  
  // Bridge cluster (top - where identity meets action)
  { id: 'br1', cluster: 'bridge', label: 'Purpose Crystallized', connections: 12 },
  { id: 'br2', cluster: 'bridge', label: 'Values-Action Alignment', connections: 10 },
  { id: 'br3', cluster: 'bridge', label: 'Identity Through Creation', connections: 8 },
  { id: 'br4', cluster: 'bridge', label: 'Authentic Expression', connections: 9 },
  { id: 'br5', cluster: 'bridge', label: 'Mission Clarity', connections: 11 },
  
  // Insight Seeds cluster (bottom - new/emerging)
  { id: 'is1', cluster: 'insight_seeds', label: 'New Opportunity Spotted', connections: 2 },
  { id: 'is2', cluster: 'insight_seeds', label: 'Emerging Pattern', connections: 1 },
  { id: 'is3', cluster: 'insight_seeds', label: 'Fresh Perspective', connections: 2 },
  { id: 'is4', cluster: 'insight_seeds', label: 'Curiosity Spark', connections: 1 },
  { id: 'is5', cluster: 'insight_seeds', label: 'Question to Explore', connections: 2 },
];

// Sample connections between dots
export const FUTURE_CONNECTIONS: FutureConnection[] = [
  // Bridge connections (high-value cross-cluster)
  { from: 'br1', to: 'vi1', type: 'bridge' },
  { from: 'br1', to: 'op1', type: 'bridge' },
  { from: 'br2', to: 'sd4', type: 'bridge' },
  { from: 'br2', to: 'sk6', type: 'bridge' },
  { from: 'br3', to: 'op2', type: 'bridge' },
  { from: 'br3', to: 'sd2', type: 'bridge' },
  { from: 'br4', to: 'vi4', type: 'bridge' },
  { from: 'br4', to: 'op4', type: 'bridge' },
  { from: 'br5', to: 'sd4', type: 'bridge' },
  { from: 'br5', to: 'op5', type: 'bridge' },
  
  // Skills to Outputs connections
  { from: 'sk1', to: 'op1', type: 'neural' },
  { from: 'sk2', to: 'op5', type: 'neural' },
  { from: 'sk3', to: 'op1', type: 'neural' },
  { from: 'sk4', to: 'op6', type: 'neural' },
  { from: 'sk6', to: 'op3', type: 'neural' },
  { from: 'sk7', to: 'op2', type: 'neural' },
  
  // Values to Self Discovery connections
  { from: 'vi1', to: 'sd1', type: 'neural' },
  { from: 'vi2', to: 'sd3', type: 'neural' },
  { from: 'vi3', to: 'sd4', type: 'neural' },
  { from: 'vi4', to: 'sd5', type: 'neural' },
  { from: 'vi6', to: 'sd6', type: 'neural' },
  
  // Cross-hemisphere connections
  { from: 'sk6', to: 'vi1', type: 'bridge' },
  { from: 'op1', to: 'sd4', type: 'bridge' },
  { from: 'sk4', to: 'vi4', type: 'bridge' },
  { from: 'op2', to: 'vi3', type: 'bridge' },
  
  // Cluster internal connections
  { from: 'sk1', to: 'sk2', type: 'cluster' },
  { from: 'sk2', to: 'sk3', type: 'cluster' },
  { from: 'sk6', to: 'sk7', type: 'cluster' },
  { from: 'op1', to: 'op2', type: 'cluster' },
  { from: 'op3', to: 'op4', type: 'cluster' },
  { from: 'vi1', to: 'vi2', type: 'cluster' },
  { from: 'vi3', to: 'vi4', type: 'cluster' },
  { from: 'sd1', to: 'sd3', type: 'cluster' },
  { from: 'sd2', to: 'sd4', type: 'cluster' },
  
  // Seeds connecting to established dots
  { from: 'is1', to: 'sk6', type: 'neural' },
  { from: 'is2', to: 'vi6', type: 'neural' },
  { from: 'is3', to: 'br1', type: 'neural' },
];

// Calculate dot size based on connections
export const getDotSize = (connections: number): number => {
  const baseSize = 12;
  const maxBonus = 20;
  const bonus = Math.min(connections * 2, maxBonus);
  return baseSize + bonus;
};

// Get position for a dot within its cluster
export const getDotPosition = (
  dot: FutureDot, 
  index: number, 
  totalInCluster: number,
  centerX: number,
  centerY: number,
  baseRadius: number
): { x: number; y: number } => {
  const clusterConfig = CLUSTER_CONFIG[dot.cluster];
  const baseAngle = clusterConfig.position.angle;
  const radiusMultiplier = clusterConfig.position.radiusMultiplier;
  
  // Spread dots within cluster
  const spreadAngle = 40; // degrees to spread within cluster
  const angleOffset = (index - totalInCluster / 2) * (spreadAngle / Math.max(1, totalInCluster - 1));
  const angle = baseAngle + angleOffset;
  
  // Vary radius for organic feel
  const radiusVariation = (index % 3) * 25 - 25;
  const radius = (baseRadius * radiusMultiplier) + radiusVariation;
  
  const rad = (angle * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(rad),
    y: centerY + radius * Math.sin(rad),
  };
};
