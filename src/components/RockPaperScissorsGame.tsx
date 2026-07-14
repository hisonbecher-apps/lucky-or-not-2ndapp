import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, User, Users, Check, Bot } from 'lucide-react';
import { triggerConfetti } from '../utils/confetti';
import { useAppContext } from '../context/AppContext';
import { useSocket } from '../context/SocketContext';

import ShareResult from './ShareResult';

interface RockPaperScissorsGameProps {
  onUseCredit: () => boolean;
  onShowAd: () => void;
  onPlayAgainChallenge?: () => void;
}

type Choice = 'rock' | 'paper' | 'scissors';
type GameState = 'setup' | 'choosing' | 'counting' | 'result' | 'gameover' | 'matchmaking' | 'ready';

const CHOICES: { id: Choice; emoji: string; label: string }[] = [
  { id: 'rock', emoji: '✊', label: 'Rock' },
  { id: 'paper', emoji: '✋', label: 'Paper' },
  { id: 'scissors', emoji: '✌️', label: 'Scissors' },
];

const RockPaperScissorsGame: React.FC<RockPaperScissorsGameProps> = ({ onUseCredit, onShowAd, onPlayAgainChallenge }) => {
  const { playClick, playWin, playLose, user, recordGameResult, playRpsRound, stopRpsRound, stopAllGameSounds } = useAppContext();
  const { 
    socket, 
    findMatch, 
    challengeUser, 
    makeChoice
  } = useSocket();

  const [gameState, setGameState] = useState<GameState>('setup');
  const [mode] = useState<'single' | 'multi'>('single');
  const [totalRounds, setTotalRounds] = useState<number>(3);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [opponentScore, setOpponentScore] = useState<number>(0);
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [opponentChoice, setOpponentChoice] = useState<Choice | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [roundWinner, setRoundWinner] = useState<'player' | 'opponent' | 'draw' | null>(null);
  
  // Multiplayer state
  const [gameId, setGameId] = useState<string | null>(null);
  const [opponentName, setOpponentName] = useState<string>('Opponent');
  const [isRandom, setIsRandom] = useState<boolean>(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const roundStartTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      stopRpsRound();
    };
  }, []);



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


  const handleChoice = (choice: Choice) => {
    if (gameState !== 'choosing') return;
    playClick();
    setPlayerChoice(choice);
    
    if (mode === 'single') {
      setGameState('counting');
      setCountdown(1);
      playRpsRound();
      roundStartTimeRef.current = Date.now();
    } else if (gameId) {
      makeChoice(gameId, choice);
      setGameState('counting');
      setCountdown(1);
      playRpsRound();
      roundStartTimeRef.current = Date.now();
    }
  };

  // Socket listeners for multiplayer
  useEffect(() => {
    if (!socket) return;

    socket.on('match_found', (data: { gameId: string; opponent: string, isRandom?: boolean }) => {
      setGameId(data.gameId);
      setOpponentName(data.opponent);
      setIsRandom(data.isRandom || false);
      setGameState('ready');
      setCurrentRound(1);
      setPlayerScore(0);
      setOpponentScore(0);
      setPlayerChoice(null);
      setOpponentChoice(null);
    });

    socket.on('round_result', (data: { choices: any[]; winner: string | 'draw'; scores: any[] }) => {
      const myChoice = data.choices.find(c => c.socketId === socket.id)?.choice;
      const oppChoice = data.choices.find(c => c.socketId !== socket.id)?.choice;
      
      setPlayerChoice(myChoice);
      setOpponentChoice(oppChoice);
      
      if (data.winner === 'draw') {
        setRoundWinner('draw');
        recordGameResult(false, 'rps');
      } else if (data.winner === socket.id) {
        setRoundWinner('player');
        recordGameResult(true, 'rps');
      } else {
        setRoundWinner('opponent');
        recordGameResult(false, 'rps');
      }

      const myScore = data.scores.find(s => s.socketId === socket.id)?.score;
      const oppScore = data.scores.find(s => s.socketId !== socket.id)?.score;
      setPlayerScore(myScore);
      setOpponentScore(oppScore);
      
      // Ensure sound plays for at least 3 seconds (3000ms) to match the audio file
      const elapsed = Date.now() - roundStartTimeRef.current;
      const remaining = Math.max(0, 3000 - elapsed);
      
      setTimeout(() => {
        setGameState('result');
        stopRpsRound();
      }, remaining);
    });


    return () => {
      socket.off('match_found');
      socket.off('round_result');
      socket.off('challenge_sent');
      socket.off('user_not_found');
    };
  }, [socket]);

  useEffect(() => {
    if (gameState === 'counting' && mode === 'single') {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (countdown < 3) {
          setCountdown(prev => prev + 1);
          playClick();
        } else {
          // Reveal result
          const opponentOptions: Choice[] = ['rock', 'paper', 'scissors'];
          const randomChoice = opponentOptions[Math.floor(Math.random() * 3)];
          setOpponentChoice(randomChoice);
          
          // Determine winner
          if (playerChoice === randomChoice) {
            setRoundWinner('draw');
            recordGameResult(false, 'rps');
          } else if (
            (playerChoice === 'rock' && randomChoice === 'scissors') ||
            (playerChoice === 'paper' && randomChoice === 'rock') ||
            (playerChoice === 'scissors' && randomChoice === 'paper')
          ) {
            setRoundWinner('player');
            setPlayerScore(prev => prev + 1);
            recordGameResult(true, 'rps');
          } else {
            setRoundWinner('opponent');
            setOpponentScore(prev => prev + 1);
            recordGameResult(false, 'rps');
          }
          
          setGameState('result');
          stopRpsRound();
        }
      }, 1000);
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }
  }, [gameState, countdown, playerChoice, playClick, mode]);

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
    } else {
      setGameState('gameover');
      if (playerScore > opponentScore) {
        triggerConfetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#818cf8', '#a5b4fc']
        });
        playWin();
      } else if (playerScore < opponentScore) {
        playLose();
      }
    }
  };

  const handlePlayAgain = () => {
    playClick();
    if (mode === 'single') {
      startNewGame();
    } else if (mode === 'multi') {
      if (onPlayAgainChallenge) {
        onPlayAgainChallenge();
      } else if (!isRandom) {
        setGameState('matchmaking');
        challengeUser(opponentName);
      } else {
        resetToSetup();
      }
    }
  };

  const resetToSetup = () => {
    playClick();
    setGameState('setup');
    stopRpsRound();
    if (mode === 'multi' && onPlayAgainChallenge) {
      onPlayAgainChallenge();
    }
  };

  const getHandEmoji = (choice: Choice | null, isCounting: boolean) => {
    if (isCounting) return '✊'; // Keep fist during counting
    if (!choice) return '✊';
    return CHOICES.find(c => c.id === choice)?.emoji || '✊';
  };

  if (gameState === 'setup') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center px-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-[68px] h-[68px] bg-white rounded-2xl shadow-md border border-slate-100 flex items-center justify-center text-3xl rotate-[-10deg]">
            ✊
          </div>
          <div className="w-[68px] h-[68px] bg-white rounded-2xl shadow-md border border-slate-100 flex items-center justify-center text-3xl z-10 scale-110">
            ✋
          </div>
          <div className="w-[68px] h-[68px] bg-white rounded-2xl shadow-md border border-slate-100 flex items-center justify-center text-3xl rotate-[10deg]">
            ✌️
          </div>
        </div>
        
        <p className="text-slate-500 font-medium mb-4">How many rounds?</p>
        <div className="flex items-center gap-4 mb-8">
          {[1, 3, 5, 10].map(num => (
            <button
              key={num}
              onClick={() => setTotalRounds(num)}
              className={`w-12 h-12 rounded-xl font-black text-lg transition-all ${
                totalRounds === num 
                ? 'bg-indigo-500 text-white shadow-lg' 
                : 'bg-slate-50 text-slate-400 border-2 border-slate-100'
              }`}
            >
              {num}
            </button>
          ))}
        </div>

        <button
          onClick={startNewGame}
          className="w-full py-5 bg-indigo-500 text-white rounded-3xl font-black text-xl shadow-xl shadow-indigo-100 hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          <Play fill="currentColor" />
          START GAME
        </button>
        <p className="mt-4 text-slate-400 font-bold text-xs uppercase tracking-widest">Costs 1 Credit</p>
      </div>
    );
  }

  if (gameState === 'matchmaking') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center px-6">
        <div className="relative w-40 h-40 mb-8 flex items-center justify-center">
          {/* Radar sweep effect */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-2 border-indigo-100"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0%, transparent 70%, rgba(99, 102, 241, 0.2) 100%)'
            }}
          />
          {/* Pulsing rings */}
          <motion.div
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-4 rounded-full border-2 border-indigo-400"
          />
          <motion.div
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.75 }}
            className="absolute inset-4 rounded-full border-2 border-indigo-400"
          />
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="bg-white p-4 rounded-full shadow-lg"
            >
              <Users size={32} className="text-indigo-500" />
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

  if (gameState === 'ready') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center px-6 text-center">
        <h2 className="text-3xl font-black text-slate-800 mb-2 uppercase tracking-widest">Match Found!</h2>
        <p className="text-slate-500 font-medium mb-8">You are playing against <span className="font-bold text-indigo-500">{opponentName}</span></p>
        <button
          onClick={() => setGameState('choosing')}
          className="w-full py-5 bg-emerald-500 text-white rounded-3xl font-black text-xl shadow-xl shadow-emerald-100 hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          <Check size={24} />
          START MATCH
        </button>
      </div>
    );
  }

  return (
    <div id="game-container" className="w-full h-full flex flex-col items-center relative overflow-hidden">

      <div className="absolute top-0 left-0 right-0 flex justify-between items-start px-4 py-2 z-20 mt-12">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{user?.name || 'You'}</span>
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-100 shadow-sm">
            <User size={16} className="text-indigo-500" />
            <span className="font-black text-slate-700">{playerScore}</span>
          </div>
        </div>
        
        <div className="flex gap-1 mt-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div 
              key={i}
              className={`w-2 h-2 rounded-full ${i < currentRound - 1 ? 'bg-emerald-400' : i === currentRound - 1 ? 'bg-amber-400 animate-pulse' : 'bg-slate-200'}`}
            />
          ))}
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{opponentName}</span>
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-100 shadow-sm">
            <span className="font-black text-slate-700">{opponentScore}</span>
            <Bot size={16} className="text-rose-500" />
          </div>
        </div>
      </div>

      {/* Opponent Arm (Top) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[40%] flex flex-col items-center pointer-events-none">
        <motion.div
          animate={gameState === 'counting' ? { y: [0, 30, 0] } : { y: 0 }}
          transition={gameState === 'counting' ? { duration: 0.8, repeat: Infinity, ease: "easeInOut" } : {}}
          className="flex flex-col items-center"
        >
          <div className="w-12 h-24 bg-red-200 rounded-b-full shadow-inner" />
          <div className="text-7xl mt-[-15px] drop-shadow-xl rotate-180">
            {getHandEmoji(opponentChoice, gameState === 'counting')}
          </div>
        </motion.div>
      </div>

      {/* Player Arm (Bottom) */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-[40%] flex flex-col-reverse items-center pointer-events-none">
        <motion.div
          animate={gameState === 'counting' ? { y: [0, -30, 0] } : { y: 0 }}
          transition={gameState === 'counting' ? { duration: 0.8, repeat: Infinity, ease: "easeInOut" } : {}}
          className="flex flex-col-reverse items-center"
        >
          <div className="w-12 h-24 bg-blue-500 rounded-t-full shadow-lg" />
          <div className="text-7xl mb-[-15px] drop-shadow-xl">
            {getHandEmoji(playerChoice, gameState === 'counting')}
          </div>
        </motion.div>
      </div>

      {/* Center UI */}
      <div className="flex-1 w-full flex flex-col items-center justify-center z-10 px-4">
        <AnimatePresence mode="wait">
          {gameState === 'choosing' && (
            <motion.div
              key="choosing"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              className="flex flex-col items-center"
              style={{ transform: 'translateZ(0)' }}
            >
              <h3 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-widest whitespace-nowrap">Choose Your Move</h3>
              <div className="flex gap-4">
                {CHOICES.map(choice => (
                  <button
                    key={choice.id}
                    onClick={() => handleChoice(choice.id)}
                    className="w-20 h-24 bg-white rounded-3xl shadow-xl border-2 border-slate-50 hover:border-indigo-400 hover:scale-110 transition-all flex flex-col items-center justify-center gap-2 group"
                  >
                    <span className="text-4xl group-hover:animate-bounce">{choice.emoji}</span>
                    <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-indigo-500">{choice.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {gameState === 'counting' && (
            <motion.div
              key="counting"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1.5 }}
              exit={{ opacity: 0, scale: 2 }}
              className="text-8xl font-black text-indigo-500 drop-shadow-2xl"
            >
              {mode === 'single' ? countdown : '...'}
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
              style={{ transform: 'translateZ(0)' }}
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
                   roundWinner === 'opponent' ? `${opponentName} Won!` : 'Draw!'}
                </div>
              </motion.div>
            </motion.div>
          )}

          {gameState === 'gameover' && (
            <motion.div
              key="gameover"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center bg-white p-8 rounded-[2.5rem] shadow-2xl border-2 border-indigo-50 w-full max-w-md"
              style={{ transform: 'translateZ(0)' }}
            >
              <div className="text-4xl mb-2">
                {playerScore > opponentScore ? '🏆' : playerScore < opponentScore ? '💀' : '🤝'}
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-1 uppercase">
                {playerScore > opponentScore ? `${user?.name || 'You'} Victory!` : playerScore < opponentScore ? `${opponentName} Victory!` : 'It\'s a Tie!'}
              </h2>
              <div className="flex items-center gap-4 my-4">
                <div className="text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">You</div>
                  <div className="text-2xl font-black text-indigo-500">{playerScore}</div>
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
                    className="w-full py-3 bg-indigo-500 text-white rounded-xl font-black text-base shadow-lg shadow-indigo-100 hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={18} />
                    BACK TO MENU
                  </button>
                ) : (
                  <button
                    onClick={handlePlayAgain}
                    className="w-full py-3 bg-indigo-500 text-white rounded-xl font-black text-base shadow-lg shadow-indigo-100 hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-2"
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
                  <ShareResult gameName="Rock Paper Scissors" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RockPaperScissorsGame;
