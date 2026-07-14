import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Swords } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { GameId } from '../types';

interface GlobalInvitationsProps {
  onAccept: (gameId: GameId) => void;
}

const GlobalInvitations: React.FC<GlobalInvitationsProps> = ({ onAccept }) => {
  const { 
    socket, 
    invitation, setInvitation, 
    shortStrawInvite, setShortStrawInvite, 
    spinBottleInvite, setSpinBottleInvite, 
    brideBouquetInvite, setBrideBouquetInvite,
    wheelOfFortuneInvite, setWheelOfFortuneInvite,
    coinFlipInvite, setCoinFlipInvite
  } = useSocket();

  const handleAcceptRps = () => {
    if (!invitation) return;
    socket?.emit('accept_challenge', invitation.fromSocketId);
    setInvitation(null);
    onAccept('rps');
  };

  const handleAcceptShortStraw = () => {
    if (!shortStrawInvite) return;
    socket?.emit('accept_short_straw', { fromSocketId: shortStrawInvite.fromSocketId, gameId: shortStrawInvite.gameId });
    setShortStrawInvite(null);
    onAccept('short-straw');
  };

  const handleAcceptSpinBottle = () => {
    if (!spinBottleInvite) return;
    socket?.emit('accept_spin_bottle', { fromSocketId: spinBottleInvite.fromSocketId, gameId: spinBottleInvite.gameId });
    setSpinBottleInvite(null);
    onAccept('spin-bottle');
  };

  const handleAcceptBrideBouquet = () => {
    if (!brideBouquetInvite) return;
    socket?.emit('accept_bride_bouquet', { fromSocketId: brideBouquetInvite.fromSocketId, gameId: brideBouquetInvite.gameId });
    setBrideBouquetInvite(null);
    onAccept('bride-bouquet');
  };

  const handleAcceptWheelOfFortune = () => {
    if (!wheelOfFortuneInvite) return;
    socket?.emit('accept_wheel_of_fortune', { fromSocketId: wheelOfFortuneInvite.fromSocketId, gameId: wheelOfFortuneInvite.gameId });
    setWheelOfFortuneInvite(null);
    onAccept('wheel-of-fortune');
  };

  const handleAcceptCoinFlip = () => {
    if (!coinFlipInvite) return;
    socket?.emit('accept_coin_flip', { fromSocketId: coinFlipInvite.fromSocketId, gameId: coinFlipInvite.gameId });
    setCoinFlipInvite(null);
    onAccept('coin-flip');
  };

  // Helper to render an invite toast
  const renderToast = (
    key: string,
    from: string,
    gameTitle: string,
    onClose: () => void,
    onAcceptToast: () => void
  ) => (
    <motion.div 
      key={key}
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="w-full max-w-sm bg-white border-2 border-red-100 shadow-2xl rounded-2xl p-4 flex items-center justify-between mb-3 pointer-events-auto overflow-hidden relative"
    >
      {/* Background flair */}
      <div className="absolute top-0 right-0 -mr-6 -mt-6 opacity-10 pointer-events-none">
        <Swords size={100} />
      </div>

      <div className="flex items-center gap-4 relative z-10">
        <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-red-500/30">
          {from[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <p className="text-sm font-black text-slate-800 leading-tight">
            <span className="text-red-500">{from}</span> challenged you!
          </p>
          <p className="text-xs font-bold text-slate-400 mt-0.5">{gameTitle}</p>
        </div>
      </div>
      <div className="flex flex-col gap-2 relative z-10">
        <button 
          onClick={onAcceptToast}
          className="w-10 h-10 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl transition-transform active:scale-90 flex items-center justify-center shadow-lg shadow-emerald-500/20"
        >
          <Check size={20} strokeWidth={3} />
        </button>
        <button 
          onClick={onClose}
          className="w-10 h-10 bg-slate-100 text-slate-400 hover:bg-slate-200 rounded-xl transition-transform active:scale-90 flex items-center justify-center"
        >
          <X size={20} />
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="fixed top-4 left-0 w-full z-[120] pointer-events-none flex flex-col items-center px-4">
      <AnimatePresence>
        {invitation && renderToast('rps-inv', invitation.from, 'Rock Paper Scissors', () => setInvitation(null), handleAcceptRps)}
        {shortStrawInvite && renderToast('shortstraw-inv', shortStrawInvite.from, 'Short Straw', () => setShortStrawInvite(null), handleAcceptShortStraw)}
        {spinBottleInvite && renderToast('spinbottle-inv', spinBottleInvite.from, 'Spin the Bottle', () => setSpinBottleInvite(null), handleAcceptSpinBottle)}
        {brideBouquetInvite && renderToast('bridebouquet-inv', brideBouquetInvite.from, 'Bride Bouquet', () => setBrideBouquetInvite(null), handleAcceptBrideBouquet)}
        {wheelOfFortuneInvite && renderToast('wheelfortune-inv', wheelOfFortuneInvite.from, 'Wheel of Fortune', () => setWheelOfFortuneInvite(null), handleAcceptWheelOfFortune)}
        {coinFlipInvite && renderToast('coinflip-inv', coinFlipInvite.from, 'Coin Flip', () => setCoinFlipInvite(null), handleAcceptCoinFlip)}
      </AnimatePresence>
    </div>
  );
};

export default GlobalInvitations;
