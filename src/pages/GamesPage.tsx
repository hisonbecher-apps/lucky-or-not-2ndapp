import React from 'react';
import { motion } from 'motion/react';
import { GAMES, GameId } from '../types';
import { useDragToScroll } from '../hooks/useDragToScroll';
import GlobalHeader from '../components/GlobalHeader';

interface GamesPageProps {
  onOpenGame: (id: GameId) => void;
  onOpenSettings: () => void;
  onOpenShop: () => void;
  onOpenChallenge: () => void;
  onOpenProfile: () => void;
  onOpenNumberGenerator: () => void;
}

const GamesPage: React.FC<GamesPageProps> = ({ 
  onOpenGame, 
  onOpenSettings, 
  onOpenShop, 
  onOpenChallenge, 
  onOpenProfile,
  onOpenNumberGenerator
}) => {

  const scrollRef = useDragToScroll();

  const handleOpenSettings = () => {
    onOpenSettings();
  };

  const handleOpenGame = (id: GameId) => {
    onOpenGame(id);
  };

  return (
    <div 
      ref={scrollRef}
      className="h-full w-full flex flex-col bg-emerald-50 overflow-y-auto pb-20 select-none"
    >
      <GlobalHeader 
        onOpenProfile={onOpenProfile}
        onOpenShop={onOpenShop}
        showSettings={true}
        onOpenSettings={handleOpenSettings}
      />

      {/* Content */}
      <div className="px-6 pt-2">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Games</h1>
        </div>

        {/* Global Challenge Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onOpenChallenge()}
          className="w-full mb-8 relative overflow-hidden rounded-2xl shadow-lg border-2 border-orange-500/50 group h-16"
        >
          {/* Flame Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-500" 
            style={{ backgroundImage: 'url(/assets/images/flame_bg.webp)' }}
          />
          
          {/* Animated Glow Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-red-600/20 via-transparent to-orange-500/10 animate-pulse" />

          <div className="relative h-full px-6 flex items-center justify-center gap-3">
            <span className="text-white font-black text-2xl tracking-widest uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
              CHALLENGE
            </span>
          </div>
        </motion.button>

        {/* Number Generator Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onOpenNumberGenerator()}
          className="w-full mb-8 relative overflow-hidden rounded-2xl shadow-lg border-2 border-emerald-500/50 group h-16 bg-emerald-600"
        >
          {/* Theme Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-500" 
            style={{ backgroundImage: 'url(/assets/images/lucky_numbers_bg.webp)' }}
          />
          
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/40 via-emerald-600/60 to-emerald-800/80" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 to-transparent" />
          
          <div className="relative h-full px-6 flex items-center justify-center gap-3">
            <span className="text-white font-black text-[15px] sm:text-lg tracking-tight sm:tracking-wider uppercase drop-shadow-md whitespace-nowrap px-2">
              GENERATE LUCKY NUMBERS
            </span>
          </div>
        </motion.button>

        <div className="grid grid-cols-2 gap-4">
          {GAMES.map((game, index) => (
            <motion.button
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleOpenGame(game.id)}
              className="aspect-square bg-white rounded-3xl p-4 flex flex-col items-center justify-center gap-3 shadow-sm border border-slate-100 hover:shadow-md transition-all group"
            >
              <div className={`w-16 h-16 ${game.color} rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform`}>
                {game.icon}
              </div>
              <div className="text-center">
                <div className="font-bold text-slate-800 text-sm leading-tight">{game.title}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GamesPage;
