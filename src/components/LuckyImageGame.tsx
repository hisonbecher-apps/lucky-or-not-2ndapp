import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image as ImageIcon, RotateCcw, Sparkles, History, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { LUCKY_IMAGES, LuckyImage } from '../types';
import { useDragToScroll } from '../hooks/useDragToScroll';

// Dynamic image loading logic
const dynamicImagesGlob = import.meta.glob('../assets/lucky_images/*.{png,jpg,jpeg,webp}', { eager: true });

const formatLabel = (raw: string): string => {
  if (!raw) return 'Your Destiny';
  
  // Replace underscores and hyphens with spaces
  let text = raw.replace(/[_-]/g, ' ').trim();
  
  // Basic grammar: fix a/an
  text = text.replace(/\ba\s+([aeiou])/gi, 'an $1');
  
  // Capitalize first letter
  text = text.charAt(0).toUpperCase() + text.slice(1);
  
  // Add punctuation if missing
  if (!/[.!?]$/.test(text)) {
    // Check for question starters
    const isQuestion = /^(who|what|where|when|why|how|will|is|are|can|do|does)\b/i.test(text);
    text += isQuestion ? '?' : '!';
  }
  
  return text;
};

const getProcessedDynamicImages = (): LuckyImage[] => {
  return Object.keys(dynamicImagesGlob).map((path) => {
    const filename = path.split('/').pop() || '';
    const nameWithoutExt = filename.split('.').slice(0, -1).join('.');
    
    // Check for 'poz' or 'neg' prefix
    const isLucky = nameWithoutExt.toLowerCase().startsWith('poz');
    
    // Extract label: remove pozX_ or negX_ and replace _ with spaces
    // Regular expression to match prefix and optional index followed by underscore
    const labelRaw = nameWithoutExt.replace(/^(poz|neg)\d*_/, '');
    const label = formatLabel(labelRaw);
    
    return {
      url: (dynamicImagesGlob[path] as any).default || dynamicImagesGlob[path],
      label: label,
      type: isLucky ? 'lucky' : 'unlucky'
    };
  });
};

const processedDynamicImages = getProcessedDynamicImages();
const ALL_IMAGES = processedDynamicImages.length > 0 ? processedDynamicImages : LUCKY_IMAGES;

import ShareResult from './ShareResult';

interface LuckyImageGameProps {
  onUseCredit: () => boolean;
  onShowAd: () => void;
}

