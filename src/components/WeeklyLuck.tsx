import React from 'react';
import { motion } from 'motion/react';

export type DayLuckStatus = 'lucky' | 'unlucky' | 'neutral' | 'future';

interface WeeklyLuckProps {
  days: DayLuckStatus[];
  zoomed?: boolean;
}

const WeeklyLuck: React.FC<WeeklyLuckProps> = ({ days, zoomed = false }) => {
  /*
    Mapping:
    - 7 dikey bölme (day indicators) in week.png
    - Each column represents a day of the week
    - Lucky days: luck_clover.png
    - Unlucky days: luck_cat.png
  */

  return (
    <div className="w-full h-full relative overflow-hidden bg-emerald-950 flex items-center justify-center">
      {/* Background Frame */}
      <img 
        src="/images/luck/week.webp" 
        alt="Weekly Status Frame"
        className="absolute inset-0 w-full h-full object-cover scale-105"
      />
      
      {/* Weekly Indicators Overlay */}
      <div className="absolute top-[32%] left-[9%] right-[9%] bottom-[25%] flex items-center justify-center">
        <div className="w-full h-full grid grid-cols-7 gap-0.5">
          {days?.map((status, i) => {
            const isLucky = status === 'lucky';
            const isUnlucky = status === 'unlucky';
            const showIcon = isLucky || isUnlucky;

            return (
              <div key={i} className="flex items-center justify-center w-full h-full relative">
                <span className={`absolute ${zoomed ? 'top-3 sm:top-5 text-[14px] sm:text-[24px]' : 'top-1.5 text-[7px] sm:text-[9px]'} font-black text-emerald-950 z-10`}>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                </span>
                {showIcon && (
                  <motion.div
                    initial={{ y: -20, opacity: 0, scale: 0.5 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ 
                        type: 'spring', 
                        damping: 15, 
                        stiffness: 300,
                        delay: i * 0.1 
                    }}
                    className="w-[85%] h-[85%] flex items-center justify-center mt-2"
                  >
                    <img 
                      src={isLucky ? '/images/luck/luck_clover.webp' : '/images/luck/luck_cat.webp'} 
                      alt={status}
                      className="w-full h-full object-contain drop-shadow-lg"
                    />
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeeklyLuck;
