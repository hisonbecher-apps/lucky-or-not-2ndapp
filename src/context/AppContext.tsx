import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, MOTTOS } from '../types';
import { soundService } from '../services/soundService';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { App as CapacitorApp } from '@capacitor/app';

interface AppContextType extends AppState {
  setCredits: (credits: number) => void;
  useCredit: () => boolean;
  addCredits: (amount: number) => void;
  setSkipMotto: (skip: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setMusicEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;
  setMusicVolume: (volume: number) => void;
  resetMottoPreference: () => void;
  refreshMotto: () => void;
  setLuckyImageIndex: (index: number) => void;
  setUser: (user: { name: string, email: string } | null) => void;
  setAvatarIndex: (index: number) => void;
  recordGameResult: (isWin: boolean, gameId: string) => void;
  incrementGamesPlayed: () => void;
  markFortuneAsSeen: (index: number) => void;
  setSeenFortuneIndices: (indices: number[]) => void;
  addFriend: (friendOrName: string | any) => void;
  removeFriend: (id: string) => void;
  playWheelSpin: () => void;
  stopWheelSpin: () => void;
  playBottleSpin: () => void;
  stopBottleSpin: () => void;
  playBottleResult: () => void;
  playCoinFlip: () => void;
  stopCoinFlip: () => void;
  playCookieBreak: () => void;
  playClick: () => void;
  playWin: () => void;
  playLose: () => void;
  playJackpot: () => void;
  playMusic: () => void;
  playRpsRound: () => void;
  stopRpsRound: () => void;
  stopAllGameSounds: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'lucky_or_not_state';
const MAX_CREDITS = 15;
const REGEN_TIME = 30 * 60 * 1000; // 30 minutes in ms

export const SYSTEM_PLAYERS = [
  { id: 'bot_Blondie8', name: 'Blondie8', isOnline: true, avatarColor: 'bg-blue-500' },
  { id: 'bot_Mydoe8', name: 'Mydoe8', isOnline: true, avatarColor: 'bg-pink-500' },
  { id: 'bot_Ziverov8', name: 'Ziverov8', isOnline: false, avatarColor: 'bg-purple-500' },
  { id: 'bot_Matalay8', name: 'Matalay8', isOnline: true, avatarColor: 'bg-green-500' },
  { id: 'bot_Diamond8', name: 'Diamond8', isOnline: false, avatarColor: 'bg-amber-500' },
  { id: 'bot_Huson8', name: 'Huson8', isOnline: true, avatarColor: 'bg-rose-500' },
  { id: 'bot_Hison8', name: 'Hison8', isOnline: false, avatarColor: 'bg-cyan-500' },
  { id: 'bot_Angel8', name: 'Angel8', isOnline: true, avatarColor: 'bg-indigo-500' },
  { id: 'bot_Maniac8', name: 'Maniac8', isOnline: false, avatarColor: 'bg-teal-500' },
  { id: 'bot_Engineer8', name: 'Engineer8', isOnline: true, avatarColor: 'bg-fuchsia-500' }
];

const DEFAULT_BOTS = SYSTEM_PLAYERS.slice(0, 5);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const defaults: AppState = {
      credits: 15,
      lastCreditUpdate: Date.now(),
      lastMottoUpdate: 0,
      selectedMottoIndex: 0,
      skipMotto: false,
      soundEnabled: true,
      musicEnabled: true,
      soundVolume: 0.4,
      musicVolume: 0.25,
      lastLuckyImageUpdate: 0,
      selectedLuckyImageIndex: null,
      luckyImageHistory: [],
      user: null,
      selectedAvatarIndex: 0,
      luckHistory: {},
      seenFortuneIndices: [],
      gamesPlayed: 0,
      creditsSpent: 0,
      friends: DEFAULT_BOTS,
    };

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Maintain default bots only if friends list doesn't exist at all
        const mergedFriends = (parsed.friends !== undefined && parsed.friends !== null) ? parsed.friends : DEFAULT_BOTS;
        return { ...defaults, ...parsed, friends: mergedFriends };
      } catch (e) {
        return defaults;
      }
    }
    return defaults;
  });

  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Auth & Firestore Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User logged in
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          const userData = {
            name: firebaseUser.displayName || 'Lucky Player',
            email: firebaseUser.email || ''
          };

          if (userDoc.exists()) {
            // Sync from cloud to local
            const cloudData = userDoc.data();
            const mergedFriends = (cloudData.friends !== undefined && cloudData.friends !== null) ? cloudData.friends : DEFAULT_BOTS;
            
            setState(prev => ({
              ...prev,
              ...cloudData,
              friends: mergedFriends,
              user: userData // Always use latest auth info
            }));
          } else {
            // First time login - START FRESH
            const freshData = {
              credits: 15,
              lastCreditUpdate: Date.now(),
              lastLuckyImageUpdate: 0,
              selectedLuckyImageIndex: null,
              luckyImageHistory: [],
              luckHistory: {},
              seenFortuneIndices: [],
              gamesPlayed: 0,
              creditsSpent: 0,
              friends: DEFAULT_BOTS,
              selectedAvatarIndex: 0
            };
            
            await setDoc(userDocRef, freshData);
            setState(prev => ({ ...prev, ...freshData, user: userData }));
          }
        } catch (error) {
          console.error("Firestore sync error on login:", error);
          // Still set user so they can play even if Firestore fails
          setState(prev => ({ 
            ...prev, 
            user: {
              name: firebaseUser.displayName || 'Lucky Player',
              email: firebaseUser.email || ''
            } 
          }));
        }
      } else {
        // User logged out
        setState(prev => ({ ...prev, user: null }));
      }
      setIsInitialLoad(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync to Firestore on change (Debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      const firebaseUser = auth.currentUser;
      if (firebaseUser && !isInitialLoad) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        await updateDoc(userDocRef, {
          credits: state.credits,
          lastCreditUpdate: state.lastCreditUpdate,
          lastLuckyImageUpdate: state.lastLuckyImageUpdate,
          selectedLuckyImageIndex: state.selectedLuckyImageIndex,
          luckyImageHistory: state.luckyImageHistory || [],
          gamesPlayed: state.gamesPlayed,
          creditsSpent: state.creditsSpent || 0,
          friends: state.friends || [],
          selectedAvatarIndex: state.selectedAvatarIndex || 0,
          luckHistory: state.luckHistory || {},
          seenFortuneIndices: state.seenFortuneIndices || []
        }).catch(err => console.error("Firestore sync error:", err));
      }
    }, 2000); // 2 seconds debounce

    return () => clearTimeout(timer);
  }, [
    state.credits, state.lastCreditUpdate, 
    state.gamesPlayed, state.creditsSpent, state.selectedAvatarIndex, state.luckHistory,
    state.selectedLuckyImageIndex, state.lastLuckyImageUpdate, state.seenFortuneIndices,
    state.friends
  ]);

  // Persist state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    soundService.setPreferences(state.soundEnabled, state.musicEnabled, state.soundVolume, state.musicVolume);
  }, [state]);

  // Handle App Background/Foreground state
  useEffect(() => {
    const listener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) {
        soundService.pauseMusic();
        soundService.stopAllGameSounds();
      } else {
        if (state.musicEnabled) {
          soundService.playMusic();
        }
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [state.musicEnabled]);

  // Credit regeneration
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const timePassed = now - state.lastCreditUpdate;
      
      if (timePassed >= REGEN_TIME && state.credits < MAX_CREDITS) {
        const creditsToAdd = Math.floor(timePassed / REGEN_TIME);
        const newCredits = Math.min(MAX_CREDITS, state.credits + creditsToAdd);
        const newLastUpdate = state.lastCreditUpdate + (creditsToAdd * REGEN_TIME);
        
        setState(prev => ({
          ...prev,
          credits: newCredits,
          lastCreditUpdate: newLastUpdate
        }));
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [state.credits, state.lastCreditUpdate]);

  const refreshMotto = () => {
    const now = Date.now();
    const isSameDay = state.lastMottoUpdate > 0 && new Date(now).toDateString() === new Date(state.lastMottoUpdate).toDateString();
    
    if (!isSameDay) {
      setState(prev => ({
        ...prev,
        selectedMottoIndex: Math.floor(Math.random() * MOTTOS.length),
        lastMottoUpdate: now
      }));
    }
  };

  const setCredits = (credits: number) => setState(prev => ({ ...prev, credits }));
  
  const useCredit = () => {
    if (state.credits > 0) {
      setState(prev => {
        const isFromMax = prev.credits === MAX_CREDITS;
        return { 
          ...prev, 
          credits: prev.credits - 1,
          creditsSpent: (prev.creditsSpent || 0) + 1,
          lastCreditUpdate: isFromMax ? Date.now() : prev.lastCreditUpdate
        };
      });
      return true;
    }
    return false;
  };

  const addCredits = (amount: number) => {
    setState(prev => ({ ...prev, credits: prev.credits + amount }));
  };

  const setSkipMotto = (skip: boolean) => setState(prev => ({ ...prev, skipMotto: skip }));
  const setSoundEnabled = (enabled: boolean) => setState(prev => ({ ...prev, soundEnabled: enabled }));
  const setMusicEnabled = (enabled: boolean) => setState(prev => ({ ...prev, musicEnabled: enabled }));
  const setSoundVolume = (volume: number) => setState(prev => ({ ...prev, soundVolume: volume }));
  const setMusicVolume = (volume: number) => setState(prev => ({ ...prev, musicVolume: volume }));
  const resetMottoPreference = () => setState(prev => ({ ...prev, skipMotto: false, lastMottoUpdate: 0 }));

  const setLuckyImageIndex = (index: number) => {
    setState(prev => {
      const newHistory = [index, ...(prev.luckyImageHistory || [])].slice(0, 5);
      return {
        ...prev,
        selectedLuckyImageIndex: index,
        lastLuckyImageUpdate: Date.now(),
        luckyImageHistory: newHistory
      };
    });
  };

  const setUser = (user: { name: string, email: string } | null) => {
    if (user === null) {
      signOut(auth).catch(err => console.error("Sign out error:", err));
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('remembered_email');
      setState(prev => ({ ...prev, user: null }));
      return;
    }
    setState(prev => ({ ...prev, user }));
  };

  const setAvatarIndex = (index: number) => setState(prev => ({ ...prev, selectedAvatarIndex: index }));

  const recordGameResult = (isWin: boolean, gameId: string) => {
    if (gameId === 'cookies') return;
    const today = new Date().toISOString().split('T')[0];
    setState(prev => {
      const history = { ...prev.luckHistory };
      const todayStats = history[today] || { wins: 0, total: 0 };
      history[today] = {
          wins: todayStats.wins + (isWin ? 1 : 0),
          total: todayStats.total + 1
      };
      return { ...prev, luckHistory: history };
    });
  };

  const incrementGamesPlayed = () => setState(prev => ({ ...prev, gamesPlayed: prev.gamesPlayed + 1 }));

  const markFortuneAsSeen = (index: number) => {
    setState(prev => ({
      ...prev,
      seenFortuneIndices: [...new Set([...(prev.seenFortuneIndices || []), index])]
    }));
  };

  const setSeenFortuneIndices = (indices: number[]) => setState(prev => ({ ...prev, seenFortuneIndices: indices }));

  const addFriend = (friendOrName: string | any) => {
    let newFriend;
    if (typeof friendOrName === 'string') {
      const avatarColors = ['bg-blue-500', 'bg-pink-500', 'bg-purple-500', 'bg-green-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500', 'bg-fuchsia-500'];
      newFriend = {
        id: `friend_${Date.now()}`,
        name: friendOrName,
        isOnline: Math.random() > 0.5,
        avatarColor: avatarColors[Math.floor(Math.random() * avatarColors.length)]
      };
    } else {
      newFriend = friendOrName;
    }

    setState(prev => ({
      ...prev,
      friends: [...(prev.friends || []), newFriend]
    }));
  };

  const removeFriend = (id: string) => {
    setState(prev => ({
      ...prev,
      friends: (prev.friends || []).filter(f => f.id !== id)
    }));
  };

  const playWheelSpin = () => soundService.playWheelSpin();
  const stopWheelSpin = () => soundService.stopWheelSpin();
  const playBottleSpin = () => soundService.playBottleSpin();
  const stopBottleSpin = () => soundService.stopBottleSpin();
  const playBottleResult = () => soundService.playBottleResult();
  const playCoinFlip = () => soundService.playCoinFlip();
  const stopCoinFlip = () => soundService.stopCoinFlip();
  const playCookieBreak = () => soundService.playCookieBreak();
  const playClick = () => soundService.playClick();
  const playWin = () => soundService.playWin();
  const playLose = () => soundService.playLose();
  const playJackpot = () => soundService.playJackpot();
  const playMusic = () => soundService.playMusic();
  const playRpsRound = () => soundService.playRpsRound();
  const stopRpsRound = () => soundService.stopRpsRound();
  const stopAllGameSounds = () => soundService.stopAllGameSounds();

  return (
    <AppContext.Provider value={{
      ...state,
      setCredits,
      useCredit,
      addCredits,
      setSkipMotto,
      setSoundEnabled,
      setMusicEnabled,
      setSoundVolume,
      setMusicVolume,
      resetMottoPreference,
      refreshMotto,
      setLuckyImageIndex,
      setUser,
      setAvatarIndex,
      recordGameResult,
      incrementGamesPlayed,
      markFortuneAsSeen,
      setSeenFortuneIndices,
      addFriend,
      removeFriend,
      playWheelSpin,
      stopWheelSpin,
      playBottleSpin,
      stopBottleSpin,
      playBottleResult,
      playCoinFlip,
      stopCoinFlip,
      playCookieBreak,
      playClick,
      playWin,
      playLose,
      playJackpot,
      playMusic,
      playRpsRound,
      stopRpsRound,
      stopAllGameSounds,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
