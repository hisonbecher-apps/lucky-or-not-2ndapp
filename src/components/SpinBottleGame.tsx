import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Play, RotateCcw, Users, Sparkles } from 'lucide-react';
import { triggerConfetti } from '../utils/confetti';
import { useAppContext } from '../context/AppContext';
import { useSocket } from '../context/SocketContext';
import { useDragToScroll } from '../hooks/useDragToScroll';

import ShareResult from './ShareResult';

interface SpinBottleGameProps {
  onUseCredit: () => boolean;
  onShowAd: () => void;
  onPlayAgainChallenge?: () => void;
}


const PASTEL_COLORS = [
  '#FFB7B2', '#FFDAC1', '#E2F0CB', '#B5EAD7', '#C7CEEA',
  '#F3E5F5', '#E1F5FE', '#F1F8E9', '#FFFDE7', '#FFF3E0'
];

const SpinBottleGame: React.FC<SpinBottleGameProps> = ({ onUseCredit, onShowAd, onPlayAgainChallenge }) => {
  const { playClick, playBottleSpin, stopBottleSpin, playBottleResult, playWin, playLose, user, recordGameResult, stopAllGameSounds } = useAppContext();
  const { socket } = useSocket();
  const scrollRef = useDragToScroll();
  const [players, setPlayers] = useState<string[]>(['', '']);
  const [isGameStarted, setIsGameStarted] = useState(false);
  
  useEffect(() => {
    if (user?.name && !isGameStarted && players[0] === '') {
      setPlayers(prev => {
        const next = [...prev];
        next[0] = user.name;
        return next;
      });
    }
  }, [user, isGameStarted]);

  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  
  // Multiplayer states
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [gameId, setGameId] = useState<string | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [currentTurnName, setCurrentTurnName] = useState<string>('');
  const [winnerName, setWinnerName] = useState<string | null>(null);

  const spinTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
      // Confetti reset is handled globally or via GameDetailPage
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('spin_bottle_started', (data) => {
      setPlayers(data.players.map((p: any) => p.name));
      setIsGameStarted(true);
      setIsMultiplayer(true);
      setGameId(data.gameId);
      setIsMyTurn(data.turnSocketId === socket.id);
      const turnPlayer = data.players.find((p: any) => p.socketId === data.turnSocketId);
      setCurrentTurnName(turnPlayer?.name || '');
      setWinnerName(null);
      setWinner(null);
    });

    socket.on('spin_bottle_result', (data) => {
      setRotation(data.rotation);
      setIsSpinning(true);
      playBottleSpin();
      
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
      spinTimeoutRef.current = setTimeout(() => {
        setIsSpinning(false);
        stopBottleSpin();
        setWinner(data.winnerName);
        setWinnerName(data.winnerName);
        setIsMyTurn(data.winnerSocketId === socket.id);
        setCurrentTurnName(data.winnerName);
        playBottleResult();
        triggerEffects();
      }, 2500);
    });


    return () => {
      socket.off('spin_bottle_started');
      socket.off('spin_bottle_result');
    };
  }, [socket, playBottleSpin, stopBottleSpin]);

  const triggerEffects = () => {
    triggerConfetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      startVelocity: 25,
      gravity: 0.7,
      ticks: 300,
      colors: ['#10b981', '#34d399', '#6ee7b7', '#fbbf24', '#f59e0b']
    });

    const duration = 4 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { 
      startVelocity: 15,
      spread: 360, 
      ticks: 200,
      gravity: 0.5,
      decay: 0.96,
      zIndex: 0 
    };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 30 * (timeLeft / duration);
      triggerConfetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      triggerConfetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 600);
  };

  const addPlayer = () => {
    if (players.length < 14) {
      setPlayers([...players, '']);
    }
  };

  const updatePlayer = (index: number, name: string) => {
    const newPlayers = [...players];
    newPlayers[index] = name;
    setPlayers(newPlayers);
  };

  const removePlayer = (index: number) => {
    if (players.length > 2) {
      const newPlayers = players.filter((_, i) => i !== index);
      setPlayers(newPlayers);
    }
  };

  const startGame = () => {
    const validPlayers = players.filter(p => p.trim() !== '');
    if (validPlayers.length < 2 || validPlayers.length > 14) {
      alert('Please enter between 2 and 14 players.');
      return;
    }
    setPlayers(validPlayers);
    setIsGameStarted(true);
    setIsMultiplayer(false);
  };

  const spinBottle = () => {
    if (isSpinning) return;
    
    if (isMultiplayer) {
      if (!isMyTurn) return;
      
      const sliceAngle = 360 / players.length;
      const margin = sliceAngle * 0.15; // 15% margin off the edges
      const targetSlice = Math.floor(Math.random() * players.length);
      const safeAngle = margin + Math.random() * (sliceAngle - 2 * margin);
      const finalTargetAngle = targetSlice * sliceAngle + safeAngle;
      
      const currentVisualAngle = rotation % 360;
      let angleDiff = finalTargetAngle - currentVisualAngle;
      if (angleDiff <= 0) angleDiff += 360;
      
      const extraSpins = 5 + Math.floor(Math.random() * 5);
      const newRotation = rotation + (extraSpins * 360) + angleDiff;
      const winnerIndex = targetSlice;
      
      socket?.emit('spin_bottle_spin', { gameId, rotation: newRotation, winnerIndex });
      return;
    }

    if (!onUseCredit()) {
      onShowAd();
      return;
    }

    setIsSpinning(true);
    setWinner(null);
    playBottleSpin();
    
    const sliceAngle = 360 / players.length;
    const margin = sliceAngle * 0.15;
    const targetSlice = Math.floor(Math.random() * players.length);
    const safeAngle = margin + Math.random() * (sliceAngle - 2 * margin);
    const finalTargetAngle = targetSlice * sliceAngle + safeAngle;
    
    const currentVisualAngle = rotation % 360;
    let angleDiff = finalTargetAngle - currentVisualAngle;
    if (angleDiff <= 0) angleDiff += 360;

    const extraSpins = 5 + Math.floor(Math.random() * 5);
    const newRotation = rotation + (extraSpins * 360) + angleDiff;
    setRotation(newRotation);

    if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
    spinTimeoutRef.current = setTimeout(() => {
      setIsSpinning(false);
      stopBottleSpin();
      const winName = players[targetSlice];
      setWinner(winName);
      
      // Removed from luck calculation per user request
      // recordGameResult(winName === user?.name, 'bottle');

      playBottleResult();
      triggerEffects();
    }, 2500);
  };

  const resetGame = () => {
    stopAllGameSounds();
    playClick();
    setIsGameStarted(false);
    setIsMultiplayer(false);
    setWinner(null);
    setWinnerName(null);
    setRotation(0);
    setGameId(null);
  };



  if (!isGameStarted) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <h2 className="text-xl font-bold text-slate-800 mb-6">
          Enter Players
        </h2>

        <div 
          ref={scrollRef}
          className="w-full space-y-3 max-h-[40vh] overflow-y-auto pr-2 select-none"
        >
          {players.map((player, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={player}
                placeholder={`Player ${index + 1}`}
                onChange={(e) => updatePlayer(index, e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-400 transition-colors font-medium"
              />
              {players.length > 2 && (
                <button 
                  onClick={() => removePlayer(index)}
                  className="p-3 text-red-400 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </motion.div>
          ))}
        </div>
        
        {players.length < 14 && (
          <button 
            onClick={addPlayer}
            className="mt-4 flex items-center gap-2 text-emerald-600 font-bold text-sm hover:bg-emerald-50 px-4 py-2 rounded-full transition-colors"
          >
            <Plus size={18} />
            Add Player
          </button>
        )}

        <button
          onClick={startGame}
          className="mt-8 w-full py-4 bg-emerald-500 text-white rounded-2xl font-black shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all active:scale-95"
        >
          SAVE PLAYERS
        </button>
      </div>

    );
  }

  const sliceAngle = 360 / players.length;

  return (
    <div id="game-container" className="w-full h-full flex flex-col items-center justify-center">
      {isMultiplayer && (
        <div className="mb-6 flex flex-col items-center">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full mb-2">
            <Users size={16} className="text-slate-500" />
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Multiplayer Mode</span>
        </div>
        <p className="text-sm font-medium">
          {isMyTurn ? (
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

    <div className="relative w-72 h-72 mb-8 shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full rounded-full shadow-2xl overflow-hidden">
        {(isMultiplayer ? players.slice(0, 2) : players).map((player, index) => {
          const count = isMultiplayer ? 2 : players.length;
          const sAngle = 360 / count;
          const startAngle = index * sAngle;
          const endAngle = (index + 1) * sAngle;
            const x1 = 50 + 50 * Math.cos((Math.PI * (startAngle - 90)) / 180);
            const y1 = 50 + 50 * Math.sin((Math.PI * (startAngle - 90)) / 180);
            const x2 = 50 + 50 * Math.cos((Math.PI * (endAngle - 90)) / 180);
            const y2 = 50 + 50 * Math.sin((Math.PI * (endAngle - 90)) / 180);
            const largeArcFlag = sliceAngle > 180 ? 1 : 0;
            const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
            const textAngle = startAngle + sliceAngle / 2;
            const tx = 50 + 30 * Math.cos((Math.PI * (textAngle - 90)) / 180);
            const ty = 50 + 30 * Math.sin((Math.PI * (textAngle - 90)) / 180);

            return (
              <g key={index}>
                <path d={pathData} fill={PASTEL_COLORS[index % PASTEL_COLORS.length]} />
                <text 
                  x={tx} 
                  y={ty} 
                  fill="#475569" 
                  fontSize="4" 
                  fontWeight="bold" 
                  textAnchor="middle"
                  transform={`rotate(${textAngle}, ${tx}, ${ty})`}
                >
                  {player}
                </text>
              </g>
            );
          })}
        </svg>

        <motion.div
          animate={{ rotate: rotation }}
          transition={{ duration: isSpinning ? 2.5 : 0, ease: "easeOut" }}
          onClick={spinBottle}
          className={`absolute inset-0 flex items-center justify-center z-10 ${isMyTurn || !isMultiplayer ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'}`}
        >
          <div className="relative w-12 h-40 flex items-center justify-center">
            <div className="absolute inset-0 bg-emerald-700 rounded-full shadow-lg border-4 border-emerald-900 flex flex-col items-center justify-center overflow-hidden">
              <div className="flex-1 flex items-center justify-center">
                <span className="text-white font-black text-xs -rotate-90 tracking-widest">SPIN</span>
              </div>
            </div>
            <div className="absolute -top-4 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[20px] border-b-emerald-900" />
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center mb-6"
            style={{ transform: 'translateZ(0)' }}
          >
            <div className="text-4xl font-black text-slate-900 break-words px-4">{winner}</div>
            <div className="text-2xl font-black text-emerald-500 tracking-tight mt-1">Truth or Dare?</div>
            <div className="mt-4">
              <ShareResult gameName="Spin the Bottle" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full space-y-3">
        <button
          disabled={isSpinning || (isMultiplayer && !isMyTurn)}
          onClick={spinBottle}
          className={`w-full py-5 rounded-3xl font-black text-xl flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 ${
            isSpinning || (isMultiplayer && !isMyTurn)
            ? 'bg-slate-100 text-slate-300 shadow-none' 
            : 'bg-emerald-500 text-white shadow-emerald-100 hover:bg-emerald-600'
          }`}
        >
          <Play fill="currentColor" />
          {isSpinning ? 'SPINNING...' : (
             isMultiplayer 
             ? (isMyTurn ? 'YOUR TURN TO SPIN' : `${currentTurnName?.toUpperCase()} SPIN`) 
             : (winnerName ? `${winnerName.toUpperCase()} SPIN` : 'SPIN BOTTLE')
          )}
        </button>
        
        <button
          onClick={() => {
            resetGame();
            if (isMultiplayer && onPlayAgainChallenge) {
              onPlayAgainChallenge();
            }
          }}
          className="w-full py-3 text-slate-400 font-bold text-sm flex items-center justify-center gap-2 hover:text-slate-600 transition-colors"
        >
          <RotateCcw size={16} />
          {isMultiplayer ? 'Back to Menu' : 'Change Players'}
        </button>
      </div>
    </div>
  );
};

export default SpinBottleGame;
