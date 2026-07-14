import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext, SYSTEM_PLAYERS } from '../context/AppContext';
import { Share2, Users, TrendingUp, Calendar, Globe, Edit3, Loader2, Sparkles, Plus, X, Trash2 } from 'lucide-react';
import { useDragToScroll } from '../hooks/useDragToScroll';
import { AVATARS, getAvatarUrl } from '../lib/avatarUtils';
import { toPng } from 'html-to-image';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { DayLuckStatus } from '../components/SevenLeafClover';
import WeeklyLuck from '../components/WeeklyLuck';
import LuckScales from '../components/LuckScales';
import { Sun, CloudRain } from 'lucide-react';
import GlobalHeader from '../components/GlobalHeader';

interface UserPageProps {
  onBack: () => void;
}

const UserPage: React.FC<UserPageProps> = ({ onBack }) => {
  const { user, friends, playClick, selectedAvatarIndex, setAvatarIndex, luckHistory, addFriend, removeFriend } = useAppContext();
  const scrollRef = useDragToScroll();
  const profileRef = React.useRef<HTMLDivElement>(null);
  const [isPickerOpen, setIsPickerOpen] = React.useState(false);
  const [isSharing, setIsSharing] = React.useState(false);
  const [zoomedType, setZoomedType] = React.useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'motto' | null>(null);
  const [dailyMottoImage, setDailyMottoImage] = React.useState<string | null>(null);
  const [isAddingFriend, setIsAddingFriend] = React.useState(false);
  const [newFriendName, setNewFriendName] = React.useState('');

  const handleAddFriend = () => {
    if (newFriendName.trim()) {
      addFriend(newFriendName.trim());
      setNewFriendName('');
      setIsAddingFriend(false);
      playClick();
    }
  };

  React.useEffect(() => {
    const savedMotto = localStorage.getItem('lucky_or_not_daily_motto_image');
    if (savedMotto) setDailyMottoImage(savedMotto);
  }, []);
  // Helper to get stats for a range of dates
  const getStatsForRange = (daysCount: number) => {
    let wins = 0;
    let total = 0;
    const now = new Date();
    
    for (let i = 0; i < daysCount; i++) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      const key = date.toISOString().split('T')[0];
      const stats = luckHistory[key];
      if (stats) {
        wins += stats.wins;
        total += stats.total;
      }
    }
    return { wins, total, percentage: total > 0 ? Math.round((wins / total) * 100) : 0 };
  };

  const getLuckyDaysForRange = (daysCount: number) => {
    let luckyDays = 0;
    const now = new Date();
    for (let i = 0; i < daysCount; i++) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      const key = date.toISOString().split('T')[0];
      const stats = luckHistory[key];
      if (stats && stats.total > 0 && (stats.wins / stats.total) >= 0.5) {
        luckyDays++;
      }
    }
    return luckyDays;
  };

  const todayKey = new Date().toISOString().split('T')[0];
  const todayStats = luckHistory[todayKey] || { wins: 0, total: 0 };
  const todayPercentage = todayStats.total > 0 ? Math.round((todayStats.wins / todayStats.total) * 100) : 0;
  const isTodayLucky = todayPercentage >= 50 && todayStats.total > 0;

  const getDailyLuckImage = () => {
    if (todayStats.total === 0) return '/images/luck/daily_lucky.webp'; // Default to lucky if no games played today
    return todayPercentage >= 50 ? '/images/luck/daily_lucky.webp' : '/images/luck/daily_unlucky.webp';
  };

  const dailyLuckImage = getDailyLuckImage();

  // Generate dates for current week from Monday to Sunday
  const getCurrentWeekDates = () => {
    const dates: Date[] = [];
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - diffToMonday);

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  // Weekly Clover Data (Generated from luckHistory)
  const getWeeklyCloverData = (): DayLuckStatus[] => {
    const data: DayLuckStatus[] = [];
    const weekDates = getCurrentWeekDates();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    for (const date of weekDates) {
      const key = date.toISOString().split('T')[0];
      if (key > todayStr) {
        data.push('future');
      } else {
        const stats = luckHistory[key];
        if (!stats || stats.total === 0) {
          data.push('unlucky');
        } else {
          const percentage = (stats.wins / stats.total) * 100;
          data.push(percentage >= 50 ? 'lucky' : 'unlucky');
        }
      }
    }
    return data;
  };



  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const weeklyCloverData = getWeeklyCloverData();
  const luckyDaysWeekly = weeklyCloverData.filter(status => status === 'lucky').length;
  
  const luckyDaysMonthly = getLuckyDaysForRange(daysInMonth);
  const luckyDaysYearly = getLuckyDaysForRange(365);

  const monthlyStats = getStatsForRange(daysInMonth);
  const monthlyScore = Math.round((luckyDaysMonthly / daysInMonth) * 100) || 0;

  const luckIndicators = [
    { 
      label: 'Daily', 
      stats: todayStats.total > 0 ? `${todayStats.wins}/${todayStats.total}` : '0/0',
      score: todayPercentage, 
      icon: dailyLuckImage ? (
        <img src={dailyLuckImage} alt="Luck Status" className="w-5 h-5 object-contain" />
      ) : (
        isTodayLucky ? <Sun size={16} /> : <CloudRain size={16} />
      ), 
      color: isTodayLucky ? 'text-emerald-500' : 'text-slate-400',
      isLucky: isTodayLucky
    },
    { 
      label: 'Weekly', 
      stats: `${luckyDaysWeekly}/7`,
      score: Math.round((luckyDaysWeekly / 7) * 100) || 0, 
      icon: <Calendar size={16} />, 
      color: 'text-blue-500' 
    },
    { 
      label: 'Monthly', 
      stats: `${luckyDaysMonthly}/${daysInMonth}`,
      score: monthlyScore, 
      icon: <TrendingUp size={16} />, 
      color: 'text-purple-500' 
    },
    { 
      label: 'Yearly', 
      stats: `${luckyDaysYearly}/365`,
      score: Math.round((luckyDaysYearly / 365) * 100) || 0, 
      icon: <Globe size={16} />, 
      color: 'text-amber-500' 
    },
  ];

  const handleShare = async () => {
    if (!profileRef.current || isSharing) return;
    
    playClick();
    setIsSharing(true);

    try {
      // Small delay to ensure any animations are settled
      await new Promise(resolve => setTimeout(resolve, 100));

      const dataUrl = await toPng(profileRef.current, {
        backgroundColor: '#f8fafc', // Same as bg-slate-50
        cacheBust: true,
        style: {
          padding: '24px',
          borderRadius: '0'
        }
      });

      const fileName = `lucky-profile-${user?.name}.png`;

      // NATIVE SHARING (Android/iOS)
      if (Capacitor.isNativePlatform()) {
        try {
          const base64Data = dataUrl.split(',')[1];
          const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Cache,
          });

          await Share.share({
            title: 'Lucky or Not Profile',
            text: `Check out my luck profile! %${luckIndicators[0].score} luck today!`,
            files: [savedFile.uri],
          });
          
          return; // Success
        } catch (nativeErr) {
          console.error('Native profile share failed:', nativeErr);
        }
      }

      // WEB SHARING FALLBACK
      // Convert dataUrl to Blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Lucky or Not Profile',
          text: `Check out my luck profile! %${luckIndicators[0].score} luck today!`,
        });
      } else {
        // Fallback: Just share the link if file sharing is not supported
        const shareData = {
          title: 'Lucky or Not Profile',
          text: `Check out my luck profile! %${luckIndicators[0].score} luck today!`,
          url: window.location.href,
        };
        
        if (navigator.share) {
          await navigator.share(shareData);
        } else {
          // Download as fallback for profile image
          const link = document.createElement('a');
          link.download = fileName;
          link.href = dataUrl;
          link.click();
          alert('Profile image downloaded!');
        }
      }
    } catch (err) {
      console.error('Error sharing profile image:', err);
      alert('Failed to share profile. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleSelectAvatar = (index: number) => {
    playClick();
    setAvatarIndex(index);
    setIsPickerOpen(false);
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-50">
      <GlobalHeader onBack={onBack} onOpenProfile={() => {}} />

      <div 
        ref={scrollRef}
        className="flex-1 px-6 space-y-6 overflow-y-auto pb-8 select-none"
      >
        <div className="flex justify-end items-center pt-4">
          <button 
            onClick={handleShare}
            disabled={isSharing}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/10 active:scale-95 transition-all disabled:opacity-50 text-sm font-bold"
          >
            {isSharing ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
            Share
          </button>
        </div>

        <div ref={profileRef} className="space-y-6 pt-2 pb-4">
          {/* Profile Card */}
          <div className="relative overflow-hidden bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />
            
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="relative group">
                <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center overflow-hidden shadow-xl shadow-emerald-500/20 mb-4 border-4 border-white">
                  <img 
                    src={getAvatarUrl(selectedAvatarIndex)} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <button 
                  onClick={() => setIsPickerOpen(true)}
                  className="absolute bottom-2 right-0 p-2 bg-emerald-500 text-white rounded-xl shadow-lg hover:bg-emerald-600 transition-colors active:scale-90"
                >
                  <Edit3 size={14} />
                </button>
              </div>
              <h2 className="text-xl font-black text-slate-900">{user?.name}</h2>
            </div>
          </div>


          {/* Daily Motto */}
          {dailyMottoImage && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-2">
                <Sparkles size={18} className="text-amber-500" />
                <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Daily Motto</h3>
              </div>
              <button 
                onClick={() => { playClick(); setZoomedType('motto'); }}
                className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden w-full aspect-video flex flex-col justify-center active:scale-[0.98] transition-transform"
              >
                <img
                  src={dailyMottoImage}
                  alt="Daily Motto"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </button>
            </div>
          )}

          {/* Luck Indicators Matrix */}
          <div className="space-y-6 mt-6">
            {/* Top Row: Daily, Weekly, Monthly */}
            <div className="grid grid-cols-3 gap-3">
              {luckIndicators.slice(0, 3).map((indicator) => {
                const isDaily = indicator.label === 'Daily';
                
                return (
                  <div key={indicator.label} className="flex flex-col gap-2">
                    {/* Label Above */}
                    <div className="text-center">
                      <div className="text-[10px] font-black text-slate-900 uppercase tracking-tighter leading-tight">
                        {indicator.label}
                      </div>
                      <div className="text-[9px] font-bold text-slate-400 tracking-widest leading-none">
                        {indicator.stats}
                      </div>
                    </div>

                    <button 
                      onClick={() => { playClick(); setZoomedType(indicator.label.toLowerCase() as any); }}
                      className={`bg-white rounded-[1.5rem] shadow-sm flex flex-col items-center justify-center relative overflow-hidden aspect-square transition-all duration-500 active:scale-95 ${
                        indicator.label === 'Monthly' && monthlyStats.total > 0
                          ? (monthlyScore > 50 
                              ? 'border-4 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]' 
                              : (monthlyScore < 50 
                                  ? 'border-4 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                                  : 'border-2 border-slate-100'))
                          : 'border-2 border-slate-100'
                      }`}
                    >
                      {isDaily && dailyLuckImage ? (
                        <img src={dailyLuckImage} alt="Luck Status" className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full w-full">
                          <div className="flex-1 flex items-center justify-center w-full">
                            {indicator.label === 'Weekly' ? (
                              <WeeklyLuck days={weeklyCloverData} />
                            ) : indicator.label === 'Monthly' ? (
                              <LuckScales 
                                status={
                                  monthlyStats.total === 0 || monthlyScore === 50 ? 'balanced' : 
                                  (monthlyScore > 50 ? 'lucky' : 'unlucky')
                                } 
                              />
                            ) : (
                              <div className="text-lg font-black text-slate-900 leading-none">%{indicator.score}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Bottom Row: Yearly (Larger Rectangle) */}
            <div className="flex flex-col gap-2">
              {luckIndicators.slice(3, 4).map((indicator) => (
                <React.Fragment key={indicator.label}>
                  {/* Label Above (Centered) */}
                  <div className="text-center">
                    <div className="text-[10px] font-black text-slate-900 uppercase tracking-tighter leading-tight">
                      {indicator.label}
                    </div>
                    <div className="text-[9px] font-bold text-slate-400 tracking-widest leading-none">
                      {indicator.stats}
                    </div>
                  </div>

                  <button 
                    onClick={() => { playClick(); setZoomedType('yearly'); }}
                    className="bg-white rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden w-full aspect-video flex flex-col justify-center active:scale-[0.98] transition-transform"
                  >
                    <video
                      src="/videos/year.mp4"
                      className="absolute inset-0 w-full h-full object-cover"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Friends Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-slate-400" />
                <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Friends</h3>
                {!isAddingFriend && (
                  <button 
                    onClick={() => { setIsAddingFriend(true); playClick(); }}
                    className="ml-2 flex items-center gap-1 text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full hover:bg-emerald-100 transition-all active:scale-95 border border-emerald-100 shadow-sm shadow-emerald-500/5"
                  >
                    <Plus size={10} /> Add
                  </button>
                )}
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase">
                {friends?.length || 0} Total
              </span>
            </div>

            {/* Inline Add Input */}
            <AnimatePresence>
              {isAddingFriend && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="px-1 space-y-2"
                >
                  <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border-2 border-emerald-100 shadow-sm shadow-emerald-500/5">
                    <input 
                      autoFocus
                      type="text"
                      placeholder="Type bot name (e.g. Blondie8)..."
                      value={newFriendName}
                      onChange={(e) => setNewFriendName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setIsAddingFriend(false);
                          setNewFriendName('');
                        }
                      }}
                      className="flex-1 bg-transparent px-3 py-2 text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none"
                    />
                    <button 
                      onClick={() => { setIsAddingFriend(false); setNewFriendName(''); }}
                      className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Search Results */}
                  {newFriendName.trim().length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar flex flex-col"
                    >
                      <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Global Directory</span>
                        <Globe size={10} className="text-slate-300" />
                      </div>
                      
                      {(() => {
                        const available = SYSTEM_PLAYERS.filter(bot => !friends?.some(f => f.id === bot.id));
                        const matches = available.filter(bot => 
                          bot.name.toLowerCase().includes(newFriendName.toLowerCase())
                        );

                        if (matches.length === 0) {
                          return (
                            <div className="p-6 text-center">
                              <Users size={24} className="mx-auto mb-2 text-slate-200" />
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                No players found
                              </div>
                            </div>
                          );
                        }

                        return matches.map(bot => (
                          <button
                            key={bot.id}
                            onClick={() => {
                              addFriend(bot);
                              setNewFriendName('');
                              setIsAddingFriend(false);
                              playClick();
                            }}
                            className="w-full p-4 flex items-center justify-between hover:bg-emerald-50 transition-colors border-b border-slate-50 last:border-0 group text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 ${bot.avatarColor} rounded-xl flex items-center justify-center text-white text-xs font-black shadow-sm`}>
                                {bot.name.charAt(0)}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">{bot.name}</div>
                                <div className="flex items-center gap-1.5">
                                  <div className={`w-1.5 h-1.5 rounded-full ${bot.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                  <span className="text-[9px] text-slate-400 font-medium uppercase tracking-tight">
                                    {bot.isOnline ? 'Online' : 'Offline'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Plus size={16} className="text-emerald-500 bg-emerald-50 p-1 rounded-lg group-hover:scale-110 transition-transform" />
                          </button>
                        ));
                      })()}
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="space-y-2">
              {friends && friends.length > 0 ? (
                friends.map((friend) => (
                  <div 
                    key={friend.id}
                    className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-emerald-100 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${friend.avatarColor} rounded-xl flex items-center justify-center text-white text-xs font-black shadow-sm`}>
                        {friend.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800">{friend.name}</div>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${friend.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">
                            {friend.isOnline ? 'Active' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFriend(friend.id);
                        playClick();
                      }}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                  <Users size={32} className="mb-2 opacity-20" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">No friends yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Zoom Overlay */}
      {zoomedType && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 sm:p-12">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/90 backdrop-blur-md"
            onClick={() => setZoomedType(null)}
          />
          <motion.div 
            layoutId={`zoom-${zoomedType}`}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full aspect-square max-w-lg bg-white rounded-[3rem] overflow-hidden shadow-2xl flex flex-col pointer-events-auto"
            onClick={() => setZoomedType(null)}
          >
            {zoomedType === 'daily' && dailyLuckImage && (
              <img src={dailyLuckImage} alt="Luck Status" className="w-full h-full object-cover" />
            )}
            {zoomedType === 'weekly' && (
              <WeeklyLuck days={weeklyCloverData} zoomed />
            )}
            {zoomedType === 'monthly' && (
              <LuckScales 
                status={
                  monthlyStats.total === 0 || monthlyScore === 50 ? 'balanced' : 
                  (monthlyScore > 50 ? 'lucky' : 'unlucky')
                } 
              />
            )}
            {zoomedType === 'yearly' && (
              <video
                src="/videos/year.mp4"
                className="w-full h-full object-cover"
                autoPlay
                loop
                playsInline
                // Sound on when zoomed
              />
            )}
            {zoomedType === 'motto' && dailyMottoImage && (
              <img src={dailyMottoImage} alt="Daily Motto Zoomed" className="w-full h-full object-cover" />
            )}
            
            {/* Info Overlay */}
            <div className="absolute top-0 left-0 right-0 p-8 flex flex-col items-center gap-2 bg-gradient-to-b from-black/40 to-transparent pointer-events-none">
              {(() => {
                const indicator = luckIndicators.find(i => i.label.toLowerCase() === zoomedType);
                if (!indicator) return (
                  <div className="px-4 py-1.5 bg-black/20 backdrop-blur-sm rounded-full text-white/90 text-[10px] font-black uppercase tracking-widest">
                    Click to Close
                  </div>
                );
                
                return (
                  <>
                    <div className="flex flex-col items-center">
                      <h4 className="text-white font-black text-2xl uppercase tracking-tighter drop-shadow-lg">
                        {indicator.label}
                      </h4>
                      <div className="flex items-center gap-3">
                        <span className="text-white/80 font-bold text-xs uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                          {indicator.stats}
                        </span>
                        <span className="text-emerald-400 font-black text-xl drop-shadow-md">
                          %{indicator.score}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 px-3 py-1 bg-black/20 backdrop-blur-sm rounded-full text-white/60 text-[9px] font-bold uppercase tracking-[0.2em]">
                      Click to Close
                    </div>
                  </>
                );
              })()}
            </div>
          </motion.div>
        </div>
      )}

      {/* Avatar Picker Modal */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsPickerOpen(false)}
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-sm bg-white rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[70vh]"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">Select Avatar</h3>
              <button 
                onClick={() => setIsPickerOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                Cancel
              </button>
            </div>
            <div className="p-6 overflow-y-auto grid grid-cols-3 gap-4">
              {AVATARS.map((avatar, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectAvatar(index)}
                  className={`aspect-square rounded-2xl overflow-hidden border-4 transition-all active:scale-95 ${
                    selectedAvatarIndex === index ? 'border-emerald-500' : 'border-transparent hover:border-slate-100'
                  }`}
                >
                  <img src={avatar} alt={`Avatar ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default UserPage;
