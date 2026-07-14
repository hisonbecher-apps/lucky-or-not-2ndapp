import React from 'react';

interface DetailedCloverProps {
  size?: number;
  className?: string;
}

const DetailedClover: React.FC<DetailedCloverProps> = ({ size = 24, className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      className={className}
      style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.15))' }}
    >
      <defs>
        <linearGradient id="cloverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      
      <g transform="translate(50, 45)">
        {/* Stem */}
        <path 
          d="M0,0 Q5,40 -10,50" 
          stroke="#064e3b" 
          strokeWidth="8" 
          fill="none" 
          strokeLinecap="round" 
        />
        <path 
          d="M0,0 Q5,40 -10,50" 
          stroke="url(#cloverGradient)" 
          strokeWidth="5" 
          fill="none" 
          strokeLinecap="round" 
        />

        {/* Leaves */}
        {[0, 90, 180, 270].map((angle) => (
          <g key={angle} transform={`rotate(${angle})`}>
            {/* Main Leaf Body - Rounder and Bubbly */}
            <path 
              d="M0,0 C-15,-25 -30,-15 -30,0 C-30,15 -15,10 0,0 C15,10 30,15 30,0 C30,-15 15,-25 0,0" 
              fill="url(#cloverGradient)" 
              stroke="#064e3b" 
              strokeWidth="3" 
            />
            {/* Shine/Highlight for bubbly effect */}
            <path 
              d="M-18,-8 A12,12 0 0 1 -8,-18" 
              stroke="white" 
              strokeWidth="2" 
              strokeLinecap="round"
              opacity="0.4" 
            />
          </g>
        ))}
      </g>
    </svg>
  );
};

export default DetailedClover;
