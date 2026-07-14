import React from 'react';
import { motion } from 'motion/react';

interface LuckScalesProps {
  status?: 'balanced' | 'lucky' | 'unlucky';
  size?: number;
}

const LuckScales: React.FC<LuckScalesProps> = ({ status = 'balanced' }) => {
  
  const getImagePath = () => {
    switch (status) {
      case 'lucky': return '/images/luck/scales_lucky.webp';
      case 'unlucky': return '/images/luck/scales_unlucky.webp';
      default: return '/images/luck/scales_balanced.webp';
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden">
        <img 
          src={getImagePath()} 
          alt={`Luck Scales - ${status}`}
          className="w-full h-full object-cover drop-shadow-md scale-105"
        />
        
        {/* Subtle glow based on status */}
        <div 
          className="absolute inset-x-0 bottom-0 h-1/2 blur-2xl opacity-20 pointer-events-none transition-colors duration-1000"
          style={{ 
            backgroundColor: status === 'lucky' ? '#10b981' : (status === 'unlucky' ? '#ef4444' : '#64748b') 
          }}
        />
    </div>
  );
};

export default LuckScales;
