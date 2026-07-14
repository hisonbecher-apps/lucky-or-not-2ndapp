import React from 'react';
import { motion } from 'motion/react';

export type DayLuckStatus = 'lucky' | 'unlucky' | 'neutral' | 'future';

interface SevenLeafCloverProps {
  days: DayLuckStatus[];
  size?: number;
}

const SevenLeafClover: React.FC<SevenLeafCloverProps> = ({ days, size = 180 }) => {
  // SVG proportions
  const centerX = 100;
  const centerY = 100;
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 200 200"
      className="drop-shadow-lg"
    >
      <defs>
        <linearGradient id="greenLeaf" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ade80" /> {/* emerald-400 */}
          <stop offset="100%" stopColor="#059669" /> {/* emerald-600 */}
        </linearGradient>
        <linearGradient id="yellowLeaf" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde047" /> {/* yellow-300 */}
          <stop offset="100%" stopColor="#a16207" /> {/* yellow-700 / brown */}
        </linearGradient>
        <linearGradient id="neutralLeaf" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f1f5f9" /> {/* slate-100 */}
          <stop offset="100%" stopColor="#cbd5e1" /> {/* slate-300 */}
        </linearGradient>
      </defs>

      {/* Stem */}
      <path 
        d="M100,100 Q105,160 85,185" 
        stroke="#064e3b" 
        strokeWidth="6" 
        fill="none" 
        strokeLinecap="round" 
        opacity="0.8"
      />

      {/* Leaves */}
      {Array.from({ length: 7 }).map((_, i) => {
        const rotation = (360 / 7) * i;
        const status = days[i] || 'future';
        
        let fill = "url(#neutralLeaf)";
        let stroke = "#94a3b8";
        
        if (status === 'lucky') {
          fill = "url(#greenLeaf)";
          stroke = "#064e3b";
        } else if (status === 'unlucky') {
          fill = "url(#yellowLeaf)";
          stroke = "#713f12";
        } else if (status === 'neutral') {
          fill = "url(#neutralLeaf)";
          stroke = "#475569";
        }

        return (
          <motion.g 
            key={i} 
            initial={{ scale: 0, rotate: rotation }}
            animate={{ scale: 1, rotate: rotation }}
            transition={{ delay: i * 0.1, duration: 0.5, type: 'spring' }}
            style={{ originX: '100px', originY: '100px' }}
          >
            {/* Heart-shaped leaf */}
            <path 
              d="M100,100 C80,70 50,85 50,105 C50,125 80,140 100,100 C120,140 150,125 150,105 C150,85 120,70 100,100"
              transform="translate(0, -35)"
              fill={fill}
              stroke={stroke}
              strokeWidth="1.5"
            />
            {/* Vein */}
            <path 
              d="M100,100 L100,65"
              transform="translate(0, -35)"
              stroke={stroke}
              strokeWidth="0.5"
              opacity="0.3"
            />
          </motion.g>
        );
      })}

      {/* Center cap */}
      <circle cx="100" cy="100" r="8" fill="#ecfdf5" stroke="#10b981" strokeWidth="2" />
    </svg>
  );
};

export default SevenLeafClover;
