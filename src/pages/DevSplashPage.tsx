import React from 'react';
import { motion } from 'motion/react';

interface DevSplashPageProps {
  onComplete: () => void;
}

const DevSplashPage: React.FC<DevSplashPageProps> = ({ onComplete }) => {
  return (
    <div 
      className="h-full w-full flex flex-col items-center justify-center cursor-pointer relative overflow-hidden bg-black"
      onClick={onComplete}
    >
      <img 
        src="/dev_splash.png" 
        alt="Developer Splash" 
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
      
      <div className="absolute bottom-12 w-full flex justify-center z-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-white/80 text-xs font-bold tracking-[0.5em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            Tap to Start
          </span>
        </motion.div>
      </div>
    </div>
  );
};

export default DevSplashPage;
