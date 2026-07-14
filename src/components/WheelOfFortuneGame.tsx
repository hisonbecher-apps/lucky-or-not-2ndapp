import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw } from 'lucide-react';
import { triggerConfetti } from '../utils/confetti';
import { useAppContext } from '../context/AppContext';
import { useSocket } from '../context/SocketContext';
import { Play, Users, Sparkles } from 'lucide-react';
import ShareResult from './ShareResult';

interface WheelOfFortuneGameProps {
  onUseCredit: () => boolean;
  onShowAd: () => void;
  onPlayAgainChallenge?: () => void;
}

const INITIAL_SECTIONS = [
  { label: 'BANKRUPT', color: 'bg-red-600', value: 'lose' },
  { label: 'MONEY', color: 'bg-emerald-600', value: 'win' },
  { label: 'LOSER', color: 'bg-red-500', value: 'lose' },
  { label: 'GOLD', color: 'bg-emerald-500', value: 'win' },
  { label: 'JACKPOT', color: 'bg-yellow-400', value: 'win', isJackpot: true },
  { label: 'BROKE', color: 'bg-red-400', value: 'lose' },
  { label: 'WIN', color: 'bg-emerald-400', value: 'win' },
  { label: 'BAD LUCK', color: 'bg-red-300', value: 'lose' },
  { label: 'LUCKY', color: 'bg-emerald-300', value: 'win' },
];

// Use the fixed alternating order
const SECTIONS = INITIAL_SECTIONS;

const PASTEL_COLORS = [
  'bg-red-200', 'bg-orange-200', 'bg-yellow-200', 
  'bg-green-200', 'bg-teal-200', 'bg-blue-200', 
  'bg-indigo-200', 'bg-purple-200', 'bg-pink-200'
];