const LuckyImageGame: React.FC<LuckyImageGameProps> = ({ onUseCredit, onShowAd }) => {
  const { selectedLuckyImageIndex, lastLuckyImageUpdate, setLuckyImageIndex, luckyImageHistory, recordGameResult } = useAppContext();
  const scrollRef = useDragToScroll();
  const [selectedImage, setSelectedImage] = useState<LuckyImage | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const now = Date.now();
    const isSameDay = lastLuckyImageUpdate > 0 && new Date(now).toDateString() === new Date(lastLuckyImageUpdate).toDateString();
    
    // Check if we have a valid image for today
    if (selectedLuckyImageIndex !== null && isSameDay) {
      // It's the same day, show the already selected image
      setSelectedImage(ALL_IMAGES[selectedLuckyImageIndex]);
    } else {
      // It's a new day, reset the local state so the user can pick
      setSelectedImage(null);
    }
  }, [selectedLuckyImageIndex, lastLuckyImageUpdate]);

  const handleReveal = () => {
    if (!onUseCredit()) {
      onShowAd();
      return;
    }

    setIsRevealing(true);
    
    // Simulate a delay for "revealing"
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      // Logic to prevent showing the same image until 5 others have been shown
      const allIndices = Array.from({ length: ALL_IMAGES.length }, (_, i) => i);
      
      // Filter out indices that are in the last 5 (luckyImageHistory)
      // Note: luckyImageHistory stores recent indices, with indices[0] being the most recent.
      const availableIndices = allIndices.filter(index => !(luckyImageHistory || []).includes(index));
      
      // Fallback: If pool is empty (e.g. total images <= 5), exclude at least the most recent one if possible
      const pool = availableIndices.length > 0 ? availableIndices : 
                   (allIndices.length > 1 ? allIndices.filter(i => i !== selectedLuckyImageIndex) : allIndices);
      
      const randomIndex = pool[Math.floor(Math.random() * pool.length)];
      const img = ALL_IMAGES[randomIndex];
      setLuckyImageIndex(randomIndex);
      setSelectedImage(img);
      setIsRevealing(false);

      // Record result for luck statistics: 'rich' or 'lucky' are wins
      recordGameResult(img.type === 'rich' || img.type === 'lucky', 'luckyimage');
    }, 1500);
  };

  const handleReset = () => {
    // We don't reset the image if it's still the same day. 
    // The user has to wait 24 hours to pick a new one.
    // We can just show an alert or let them know.
    alert("You can only pick one lucky image per day. Come back tomorrow!");
  };

  return (
    <div id="game-container" className="w-full h-full flex flex-col items-center justify-center relative">
      <AnimatePresence mode="wait">
        {!selectedImage && !isRevealing ? (
          <motion.div
            key="start"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex flex-col items-center"
          >
            <div className="w-48 h-48 bg-slate-50 rounded-[2.5rem] border-4 border-dashed border-slate-200 flex items-center justify-center mb-8">
              <ImageIcon size={64} className="text-slate-200" />
            </div>
            <button
              onClick={handleReveal}
              className="px-12 py-5 bg-emerald-500 text-white rounded-3xl font-black text-xl shadow-xl shadow-emerald-100 hover:bg-emerald-600 transition-all active:scale-95 flex items-center gap-3"
            >
              <Sparkles fill="currentColor" />
              SEE YOUR IMAGE
            </button>
            <p className="mt-4 text-slate-400 font-bold text-xs uppercase tracking-widest">Costs 1 Credit</p>
            
            {luckyImageHistory && luckyImageHistory.length > 0 && (
              <button
                onClick={() => setShowHistory(true)}
                className="mt-8 flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-sm transition-colors"
              >
                <History size={16} />
                View History
              </button>
            )}
          </motion.div>
        ) : isRevealing ? (
          <motion.div
            key="revealing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center"
          >
            <div className="relative w-64 h-64 flex items-center justify-center mb-8">
              {/* Shuffling cards effect */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    x: [0, (i === 0 ? -40 : i === 2 ? 40 : 0), 0],
                    y: [0, -20, 0],
                    rotate: [0, (i === 0 ? -15 : i === 2 ? 15 : 0), 0],
                    scale: [1, 1.1, 1],
                    zIndex: [1, 10, 1]
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    delay: i * 0.2,
                    ease: "easeInOut" 
                  }}
                  className="absolute w-32 h-48 bg-white rounded-2xl shadow-xl border-4 border-slate-100 flex items-center justify-center"
                >
                  <div className="w-full h-full m-2 rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50 flex items-center justify-center">
                    <Sparkles className="text-emerald-300" size={32} />
                  </div>
                </motion.div>
              ))}
            </div>
            <motion.p 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-xl font-black text-slate-800 tracking-widest uppercase"
            >
              REVEALING YOUR FATE...
            </motion.p>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center w-full"
          >
            <div className="relative group">
              <div className={`absolute -inset-4 rounded-[3.5rem] blur-xl opacity-20 transition-all duration-500 ${
                selectedImage.type === 'rich' ? 'bg-amber-400' : 
                selectedImage.type === 'lucky' ? 'bg-emerald-400' : 
                selectedImage.type === 'poor' ? 'bg-slate-400' : 'bg-red-400'
              }`} />
              <img
                src={selectedImage.url}
                alt={selectedImage.label}
                referrerPolicy="no-referrer"
                className="w-72 h-72 object-cover rounded-[3rem] shadow-2xl relative z-10 border-4 border-white"
              />
            </div>
            
            <div className="mt-8 text-center">
              <h3 className={`text-3xl font-black mb-2 ${
                selectedImage.type === 'rich' ? 'text-amber-600' : 
                selectedImage.type === 'lucky' ? 'text-emerald-600' : 
                selectedImage.type === 'poor' ? 'text-slate-600' : 'text-red-600'
              }`}>
                {selectedImage.label}
              </h3>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Your Destiny for Today</p>
            </div>

            <div className="flex flex-col items-center gap-4 mt-8">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-8 py-3 bg-slate-100 text-slate-600 rounded-full font-bold hover:bg-slate-200 transition-colors"
              >
                <RotateCcw size={18} />
                Try Again Tomorrow
              </button>

              <div className="w-full max-w-[200px]">
                <ShareResult gameName="Lucky Image" />
              </div>

              {luckyImageHistory && luckyImageHistory.length > 0 && (
                <button
                  onClick={() => setShowHistory(true)}
                  className="flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-sm transition-colors"
                >
                  <History size={16} />
                  View History
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowHistory(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              ref={scrollRef}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] p-6 shadow-2xl max-h-[80vh] overflow-y-auto select-none"
            >
              <div className="flex items-center justify-between mb-6 sticky top-0 bg-white z-10 pb-2 border-b border-slate-100">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <History size={20} className="text-slate-400" />
                  Your Destiny History
                </h3>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {luckyImageHistory?.map((imageIndex, i) => {
                  const img = ALL_IMAGES[imageIndex];
                  if (!img) return null;
                  
                  return (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="relative w-16 h-16 shrink-0">
                        <img 
                          src={img.url} 
                          alt={img.label} 
                          className="w-full h-full object-cover rounded-xl shadow-sm"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-bold truncate ${
                          img.type === 'rich' ? 'text-amber-600' : 
                          img.type === 'lucky' ? 'text-emerald-600' : 
                          img.type === 'poor' ? 'text-slate-600' : 'text-red-600'
                        }`}>
                          {img.label}
                        </div>
                        <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">
                          {i === 0 ? 'Today' : `${i} day${i > 1 ? 's' : ''} ago`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LuckyImageGame;
