import React, { useState } from 'react';
import { Share2, Check, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

interface ShareResultProps {
  elementId?: string;
  gameName: string;
}

const ShareResult: React.FC<ShareResultProps> = ({ elementId = 'app-root', gameName }) => {
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const element = document.getElementById(elementId);
    if (!element) return;

    setIsSharing(true);
    try {
      const dataUrl = await toPng(element, {
        cacheBust: true,
        backgroundColor: '#f8fafc', // Default slate-50 background
      });

      const fileName = `${gameName.toLowerCase().replace(/\s+/g, '-')}-result.png`;

      // NATIVE SHARING (Android/iOS)
      if (Capacitor.isNativePlatform()) {
        try {
          // 1. Save base64 to temporary file
          const base64Data = dataUrl.split(',')[1];
          const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Cache,
          });

          // 2. Share the file
          await Share.share({
            title: `${gameName} Result`,
            text: `Check out my ${gameName} result!`,
            files: [savedFile.uri],
          });
          
          return; // Success
        } catch (nativeErr) {
          console.error('Native share failed, falling back to web:', nativeErr);
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
          title: `${gameName} Result`,
          text: `Check out my ${gameName} result!`,
        });
      } else {
        // Fallback: Download the image
        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrl;
        link.click();
        
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Error sharing:', err);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={isSharing}
      className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50"
    >
      {isSharing ? (
        <Loader2 size={18} className="animate-spin" />
      ) : copied ? (
        <Check size={18} className="text-emerald-500" />
      ) : (
        <Share2 size={18} />
      )}
      {isSharing ? 'Capturing...' : copied ? 'Downloaded!' : 'Share Result'}
    </button>
  );
};

export default ShareResult;
