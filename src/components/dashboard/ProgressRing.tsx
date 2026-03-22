import { motion } from "framer-motion";

interface ProgressRingProps {
  value: number;
  max: number;
  label: string;
  color?: string;
  size?: number;
}

const ProgressRing = ({ value, max, label, color = "hsl(var(--primary))", size = 100 }: ProgressRingProps) => {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-display font-bold">{percentage}%</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground font-medium text-center">{label}</p>
    </div>
  );
};

export default ProgressRing;
