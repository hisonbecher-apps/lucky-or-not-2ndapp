import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { useSocket } from '../context/SocketContext';
import { GAMES, GameId } from '../types';
import { ArrowLeft, Play, X, Plus, Loader2 } from 'lucide-react';
import { triggerConfetti, resetConfetti } from '../utils/confetti';
import { useDragToScroll } from '../hooks/useDragToScroll';
import SpinBottleGame from '../components/SpinBottleGame';
import LuckyImageGame from '../components/LuckyImageGame';
import FortuneCookieGame from '../components/FortuneCookieGame';
import ShortStrawGame from '../components/ShortStrawGame';
import RockPaperScissorsGame from '../components/RockPaperScissorsGame';
import GiftBoxGame from '../components/GiftBoxGame';
import CoinFlipGame from '../components/CoinFlipGame';
import WheelOfFortuneGame from '../components/WheelOfFortuneGame';
import DaisyLoveGame from '../components/DaisyLoveGame';
import BrideBouquetGame from '../components/BrideBouquetGame';
import DetailedClover from '../components/DetailedClover';
import BannerAd from '../components/BannerAd';
import GlobalHeader from '../components/GlobalHeader';

interface GameDetailPageProps {
  gameId: GameId;
  onBack: (wasChallenge?: boolean) => void;
  onShowAd: () => void;
  onOpenShop: () => void;
  onOpenProfile?: () => void;
}

