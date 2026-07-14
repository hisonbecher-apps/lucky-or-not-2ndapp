import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw } from 'lucide-react';
import { triggerConfetti } from '../utils/confetti';

import { useAppContext } from '../context/AppContext';
import ShareResult from './ShareResult';

interface DaisyLoveGameProps {
  onUseCredit: () => boolean;
  onShowAd: () => void;
}

const DaisyLoveGame: React.FC<DaisyLoveGameProps> = ({ onUseCredit, onShowAd }) => {
  const { playClick, playWin, playLose, recordGameResult, stopAllGameSounds } = useAppContext();
  const [petals, setPetals] = useState<number>(11);
  const [pluckedIndices, setPluckedIndices] = useState<number[]>([]);
  const [gameState, setGameState] = useState<'setup' | 'idle' | 'playing' | 'result'>('setup');
  const [targetGender, setTargetGender] = useState<'male' | 'female'>('male');
  const [lastMessage, setLastMessage] = useState<string>('');

  const selectGender = (gender: 'male' | 'female') => {
    setTargetGender(gender);
    setGameState('idle');
  };

  const startPlaying = () => {
    if (!onUseCredit()) {
      onShowAd();
      return;
    }
    setGameState('playing');
    setPetals(Math.random() > 0.5 ? 11 : 10); // Randomly choose 10 or 11 petals
    setPluckedIndices([]);
    const subject = targetGender === 'male' ? 'He' : 'She';
    setLastMessage(`${subject} loves me...`);
  };

  const pluckPetal = (index: number) => {
    if (gameState !== 'playing' || pluckedIndices.includes(index)) return;
    
    const newPluckedIndices = [...pluckedIndices, index];
    setPluckedIndices(newPluckedIndices);
    
    const isLovesMe = newPluckedIndices.length % 2 !== 0;
    const subject = targetGender === 'male' ? 'He' : 'She';
    setLastMessage(isLovesMe ? `${subject} loves me...` : `${subject} loves me not...`);

    if (newPluckedIndices.length >= petals) {
      setGameState('result');
      
      // Record result for luck statistics
      recordGameResult(isLovesMe, 'daisy');

      if (isLovesMe) {
        playWin();
        triggerConfetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#fbbf24', '#ffffff', '#fef3c7']
        });
      } else {
        playLose();
      }
    }
  };

  const resetGame = () => {
    stopAllGameSounds();
    setGameState('setup');
    setPluckedIndices([]);
    setLastMessage('');
  };

  return (
    <div id="game-container" className="w-full h-full flex flex-col items-center justify-center relative px-4 bg-emerald-50/40 rounded-[3rem] border border-emerald-100/50">
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <AnimatePresence mode="wait">
          {gameState === 'setup' ? (
            <motion.div
              key="setup"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="text-center"
            >
              <h2 className="text-xl font-black text-slate-400 uppercase tracking-[0.2em] mb-8">
                You are looking for
              </h2>
              <div className="flex gap-6 justify-center">
                <button
                  onClick={() => selectGender('male')}
                  className="group flex flex-col items-center gap-3"
                >
                  <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl border-2 border-slate-50 group-hover:border-blue-400 group-hover:scale-110 transition-all flex items-center justify-center text-4xl">
                    ♂️
                  </div>
                  <span className="font-black text-slate-400 group-hover:text-blue-500 uppercase text-xs tracking-widest">Male</span>
                </button>
                <button
                  onClick={() => selectGender('female')}
                  className="group flex flex-col items-center gap-3"
                >
                  <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl border-2 border-slate-50 group-hover:border-pink-400 group-hover:scale-110 transition-all flex items-center justify-center text-4xl">
                    ♀️
                  </div>
                  <span className="font-black text-slate-400 group-hover:text-pink-500 uppercase text-xs tracking-widest">Female</span>
                </button>
              </div>
            </motion.div>
          ) : gameState === 'idle' ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest mb-4">
                Daisy Love
              </h2>
              <p className="text-slate-500 font-medium mb-12">
                Does {targetGender === 'male' ? 'he' : 'she'} love you? Pluck the petals to find out.
              </p>
              <button
                onClick={startPlaying}
                className="px-12 py-4 bg-yellow-400 hover:bg-yellow-500 text-slate-900 rounded-full font-black text-xl shadow-xl transition-all active:scale-95"
              >
                START PLUCKING
              </button>
              <p className="mt-4 text-slate-400 font-bold text-xs uppercase tracking-widest">Costs 1 Credit</p>
              <button 
                onClick={() => setGameState('setup')}
                className="mt-6 text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-slate-500 transition-colors"
              >
                Change Gender
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center"
            >
              <div className="relative w-64 h-64 flex items-center justify-center">
                {/* Center of Daisy */}
                <div className="w-16 h-16 bg-yellow-400 rounded-full z-20 shadow-inner border-4 border-yellow-500" />
                
                {/* Petals */}
                {Array.from({ length: petals }).map((_, i) => {
                  const angle = (360 / petals) * i;
                  const isPlucked = pluckedIndices.includes(i);
                  return (
                    <motion.div
                      key={i}
                      initial={false}
                      animate={isPlucked ? { 
                        opacity: 0, 
                        scale: 0.5, 
                        y: 100, 
                        rotate: angle + 20,
                        x: Math.sin(angle) * 50 
                      } : { 
                        opacity: 1, 
                        scale: 1,
                        rotate: angle 
                      }}
                      transition={{ duration: 0.5 }}
                      onClick={() => pluckPetal(i)}
                      className={`absolute w-12 h-24 bg-white rounded-full origin-bottom cursor-pointer z-10 border border-slate-300 shadow-md ${isPlucked ? 'pointer-events-none' : ''}`}
                      style={{ 
                        bottom: '50%',
                        transform: `rotate(${angle}deg)`
                      }}
                    />
                  );
                })}
              </div>

              <div className="mt-12 h-12 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={lastMessage}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`text-2xl font-black uppercase tracking-tighter ${
                      gameState === 'result' 
                        ? (pluckedIndices.length % 2 !== 0 ? 'text-emerald-500' : 'text-slate-400')
                        : 'text-slate-600'
                    }`}
                  >
                    {gameState === 'result' 
                      ? (pluckedIndices.length % 2 !== 0 
                          ? (targetGender === 'male' ? 'HE LOVES YOU!' : 'SHE LOVES YOU!') 
                          : (targetGender === 'male' ? 'HE LOVES YOU NOT' : 'SHE LOVES YOU NOT'))
                      : lastMessage}
                  </motion.p>
                </AnimatePresence>
              </div>

              {gameState === 'result' && (
                <div className="flex flex-col items-center gap-4 mt-8">
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={resetGame}
                    className="flex items-center gap-2 bg-slate-100 text-slate-600 px-8 py-3 rounded-full font-bold hover:bg-slate-200 transition-colors"
                  >
                    <RotateCcw size={18} />
                    Try Again
                  </motion.button>
                  <div className="w-full max-w-[200px]">
                    <ShareResult gameName="Daisy Love" />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DaisyLoveGame;
