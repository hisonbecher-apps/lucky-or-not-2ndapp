import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { X, ExternalLink } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { adService } from '../services/adService';
import { Capacitor } from '@capacitor/core';

const BannerAd: React.FC = () => {
  const [isVisible, setIsVisible] = React.useState(true);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (isNative && isVisible) {
      adService.showBanner();
    } else if (isNative && !isVisible) {
      adService.hideBanner();
    }

    return () => {
      if (isNative) adService.hideBanner();
    };
  }, [isNative, isVisible]);

  if (!isVisible) return null;

  // On native platforms, the banner is rendered by the AdMob plugin outside the WebView
  if (isNative) return null;

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="absolute bottom-0 left-0 right-0 bg-slate-900 text-white py-1.5 px-3 z-50 flex items-center justify-between shadow-2xl border-t border-white/10"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
          <span className="text-lg font-black">L</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Sponsored</span>
          <span className="text-[10px] font-bold leading-tight">Get 100 Free Credits on Lucky Spin!</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <a 
          href="#" 
          onClick={(e) => e.preventDefault()}
          className="bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1.5 hover:bg-emerald-600 transition-colors"
        >
          CLAIM <ExternalLink size={10} />
        </a>
        <button 
          onClick={() => setIsVisible(false)}
          className="p-1.5 text-slate-500 hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </motion.div>
  );
};

export default BannerAd;
