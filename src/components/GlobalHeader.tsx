import React, { useState, useEffect } from 'react';
import { ArrowLeft, Settings as SettingsIcon, Plus } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import DetailedClover from './DetailedClover';
import { getAvatarUrl } from '../lib/avatarUtils';

interface GlobalHeaderProps {
  showBack?: boolean;
  onBack?: () => void;
  showSettings?: boolean;
  onOpenSettings?: () => void;
  onOpenProfile?: () => void;
  onOpenShop?: () => void;
}

const GlobalHeader: React.FC<GlobalHeaderProps> = ({
  showBack, onBack, showSettings, onOpenSettings, onOpenProfile, onOpenShop
}) => {
  const { user, credits, selectedAvatarIndex, lastCreditUpdate } = useAppContext();
  const [timeText, setTimeText] = useState('');

  useEffect(() => {
    if (credits >= 15) {
      setTimeText('');
      return;
    }

    const REGEN_TIME = 30 * 60 * 1000;

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = now - (lastCreditUpdate || now);
      const remaining = REGEN_TIME - elapsed;

      if (remaining <= 0) {
        setTimeText('00:00');
      } else {
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        const pad = (n: number) => n < 10 ? `0${n}` : n;
        setTimeText(`${pad(minutes)}:${pad(seconds)}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [credits, lastCreditUpdate]);

  return (
    <div className="sticky top-0 z-50 bg-emerald-50/80 backdrop-blur-md px-6 py-4 flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        <button 
          onClick={onOpenProfile}
          className="w-[52px] h-[52px] bg-white rounded-2xl overflow-hidden border-2 border-emerald-100 shadow-sm active:scale-90 transition-transform shrink-0"
        >
          <img 
            src={getAvatarUrl(selectedAvatarIndex)} 
            alt="Avatar" 
            className="w-full h-full object-cover"
          />
        </button>
        
        <div className="flex flex-col items-start justify-center min-w-[100px] gap-1 py-0.5">
          {user && (
            <button 
              onClick={onOpenProfile}
              className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-emerald-500 transition-colors text-left truncate max-w-[120px] leading-none"
            >
              {user.name}
            </button>
          )}
          <div className="flex items-center gap-2 bg-emerald-200 px-3 py-1 rounded-full shadow-sm border border-black relative shrink-0">
            <DetailedClover size={20} className="text-emerald-700 shrink-0" />
            <span className="font-black text-sm text-slate-800 leading-none">{credits}</span>
            {onOpenShop && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenShop();
                }}
                className="ml-0.5 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-white shadow-sm hover:bg-amber-500 transition-colors active:scale-90 shrink-0"
              >
                <Plus size={12} strokeWidth={4} />
              </button>
            )}
            {timeText && (
              <span className="text-[9px] font-black text-red-500 ml-1 tracking-tight leading-none animate-pulse shrink-0">
                +1 in {timeText}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {showSettings && onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="p-2 bg-white rounded-full shadow-sm border border-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <SettingsIcon size={24} />
          </button>
        )}
        {onBack && (
          <button 
            onClick={onBack}
            className="p-2 bg-white rounded-full shadow-sm border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default GlobalHeader;
