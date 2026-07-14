import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Swords, User, Dice5, Loader2, Play } from 'lucide-react';
import { GAMES, GameId } from '../types';
import { useAppContext, SYSTEM_PLAYERS } from '../context/AppContext';
import { useSocket } from '../context/SocketContext';
import { useDragToScroll } from '../hooks/useDragToScroll';

interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChallenge: (gameId: GameId) => void;
}

const SUPPORTED_GAMES: GameId[] = ['rps', 'short-straw', 'spin-bottle', 'wheel-of-fortune', 'coin-flip', 'bride-bouquet'];

const ChallengeModal: React.FC<ChallengeModalProps> = ({ isOpen, onClose, onChallenge }) => {
  const { playClick, user, friends } = useAppContext();
  const { socket, fetchOnlineUsers, setWaitingForOpponent } = useSocket();
  
  const [selectedGame, setSelectedGame] = useState<GameId>('rps');
  const [onlinePlayers, setOnlinePlayers] = useState<{id: string, name: string}[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // UI States
  const [showYouChoosePopup, setShowYouChoosePopup] = useState(false);
  const [showRandomAnimation, setShowRandomAnimation] = useState(false);
  const [randomPlayerName, setRandomPlayerName] = useState<string>('');
  const [randomResult, setRandomResult] = useState<'animating' | 'found' | 'not-found'>('animating');

  const randomIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const randomTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const contentRef = useDragToScroll();

  useEffect(() => {
    if (isOpen) {
      loadOnlinePlayers();
      setIsSending(false);
      setShowYouChoosePopup(false);
      setShowRandomAnimation(false);
    }
    return () => {
      if (randomIntervalRef.current) clearInterval(randomIntervalRef.current);
      if (randomTimeoutRef.current) clearTimeout(randomTimeoutRef.current);
    };
  }, [isOpen]);

  const loadOnlinePlayers = async () => {
    setIsLoadingPlayers(true);
    try {
      const players = await fetchOnlineUsers();
      setOnlinePlayers(players);
    } catch (e) {
      console.error(e);
    }
    setIsLoadingPlayers(false);
  };

  const handleSend = (name: string) => {
    if (!name || !socket || !user) return;
    if (!socket.connected) {
      alert("Socket server is not connected. If you are on a mobile device, please check if your server is configured and running on a public address.");
      return;
    }
    
    playClick();
    setIsSending(true);

    const onUserNotFound = () => {
      setIsSending(false);
      socket.off('user_not_found', onUserNotFound);
      socket.off('invite_sent', onInviteSent);
      socket.off('challenge_sent', onInviteSent);
    };

    const onInviteSent = () => {
      setIsSending(false);
      onChallenge(selectedGame);
      socket.off('user_not_found', onUserNotFound);
      socket.off('invite_sent', onInviteSent);
      socket.off('challenge_sent', onInviteSent);
    };

    socket.on('user_not_found', onUserNotFound);
    socket.on('invite_sent', onInviteSent);
    socket.on('challenge_sent', onInviteSent);

    const gameId = selectedGame;
    const newGameId = `${gameId}_${socket.id}_${Date.now()}`;

    if (gameId === 'rps') {
      socket.emit('challenge_user', name);
    } else {
      if (gameId === 'short-straw') {
        socket.emit('invite_short_straw', { targetName: name, gameId: newGameId });
      } else if (gameId === 'spin-bottle') {
        socket.emit('invite_spin_bottle', { targetName: name, gameId: newGameId });
      } else if (gameId === 'bride-bouquet') {
        socket.emit('invite_bride_bouquet', { targetName: name, gameId: newGameId });
      } else if (gameId === 'wheel-of-fortune') {
        socket.emit('invite_wheel_of_fortune', { targetName: name, gameId: newGameId });
      } else if (gameId === 'coin-flip') {
        socket.emit('invite_coin_flip', { targetName: name, gameId: newGameId });
      }
    }
  };

  const startRandomAnimation = async () => {
    playClick();
    setShowRandomAnimation(true);
    setRandomResult('animating');
    
    // Refresh players first to be sure
    setIsLoadingPlayers(true);
    const players = await fetchOnlineUsers();
    setOnlinePlayers(players);
    setIsLoadingPlayers(false);

    if (players.length === 0) {
      setRandomResult('not-found');
      randomTimeoutRef.current = setTimeout(() => {
        setShowRandomAnimation(false);
      }, 2000);
      return;
    }

    // Animation loop
    let ticks = 0;
    const maxTicks = 20;
    randomIntervalRef.current = setInterval(() => {
      const p = players[Math.floor(Math.random() * players.length)];
      setRandomPlayerName(p.name);
      ticks++;
      if (ticks >= maxTicks) {
        if (randomIntervalRef.current) clearInterval(randomIntervalRef.current);
        const finalPlayer = players[Math.floor(Math.random() * players.length)];
        setRandomPlayerName(finalPlayer.name);
        setRandomResult('found');
        
        // Auto send after 1s
        randomTimeoutRef.current = setTimeout(() => {
          handleSend(finalPlayer.name);
        }, 1000);
      }
    }, 100);
  };

  const cancelRandomAnimation = () => {
    playClick();
    if (randomIntervalRef.current) clearInterval(randomIntervalRef.current);
    if (randomTimeoutRef.current) clearTimeout(randomTimeoutRef.current);
    setShowRandomAnimation(false);
  };

  const supportedGameDetails = GAMES.filter(g => SUPPORTED_GAMES.includes(g.id));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 overflow-hidden"
        >
          {/* Flame Backdrop */}
          <div 
            className="absolute inset-0 bg-cover bg-center scale-110 blur-sm brightness-[0.3]"
            style={{ backgroundImage: 'url(/assets/images/flame_bg.webp)' }}
          />
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
          
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="relative p-6 text-center overflow-hidden shrink-0 border-b-2 border-orange-500/30">
              <div 
                className="absolute inset-0 bg-cover bg-center" 
                style={{ backgroundImage: 'url(/assets/images/flame_bg.webp)' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-red-600/60 via-transparent to-orange-500/40 animate-pulse" />
              
              <div className="relative z-10">
                <button 
                  onClick={onClose}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-red-500/20">
                  <Swords fill="white" className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-[0.2em] drop-shadow-lg">Challenge</h3>
              </div>
            </div>

            {/* Content (Main View) */}
            <div 
              ref={contentRef}
              className="p-6 overflow-y-auto slim-scrollbar select-none flex-1"
            >
              <section>
                <h4 className="font-black text-slate-400 uppercase tracking-wider text-xs mb-3 text-center">Select Game</h4>
                <div className="grid grid-cols-3 gap-2">
                  {supportedGameDetails.map((game) => (
                    <button
                      key={game.id}
                      onClick={() => { playClick(); setSelectedGame(game.id); }}
                      className={`relative p-2 h-24 rounded-2xl border-2 transition-all active:scale-95 flex flex-col items-center justify-center gap-1 ${
                        selectedGame === game.id 
                          ? 'border-red-400 bg-red-50 ring-4 ring-red-100' 
                          : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                      }`}
                    >
                      <div className={`w-10 h-10 ${game.color} rounded-xl flex items-center justify-center text-xl shadow-inner`}>
                        {game.icon}
                      </div>
                      <span className="text-xs font-bold text-slate-700 text-center">{game.title}</span>
                    </button>
                  ))}
                </div>
              </section>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0 flex gap-3">
              <button
                onClick={() => { playClick(); setShowYouChoosePopup(true); }}
                className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 hover:opacity-90 transition-opacity active:scale-95"
              >
                <User size={20} />
                CHOOSE
              </button>
              <button
                onClick={startRandomAnimation}
                className="flex-1 py-4 bg-orange-500 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 hover:opacity-90 transition-opacity active:scale-95"
              >
                <Dice5 size={20} />
                RANDOM
              </button>
            </div>

            {/* YOU CHOOSE POPUP */}
            <AnimatePresence>
              {showYouChoosePopup && (
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="absolute inset-0 bg-white z-20 flex flex-col"
                >
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
                    <h3 className="font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <User className="text-emerald-500" size={18} /> Choose Opponent
                    </h3>
                    <button 
                      onClick={() => setShowYouChoosePopup(false)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                    <span className="text-xs font-bold text-slate-400 uppercase">Online Players ({onlinePlayers.length})</span>
                    <button onClick={loadOnlinePlayers} className="text-emerald-500 hover:text-emerald-600 p-1 flex items-center gap-1 text-xs font-bold">
                       <motion.div animate={{ rotate: isLoadingPlayers ? 360 : 0 }} transition={{ duration: 1, repeat: isLoadingPlayers ? Infinity : 0, ease: "linear" }}>
                          <Loader2 size={14} />
                       </motion.div>
                       REFRESH
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto slim-scrollbar p-4 bg-slate-50">
                    {(() => {
                      const displayPlayers: {name: string, isFriend: boolean, isOnline: boolean}[] = [];
                      
                      // Add all system bots first
                      SYSTEM_PLAYERS.forEach(bot => {
                        const isFriend = friends?.some(f => f.name === bot.name) || false;
                        displayPlayers.push({ name: bot.name, isFriend, isOnline: bot.isOnline });
                      });

                      // Add friends who are not already in displayPlayers (i.e. not bots)
                      friends?.forEach(f => {
                        if (!displayPlayers.some(dp => dp.name === f.name)) {
                          displayPlayers.push({ name: f.name, isFriend: true, isOnline: f.isOnline });
                        }
                      });

                      // Add online players who are not in displayPlayers (not bots, not friends) and not self
                      onlinePlayers.forEach(p => {
                        if (!displayPlayers.some(dp => dp.name === p.name) && p.name !== user?.name) {
                          displayPlayers.push({ name: p.name, isFriend: false, isOnline: true });
                        }
                      });

                      if (displayPlayers.length === 0 && !isLoadingPlayers) {
                        return (
                          <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-50">
                            <User size={48} className="mb-2" />
                            <p className="text-sm font-bold uppercase tracking-widest text-center">No players found.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-2">
                          {displayPlayers.map((p, i) => (
                            <button
                              key={i}
                              disabled={isSending}
                              onClick={() => handleSend(p.name)}
                              className="w-full bg-white p-4 rounded-2xl border-2 border-slate-100 hover:border-emerald-200 flex items-center justify-between transition-all active:scale-95 group disabled:opacity-50"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${p.isOnline ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-slate-300'}`} />
                                <div className="flex flex-col items-start">
                                  <span className="font-black text-slate-700 text-lg">{p.name}</span>
                                  {p.isFriend && <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Friend</span>}
                                </div>
                              </div>
                              <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                                {isSending ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} className="ml-1" />}
                              </div>
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* RANDOM ANIMATION POPUP */}
            <AnimatePresence>
              {showRandomAnimation && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 bg-slate-900/90 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6"
                >
                  {randomResult === 'not-found' ? (
                    <motion.div 
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      className="text-center"
                    >
                      <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-slate-700">
                        <X className="text-slate-500" size={40} />
                      </div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-2">No Match</h3>
                      <p className="text-slate-400 font-medium">Try again later.</p>
                    </motion.div>
                  ) : (
                    <div className="text-center w-full">
                      <div className="w-24 h-24 bg-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-orange-500/50 relative overflow-hidden">
                        <motion.div
                          animate={{ rotate: randomResult === 'animating' ? 360 : 0 }}
                          transition={{ duration: 0.5, repeat: randomResult === 'animating' ? Infinity : 0, ease: "linear" }}
                        >
                          <Dice5 className="text-white" size={48} />
                        </motion.div>
                        {randomResult === 'found' && (
                          <motion.div 
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute inset-0 bg-emerald-500 flex items-center justify-center"
                          >
                            <Play className="text-white ml-1" size={48} />
                          </motion.div>
                        )}
                      </div>
                      
                      <h4 className="text-sm font-bold text-orange-400 uppercase tracking-[0.3em] mb-4">
                        {randomResult === 'animating' ? 'FINDING OPPONENT' : 'OPPONENT FOUND'}
                      </h4>
                      
                      <div className="bg-slate-800 border-2 border-slate-700 rounded-2xl py-4 px-6 overflow-hidden">
                        <AnimatePresence mode="popLayout">
                          <motion.div
                            key={randomPlayerName}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            transition={{ duration: 0.1 }}
                            className="text-2xl font-black text-white truncate"
                          >
                            {randomPlayerName || '...'}
                          </motion.div>
                        </AnimatePresence>
                      </div>

                      {isSending && randomResult === 'found' && (
                        <div className="mt-8 text-emerald-400 font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2">
                          <Loader2 size={16} className="animate-spin" />
                          Sending Invite...
                        </div>
                      )}
                    </div>
                  )}
                  
                  {randomResult === 'not-found' ? (
                    <button 
                      onClick={() => setShowRandomAnimation(false)}
                      className="mt-8 px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors"
                    >
                      Close
                    </button>
                  ) : (
                    <button 
                      onClick={cancelRandomAnimation}
                      className="mt-8 px-6 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold hover:bg-slate-700 hover:text-white transition-colors border border-slate-700"
                    >
                      Cancel
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChallengeModal;
