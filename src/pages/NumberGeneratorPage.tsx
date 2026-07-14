import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronUp,
  ChevronDown,
  RotateCcw, 
  Copy, 
  Save, 
  Check, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import GlobalHeader from '../components/GlobalHeader';
import ShareResult from '../components/ShareResult';

interface SavedGeneration {
  id: string;
  name: string;
  numbers: number[];
  timestamp: number;
  config: {
    count: number;
    min: number;
    max: number;
    allowDuplicates: boolean;
  };
}

interface NumberGeneratorPageProps {
  onBack: () => void;
  onOpenProfile: () => void;
}

const NumberGeneratorPage: React.FC<NumberGeneratorPageProps> = ({ onBack, onOpenProfile }) => {
  const { playClick } = useAppContext();
  
  // Generation Config State
  const [count, setCount] = useState<number>(6);
  const [min, setMin] = useState<number>(1);
  const [max, setMax] = useState<number>(49);
  const [allowDuplicates, setAllowDuplicates] = useState<boolean>(false);
  
  // App State
  const [generatedNumbers, setGeneratedNumbers] = useState<number[] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSavePromptOpen, setIsSavePromptOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [savedGenerations, setSavedGenerations] = useState<SavedGeneration[]>([]);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const adjustTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const adjustIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const startAdjust = (action: () => void) => {
    action(); // single tap
    
    // Wait 400ms before starting rapid fire
    adjustTimeoutRef.current = setTimeout(() => {
      adjustIntervalRef.current = setInterval(action, 100);
    }, 400);
  };

  const stopAdjust = () => {
    if (adjustTimeoutRef.current) {
      clearTimeout(adjustTimeoutRef.current);
      adjustTimeoutRef.current = null;
    }
    if (adjustIntervalRef.current) {
      clearInterval(adjustIntervalRef.current);
      adjustIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopAdjust();
  }, []);

  // Load saved generations on mount
  useEffect(() => {
    const saved = localStorage.getItem('lucky_numbers_history');
    if (saved) {
      try {
        setSavedGenerations(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved numbers', e);
      }
    }
  }, []);

  // Save history to localStorage
  const persistHistory = (newHistory: SavedGeneration[]) => {
    localStorage.setItem('lucky_numbers_history', JSON.stringify(newHistory));
    setSavedGenerations(newHistory);
  };

  const handleGenerate = () => {
    playClick();
    setError(null);

    // Validation
    if (count <= 0) {
      setError('Count must be greater than 0');
      return;
    }
    if (min >= max) {
      setError('Max must be greater than min');
      return;
    }
    
    const rangeSize = max - min + 1;
    if (!allowDuplicates && count > rangeSize) {
      setError(`Cannot generate ${count} unique numbers in a range of ${rangeSize}`);
      return;
    }

    const results: number[] = [];
    if (allowDuplicates) {
      for (let i = 0; i < count; i++) {
        results.push(Math.floor(Math.random() * (max - min + 1)) + min);
      }
    } else {
      const pool = Array.from({ length: rangeSize }, (_, i) => min + i);
      for (let i = 0; i < count; i++) {
        const index = Math.floor(Math.random() * pool.length);
        results.push(pool.splice(index, 1)[0]);
      }
    }

    setGeneratedNumbers(results.sort((a, b) => a - b));
    setIsModalOpen(true);
  };

  const handleCopy = () => {
    if (!generatedNumbers) return;
    playClick();
    const text = generatedNumbers.join(', ');
    navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleSaveInit = () => {
    playClick();
    setIsSavePromptOpen(true);
  };

  const handleSaveConfirm = () => {
    if (saveName.length < 3 || saveName.length > 15) {
      return;
    }
    
    playClick();
    const newEntry: SavedGeneration = {
      id: Math.random().toString(36).substr(2, 9),
      name: saveName,
      numbers: generatedNumbers!,
      timestamp: Date.now(),
      config: { count, min, max, allowDuplicates }
    };

    // Limit history to 50 items to prevent localStorage overflow
    const newHistory = [newEntry, ...savedGenerations].slice(0, 50);
    persistHistory(newHistory);
    setIsSavePromptOpen(false);
    setIsModalOpen(false);
    setSaveName('');
  };

  const handleDelete = (id: string) => {
    playClick();
    const newHistory = savedGenerations.filter(g => g.id !== id);
    persistHistory(newHistory);
  };

  const handleCopyHistory = (numbers: number[]) => {
    playClick();
    const text = numbers.join(', ');
    navigator.clipboard.writeText(text);
    // Optional: show a small toast or message
  };

  return (
    <div className="h-full w-full flex flex-col bg-emerald-50 overflow-hidden select-none">
      <GlobalHeader 
        showBack={true}
        onBack={onBack}
        onOpenProfile={onOpenProfile}
      />

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
        {/* Input Card */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 mb-8">
          <div className="flex items-center justify-center mb-6">
            <h2 className="text-2xl font-black text-emerald-800 uppercase tracking-widest">Configuration</h2>
          </div>

          <div className="space-y-6">
            {/* Count Input */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-wider px-1">
                How many numbers?
              </label>
              <div className="relative group bg-emerald-50 rounded-2xl border border-emerald-100 focus-within:border-emerald-500 transition-colors">
                <input 
                  type="number" 
                  value={count}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) setCount(Math.min(100, Math.max(1, val)));
                    else setCount(0);
                  }}
                  onBlur={() => { if (count < 1) setCount(1); }}
                  className="w-full h-14 bg-transparent text-center font-black text-2xl text-emerald-600 outline-none pr-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                  <button 
                    onPointerDown={(e) => { e.preventDefault(); playClick(); startAdjust(() => setCount(prev => Math.min(100, prev + 1))); }}
                    onPointerUp={stopAdjust}
                    onPointerLeave={stopAdjust}
                    className="p-1 text-emerald-600 hover:bg-white rounded-lg transition-colors touch-none select-none"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button 
                    onPointerDown={(e) => { e.preventDefault(); playClick(); startAdjust(() => setCount(prev => Math.max(1, prev - 1))); }}
                    onPointerUp={stopAdjust}
                    onPointerLeave={stopAdjust}
                    className="p-1 text-emerald-600 hover:bg-white rounded-lg transition-colors touch-none select-none"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Range Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider px-1">
                  Min Range
                </label>
                <div className="relative group bg-emerald-50 rounded-2xl border border-emerald-100 focus-within:border-emerald-500 transition-colors">
                  <input 
                    type="number" 
                    value={min}
                    onChange={(e) => setMin(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full h-12 bg-transparent text-center font-black text-lg text-slate-800 outline-none pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                    <button 
                      onPointerDown={(e) => { e.preventDefault(); playClick(); startAdjust(() => setMin(prev => prev + 1)); }}
                      onPointerUp={stopAdjust}
                      onPointerLeave={stopAdjust}
                      className="p-0.5 text-emerald-600 hover:bg-white rounded-md transition-colors touch-none select-none"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button 
                      onPointerDown={(e) => { e.preventDefault(); playClick(); startAdjust(() => setMin(prev => Math.max(1, prev - 1))); }}
                      onPointerUp={stopAdjust}
                      onPointerLeave={stopAdjust}
                      className="p-0.5 text-emerald-600 hover:bg-white rounded-md transition-colors touch-none select-none"
                    >
                      <ChevronDown size={12} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider px-1">
                  Max Range
                </label>
                <div className="relative group bg-emerald-50 rounded-2xl border border-emerald-100 focus-within:border-emerald-500 transition-colors">
                  <input 
                    type="number" 
                    value={max}
                    onChange={(e) => setMax(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full h-12 bg-transparent text-center font-black text-lg text-slate-800 outline-none pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                    <button 
                      onPointerDown={(e) => { e.preventDefault(); playClick(); startAdjust(() => setMax(prev => prev + 1)); }}
                      onPointerUp={stopAdjust}
                      onPointerLeave={stopAdjust}
                      className="p-0.5 text-emerald-600 hover:bg-white rounded-md transition-colors touch-none select-none"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button 
                      onPointerDown={(e) => { e.preventDefault(); playClick(); startAdjust(() => setMax(prev => Math.max(1, prev - 1))); }}
                      onPointerUp={stopAdjust}
                      onPointerLeave={stopAdjust}
                      className="p-0.5 text-emerald-600 hover:bg-white rounded-md transition-colors touch-none select-none"
                    >
                      <ChevronDown size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Duplicates Toggle */}
            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <div className="flex flex-col">
                <span className="font-bold text-slate-800 text-sm">Allow Repeating Numbers</span>
                <span className="text-xs text-slate-400 uppercase font-black">Duplicates</span>
              </div>
              <button 
                onClick={() => { playClick(); setAllowDuplicates(!allowDuplicates); }}
                className={`w-12 h-6 rounded-full transition-colors relative ${allowDuplicates ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <motion.div 
                  className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm"
                  animate={{ x: allowDuplicates ? 24 : 0 }}
                />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">
                <AlertCircle size={16} />
                <span className="text-xs font-bold">{error}</span>
              </div>
            )}

            <button
              onClick={handleGenerate}
              className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <RotateCcw size={20} />
              GENERATE LUCKY NUMBERS
            </button>
          </div>
        </section>

        {/* History Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-black text-slate-900">History</h2>
            <span className="text-xs font-black text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
              {savedGenerations.length} Saved
            </span>
          </div>

          <div className="space-y-3">
            {savedGenerations.length === 0 ? (
              <div className="text-center py-10 bg-white/50 rounded-3xl border-2 border-dashed border-emerald-100">
                <p className="text-slate-400 text-sm font-medium">No saved numbers yet.</p>
              </div>
            ) : (
              savedGenerations.map((item) => (
                <div 
                  key={item.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-50 flex items-center justify-between group"
                >
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <span className="font-bold text-slate-800 truncate">{item.name}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.numbers.map((n, i) => (
                        <span key={i} className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {n}
                        </span>
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                      {new Date(item.timestamp).toLocaleDateString()} • {item.config.count} numbers
                    </span>
                  </div>
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    <button 
                      onClick={() => handleCopyHistory(item.numbers)}
                      className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                      title="Copy Numbers"
                    >
                      <Copy size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      title="Delete Entry"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Results Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="p-8 text-center pt-12">
                <h3 className="text-2xl font-black text-slate-900 mb-2">Your Lucky Numbers</h3>
                <p className="text-slate-400 text-sm font-medium mb-8">Generated based on your settings</p>
                
                <div className="bg-emerald-50 rounded-3xl p-6 mb-8 border border-emerald-100 flex flex-wrap justify-center gap-3">
                  {generatedNumbers?.map((num, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="w-12 h-12 bg-white rounded-xl shadow-sm border border-emerald-200 flex items-center justify-center font-black text-emerald-700 text-lg"
                    >
                      {num}
                    </motion.div>
                  )) || null}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCopy}
                    className="flex-1 h-14 bg-emerald-100 text-emerald-700 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-emerald-200 transition-colors"
                  >
                    {copyFeedback ? <Check size={20} /> : <Copy size={20} />}
                    {copyFeedback ? 'COPIED!' : 'COPY'}
                  </button>
                  <button
                    onClick={handleSaveInit}
                    className="flex-1 h-14 bg-emerald-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors"
                  >
                    <Save size={20} />
                    SAVE
                  </button>
                </div>

                <div className="mt-4">
                  <ShareResult gameName="Number Generator" />
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-full py-4 bg-slate-50 text-slate-400 text-xs font-black uppercase tracking-widest hover:text-slate-600 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Save Prompt Modal */}
      <AnimatePresence>
        {isSavePromptOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl border-4 border-emerald-500"
            >
              <h3 className="text-lg font-black text-slate-900 mb-2">Name this batch</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-tight mb-4">3 to 15 characters</p>
              
              <input 
                autoFocus
                type="text"
                placeholder="My Lucky Pick"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                maxLength={15}
                className="w-full h-12 px-4 bg-emerald-50 rounded-xl border border-emerald-100 outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold mb-6"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setIsSavePromptOpen(false)}
                  className="flex-1 py-3 text-slate-400 font-black text-sm uppercase"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveConfirm}
                  disabled={saveName.length < 3}
                  className={`flex-1 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all ${saveName.length >= 3 ? 'bg-emerald-600 text-white shadow-lg active:scale-95' : 'bg-slate-100 text-slate-300 pointer-events-none'}`}
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NumberGeneratorPage;
