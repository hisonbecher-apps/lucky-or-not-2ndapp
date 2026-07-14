import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { useAppContext } from '../context/AppContext';


interface SplashPageProps {
  onStart: () => void;
}

const SplashPage: React.FC<SplashPageProps> = ({ onStart }) => {
  const { playMusic } = useAppContext();

  useEffect(() => {
    // Attempt to start music immediately.
    // The browser might block this until user interaction,
    // but we fire it so it starts if allowed.
    playMusic();
  }, [playMusic]);

  const handleStart = () => {
    // In case original mount play was blocked, we trigger it again on the first click interaction
    playMusic();
    onStart();
  };

  return (
    <div 
      className="h-full w-full flex flex-col items-center justify-center text-white cursor-pointer p-8 text-center relative overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: "url('/images/splash_bg.webp')" }}
      onClick={handleStart}
    >
      {/* Background Shading/Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.1)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(0,0,0,0.2)_0%,transparent_60%)] pointer-events-none" />

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="relative z-10"
      >
        <p className="text-emerald-200 font-bold text-[10px] sm:text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] drop-shadow-md whitespace-nowrap">
          Test your luck in mini games!
        </p>
      </motion.div>

      <motion.div
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-12 text-sm uppercase tracking-widest font-bold text-emerald-200"
      >
        Tap to start
      </motion.div>
    </div>
  );
};

export default SplashPage;
