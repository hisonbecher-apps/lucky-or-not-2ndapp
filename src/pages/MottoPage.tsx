import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { MOTTOS } from '../types';
import { Quote, Image as ImageIcon } from 'lucide-react';

// Automatically load all images from the mottos folder (eagerly loaded)
// @ts-ignore
const imageModules = import.meta.glob('../assets/mottos/*.{png,jpg,jpeg,gif,webp}', { eager: true });
const mottoImages = Object.values(imageModules).map((mod: any) => mod.default as string);

interface MottoPageProps {
  onContinue: () => void;
}

const MottoPage: React.FC<MottoPageProps> = ({ onContinue }) => {
  const { selectedMottoIndex, skipMotto, setSkipMotto } = useAppContext();
  const motto = MOTTOS[selectedMottoIndex % MOTTOS.length];

  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    if (mottoImages.length === 0) return;

    const today = new Date().toDateString();
    const lastDate = localStorage.getItem('lucky_or_not_daily_motto_date');
    const savedMotto = localStorage.getItem('lucky_or_not_daily_motto_image');

    if (lastDate === today && savedMotto && mottoImages.includes(savedMotto)) {
      setImageSrc(savedMotto);
      return;
    }

    const storageKey = 'lucky_or_not_motto_bag';
    let bag: number[] = [];
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        bag = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse motto bag', e);
    }

    // Ensure bag elements are valid indices
    bag = bag.filter(idx => idx >= 0 && idx < mottoImages.length);

    if (bag.length === 0) {
      // Refill the bag with all possible indices
      bag = Array.from({ length: mottoImages.length }, (_, i) => i);
      // Shuffle the bag
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
    }

    // Pick the last element from the shuffled bag
    const pickedIndex = bag.pop();

    if (pickedIndex !== undefined) {
      setImageSrc(mottoImages[pickedIndex]);
      // Save the updated bag back to storage
      localStorage.setItem(storageKey, JSON.stringify(bag));
      localStorage.setItem('lucky_or_not_daily_motto_image', mottoImages[pickedIndex]);
      localStorage.setItem('lucky_or_not_daily_motto_date', today);
    }
  }, []);

  const handleContinue = () => {
    onContinue();
  };

  const handleToggleSkip = (checked: boolean) => {
    setSkipMotto(checked);
  };

  return (
    <div className="h-full w-full flex flex-col bg-white p-8 pb-20">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {imageSrc ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-xs aspect-square rounded-3xl border-4 border-amber-100 overflow-hidden relative mb-8 shadow-xl"
          >
            <img src={imageSrc} alt="Motivation" className="w-full h-full object-cover" />
          </motion.div>
        ) : (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-xs aspect-square bg-amber-50 rounded-3xl border-4 border-amber-100 flex flex-col items-center justify-center p-8 relative mb-8"
          >
            <Quote size={40} className="text-amber-300 absolute top-6 left-6 -rotate-12" />

            <div className="text-2xl font-serif italic text-amber-900 leading-relaxed z-10">
              "{motto}"
            </div>

            <Quote size={40} className="text-amber-300 absolute bottom-6 right-6 rotate-168" />

            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-10 pointer-events-none">
              <ImageIcon size={100} />
              <span className="text-xs font-bold mt-2">Add images to src/assets/mottos</span>
            </div>
          </motion.div>
        )}

        <h2 className="text-2xl font-bold text-slate-800 mb-2">Daily Motto</h2>
        <p className="text-slate-500 text-sm mb-8">A little inspiration for your journey today.</p>
      </div>

      <div className="space-y-6">
        <label className="flex items-center justify-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={skipMotto}
              onChange={(e) => handleToggleSkip(e.target.checked)}
            />
            <div className="w-6 h-6 border-2 border-slate-300 rounded-md peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all"></div>
            <svg className="absolute top-1 left-1 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
            Don't show again for 24 hours
          </span>
        </label>

        <button
          onClick={handleContinue}
          className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-200 transition-all active:scale-95"
        >
          Let's Try
        </button>
      </div>
    </div>
  );
};

export default MottoPage;
