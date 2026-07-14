import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Play } from 'lucide-react';
import { FORTUNE_NOTES } from '../types';
import { useAppContext } from '../context/AppContext';

import ShareResult from './ShareResult';

interface FortuneCookieGameProps {
  onUseCredit: () => boolean;
  onShowAd: () => void;
}

const FortuneCookieGame: React.FC<FortuneCookieGameProps> = ({ onUseCredit, onShowAd }) => {
  const { playClick, playCookieBreak, playBottleResult, seenFortuneIndices, markFortuneAsSeen, setSeenFortuneIndices, stopAllGameSounds } = useAppContext();
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'revealed'>('idle');
  const [note, setNote] = useState<string>('');
  const [playCount, setPlayCount] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timeout when component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleStartGame = () => {
    if (gameState !== 'idle') return;
    
    if (!onUseCredit()) {
      onShowAd();
      return;
    }

    playClick(); // Initial click
    // Note: We might want to play `playCookieBreak` here, or rely on the video's own sound
    // if the user's video has sound. For safety, we keep game sounds minimalistic when using a custom video.

    setGameState('playing');
    setPlayCount(prev => prev + 1);
  };

  const generateNote = () => {
    const totalFortunes = FORTUNE_NOTES.length;
    if (totalFortunes === 0) return;

    // Filter out indices that have already been seen
    const availableIndices = Array.from({ length: totalFortunes }, (_, i) => i)
      .filter(i => !seenFortuneIndices.includes(i));

    let selectedIndex: number;

    if (availableIndices.length === 0) {
      // All fortunes have been seen, reset and start over
      selectedIndex = Math.floor(Math.random() * totalFortunes);
      setSeenFortuneIndices([selectedIndex]);
    } else {
      // Pick a random index from available ones
      const poolIndex = Math.floor(Math.random() * availableIndices.length);
      selectedIndex = availableIndices[poolIndex];
      markFortuneAsSeen(selectedIndex);
    }

    setNote(FORTUNE_NOTES[selectedIndex]);
  };

  const handleVideoEnded = () => {
    setGameState('revealed');
    generateNote();
    playBottleResult(); // Play a nice reveal sound when the sentence shows up
  };

  const resetGame = () => {
    stopAllGameSounds();
    setGameState('idle');
    setNote('');
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  return (
    <div id="game-container" className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden px-4">
      <div className="relative w-full max-w-sm aspect-square bg-slate-100 rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-50 flex items-center justify-center">
        
        {/* The Video/Animation Element */}
        <video
          key={playCount}
          src="/videos/fortune_cookie.mp4"
          className={`w-full h-full object-cover ${gameState === 'revealed' ? 'hidden' : 'block'}`}
          autoPlay
          playsInline
          loop={gameState === 'idle'}
          onEnded={handleVideoEnded}
        />

        {/* Play Overlay when Idle */}
        <AnimatePresence>
          {gameState === 'idle' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleStartGame}
              className="absolute inset-0 bg-slate-900/10 flex flex-col items-center justify-center cursor-pointer backdrop-blur-[1px] transition-all hover:bg-slate-900/20 z-10"
            >
              <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center pl-2 shadow-xl shadow-amber-500/50 mb-4 animate-pulse">
                <Play size={40} className="text-white" fill="currentColor" />
              </div>
              <p className="text-white font-black text-xl drop-shadow-lg uppercase tracking-wider">Tap to open</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Note Reveal Overlay */}
        <AnimatePresence>
          {gameState === 'revealed' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center z-20 p-6"
            >
              <div className="absolute inset-0 bg-white flex flex-col items-center justify-center text-center p-8 z-30">
                <div className="w-full max-h-full overflow-y-auto slim-scrollbar py-4 px-2">
                  <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl md:text-3xl font-serif italic text-slate-800 leading-relaxed font-bold tracking-tight"
                  >
                     {note}
                  </motion.p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Action Buttons Area */}
      <div className="flex flex-col items-center gap-4 mt-8 h-32">
        <AnimatePresence mode="wait">
          {gameState === 'revealed' && (
            <motion.div
              key="actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex flex-col items-center gap-4 w-full"
            >
              <button
                onClick={resetGame}
                className="flex items-center gap-2 bg-slate-100 text-slate-600 px-8 py-3 rounded-full font-bold hover:bg-slate-200 transition-colors w-full justify-center max-w-xs"
              >
                <RotateCcw size={18} />
                Try Another
              </button>
              <div className="w-full max-w-[200px]">
                <ShareResult gameName="Fortune Cookie" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
};

export default FortuneCookieGame;