const GameDetailPage: React.FC<GameDetailPageProps> = ({ gameId, onBack, onShowAd, onOpenShop, onOpenProfile }) => {
  const { credits, useCredit, addCredits, user, stopAllGameSounds } = useAppContext();
  const { isWaitingForOpponent, setWaitingForOpponent } = useSocket();
  const scrollRef = useDragToScroll();
  const game = GAMES.find(g => g.id === gameId)!;
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [result, setResult] = useState<'win' | 'lose' | null>(null);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      stopAllGameSounds();
      resetConfetti();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []); // VERY IMPORTANT: empty dependency array so it only fires on true unmount

  const handleBack = (wasChallenge?: boolean) => {
    if (isWaitingForOpponent) {
      setWaitingForOpponent(false);
    }
    onBack(wasChallenge);
  };

  const handleBackChallenge = () => {
    handleBack(true);
  };

  const handlePlay = () => {
    if (credits <= 0) {
      onShowAd();
      return;
    }

    setIsPlaying(true);
    setResult(null);
    useCredit();

    // Simulate game logic
    timeoutRef.current = setTimeout(() => {
      const isWin = Math.random() > 0.5;
      setResult(isWin ? 'win' : 'lose');
      setIsPlaying(false);
      
      if (isWin) {
        triggerConfetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399', '#6ee7b7']
        });
      }
    }, 600);
  };

  const isSpinBottle = gameId === 'spin-bottle';
  const isLuckyImage = gameId === 'lucky-image';
  const isFortuneCookie = gameId === 'fortune-cookie';
  const isShortStraw = gameId === 'short-straw';
  const isRPS = gameId === 'rps';
  const isGiftBox = gameId === 'gift-box';
  const isCoinFlip = gameId === 'coin-flip';
  const isWheelOfFortune = gameId === 'wheel-of-fortune';
  const isDaisyLove = gameId === 'daisy-love';
  const isBrideBouquet = gameId === 'bride-bouquet';

  return (
    <div className="h-full w-full flex flex-col bg-white relative">
      <GlobalHeader 
        showBack={true}
        onBack={handleBack}
        onOpenShop={onOpenShop}
        onOpenProfile={onOpenProfile}
      />

      {/* Content */}
      <div 
        ref={scrollRef}
        className="flex-1 flex flex-col items-center px-8 text-center pt-2 pb-20 overflow-y-auto no-scrollbar select-none"
      >
        <div className="mb-4 shrink-0">
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">{game.title}</h1>
        </div>

        <div className="flex-1 w-full flex justify-center items-center relative">
          {isSpinBottle ? (
            <SpinBottleGame 
              onUseCredit={useCredit} 
              onShowAd={onShowAd} 
              onPlayAgainChallenge={handleBackChallenge}
            />
          ) : isLuckyImage ? (
            <LuckyImageGame 
              onUseCredit={useCredit} 
              onShowAd={onShowAd} 
            />
          ) : isFortuneCookie ? (
            <FortuneCookieGame 
              onUseCredit={useCredit} 
              onShowAd={onShowAd} 
            />
          ) : isShortStraw ? (
            <ShortStrawGame 
              onUseCredit={useCredit} 
              onShowAd={onShowAd} 
              onPlayAgainChallenge={handleBackChallenge}
            />
          ) : isRPS ? (
            <RockPaperScissorsGame 
              onUseCredit={useCredit} 
              onShowAd={onShowAd} 
              onPlayAgainChallenge={handleBackChallenge}
            />
          ) : isGiftBox ? (
            <GiftBoxGame 
              onUseCredit={useCredit} 
              onShowAd={onShowAd} 
            />
          ) : isCoinFlip ? (
            <CoinFlipGame 
              onUseCredit={useCredit} 
              onShowAd={onShowAd} 
              onPlayAgainChallenge={handleBackChallenge}
            />
          ) : isWheelOfFortune ? (
            <WheelOfFortuneGame 
              onUseCredit={useCredit} 
              onShowAd={onShowAd} 
              onPlayAgainChallenge={handleBackChallenge}
            />
          ) : isDaisyLove ? (
            <DaisyLoveGame 
              onUseCredit={useCredit} 
              onShowAd={onShowAd} 
            />
          ) : isBrideBouquet ? (
            <BrideBouquetGame 
              onUseCredit={useCredit} 
              onShowAd={onShowAd} 
              onPlayAgainChallenge={handleBackChallenge}
            />
          ) : (
            <AnimatePresence mode="wait">
              {isPlaying ? (
                <motion.div
                  key="playing"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.2, opacity: 0 }}
                  className="flex flex-col items-center"
                  style={{ transform: 'translateZ(0)' }}
                >
                  <div className="relative w-48 h-48 flex items-center justify-center mb-8">
                    {/* Outer rotating dashed ring */}
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 rounded-full border-4 border-dashed border-emerald-200"
                    />
                    {/* Inner rotating solid ring (opposite direction) */}
                    <motion.div 
                      animate={{ rotate: -360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-4 rounded-full border-4 border-emerald-400 border-t-transparent border-b-transparent"
                    />
                    {/* Center bouncing icon */}
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0]
                      }}
                      transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                      className="text-6xl drop-shadow-lg"
                    >
                      {game.icon}
                    </motion.div>
                    
                    {/* Floating particles */}
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{
                          y: [0, -40, 0],
                          x: [0, (i % 2 === 0 ? 20 : -20), 0],
                          opacity: [0, 1, 0],
                          scale: [0.5, 1, 0.5]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.3,
                          ease: "easeInOut"
                        }}
                        className="absolute w-3 h-3 bg-emerald-300 rounded-full"
                        style={{
                          top: '50%',
                          left: '50%',
                          transformOrigin: 'center',
                          transform: `rotate(${i * 60}deg) translateY(-40px)`
                        }}
                      />
                    ))}
                  </div>
                  <motion.p 
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="text-xl font-black text-slate-800 tracking-widest uppercase"
                  >
                    TESTING LUCK...
                  </motion.p>
                </motion.div>
              ) : result ? (
                <motion.div
                  key="result"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center"
                  style={{ transform: 'translateZ(0)' }}
                >
                  <div className={`text-8xl mb-6 ${result === 'win' ? 'animate-bounce' : 'grayscale opacity-50'}`}>
                    {result === 'win' ? '🎉' : '😢'}
                  </div>
                  <h2 className={`text-4xl font-black mb-2 ${result === 'win' ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {result === 'win' ? 'YOU WON!' : 'NOT THIS TIME'}
                  </h2>
                  <p className="text-slate-500 font-medium">
                    {result === 'win' ? 'Your luck is shining today!' : 'Better luck next time!'}
                  </p>
                  <button 
                    onClick={() => {
                      setResult(null);
                    }}
                    className="mt-8 px-8 py-3 bg-slate-100 text-slate-600 rounded-full font-bold hover:bg-slate-200 transition-colors"
                  >
                    Try Again
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center"
                  style={{ transform: 'translateZ(0)' }}
                >
                  <div className={`w-64 h-64 ${game.color} rounded-[3rem] flex items-center justify-center text-8xl shadow-2xl shadow-slate-200 mb-8`}>
                    {game.icon}
                  </div>
                  <p className="text-slate-500 font-medium max-w-[200px]">
                    Tap play to test your luck. Costs 1 credit.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {!isSpinBottle && !isLuckyImage && !isFortuneCookie && !isShortStraw && !isRPS && !isGiftBox && !isCoinFlip && !isWheelOfFortune && !isDaisyLove && !isBrideBouquet && (
          <div className="w-full pb-12 pt-8">
            <button
              disabled={isPlaying || !!result}
              onClick={handlePlay}
              className={`w-full py-5 rounded-3xl font-black text-xl flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 ${
                isPlaying || !!result 
                ? 'bg-slate-100 text-slate-300 shadow-none' 
                : 'bg-emerald-500 text-white shadow-emerald-100 hover:bg-emerald-600'
              }`}
            >
              <Play fill="currentColor" />
              PLAY NOW
            </button>
          </div>
        )}
      </div>

      {/* Ad Popup removed - handled globally by AdModal */}
      
    </div>
  );
};

export default GameDetailPage;
