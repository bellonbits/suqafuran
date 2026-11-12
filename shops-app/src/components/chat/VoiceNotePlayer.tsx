"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Mic, Volume2 } from 'lucide-react';

interface VoiceNotePlayerProps {
  src: string;
  durationLabel?: string;
  isMe: boolean;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({ src, durationLabel, isMe }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(Math.round(audio.duration));
      }
    };

    audio.ontimeupdate = () => {
      setCurrentTime(Math.round(audio.currentTime));
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.error('Audio playback error:', e);
      });
    }
  };

  const cycleSpeed = () => {
    const nextRate: 1 | 1.5 | 2 = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const formatSecs = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const displayDuration = duration > 0 ? formatSecs(duration) : durationLabel || '0:05';
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-2xl min-w-[220px] max-w-[280px] sm:max-w-xs text-slate-900 dark:text-neutral-100">
      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow bg-[#0284c7] hover:bg-[#0369a1] text-white transition-transform active:scale-95"
        aria-label={isPlaying ? 'Pause voice message' : 'Play voice message'}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>

      {/* Waveform / Progress Display */}
      <div className="flex-1 space-y-1">
        {/* Animated Sound Wave Bars */}
        <div className="flex items-center gap-1 h-6">
          {[40, 75, 55, 90, 65, 30, 85, 50, 95, 70, 45, 80, 60].map((h, i) => {
            const barProgress = (i / 13) * 100;
            const isFilled = isPlaying ? progressPercent >= barProgress : false;

            return (
              <span
                key={i}
                style={{ height: `${h}%` }}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isFilled
                    ? 'bg-[#0284c7] scale-y-110'
                    : 'bg-slate-200 dark:bg-neutral-700'
                }`}
              />
            );
          })}
        </div>

        {/* Timers & Speed pill */}
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-neutral-400">
          <span>{isPlaying ? formatSecs(currentTime) : displayDuration}</span>

          <button
            type="button"
            onClick={cycleSpeed}
            className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase transition-colors bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300"
          >
            {playbackRate}x
          </button>
        </div>
      </div>

      <Mic className="w-4 h-4 shrink-0 opacity-60 text-slate-400" />
    </div>
  );
};

