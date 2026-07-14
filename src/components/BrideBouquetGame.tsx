import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Users, Play, Send, Check, Trash2, X, Plus } from 'lucide-react';
import { triggerConfetti } from '../utils/confetti';
import { useSocket } from '../context/SocketContext';
import { useAppContext } from '../context/AppContext';

import ShareResult from './ShareResult';

interface BrideBouquetGameProps {
  onUseCredit: () => boolean;
  onShowAd: () => void;
  onPlayAgainChallenge?: () => void;
}



const BrideBouquetGame: React.FC<BrideBouquetGameProps> = ({ onUseCredit, onShowAd, onPlayAgainChallenge }) => {
  const { user, playClick, playWin, playLose, recordGameResult, stopAllGameSounds } = useAppContext();
  const { socket, onlineCount, brideBouquetInvite, setBrideBouquetInvite } = useSocket();
  const [gameState, setGameState] = useState<'setup' | 'idle' | 'tossing' | 'result' | 'matchmaking'>('setup');
  const [result, setResult] = useState<'caught' | 'missed' | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [multiplayerPlayers, setMultiplayerPlayers] = useState<{ socketId: string; name: string }[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [winnerName, setWinnerName] = useState<string | null>(null);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('bride_bouquet_started', (data: { gameId: string; players: { socketId: string; name: string }[]; isHost: boolean }) => {
      setGameId(data.gameId);
      setMultiplayerPlayers(data.players);
      setIsHost(data.isHost || false);
      setGameState('idle');
    });

    socket.on('bride_bouquet_result', (data: { catcherName: string; catcherSocketId: string }) => {
      setWinnerName(data.catcherName);
      setResult(data.catcherSocketId === socket.id ? 'caught' : 'missed');
      setGameState('tossing');

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setGameState('result');

        // Record result for luck statistics
        recordGameResult(data.catcherSocketId === socket.id, 'bouquet');

        if (data.catcherSocketId === socket.id) {
          playWin();
          triggerConfetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ef4444', '#f87171', '#fca5a5']
          });
        } else {
          playLose();
        }
      }, 7980);
    });

    socket.on('match_found', (data: { gameId: string; opponent: string; players: any[]; isHost: boolean }) => {
      setGameId(data.gameId);
      setMultiplayerPlayers(data.players);
      setIsHost(data.isHost || false);
      setGameState('idle');
    });

    return () => {
      socket.off('bride_bouquet_started');
      socket.off('bride_bouquet_result');
      socket.off('match_found');
    };
  }, [socket]);


  const tossBouquet = () => {
    if (gameState === 'tossing') return;

    if (gameId) {
      if (!socket || !gameId) return;
      
      setGameState('tossing');
      setResult(null);
      setWinnerName(null);
      
      socket.emit('bride_bouquet_toss', { gameId });
      return;
    }

    if (!onUseCredit()) {
      onShowAd();
      return;
    }

    setGameState('tossing');
    setResult(null);
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(handleVideoEnd, 7980);
  };

  const handleVideoEnd = () => {
    if (gameId) {
      if (isHost && socket) {
        socket.emit('bride_bouquet_toss', { gameId });
      }
    } else {
      const isCaught = Math.random() > 0.4;
      setResult(isCaught ? 'caught' : 'missed');
      setGameState('result');

      // Record result for luck statistics
      recordGameResult(isCaught, 'bouquet');

      if (isCaught) {
        playWin();
        triggerConfetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ef4444', '#f87171', '#fca5a5']
        });
      } else {
        playLose();
      }
    }
  };

  const resetGame = () => {
    stopAllGameSounds();
    if (gameId && onPlayAgainChallenge) {
      onPlayAgainChallenge();
      return;
    }
    setGameState('setup');
    setResult(null);
    setWinnerName(null);
    setGameId(null);
    setIsHost(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  if (gameState === 'setup') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center px-6">
        <div className="text-8xl mb-8 animate-bounce">💐</div>
        


          <button
            onClick={tossBouquet}
            className="w-full py-5 bg-red-500 text-white rounded-3xl font-black text-xl shadow-xl shadow-red-100 hover:bg-red-600 transition-all active:scale-95 flex items-center justify-center gap-3"
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
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-2 border-red-100"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0%, transparent 70%, rgba(239, 68, 68, 0.2) 100%)'
            }}
          />
          <motion.div
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-4 rounded-full border-2 border-red-400"
          />
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="bg-white p-4 rounded-full shadow-lg"
            >
              <Users size={32} className="text-red-500" />
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
    <div id="game-container" className="w-full h-full flex flex-col items-center justify-center relative px-4">
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <AnimatePresence mode="wait">
          {gameState === 'idle' ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="text-center"
            >
              <div className="text-8xl mb-8 animate-bounce">💐</div>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest mb-4">
                Bride Bouquet Toss
              </h2>
              <p className="text-slate-500 font-medium mb-12">
                {gameId ? 'Multiplayer Challenge' : 'Will you be the next one to get married?'}
              </p>
              
              {gameId && (
                <div className="mb-8 flex flex-wrap justify-center gap-2">
                  <div className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold uppercase tracking-wider">
                    {user?.name} (You)
                  </div>
                  {multiplayerPlayers.filter(p => p.socketId !== socket?.id).map(p => (
                    <div key={p.socketId} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wider">
                      {p.name}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={tossBouquet}
                disabled={gameId && !isHost}
                className={`px-12 py-4 bg-red-500 hover:bg-red-600 text-white rounded-full font-black text-xl shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {gameId && !isHost ? 'WAITING FOR HOST...' : 'TOSS BOUQUET'}
              </button>
              <p className="mt-4 text-slate-400 font-bold text-xs uppercase tracking-widest">Costs 1 Credit</p>
              
              {gameId && (
                <button 
                  onClick={resetGame}
                  className="mt-8 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-red-500 transition-colors"
                >
                  Leave Game
                </button>
              )}
            </motion.div>
          ) : gameState === 'tossing' ? (
            <motion.div
              key="tossing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="overflow-hidden w-60 rounded-[3rem] shadow-2xl relative mx-auto bg-slate-100"
              >
              <video
                autoPlay
                playsInline
                className="w-full h-auto object-cover"
              >
                <source src="/videos/bride_toss.mp4" type="video/mp4" />
              </video>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="mb-8 w-64 h-64 mx-auto overflow-hidden rounded-[3rem] shadow-2xl border-4 border-slate-50 bg-slate-200 flex items-center justify-center">
                <img 
                  src={result === 'caught' ? "/images/caught_bouquet.webp" : "/images/missed_bouquet.webp"} 
                  alt={result || ''} 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className={`text-3xl font-black uppercase tracking-tighter mb-2 ${result === 'caught' ? 'text-red-600' : 'text-slate-400'}`}>
                {result === 'caught' ? 'You caught it!' : 'Not this time!'}
              </h3>
              <p className="text-slate-500 font-medium mb-12">
                {result === 'caught' ? 'Get ready for the big day!' : 'Try again!'}
              </p>
              <button
                onClick={resetGame}
                className="flex items-center gap-2 bg-slate-100 text-slate-600 px-8 py-3 rounded-full font-bold hover:bg-slate-200 transition-colors mx-auto"
              >
                <RotateCcw size={18} />
                Try Again
              </button>
              <div className="mt-4 max-w-[200px] mx-auto">
                <ShareResult gameName="Bride Bouquet" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BrideBouquetGame;
