import { motion } from "framer-motion";

interface ClusterLabelProps {
  label: string;
  x: number;
  y: number;
  color: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ClusterLabel = ({ label, x, y, color, size = 'sm' }: ClusterLabelProps) => {
  const fontSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.7 }}
      className={`absolute pointer-events-none ${fontSizes[size]} font-medium tracking-wide uppercase`}
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        color: color,
        textShadow: `0 0 10px ${color}40`,
      }}
    >
      {label}
    </motion.div>
  );
};
