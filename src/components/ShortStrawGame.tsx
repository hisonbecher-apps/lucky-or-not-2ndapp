import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, Plus, Trash2, Sparkles } from 'lucide-react';
import { triggerConfetti } from '../utils/confetti';
import { useAppContext } from '../context/AppContext';
import { useSocket } from '../context/SocketContext';

import ShareResult from './ShareResult';

interface ShortStrawGameProps {
  onUseCredit: () => boolean;
  onShowAd: () => void;
  onPlayAgainChallenge?: () => void;
}

interface Straw {
  id: number;
  isShort: boolean;
  isPulled: boolean;
}

const ShortStrawGame: React.FC<ShortStrawGameProps> = ({ onUseCredit, onShowAd, onPlayAgainChallenge }) => {
  const { playClick, playWin, playLose, playBottleResult, user, recordGameResult, stopAllGameSounds } = useAppContext();
  const { socket } = useSocket();
  const [playerCount, setPlayerCount] = useState<number | null>(null);
  const [players, setPlayers] = useState<string[]>(['', '']);
  const [gamePlayers, setGamePlayers] = useState<string[]>([]);
  const [straws, setStraws] = useState<Straw[]>([]);
  const [gameOver, setGameOver] = useState(false);

  const [isGameStarted, setIsGameStarted] = useState(false);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  
  useEffect(() => {
    if (user?.name && !isGameStarted && players[0] === '') {
      setPlayers(prev => {
        const next = [...prev];
        next[0] = user.name;
        return next;
      });
    }
  }, [user, isGameStarted]);

  // Multiplayer state
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [gameId, setGameId] = useState<string | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [currentTurnName, setCurrentTurnName] = useState<string | null>(null);
  const [loserName, setLoserName] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('short_straw_started', (data) => {
      setGameId(data.gameId);
      setStraws(data.straws);
      setPlayerCount(data.players.length);
      setIsGameStarted(true);
      setIsMultiplayer(true);
      setIsMyTurn(data.turnSocketId === socket.id);
      const currentPlayer = data.players.find((p: any) => p.socketId === data.turnSocketId);
      setCurrentTurnName(currentPlayer?.name || 'Player');
    });

    socket.on('short_straw_update', (data) => {
      setStraws(prev => {
        const next = [...prev];
        next[data.index].isPulled = true;
        return next;
      });
      playBottleResult();
      if (isMultiplayer) {
         setCurrentTurnName(data.nextTurnName);
         setIsMyTurn(data.nextTurnSocketId === socket.id);
      }
    });

    socket.on('short_straw_result', (data) => {
      setStraws(prev => {
        const next = [...prev];
        next[data.index].isPulled = true;
        return next;
      });
      setGameOver(true);
      setLoserName(data.loserName);
      
      if (data.loserSocketId !== socket.id) {
        playWin();
        recordGameResult(true, 'straw'); // User survived
        triggerConfetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        playLose();
        recordGameResult(false, 'straw'); // User got it
      }
    });

    return () => {
      socket.off('short_straw_started');
      socket.off('short_straw_update');
      socket.off('short_straw_result');
    };
  }, [socket, isMultiplayer]);

  const initGame = (names: string[]) => {
    // Shuffle players to randomize who picks next (Fisher-Yates)
    const shuffledNames = [...names];
    for (let i = shuffledNames.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledNames[i], shuffledNames[j]] = [shuffledNames[j], shuffledNames[i]];
    }
    setGamePlayers(shuffledNames);

    const count = names.length;
    const newStraws: Straw[] = [];
    const shortIndex = Math.floor(Math.random() * count);
    for (let i = 0; i < count; i++) {
      newStraws.push({
        id: i + 1,
        isShort: i === shortIndex,
        isPulled: false
      });
    }
    setStraws(newStraws);
    setPlayerCount(names.length);
    setIsGameStarted(true);
    setGameOver(false);
    setLoserName(null);
    setCurrentPlayerIndex(0);
  };

  const handleStart = () => {
    stopAllGameSounds();
    const validPlayers = players.filter(p => p.trim() !== '');
    if (validPlayers.length < 2 || validPlayers.length > 14) {
      alert('Please enter between 2 and 14 players');
      return;
    }
    
    if (!onUseCredit()) {
      onShowAd();
      return;
    }
    
    playClick();
    setPlayers(validPlayers);
    initGame(validPlayers);
  };

  const addPlayer = () => {
    if (players.length < 14) {
      setPlayers([...players, '']);
    }
  };

  const updatePlayer = (index: number, name: string) => {
    const next = [...players];
    next[index] = name;
    setPlayers(next);
  };

  const removePlayer = (index: number) => {
    if (players.length > 2) {
      setPlayers(players.filter((_, i) => i !== index));
    }
  };

  const pullStraw = (index: number) => {
    if (gameOver || straws[index].isPulled) return;
    
    if (isMultiplayer) {
      if (!isMyTurn) return;
      socket?.emit('pull_straw_straw', { gameId, index });
      return;
    }

    const newStraws = [...straws];
    newStraws[index].isPulled = true;
    setStraws(newStraws);

    if (newStraws[index].isShort) {
      setGameOver(true);
      setLoserName(gamePlayers[currentPlayerIndex] || `Player ${currentPlayerIndex + 1}`);
      recordGameResult(false, 'straw');
      playLose();
    } else {
      recordGameResult(true, 'straw');
      playBottleResult();
      setCurrentPlayerIndex(prev => (prev + 1) % players.length);
    }
  };

  const resetGame = () => {
    stopAllGameSounds();
    playClick();
    setIsGameStarted(false);
    setPlayerCount(null);
    setStraws([]);
    setGameOver(false);
    setIsMultiplayer(false);
    setGameId(null);
    setCurrentTurnName(null);
    setLoserName(null);
    setCurrentPlayerIndex(0);
    setGamePlayers([]);
  };

  if (!isGameStarted) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <p className="text-slate-500 font-medium mb-6 mt-4">Enter Players</p>
        
        <div className="w-full space-y-3 max-h-[40vh] overflow-y-auto pr-2 mb-6">
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
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-green-400 transition-colors font-medium"
              />
              {players.length > 2 && (
                <button 
                  onClick={() => removePlayer(index)}
                  className="p-3 text-red-100 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-colors"
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
            className="mb-8 flex items-center gap-2 text-green-600 font-bold text-sm hover:bg-green-50 px-4 py-2 rounded-full transition-colors"
          >
            <Plus size={18} />
            Add Player
          </button>
        )}

        <div className="w-full space-y-3">
          <button
            onClick={handleStart}
            className="w-full py-5 bg-green-500 text-white rounded-3xl font-black text-xl shadow-xl shadow-green-100 hover:bg-green-600 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <Play fill="currentColor" />
            START GAME
          </button>
          <p className="mt-4 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">Costs 1 Credit</p>
        </div>
      </div>
    );
  }

  return (
    <div id="game-container" className="w-full h-full flex flex-col items-center pt-0">
      <div className="mb-2 text-center shrink-0">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0">
          {gameOver ? 'Game Over' : (isMultiplayer ? 'Multiplayer Match' : '')}
        </h3>
        <div className="text-slate-900 font-black text-base leading-tight mt-1">
          {gameOver ? (
            <p>{loserName} got the short straw!</p>
          ) : (
            isMultiplayer ? (
              isMyTurn ? (
                <span className="inline-flex items-center gap-2 px-6 py-1.5 bg-emerald-500 text-white rounded-full font-black animate-pulse shadow-lg shadow-emerald-500/20 text-xs">
                  <Sparkles size={14} fill="white" />
                  {user?.name}, YOUR MOVE NOW!
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-6 py-1.5 bg-amber-100 text-amber-700 rounded-full font-black border border-amber-200 text-xs uppercase">
                  {currentTurnName}, YOU ARE NEXT!
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-2 px-6 py-1.5 bg-green-500 text-white rounded-full font-black shadow-lg shadow-green-500/20 text-xs uppercase">
                <Sparkles size={14} fill="white" />
                {gamePlayers[currentPlayerIndex]} pick a straw
              </span>
            )
          )}
        </div>
      </div>

      <div className="flex-1" />

      <div className="flex flex-col gap-12 w-full mb-12 shrink-0">
        {(playerCount && playerCount > 8 
          ? [straws.slice(0, Math.ceil(playerCount / 2)), straws.slice(Math.ceil(playerCount / 2))]
          : [straws]
        ).map((rowStraws, rowIndex) => (
          <div key={rowIndex} className="flex flex-wrap justify-center gap-x-3 gap-y-10 items-end w-full min-h-[140px]">
            {rowStraws.map((straw) => {
              const globalIndex = straws.findIndex(s => s.id === straw.id);
              return (
                <motion.div
                  key={straw.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ 
                    y: straw.isPulled ? (straw.isShort ? -20 : -60) : 0,
                    opacity: 1,
                    scale: straw.isPulled ? 1.05 : 1,
                    zIndex: straw.isPulled ? 10 : 1
                  }}
                  onClick={() => pullStraw(globalIndex)}
                  className={`relative cursor-pointer group flex flex-col items-center ${(!isMyTurn && isMultiplayer && !gameOver) ? 'pointer-events-none opacity-80' : ''}`}
                >
                  <div className={`mb-1 font-black text-[10px] ${straw.isPulled ? 'opacity-0' : 'opacity-100'} transition-opacity text-slate-400`}>
                    {straw.id}
                  </div>
                  
                  <div className={`w-5 rounded-full transition-all duration-500 ${
                    straw.isPulled 
                      ? (straw.isShort ? 'bg-red-500 h-14' : 'bg-green-400 h-36') 
                      : 'bg-green-200 h-28 group-hover:bg-green-300'
                  } shadow-lg relative`}>
                    <div className="absolute inset-0 opacity-20 flex flex-col gap-3 py-3 overflow-hidden">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-1 w-full bg-white rotate-45" />
                      ))}
                    </div>
                    
                    {!straw.isPulled && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-green-800 font-black text-[10px] opacity-40">{straw.id}</span>
                      </div>
                    )}
                  </div>

                  <AnimatePresence>
                    {straw.isPulled && straw.isShort && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute -top-10 text-2xl z-20"
                      >
                        😱
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="w-full space-y-3 shrink-0">
        {!gameOver && (
          <button
            onClick={resetGame}
            className="w-full py-3 text-slate-400 font-bold text-sm flex items-center justify-center gap-2 hover:text-slate-600 transition-colors"
          >
            Cancel Game
          </button>
        )}
      </div>
      <div className="h-8 shrink-0" />

      <AnimatePresence>
        {gameOver && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-[300px] px-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -20 }}
              className="bg-white/95 backdrop-blur-md rounded-[2rem] p-5 text-center shadow-2xl border border-slate-100"
            >
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-xl">
                  😱
                </div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Game Over!</h3>
              </div>
              
              <p className="text-slate-500 text-xs font-bold mb-4">
                <span className="font-black text-red-500">{loserName}</span> got the short straw!
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (isMultiplayer) {
                      resetGame();
                      if (onPlayAgainChallenge) onPlayAgainChallenge();
                    } else {
                      initGame(players);
                    }
                  }}
                  className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-green-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <RotateCcw size={16} />
                  Play Again
                </button>
                
                <button
                  onClick={resetGame}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-500 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all active:scale-95"
                >
                  Menu
                </button>
              </div>
              <div className="mt-3">
                <ShareResult gameName="Short Straw" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShortStrawGame;
