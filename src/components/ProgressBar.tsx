import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface ProgressBarProps {
  current: number;
  goal: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, goal }) => {
  const percentage = Math.min((current / goal) * 100, 100);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <span className="text-xs font-mono uppercase tracking-tighter text-zinc-500">Fundraising Progress</span>
          <h3 className="text-2xl font-display font-bold text-white">
            {current} <span className="text-zinc-500 text-lg">/ {goal} Meals</span>
          </h3>
        </div>
        <div className="text-right">
          <span className="text-3xl font-display font-black text-primary">
            {Math.round(percentage)}%
          </span>
        </div>
      </div>

      <div className="relative h-6 w-full bg-zinc-800 rounded-full overflow-hidden border border-white/5 p-1">
        {/* Gaming style segments */}
        <div className="absolute inset-0 flex gap-1 px-2 py-1.5 opacity-20 pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="flex-1 bg-white/20 rounded-sm" />
          ))}
        </div>

        {/* Progress Fill */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-300 relative gaming-progress-glow",
            percentage >= 100 && "from-amber-500 via-amber-400 to-amber-300"
          )}
        >
          {/* Animated shine */}
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
          />
        </motion.div>
      </div>

      <p className="text-center text-xs text-zinc-500 font-mono italic">
        {percentage >= 100 
          ? "GOAL REACHED! Every extra meal helps more children." 
          : `Only ${goal - current} more meals to reach our target!`}
      </p>
    </div>
  );
};