const WheelOfFortuneGame: React.FC<WheelOfFortuneGameProps> = ({ onUseCredit, onShowAd, onPlayAgainChallenge }) => {
  const { 
    playWin, playLose, playJackpot, playClick, playWheelSpin, stopWheelSpin, user,
    recordGameResult, stopAllGameSounds 
  } = useAppContext();
  const { socket } = useSocket();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<any | null>(null);
  
  // Multiplayer states
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [gameId, setGameId] = useState<string | null>(null);
  const [players, setPlayers] = useState<string[]>([]);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [currentTurnName, setCurrentTurnName] = useState<string>('');
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const playersRef = useRef<{name: string, socketId: string}[]>([]);
  
  const spinTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (!socket) return;

    socket.on('wheel_of_fortune_started', (data) => {
      const playerNames = data.players.map((p: any) => p.name);
      setPlayers(playerNames);
      playersRef.current = data.players.map((p: any) => ({ name: p.name, socketId: p.socketId }));
      setIsMultiplayer(true);
      setGameId(data.gameId);
      setIsMyTurn(data.turnSocketId === socket.id);
      const turnPlayer = data.players.find((p: any) => p.socketId === data.turnSocketId);
      setCurrentTurnName(turnPlayer?.name || '');
      setWinnerName(null);
      setResult(null);
    });

    socket.on('wheel_of_fortune_spin_result', (data: { socketId: string; rotation: number; resultValue: number }) => {
      setRotation(data.rotation);
      setIsSpinning(true);
      playWheelSpin();
      
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
      spinTimeoutRef.current = setTimeout(() => {
        setIsSpinning(false);
        stopWheelSpin();
        
        // Calculate segment from rotation (reverse of targetAngle logic)
        const sectionAngle = 360 / SECTIONS.length;
        const normalizedRotation = data.rotation % 360;
        // targetAngle = 90 - (sectionIndex * sectionAngle)
        // sectionIndex * sectionAngle = 90 - normalizedRotation
        const sectionIndex = Math.floor(((90 - normalizedRotation) % 360 + 360) % 360 / sectionAngle);
        const segment = SECTIONS[sectionIndex % SECTIONS.length];
        
        // Show result for this specific player using segment label
        setResult({ ...segment, label: segment.label });
        
        // If it was my turn, now it might be opponent's or result time
        if (data.socketId === socket.id) {
           setIsMyTurn(false);
           const opponent = playersRef.current.find(p => p.socketId !== socket.id);
           if (opponent) setCurrentTurnName(opponent.name);
        }
      }, 3000);
    });

    socket.on('wheel_of_fortune_draw', (data: { message: string }) => {
       alert(data.message);
       setResult(null);
       // Reset for re-spin
    });

    socket.on('wheel_of_fortune_result', (data: { winnerName: string; winnerSocketId: string }) => {
      setTimeout(() => {
        setWinnerName(data.winnerName);
        setResult({ label: `WINNER: ${data.winnerName}`, value: 'win' });
        
        if (data.winnerSocketId === socket.id) {
          playWin();
          triggerConfetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
          });
        } else {
          playLose();
        }
      }, 3500); // Show after the last spin settles
    });

    return () => {
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
      socket.off('wheel_of_fortune_started');
      socket.off('wheel_of_fortune_result');
    };
  }, [socket]);

  const spinWheel = () => {
    if (isSpinning) return;
    
    stopAllGameSounds();

    if (isMultiplayer) {
      if (!isMyTurn) return;
      
      const resultValue = Math.floor(Math.random() * 1000);
      const extraSpins = 5 + Math.floor(Math.random() * 5);
      const sectionIndex = Math.floor(Math.random() * SECTIONS.length);
      const sectionAngle = 360 / SECTIONS.length;
      const targetAngle = 90 - (sectionIndex * sectionAngle);
      const finalRotation = rotation + (extraSpins * 360) + (targetAngle - (rotation % 360));
      
      socket?.emit('wheel_of_fortune_spin', { gameId, rotation: finalRotation, resultValue });
      return;
    }

    if (!onUseCredit()) {
      onShowAd();
      return;
    }
    
    playClick();

    setIsSpinning(true);
    playWheelSpin();
    setResult(null);

    // Randomly select a section
    const sectionIndex = Math.floor(Math.random() * SECTIONS.length);
    const sectionAngle = 360 / SECTIONS.length;
    
    // Calculate final rotation
    // Pointer is now at the right (90 degrees)
    setRotation(prev => {
      const extraSpins = 5 + Math.floor(Math.random() * 5);
      const targetAngle = 90 - (sectionIndex * sectionAngle);
      return prev + (extraSpins * 360) + (targetAngle - (prev % 360));
    });

    spinTimeoutRef.current = setTimeout(() => {
      setIsSpinning(false);
      stopWheelSpin();
      const finalResult = SECTIONS[sectionIndex];
      setResult(finalResult);

      // Record result for luck statistics
      recordGameResult(finalResult.value === 'win', 'wheel');

      if (finalResult.value === 'win') {
        if (finalResult.isJackpot) {
          playJackpot();
        } else {
          playWin();
        }
        setTimeout(() => {
          triggerConfetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#fbbf24', '#10b981', '#f472b6'],
            zIndex: 9999
          });
        }, 150);
      } else {
        playLose();
      }
    }, 3000);
  };

  const resetGame = () => {
    stopAllGameSounds();
    playClick();
    setResult(null);
    if (isMultiplayer) {
      if (onPlayAgainChallenge) {
        onPlayAgainChallenge();
      } else {
        setIsMyTurn(true);
        setCurrentTurnName(user?.name || '');
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative px-4">
      {isMultiplayer && (
        <div className="mb-6 flex flex-col items-center">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full mb-2">
            <Users size={16} className="text-slate-500" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Multiplayer Mode</span>
          </div>
          <p className="text-sm font-medium">
            {isSpinning ? (
               <span className="inline-flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-full font-black animate-pulse shadow-lg shadow-blue-500/20">
                 <Sparkles size={16} fill="white" />
                 {isMyTurn ? `${user?.name} IS SPINNING...` : `${currentTurnName} IS SPINNING...`}
               </span>
            ) : isMyTurn ? (
              <span className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-500 text-white rounded-full font-black animate-pulse shadow-lg shadow-emerald-500/20">
                <Sparkles size={16} fill="white" />
                {user?.name}, YOUR MOVE NOW!
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-6 py-2 bg-amber-100 text-amber-700 rounded-full font-black border border-amber-200">
                {currentTurnName}, YOU ARE NEXT!
              </span>
            )}
          </p>
        </div>
      )}

      <div className="relative w-72 h-72 mb-12">
        {/* Pointer - Now on the right (rotated 180 degrees from left) */}
        <div className="absolute top-1/2 -right-5 -translate-y-1/2 z-30 w-12 h-10 bg-white clip-path-left-pointer shadow-xl">
          <div className="absolute inset-[3px] bg-red-600 clip-path-left-pointer">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full mr-1 opacity-50" />
          </div>
        </div>

        {/* The Wheel */}
        <motion.div
          animate={{ rotate: rotation }}
          transition={{ duration: 6, ease: [0.15, 0, 0.15, 1] }}
          className="absolute -inset-4 rounded-full border-4 border-emerald-100 shadow-2xl overflow-hidden z-0"
        >
          {PASTEL_COLORS.map((color, i) => {
            const angle = 360 / PASTEL_COLORS.length;
            const sectionRotation = i * angle;
            return (
              <div
                key={`pastel-${i}`}
                className={`absolute inset-0 ${color}`}
                style={{
                  clipPath: `polygon(50% 50%, ${50 + 60 * Math.cos((sectionRotation - 90 - angle / 2) * (Math.PI / 180))}% ${50 + 60 * Math.sin((sectionRotation - 90 - angle / 2) * (Math.PI / 180))}%, ${50 + 60 * Math.cos((sectionRotation - 90 + angle / 2) * (Math.PI / 180))}% ${50 + 60 * Math.sin((sectionRotation - 90 + angle / 2) * (Math.PI / 180))}%)`,
                }}
              />
            );
          })}
        </motion.div>

        {/* Main Wheel Body */}
        <motion.div
          animate={{ rotate: rotation }}
          transition={{ duration: 3, ease: [0.15, 0, 0.15, 1] }}
          className="w-full h-full rounded-full border-8 border-emerald-500 shadow-xl relative overflow-hidden bg-emerald-50 z-10"
        >
          {SECTIONS.map((section, i) => {
            const angle = 360 / SECTIONS.length;
            const sectionRotation = i * angle;
            
            return (
              <div key={i} className="absolute inset-0">
                {/* Background Slice - Clipped */}
                <div
                  className={`absolute inset-0 ${section.color} ${section.isJackpot ? 'ring-inset ring-4 ring-amber-400' : ''}`}
                  style={{
                    clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((sectionRotation - 90 - angle / 2) * (Math.PI / 180))}% ${50 + 50 * Math.sin((sectionRotation - 90 - angle / 2) * (Math.PI / 180))}%, ${50 + 50 * Math.cos((sectionRotation - 90 + angle / 2) * (Math.PI / 180))}% ${50 + 50 * Math.sin((sectionRotation - 90 + angle / 2) * (Math.PI / 180))}%)`,
                  }}
                >
                  {section.isJackpot && (
                    <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle,rgba(251,191,36,0.4)_1px,transparent_1px)] bg-[size:8px_8px] border-[6px] border-double border-amber-600/50 rounded-full" />
                  )}
                </div>

                {/* Text Label - Not Clipped, centered in the slice */}
                <div 
                  className="absolute top-1/2 left-1/2 w-[144px] h-8 flex items-center justify-center pointer-events-none"
                  style={{ 
                    transform: `translate(0, -50%) rotate(${sectionRotation - 90}deg)`,
                    transformOrigin: 'left center',
                  }}
                >
                  <span 
                    className={`font-black uppercase drop-shadow-md whitespace-nowrap ${
                      section.isJackpot 
                        ? 'text-[17px] text-amber-950' 
                        : 'text-[14px] text-white'
                    }`}
                  >
                    {section.label}
                  </span>
                </div>
              </div>
            );
          })}
          
          {/* Center Cap */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full border-4 border-emerald-500 z-20 flex items-center justify-center shadow-lg">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          </div>
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        {result ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center w-full max-w-sm"
            style={{ transform: 'translateZ(0)' }}
          >
            <h3 className={`text-4xl font-black uppercase tracking-tighter mb-2 ${result.value === 'win' ? 'text-emerald-600' : 'text-slate-400'}`}>
              {result.label}
            </h3>
            <p className="text-slate-500 font-medium mb-8">
              {result.value === 'win' ? 'Incredible luck!' : 'Better luck next time!'}
            </p>
            <div className="flex flex-col gap-4 mt-8 max-w-xs mx-auto">
              <button
                onClick={resetGame}
                className="flex items-center justify-center gap-2 bg-slate-100 text-slate-600 px-8 py-3 rounded-full font-bold hover:bg-slate-200 transition-colors w-full"
              >
                <RotateCcw size={18} />
                Spin Again
              </button>
              <ShareResult gameName="Wheel of Fortune" />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
            style={{ transform: 'translateZ(0)' }}
          >
            <button
              disabled={isSpinning || (isMultiplayer && !isMyTurn)}
              onClick={spinWheel}
              className={`px-12 py-4 rounded-full font-black text-xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${
                isSpinning || (isMultiplayer && !isMyTurn)
                ? 'bg-slate-100 text-slate-300' 
                : 'bg-emerald-500 text-white hover:bg-emerald-600'
              }`}
            >
              {!isSpinning && <Play fill="currentColor" />}
              {isSpinning ? 'SPINNING...' : 'SPIN'}
            </button>
            {!isMultiplayer && <p className="mt-4 text-slate-400 font-bold text-xs uppercase tracking-widest">Costs 1 Credit</p>}
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .clip-path-triangle {
          clip-path: polygon(0% 0%, 100% 0%, 50% 100%);
        }
        .clip-path-left-pointer {
          clip-path: polygon(100% 0%, 0% 50%, 100% 100%);
        }
      `}} />
    </div>
  );
};

export default WheelOfFortuneGame;
