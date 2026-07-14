/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AppProvider, useAppContext } from './context/AppContext';
import { SocketProvider } from './context/SocketContext';
import DevSplashPage from './pages/DevSplashPage';
import SplashPage from './pages/SplashPage';
import RegistrationPage from './pages/RegistrationPage';
import MottoPage from './pages/MottoPage';
import GamesPage from './pages/GamesPage';
import GameDetailPage from './pages/GameDetailPage';
import SettingsPage from './pages/SettingsPage';
import UserPage from './pages/UserPage';
import NumberGeneratorPage from './pages/NumberGeneratorPage';
import BannerAd from './components/BannerAd';
import AdModal from './components/AdModal';
import { GameId } from './types';
import { useSocket } from './context/SocketContext';
import GlobalInvitations from './components/GlobalInvitations';
import ChallengeModal from './components/ChallengeModal';
import { adService } from './services/adService';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';

type Page = 'dev-splash' | 'splash' | 'register' | 'motto' | 'games' | 'game-detail' | 'settings' | 'profile' | 'number-generator';

const AppContent: React.FC = () => {
  const { skipMotto, refreshMotto, playClick, playMusic, user, gamesPlayed, creditsSpent, incrementGamesPlayed, addCredits } = useAppContext();
  const { socket } = useSocket();
  const [currentPage, setCurrentPage] = useState<Page>('dev-splash');
  const [selectedGameId, setSelectedGameId] = useState<GameId | null>(null);
  const [lastAdCredits, setLastAdCredits] = useState(0);
  
  // Ad state
  const [isAdOpen, setIsAdOpen] = useState(false);
  const [isChallengeOpen, setIsChallengeOpen] = useState(false);
  const [adRewardType, setAdRewardType] = useState<'credits' | 'game_entry'>('credits');
  const [pendingGameId, setPendingGameId] = useState<GameId | null>(null);
  const [gamesActiveTab, setGamesActiveTab] = useState<string>('classic');
  const { 
    setMusicVolume, 
    setSoundVolume, 
    setMusicEnabled, 
    setSoundEnabled,
  } = useAppContext();

  useEffect(() => {
    // Initial sound settings
    const saved = localStorage.getItem('lucky_or_not_state');
    refreshMotto();
  }, []);

  // Back Button Support via Hash Routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      
      if (hash === 'ad-modal') {
        setIsAdOpen(true);
        return;
      } else if (hash === 'challenge-modal') {
        setIsChallengeOpen(true);
        return;
      }
      
      // Not a modal hash, so ensure modals are closed
      setIsAdOpen(false);
      setIsChallengeOpen(false);

      if (['dev-splash', 'splash', 'register', 'motto', 'games', 'game-detail', 'settings', 'profile', 'number-generator'].includes(hash)) {
        setCurrentPage(hash as Page);
      } else if (!hash) {
        if (!user) setCurrentPage('dev-splash');
        else setCurrentPage('games');
      }
    };

    // Initial sync
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []); // Only bind once on mount


  // Push to history whenever we navigate forward or open a modal
  useEffect(() => {
    const currentHash = window.location.hash.replace('#', '');
    if (isAdOpen) {
      if (currentHash !== 'ad-modal') window.location.hash = 'ad-modal';
    } else if (isChallengeOpen) {
      if (currentHash !== 'challenge-modal') window.location.hash = 'challenge-modal';
    } else {
      if (currentHash === 'ad-modal' || currentHash === 'challenge-modal') {
        window.location.replace(`#${currentPage}`);
      } else if (currentHash !== currentPage) {
        window.location.hash = currentPage;
      }
    }
  }, [isChallengeOpen, isAdOpen, currentPage]);

  // Ensure music starts on the first user interaction globally
  useEffect(() => {
    const handleFirstInteraction = () => {
      playMusic();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button')) {
        playClick();
      }
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);
    document.addEventListener('click', handleGlobalClick);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [playMusic, playClick]);

  // Handle global sign-out redirect
  useEffect(() => {
    if (!user && currentPage !== 'splash' && currentPage !== 'register') {
      setCurrentPage('splash');
    }
  }, [user, currentPage]);

  const navigateBack = (forceChallenge?: any) => {
    playClick();
    
    // Check if we were in a challenge flow explicitly
    const wasChallenge = forceChallenge === true;
    
    if (window.history.length > 1 && window.location.hash && window.location.hash !== '#games') {
      window.history.back();
    } else {
      window.location.hash = 'games';
    }

    // After navigation (or if already there), if it was a challenge, reopen the modal
    if (wasChallenge) {
      setTimeout(() => {
        setIsChallengeOpen(true);
      }, 100);
    }
  };

  // Listen for hardware back button
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const backListener = CapApp.addListener('backButton', () => {
      // 1. If a modal is open, close it
      if (isAdOpen) {
        setIsAdOpen(false);
        window.history.back();
        return;
      }
      if (isChallengeOpen) {
        setIsChallengeOpen(false);
        window.history.back();
        return;
      }

      // 2. If we are not on the main page, go back
      if (currentPage !== 'games' && currentPage !== 'splash') {
        navigateBack();
      } else {
        // 3. If on main page, let the app exit
        CapApp.exitApp();
      }
    });

    return () => {
      backListener.then(l => l.remove());
    };
  }, [currentPage, isAdOpen, isChallengeOpen]);

  const navigateToMotto = () => {
    playClick();
    if (!user) {
      window.location.hash = 'register';
      return;
    }
    if (skipMotto) {
      window.location.hash = 'games';
    } else {
      window.location.hash = 'motto';
    }
  };

  const handleRegistrationComplete = () => {
    if (skipMotto) {
      window.location.hash = 'games';
    } else {
      window.location.hash = 'motto';
    }
  };

  const openGame = async (id: GameId) => {
    playClick();
    
    // Logic: Show interstitial every 10 credits spent
    const creditsSinceAd = (creditsSpent || 0) - lastAdCredits;
    const needsAd = creditsSinceAd >= 10;
    
    if (needsAd) {
      setLastAdCredits(creditsSpent || 0);
      await adService.showInterstitial();
    }

    setSelectedGameId(id);
    setPendingGameId(null);
    setGamesActiveTab('classic');
    setCurrentPage('game-detail');
    incrementGamesPlayed();
  };

  const handleAdComplete = () => {
    if (adRewardType === 'credits') {
      addCredits(5);
    }
  };

  const showCreditAd = () => {
    setAdRewardType('credits');
    setIsAdOpen(true);
  };

  const openShop = () => {
    showCreditAd();
  };

  const closeAdModal = () => {
    if (window.location.hash === '#ad-modal') {
      if (window.history.length > 1) window.history.back();
      else window.location.replace(`#${currentPage}`);
    } else {
      setIsAdOpen(false);
    }
  };

  const closeChallengeModal = () => {
    if (window.location.hash === '#challenge-modal') {
      if (window.history.length > 1) window.history.back();
      else window.location.replace(`#${currentPage}`);
    } else {
      setIsChallengeOpen(false);
    }
  };

  const handleGlobalAccept = (gameId: GameId) => {
    setIsChallengeOpen(false);
    setSelectedGameId(gameId);
    setGamesActiveTab('classic');
    setCurrentPage('game-detail');
    incrementGamesPlayed();
  };

  const onChallenge = (gameId: string) => {
    setIsChallengeOpen(false);
    setSelectedGameId(gameId as GameId);
    setGamesActiveTab('challenge');
    setCurrentPage('game-detail');
  };

  const handleSendChallenge = (gameId: GameId) => {
    setIsChallengeOpen(false);
    setSelectedGameId(gameId);
    setGamesActiveTab('challenge');
    setCurrentPage('game-detail');
    incrementGamesPlayed();
  };

  return (
    <div id="app-root" className={`h-[100vh] w-full max-w-md mx-auto bg-slate-50 overflow-hidden relative shadow-2xl font-sans text-slate-900 gpu-accelerated ${Capacitor.isNativePlatform() ? 'pb-16' : ''}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        {currentPage === 'dev-splash' && (
          <motion.div
            key="dev-splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full w-full"
          >
            <DevSplashPage onComplete={() => setCurrentPage('splash')} />
          </motion.div>
        )}

        {currentPage === 'splash' && (
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full w-full"
          >
            <SplashPage onStart={navigateToMotto} />
          </motion.div>
        )}

        {currentPage === 'register' && (
          <motion.div
            key="register"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="h-full w-full"
          >
            <RegistrationPage onComplete={handleRegistrationComplete} />
          </motion.div>
        )}

        {currentPage === 'motto' && (
          <motion.div
            key="motto"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="h-full w-full"
          >
            <MottoPage onContinue={() => setCurrentPage('games')} />
          </motion.div>
        )}

        {currentPage === 'games' && (
          <motion.div
            key="games"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="h-full w-full"
          >
            <GamesPage 
              onOpenGame={openGame} 
              onOpenSettings={() => { window.location.hash = 'settings'; }} 
              onOpenShop={openShop}
              onOpenChallenge={() => { playClick(); setIsChallengeOpen(true); }}
              onOpenProfile={() => { window.location.hash = 'profile'; }}
              onOpenNumberGenerator={() => { playClick(); window.location.hash = 'number-generator'; }}
            />
          </motion.div>
        )}

        {currentPage === 'game-detail' && selectedGameId && (
          <motion.div
            key={`game-${selectedGameId}`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="h-full w-full"
          >
            <GameDetailPage 
              gameId={selectedGameId} 
              onBack={navigateBack} 
              onShowAd={showCreditAd}
              onOpenShop={openShop}
              onOpenProfile={() => { window.location.hash = 'profile'; }}
            />
          </motion.div>
        )}

        {currentPage === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="h-full w-full"
          >
            <SettingsPage 
              onBack={navigateBack} 
              onOpenProfile={() => { window.location.hash = 'profile'; }}
            />
          </motion.div>
        )}

        {currentPage === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="h-full w-full"
          >
            <UserPage onBack={navigateBack} />
          </motion.div>
        )}

        {currentPage === 'number-generator' && (
          <motion.div
            key="number-generator"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="h-full w-full"
          >
            <NumberGeneratorPage 
              onBack={navigateBack} 
              onOpenProfile={() => { window.location.hash = 'profile'; }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {currentPage !== 'dev-splash' && currentPage !== 'splash' && <BannerAd />}
      
      <AdModal 
        isOpen={isAdOpen} 
        onClose={closeAdModal} 
        onComplete={handleAdComplete}
        rewardType={adRewardType}
      />

      <ChallengeModal
        isOpen={isChallengeOpen}
        onClose={closeChallengeModal}
        onChallenge={handleSendChallenge}
      />

      <GlobalInvitations onAccept={handleGlobalAccept} />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <SocketProvider>
        <div className="min-h-screen bg-slate-200 flex items-center justify-center p-0 sm:p-4">
          <AppContent />
        </div>
      </SocketProvider>
    </AppProvider>
  );
}

