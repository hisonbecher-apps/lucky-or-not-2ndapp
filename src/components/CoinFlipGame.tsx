import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, User, Monitor, Users, Search, Loader2, X, Bot, Check } from 'lucide-react';
import { triggerConfetti } from '../utils/confetti';
import { useAppContext } from '../context/AppContext';
import { useSocket } from '../context/SocketContext';

import ShareResult from './ShareResult';

interface CoinFlipGameProps {
  onUseCredit: () => boolean;
  onShowAd: () => void;
  onPlayAgainChallenge?: () => void;
}

type Side = 'heads' | 'tails';
type GameState = 'setup' | 'choosing' | 'flipping' | 'result' | 'gameover' | 'matchmaking' | 'ready';

const CoinFlipGame: React.FC<CoinFlipGameProps> = ({ onUseCredit, onShowAd, onPlayAgainChallenge }) => {
  const { playClick, playWin, playLose, playCoinFlip, stopCoinFlip, user, recordGameResult, stopAllGameSounds } = useAppContext();
  const { 
    socket, 
    onlineCount, 
    findMatch, 
    makeChoice,
    coinFlipInvite,
    setCoinFlipInvite
  } = useSocket();

  const [gameState, setGameState] = useState<GameState>('setup');
  const [mode, setMode] = useState<'single' | 'multi'>('single');
  const [totalRounds, setTotalRounds] = useState<number>(3);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [opponentScore, setOpponentScore] = useState<number>(0);
  const [playerChoice, setPlayerChoice] = useState<Side | null>(null);
  const [opponentChoice, setOpponentChoice] = useState<Side | null>(null);
  const [rotation, setRotation] = useState(0);
  const [roundWinner, setRoundWinner] = useState<'player' | 'opponent' | 'draw' | null>(null);
  
  // Multiplayer state
  const [gameId, setGameId] = useState<string | null>(null);
  const [opponentName, setOpponentName] = useState<string>(mode === 'single' ? 'CPU' : 'Opponent');
  const [isMyTurn, setIsMyTurn] = useState<boolean>(true);
  const [isRandom, setIsRandom] = useState<boolean>(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      stopCoinFlip();
    };
  }, [stopCoinFlip]);

  useEffect(() => {
    if (mode === 'single') {
      setOpponentName('CPU');
    } else if (gameState === 'setup') {
      setOpponentName('Opponent');
    }
  }, [mode, gameState]);

  const startNewGame = () => {
    stopAllGameSounds();
    if (!onUseCredit()) {
      onShowAd();
      return;
    }
    playClick();
    if (mode === 'single') {
      setGameState('choosing');
      setCurrentRound(1);
      setPlayerScore(0);
      setOpponentScore(0);
      setPlayerChoice(null);
      setOpponentChoice(null);
    } else {
      setGameState('matchmaking');
      findMatch();
    }
  };



  const triggerFlipSingle = (choice: Side, flipResult: Side) => {
    setGameState('flipping');
    
    const extraRotations = 5 + Math.floor(Math.random() * 5);
    const resultAngle = flipResult === 'heads' ? 0 : 180;
    const newRotation = rotation + (extraRotations * 360) + (resultAngle - (rotation % 360));
    setRotation(newRotation);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    playCoinFlip();

    timeoutRef.current = setTimeout(() => {
      stopCoinFlip();
      
      // Determine winner based on the single flip
      if (flipResult === choice) {
        setRoundWinner('player');
        setPlayerScore(prev => prev + 1);
        recordGameResult(true, 'coin');
      } else {
        setRoundWinner('opponent');
        setOpponentScore(prev => prev + 1);
        recordGameResult(false, 'coin');
      }
      
      setGameState('result');
    }, 2500);
  };

  const handleChoice = (choice: Side, isCpuChoice: boolean = false) => {
    if (gameState !== 'choosing') return;
    if (!isCpuChoice && !isMyTurn) return;

    if (!isCpuChoice) playClick();
    setPlayerChoice(choice);
    
    if (mode === 'single') {
      const cpuChoice: Side = choice === 'heads' ? 'tails' : 'heads';
      setOpponentChoice(cpuChoice);
      
      const flipResult: Side = Math.random() > 0.5 ? 'heads' : 'tails';
      triggerFlipSingle(choice, flipResult);
    } else if (gameId) {
      socket?.emit('coin_flip_choice', { gameId, choice });
      setGameState('flipping');
    }
  };

  // Socket listeners for multiplayer
  useEffect(() => {
    if (!socket) return;

    socket.on('match_found', (data: { gameId: string; opponent: string; isHost: boolean }) => {
      setMode('multi');
      setGameId(data.gameId);
      setOpponentName(data.opponent);
      setGameState('ready');
      setPlayerScore(0);
      setOpponentScore(0);
      setPlayerChoice(null);
      setOpponentChoice(null);
    });

    socket.on('coin_flip_started', (data: { gameId: string; players: any[], turnSocketId: string, isRandom?: boolean }) => {
      const opp = data.players.find(p => p.socketId !== socket.id);
      setMode('multi');
      setGameId(data.gameId);
      setOpponentName(opp?.name || 'Opponent');
      setIsRandom(data.isRandom || false);
      setIsMyTurn(data.turnSocketId === socket.id);
      setGameState('choosing');
      setCurrentRound(1);
      setPlayerScore(0);
      setOpponentScore(0);
      setPlayerChoice(null);
      setOpponentChoice(null);
    });

    socket.on('coin_flip_result', (data: { result: Side; winnerName: string; winnerSocketId: string, nextTurnSocketId: string, choices: string[] }) => {
      // Trigger flip animation
      setGameState('flipping');
      const extraRotations = 5;
      const resultAngle = data.result === 'heads' ? 0 : 180;
      setRotation(prev => prev + (extraRotations * 360) + (resultAngle - (prev % 360)));

      playCoinFlip();

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        stopCoinFlip();
        setIsMyTurn(data.nextTurnSocketId === socket.id);
        if (data.winnerSocketId === 'draw') {
          setRoundWinner('draw');
          recordGameResult(false, 'coin');
        } else if (data.winnerSocketId === socket.id) {
          setRoundWinner('player');
          setPlayerScore(prev => prev + 1);
          recordGameResult(true, 'coin');
        } else {
          setRoundWinner('opponent');
          setOpponentScore(prev => prev + 1);
          recordGameResult(false, 'coin');
        }
        
        setGameState('result');
      }, 2500);
    });

    return () => {
      socket.off('match_found');
      socket.off('coin_flip_started');
      socket.off('coin_flip_result');
    };
  }, [socket]);

  useEffect(() => {
    if (gameState === 'result' && mode === 'multi') {
      const timer = setTimeout(() => {
        nextRound();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState, mode]);

  const nextRound = () => {
    stopAllGameSounds();
    playClick();
    
    if (roundWinner === 'draw') {
      setPlayerChoice(null);
      setOpponentChoice(null);
      setRoundWinner(null);
      setGameState('choosing');
      return;
    }

    if (currentRound < totalRounds) {
      setCurrentRound(prev => prev + 1);
      setPlayerChoice(null);
      setOpponentChoice(null);
      setRoundWinner(null);
      setGameState('choosing');
      
      if (mode === 'single' && roundWinner === 'opponent') {
        setIsMyTurn(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          const cpuChoice: Side = Math.random() > 0.5 ? 'heads' : 'tails';
          setOpponentChoice(cpuChoice);
          const myChoice: Side = cpuChoice === 'heads' ? 'tails' : 'heads';
          setPlayerChoice(myChoice);
          const flipResult: Side = Math.random() > 0.5 ? 'heads' : 'tails';
          triggerFlipSingle(myChoice, flipResult);
        }, 1500);
      } else {
        setIsMyTurn(true);
      }
    } else {
      setGameState('gameover');
      if (playerScore > opponentScore) {
        triggerConfetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#fbbf24', '#f59e0b', '#d97706']
        });
        playWin();
      } else if (playerScore < opponentScore) {
        playLose();
      }
    }
  };

  const resetToSetup = () => {
    playClick();
    setGameState('setup');
    if (mode === 'multi' && onPlayAgainChallenge) {
      onPlayAgainChallenge();
    }
  };

  const handlePlayAgain = () => {
    playClick();
    if (mode === 'single') {
      startNewGame();
    } else if (mode === 'multi') {
      if (onPlayAgainChallenge) {
        onPlayAgainChallenge();
      } else {
        setGameState('matchmaking');
        socket?.emit('invite_coin_flip', { targetName: opponentName, gameId: null });
      }
    }
  };

  if (gameState === 'setup') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center px-6">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center text-4xl mb-8 shadow-lg border-4 border-amber-200">
          🪙
        </div>
        
        <p className="text-slate-500 font-medium mb-4">How many rounds?</p>
        <div className="flex items-center justify-center gap-4 mb-8 w-full">
          {[1, 3, 5, 10].map(num => (
            <button
              key={num}
              onClick={() => setTotalRounds(num)}
              className={`w-12 h-12 rounded-xl font-black text-lg transition-all ${
                totalRounds === num 
                ? 'bg-amber-500 text-white shadow-lg' 
                : 'bg-slate-50 text-slate-400 border-2 border-slate-100'
              }`}
            >
              {num}
            </button>
          ))}
        </div>

        <button
          onClick={startNewGame}
          className="w-full py-5 bg-amber-500 text-white rounded-3xl font-black text-xl shadow-xl shadow-amber-100 hover:bg-amber-600 transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          <Play fill="currentColor" />
          START GAME
        </button>
      </div>
    );
  }

  if (gameState === 'ready') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center px-6 text-center">
        <h2 className="text-3xl font-black text-slate-800 mb-2 uppercase tracking-widest">Match Found!</h2>
        <p className="text-slate-500 font-medium mb-8">You are playing against <span className="font-bold text-indigo-500">{opponentName}</span></p>
        <button
          onClick={() => setGameState('choosing')}
          className="w-full py-5 bg-emerald-500 text-white rounded-3xl font-black text-xl shadow-xl shadow-emerald-100 hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          START MATCH
        </button>
      </div>
    );
  }

  if (gameState === 'matchmaking') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center px-6">
        <div className="relative w-40 h-40 mb-8 flex items-center justify-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-2 border-amber-100"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0%, transparent 70%, rgba(245, 158, 11, 0.2) 100%)'
            }}
          />
          <motion.div
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-4 rounded-full border-2 border-amber-400"
          />
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="bg-white p-4 rounded-full shadow-lg"
            >
              <Users size={32} className="text-amber-500" />
            </motion.div>
          </div>
        </div>
        <h3 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-widest">Matchmaking</h3>
        <motion.p 
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-slate-400 font-medium uppercase tracking-widest text-sm"
        >
          Searching for opponent...
        </motion.p>
        
        <button
          onClick={() => setGameState('setup')}
          className="mt-12 px-8 py-3 bg-slate-100 text-slate-500 rounded-full font-bold hover:bg-slate-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div id="game-container" className="w-full h-full flex flex-col items-center relative overflow-hidden">

      {/* Scoreboard */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-start px-4 py-2 z-20 mt-12">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{user?.name || 'You'}</span>
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-100 shadow-sm">
            <User size={16} className="text-indigo-500" />
            <span className="font-black text-slate-700">{playerScore}</span>
          </div>
        </div>

        <div className="bg-amber-500 text-white px-4 py-1 rounded-full font-black text-sm shadow-sm mt-5">
          ROUND {currentRound} / {totalRounds}
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{opponentName}</span>
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-100 shadow-sm">
            <span className="font-black text-slate-700">{opponentScore}</span>
            <Bot size={16} className="text-rose-500" />
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 w-full flex flex-col items-center justify-center z-10 px-4">
        <div className="flex flex-col items-center gap-8">
          {/* The Main Coin */}
          <div className="perspective-1000">
            <motion.div
              animate={{ 
                rotateY: rotation,
                scale: gameState === 'result' ? 1.25 : 1,
                y: gameState === 'flipping' ? [0, -150, 0] : 0
              }}
              transition={{ 
                rotateY: { duration: 2.5, ease: "easeOut" },
                y: { duration: 2.5, ease: "easeInOut" },
                scale: { duration: 0.5, delay: 2.5 }
              }}
              style={{ transformStyle: 'preserve-3d' }}
              className="w-48 h-48 relative"
            >
              <div className="absolute inset-0 rounded-full shadow-2xl flex items-center justify-center backface-hidden overflow-hidden bg-transparent" style={{ backfaceVisibility: 'hidden' }}>
                <img src="/images/coin_heads.webp" alt="Heads" className="w-full h-full object-contain" />
              </div>
              <div className="absolute inset-0 rounded-full shadow-2xl flex items-center justify-center overflow-hidden bg-transparent" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                <img src="/images/coin_tails.webp" alt="Tails" className="w-full h-full object-contain" />
              </div>
            </motion.div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {gameState === 'choosing' && (
            <motion.div
              key="choosing"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              className="absolute bottom-12 flex flex-col items-center"
            >
              {isMyTurn ? (
                <div className="flex gap-4">
                  <button
                    onClick={() => handleChoice('heads')}
                    className="px-8 py-4 bg-white rounded-2xl shadow-xl border-2 border-slate-50 hover:border-amber-400 hover:scale-105 transition-all font-black text-slate-700 uppercase tracking-widest"
                  >
                    Heads
                  </button>
                  <button
                    onClick={() => handleChoice('tails')}
                    className="px-8 py-4 bg-white rounded-2xl shadow-xl border-2 border-slate-50 hover:border-amber-400 hover:scale-105 transition-all font-black text-slate-700 uppercase tracking-widest"
                  >
                    Tails
                  </button>
                </div>
              ) : (
                <div className="text-white font-bold text-sm bg-slate-900/50 px-6 py-3 rounded-full backdrop-blur-sm uppercase tracking-widest">
                  {opponentName} is choosing...
                </div>
              )}
            </motion.div>
          )}

          {gameState === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={nextRound}
              className="absolute inset-0 z-50 flex items-center justify-center cursor-pointer"
            >
              <motion.div
                initial={{ scale: 0.8, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white/95 backdrop-blur-sm px-8 py-4 rounded-full shadow-xl border border-slate-100 flex flex-col items-center justify-center text-center"
              >
                <div className={`text-xl font-black uppercase tracking-tight ${
                  roundWinner === 'player' ? 'text-emerald-500' : 
                  roundWinner === 'opponent' ? 'text-red-500' : 'text-slate-400'
                }`}>
                  {roundWinner === 'player' ? `${user?.name || 'You'} Won!` : 
                   roundWinner === 'opponent' ? (mode === 'single' ? 'YOU LOST!' : `${opponentName} Won!`) : 'Draw!'}
                </div>
              </motion.div>
            </motion.div>
          )}

          {gameState === 'gameover' && (
            <motion.div
              key="gameover"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-900/10 backdrop-blur-sm p-6"
            >
              <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border-2 border-amber-50 w-full max-w-xs flex flex-col items-center">
                <div className="text-4xl mb-2">
                  {playerScore > opponentScore ? '🏆' : playerScore < opponentScore ? '💀' : '🤝'}
                </div>
                <h2 className="text-xl font-black text-slate-900 mb-1 uppercase">
                  {playerScore > opponentScore ? 'Victory!' : playerScore < opponentScore ? (mode === 'single' ? 'YOU LOST!' : 'Defeat!') : 'It\'s a Tie!'}
                </h2>
                <div className="flex items-center gap-4 my-4">
                  <div className="text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">You</div>
                    <div className="text-2xl font-black text-amber-500">{playerScore}</div>
                  </div>
                  <div className="text-xl font-black text-slate-200">-</div>
                  <div className="text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">{opponentName}</div>
                    <div className="text-2xl font-black text-slate-400">{opponentScore}</div>
                  </div>
                </div>
                <div className="w-full space-y-2">
                  {mode === 'multi' && isRandom ? (
                    <button
                      onClick={resetToSetup}
                      className="w-full py-3 bg-amber-500 text-white rounded-xl font-black text-base shadow-lg shadow-amber-100 hover:bg-amber-600 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={18} />
                      BACK TO MENU
                    </button>
                  ) : (
                    <button
                      onClick={handlePlayAgain}
                      className="w-full py-3 bg-amber-500 text-white rounded-xl font-black text-base shadow-lg shadow-amber-100 hover:bg-amber-600 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={18} />
                      PLAY AGAIN
                    </button>
                  )}
                  <button
                    onClick={resetToSetup}
                    className="w-full py-1.5 text-slate-400 font-bold text-xs hover:text-slate-600 transition-colors"
                  >
                    Change Mode
                  </button>
                  <div className="pt-2">
                    <ShareResult gameName="Coin Flip" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CoinFlipGame;
