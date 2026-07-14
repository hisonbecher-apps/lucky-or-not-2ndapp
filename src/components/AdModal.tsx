import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Loader2, Gift } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { adService } from '../services/adService';

interface AdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  rewardType: 'credits' | 'game_entry';
}

const AdModal: React.FC<AdModalProps> = ({ isOpen, onClose, onComplete, rewardType }) => {
  const { playClick } = useAppContext();
  const [isWatching, setIsWatching] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsWatching(false);
    }
  }, [isOpen]);

  const handleStartAd = async () => {
    playClick();
    setIsWatching(true);
    
    try {
      const reward = await adService.showRewardedAd();
      if (reward) {
        onComplete();
        onClose();
      } else {
        // If ad failed or was cancelled, we still close the modal
        // but maybe without reward? Usually AdMob handles the 'earned' logic.
        setIsWatching(false);
      }
    } catch (error) {
      console.error('Ad Error:', error);
      setIsWatching(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-6"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl relative"
          >
            {/* Header */}
            <div className="bg-slate-900 p-6 text-center relative">
              {!isWatching && (
                <button 
                  onClick={onClose}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              )}
              <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                <Play fill="white" className="text-white ml-1" />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-widest">
                {isWatching ? 'Ad in Progress' : 'Watch to Continue'}
              </h3>
            </div>

            {/* Content */}
            <div className="p-8 flex flex-col items-center text-center">
              {isWatching ? (
                <div className="space-y-6 w-full py-4">
                  <div className="w-24 h-24 mx-auto bg-emerald-50 rounded-full flex items-center justify-center relative">
                    <Loader2 className="animate-spin text-emerald-500" size={48} />
                  </div>
                  <div className="flex items-center justify-center gap-2 text-slate-400 font-bold uppercase tracking-widest text-xs">
                    Please wait until ad finishes
                  </div>
                </div>
              ) : (
                <div className="space-y-6 w-full">
                  <div className="bg-amber-50 p-4 rounded-2xl border-2 border-amber-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-200">
                      <Gift className="text-white" size={24} />
                    </div>
                    <div className="text-left">
                      <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Reward</div>
                      <div className="text-sm font-black text-slate-800">
                        {rewardType === 'credits' ? '5 FREE CREDITS' : 'UNLOCK GAME ENTRY'}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-slate-500 font-medium text-sm">
                    Watch a short video to {rewardType === 'credits' ? 'get more credits' : 'enter the game'}.
                  </p>

                  <button
                    onClick={handleStartAd}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-3"
                  >
                    <Play fill="white" size={20} />
                    WATCH VIDEO
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AdModal;
