import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppContext } from './AppContext';

const DEFAULT_SOCKET_URL = import.meta.env.VITE_BACKEND_URL || '';

interface SocketContextType {
  socket: Socket | null;
  onlineCount: number;
  invitation: { from: string; fromSocketId: string } | null;
  setInvitation: (inv: { from: string; fromSocketId: string } | null) => void;
  shortStrawInvite: { from: string; fromSocketId: string; gameId: string } | null;
  setShortStrawInvite: (inv: { from: string; fromSocketId: string; gameId: string } | null) => void;
  spinBottleInvite: { from: string; fromSocketId: string; gameId: string } | null;
  setSpinBottleInvite: (inv: { from: string; fromSocketId: string; gameId: string } | null) => void;
  brideBouquetInvite: { from: string; fromSocketId: string; gameId: string } | null;
  setBrideBouquetInvite: (inv: { from: string; fromSocketId: string; gameId: string } | null) => void;
  wheelOfFortuneInvite: { from: string; fromSocketId: string; gameId: string } | null;
  setWheelOfFortuneInvite: (inv: { from: string; fromSocketId: string; gameId: string } | null) => void;
  coinFlipInvite: { from: string; fromSocketId: string; gameId: string } | null;
  setCoinFlipInvite: (inv: { from: string; fromSocketId: string; gameId: string } | null) => void;
  isWaitingForOpponent: boolean;
  setWaitingForOpponent: (isWaiting: boolean) => void;
  fetchOnlineUsers: () => Promise<{id: string; name: string}[]>;
  socketUrl: string;
  setSocketUrl: (url: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAppContext();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [socketUrl, setSocketUrlState] = useState(() => localStorage.getItem('custom_socket_url') || DEFAULT_SOCKET_URL);
  const [onlineCount, setOnlineCount] = useState(0);
  const [invitation, setInvitation] = useState<{ from: string; fromSocketId: string } | null>(null);
  const [shortStrawInvite, setShortStrawInvite] = useState<{ from: string; fromSocketId: string; gameId: string } | null>(null);
  const [spinBottleInvite, setSpinBottleInvite] = useState<{ from: string; fromSocketId: string; gameId: string } | null>(null);
  const [brideBouquetInvite, setBrideBouquetInvite] = useState<{ from: string; fromSocketId: string; gameId: string } | null>(null);
  const [wheelOfFortuneInvite, setWheelOfFortuneInvite] = useState<{ from: string; fromSocketId: string; gameId: string } | null>(null);
  const [coinFlipInvite, setCoinFlipInvite] = useState<{ from: string; fromSocketId: string; gameId: string } | null>(null);
  const [isWaitingForOpponent, setWaitingForOpponent] = useState(false);

  const setSocketUrl = (url: string) => {
    localStorage.setItem('custom_socket_url', url);
    setSocketUrlState(url);
  };

  const fetchOnlineUsers = (): Promise<{id: string; name: string}[]> => {
    return new Promise((resolve) => {
      if (!socket || !socket.connected) {
        resolve([]);
        return;
      }
      
      const timeout = setTimeout(() => {
        socket.off('online_users_list', handleList);
        resolve([]);
      }, 5000);
      
      const handleList = (users: {id: string; name: string}[]) => {
        clearTimeout(timeout);
        console.log('Received online users list:', users);
        socket.off('online_users_list', handleList);
        resolve(users);
      };
      
      socket.on('online_users_list', handleList);
      socket.emit('get_online_users');
    });
  };

  useEffect(() => {
    if (!socketUrl || socketUrl.trim().length === 0) return;
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
      if (user) {
        newSocket.emit('join', { id: user.email, name: user.name });
      }
    });

    newSocket.on('online_users_count', (count: number) => {
      setOnlineCount(count);
    });

    newSocket.on('receive_challenge', (data) => {
      setInvitation(data);
    });

    newSocket.on('receive_short_straw_invite', (data) => {
      setShortStrawInvite(data);
    });

    newSocket.on('receive_spin_bottle_invite', (data) => {
      setSpinBottleInvite(data);
    });

    newSocket.on('receive_bride_bouquet_invite', (data) => {
      setBrideBouquetInvite(data);
    });
    
    newSocket.on('receive_wheel_of_fortune_invite', (data) => {
      setWheelOfFortuneInvite(data);
    });

    newSocket.on('receive_coin_flip_invite', (data) => {
      setCoinFlipInvite(data);
    });

    newSocket.on('user_not_found', () => {
      setWaitingForOpponent(false);
      alert("No match found or user not found.");
    });

    // Clear waiting state globally when any game starts
    const handleGameStarted = (event: string) => {
      console.log(`Socket event received: ${event}, clearing waiting state`);
      setWaitingForOpponent(false);
    };

    newSocket.on('short_straw_started', () => handleGameStarted('short_straw_started'));
    newSocket.on('spin_bottle_started', () => handleGameStarted('spin_bottle_started'));
    newSocket.on('bride_bouquet_started', () => handleGameStarted('bride_bouquet_started'));
    newSocket.on('wheel_of_fortune_started', () => handleGameStarted('wheel_of_fortune_started'));
    newSocket.on('coin_flip_started', () => handleGameStarted('coin_flip_started'));
    newSocket.on('match_found', () => handleGameStarted('match_found'));
    
    newSocket.on('bot_challenge_pending', () => {
      console.log('Socket event received: bot_challenge_pending, setting waiting state to true');
      setWaitingForOpponent(true);
    });

    newSocket.on('waiting_for_match', () => {
      console.log('Socket event received: waiting_for_match, setting waiting state to true');
      setWaitingForOpponent(true);
    });

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [socketUrl]);

  useEffect(() => {
    if (!socket || !user) return;

    const handleConnect = () => {
      console.log('Socket connected/reconnected, emitting join');
      socket.emit('join', { id: user.email, name: user.name });
    };

    if (socket.connected) {
      handleConnect();
    }

    socket.on('connect', handleConnect);
    return () => {
      socket.off('connect', handleConnect);
    };
  }, [socket, user]);

  return (
    <SocketContext.Provider value={{ 
      socket, 
      onlineCount, 
      invitation, 
      setInvitation,
      shortStrawInvite,
      setShortStrawInvite,
      spinBottleInvite,
      setSpinBottleInvite,
      brideBouquetInvite,
      setBrideBouquetInvite,
      wheelOfFortuneInvite,
      setWheelOfFortuneInvite,
      coinFlipInvite,
      setCoinFlipInvite,
      isWaitingForOpponent,
      setWaitingForOpponent,
      fetchOnlineUsers,
      socketUrl,
      setSocketUrl
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};
