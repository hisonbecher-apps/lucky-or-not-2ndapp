import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useSocket } from '../context/SocketContext';
import { Volume2, VolumeX, RotateCcw, Shield, Info, Music, X, Globe } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { useDragToScroll } from '../hooks/useDragToScroll';
import { getAvatarUrl } from '../lib/avatarUtils';
import GlobalHeader from '../components/GlobalHeader';
import { motion, AnimatePresence } from 'motion/react';
import privacyPolicyText from '../Privacy Policy.txt?raw';

interface SettingsPageProps {
  onBack: () => void;
  onOpenProfile: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onBack, onOpenProfile }) => {
  const { 
    soundVolume, setSoundVolume,
    musicVolume, setMusicVolume,
    resetMottoPreference,
    user, 
    setUser,
    selectedAvatarIndex
  } = useAppContext();
  const { socketUrl, setSocketUrl } = useSocket();
  const [serverUrl, setServerUrl] = useState(socketUrl);
  const scrollRef = useDragToScroll();
  const [showPrivacy, setShowPrivacy] = useState(false);

  const handleBack = () => {
    onBack();
  };

  const handleReset = () => {
    if (confirm('Reset all preferences? This will show the daily motto again.')) {
      resetMottoPreference();
      alert('Preferences reset!');
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-50 relative overflow-hidden">
      <GlobalHeader 
        showBack={true}
        onBack={handleBack}
        onOpenProfile={onOpenProfile}
      />

      <div 
        ref={scrollRef}
        className="flex-1 px-6 space-y-6 overflow-y-auto pb-8 select-none"
      >
        {/* Profile Section */}
        {user && (
          <div 
            onClick={onOpenProfile}
            className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 cursor-pointer hover:border-emerald-200 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center overflow-hidden border-2 border-slate-100">
                <img 
                  src={getAvatarUrl(selectedAvatarIndex)} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-left flex-1 min-w-0">
                <div className="font-black text-slate-800 truncate">{user.name}</div>
                <div className="text-xs text-slate-400 font-medium truncate">{user.email}</div>
              </div>
              <button 
                onClick={async (e) => {
                  e.stopPropagation();
                  if (confirm('Are you sure you want to sign out? Your progress will be saved locally.')) {
                    try {
                      await signOut(auth);
                    } catch (err) {
                      console.error("Sign out error:", err);
                    }
                    setUser(null);
                  }
                }}
                className="text-xs font-bold text-red-400 hover:text-red-500 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Sound Volume Section */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-500">
              <Volume2 size={24} />
            </div>
            <div className="text-left">
              <div className="font-bold text-slate-800">Sound Effects</div>
              <div className="text-xs text-slate-400 font-medium">Adjust volume</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <VolumeX 
              size={16} 
              className="text-slate-300 cursor-pointer hover:text-slate-500 hover:scale-125 transition-all" 
              onClick={() => setSoundVolume(0)}
            />
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={soundVolume}
              onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <Volume2 
              size={16} 
              className="text-emerald-400 cursor-pointer hover:text-emerald-600 hover:scale-125 transition-all" 
              onClick={() => setSoundVolume(1)}
            />
          </div>
        </div>

        {/* Music Volume Section */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-500">
              <Music size={24} />
            </div>
            <div className="text-left">
              <div className="font-bold text-slate-800">Background Music</div>
              <div className="text-xs text-slate-400 font-medium">Adjust volume</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <VolumeX 
              size={16} 
              className="text-slate-300 cursor-pointer hover:text-slate-500 hover:scale-125 transition-all" 
              onClick={() => setMusicVolume(0)}
            />
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={musicVolume}
              onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <Volume2 
              size={16} 
              className="text-indigo-400 cursor-pointer hover:text-indigo-600 hover:scale-125 transition-all" 
              onClick={() => setMusicVolume(1)}
            />
          </div>
        </div>

        {/* Reset Motto */}
        <button 
          onClick={handleReset}
          className="w-full bg-white p-5 rounded-3xl flex items-center justify-between shadow-sm border border-slate-100 hover:border-amber-200 transition-all group text-left"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl">
              <RotateCcw size={24} />
            </div>
            <div className="text-left">
              <div className="font-bold text-slate-800">Reset Motto Preference</div>
              <div className="text-xs text-slate-400 font-medium">Show daily motto on launch</div>
            </div>
          </div>
        </button>

        {/* Server Config Card */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 text-left">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-500">
              <Globe size={24} />
            </div>
            <div className="text-left">
              <div className="font-bold text-slate-800">Multiplayer Server URL</div>
              <div className="text-xs text-slate-400 font-medium">Configure game server address</div>
            </div>
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="e.g. http://192.168.1.100:3001"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:border-emerald-500 text-slate-700"
            />
            <button 
              onClick={() => {
                setSocketUrl(serverUrl);
                alert('Server URL saved! Reconnecting...');
              }}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-2xl font-bold text-sm transition-all shadow-sm shadow-emerald-500/20 shrink-0"
            >
              Save
            </button>
          </div>
        </div>

        {/* Privacy Policy */}
        <button 
          onClick={() => setShowPrivacy(true)}
          className="w-full bg-white p-5 rounded-3xl flex items-center justify-between shadow-sm border border-slate-100 hover:border-blue-200 transition-all group text-left"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl">
              <Shield size={24} />
            </div>
            <div className="text-left">
              <div className="font-bold text-slate-800">Privacy Policy</div>
              <div className="text-xs text-slate-400 font-medium">Read our terms & conditions</div>
            </div>
          </div>
        </button>

        <div className="pt-8 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-slate-300 font-bold text-xs uppercase tracking-widest">
            <Info size={14} />
            Lucky or Not v1.0.0
          </div>
          <div className="text-[10px] text-slate-300 font-medium">Crafted with luck & magic</div>
        </div>
      </div>

      {/* Privacy Modal */}
      <AnimatePresence>
        {showPrivacy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg max-h-[80vh] rounded-[2.5rem] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-500 rounded-xl">
                    <Shield size={20} />
                  </div>
                  <h3 className="font-black text-slate-800 uppercase tracking-tight">Privacy Policy</h3>
                </div>
                <button 
                  onClick={() => setShowPrivacy(false)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 text-slate-600 text-sm leading-relaxed whitespace-pre-line font-medium custom-scrollbar">
                {privacyPolicyText}
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/50 text-center">
                <button
                  onClick={() => setShowPrivacy(false)}
                  className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold text-sm hover:bg-slate-800 transition-all active:scale-95"
                >
                  Got it, thanks!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsPage;

