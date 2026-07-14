import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Sparkles } from 'lucide-react';
import { triggerConfetti } from '../utils/confetti';
import { GIFT_ITEMS, GiftItem } from '../types';
import { useAppContext } from '../context/AppContext';

import ShareResult from './ShareResult';

interface GiftBoxGameProps {
  onUseCredit: () => boolean;
  onShowAd: () => void;
}

type GameState = 'idle' | 'opening' | 'revealed';

const GiftBoxGame: React.FC<GiftBoxGameProps> = ({ onUseCredit, onShowAd }) => {
  const { playClick, playWin, stopAllGameSounds } = useAppContext();
  const [gameState, setGameState] = useState<GameState>('idle');
  const [revealedGift, setRevealedGift] = useState<GiftItem | null>(null);

  const [playCount, setPlayCount] = useState(0);

  // Fallback timeout in case video fails to play
  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
    };
  }, []);

  const handleBoxClick = () => {
    if (gameState !== 'idle') return;

    if (!onUseCredit()) {
      onShowAd();
      return;
    }

    playClick();
    setGameState('opening');
    setPlayCount(prev => prev + 1);

    // Select random gift
    const randomGift = GIFT_ITEMS[Math.floor(Math.random() * GIFT_ITEMS.length)];
    setRevealedGift(randomGift);
  };

  useEffect(() => {
    if (gameState === 'opening') {
      if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
      if (revealedGift) {
        fallbackTimeoutRef.current = setTimeout(() => triggerReveal(revealedGift), 5430);
      }
    }
  }, [gameState, revealedGift]);



  const triggerReveal = (gift: GiftItem) => {
    setGameState('revealed');
    playWin();

    // Removed from luck calculation per user request
    // recordGameResult(gift.rarity !== 'common', 'gift');

    // Trigger confetti based on rarity
    const particleCount =
      gift.rarity === 'legendary' ? 200 :
        gift.rarity === 'epic' ? 100 :
          gift.rarity === 'rare' ? 50 : 30;

    triggerConfetti({
      particleCount,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f472b6', '#60a5fa', '#a78bfa', '#fbbf24']
    });
  };

  const resetGame = () => {
    stopAllGameSounds();
    setGameState('idle');
    setRevealedGift(null);
  };

  return (
    <div id="game-container" className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden px-4">
      <AnimatePresence mode="wait">

        {/* IDLE STATE: 3 Loop Videos layout */}
        {gameState === 'idle' && (
          <motion.div
            key="idle-state"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full flex flex-col items-center"
            style={{ transform: 'translateZ(0)' }}
          >
            <h2 className="text-2xl font-black text-slate-800 mb-8 uppercase tracking-widest text-center">
              Pick a Box
            </h2>

            <div className="flex flex-col items-center gap-6 w-full max-w-md">

              {/* Box 1 (Top) */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleBoxClick()}
                className="cursor-pointer relative overflow-hidden rounded-3xl shadow-xl border-4 border-slate-50 w-40 h-40 aspect-square"
              >
                <img
                  src="/videos/box_1.webp"
                  className="w-full h-full object-cover"
                  alt="Box 1"
                />
              </motion.div>

              {/* Bottom Boxes */}
              <div className="flex justify-center gap-6 w-full">
                {/* Box 2 (Bottom Left) */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleBoxClick()}
                  className="cursor-pointer relative overflow-hidden rounded-3xl shadow-xl border-4 border-slate-50 w-40 h-40 aspect-square"
                >
                  <img
                    src="/videos/box_2.webp"
                    className="w-full h-full object-cover"
                    alt="Box 2"
                  />
                </motion.div>

                {/* Box 3 (Bottom Right) */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleBoxClick()}
                  className="cursor-pointer relative overflow-hidden rounded-3xl shadow-xl border-4 border-slate-50 w-40 h-40 aspect-square"
                >
                  <img
                    src="/videos/box_3.webp"
                    className="w-full h-full object-cover"
                    alt="Box 3"
                  />
                </motion.div>
              </div>

            </div>
            <p className="mt-8 text-slate-400 font-bold text-xs uppercase tracking-widest">Costs 1 Credit</p>
          </motion.div>
        )}

        {/* OPENING STATE: Display the opening video */}
        {gameState === 'opening' && (
          <motion.div
            key="opening-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full flex justify-center items-center"
            style={{ transform: 'translateZ(0)' }}
          >
            <div className="relative overflow-hidden shadow-2xl rounded-3xl border-4 border-slate-50 w-full max-w-sm aspect-square bg-slate-900 flex items-center justify-center">
              <video
                key={`open-${playCount}`}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              >
                <source src="/videos/box_opening.mp4" type="video/mp4" />
              </video>
            </div>
          </motion.div>
        )}

        {/* REVEALED STATE: Display the Gift Image */}
        {gameState === 'revealed' && revealedGift && (
          <motion.div
            key="revealed-state"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full flex flex-col justify-center items-center"
            style={{ transform: 'translateZ(0)' }}
          >
            <div className="relative w-full max-w-sm aspect-square rounded-3xl bg-white shadow-2xl border-4 border-slate-50 flex items-center justify-center overflow-hidden p-6">

              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-8 opacity-10 pointer-events-none"
              >
                <Sparkles size={120} className="text-amber-400 opacity-50" />
              </motion.div>

              <img
                src={`/images/gift_${revealedGift.id}.png`}
                alt={revealedGift.label}
                className="w-full h-full object-contain relative z-10"
                onError={(e) => {
                  // Fallback if image not found, show the emoji large
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.nextElementSibling) {
                    (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
                  }
                }}
              />
              <div className="hidden text-8xl drop-shadow-2xl relative z-10">
                {revealedGift.emoji}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 text-center"
            >
              <div className={`text-xs font-black uppercase tracking-[0.3em] mb-2 ${revealedGift.rarity === 'legendary' ? 'text-amber-500' :
                  revealedGift.rarity === 'epic' ? 'text-purple-500' :
                    revealedGift.rarity === 'rare' ? 'text-blue-500' : 'text-slate-400'
                }`}>
                {revealedGift.rarity} Reward
              </div>
              <h3 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">
                {revealedGift.label}
              </h3>
            </motion.div>

            {/* Actions */}
            <div className="flex flex-col items-center gap-4 mt-8 w-full max-w-xs">
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                onClick={resetGame}
                className="flex items-center justify-center gap-2 bg-slate-100 text-slate-600 px-8 py-3 rounded-full font-bold hover:bg-slate-200 transition-colors w-full"
              >
                <RotateCcw size={18} />
                Try Another Box
              </motion.button>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="w-full"
              >
                <ShareResult gameName="Gift Box" />
              </motion.div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default GiftBoxGame;
